"""
Score an external case set with a free, local prompt-injection classifier, so its
numbers can sit next to SafePrompt's on the exact same cases.

Usage:
  python3 run_local_classifier.py --model protectai --set deepset-full
  python3 run_local_classifier.py --model protectai --all
  # Prompt Guard 2 is gated on HuggingFace: accept the licence on an HF account,
  # then provide that account's token as HF_TOKEN in the environment.
  HF_TOKEN=... python3 run_local_classifier.py --model promptguard2 --all

Requires: torch (CPU wheels are enough) and transformers.

What it reads
  The case files written by the builders in this directory (see ../README.md for how
  to rebuild each one; the prompts are not redistributed). Default locations:

    tensortrust-200     tensortrust/cases.json        (tensortrust/build_cases.py)
    bipia-200           bipia/cases.json              (bipia/build_cases.py)
    hackaprompt-1000    hackaprompt/cases.json        (hackaprompt/build_cases.py)
    deepset-full        deepset/cases-full.json       (build_hf_sets.py)
    notinject-full      notinject/cases-full.json     (build_hf_sets.py)
    gandalf-pilot       gandalf/cases-pilot.json      (build_hf_sets.py)
    tensortrust-ext100  no public builder; pass --cases
    suite-safe-219      SafePrompt's internal safe suite; prompts not published

  --cases PATH overrides the location, and SP_CASES_DIR=<dir> reads <dir>/<set>.json.
  Before scoring, the case IDs are checked against SafePrompt's committed results for
  the same set. A rebuild that does not reproduce the exact cases stops the run.

What it writes
  baselines/<model>/results-<set>.jsonl, one row per case, in the same shape as
  SafePrompt's rows:
    {"id","expect_flagged","got_flagged","correct","category","method","confidence","meta"}
  method = the HuggingFace model id, confidence = the model's probability for its
  attack label, category = the label the model assigned. meta carries the case's own
  metadata plus token count, truncation/chunking and single-case latency. No prompt
  text is ever written.

  baselines/summary-<model>.json, per set: attacks caught, ordinary passed, latency,
  and the model, revision, threshold and long-input policy used.

No tuning
  Each model runs as its model card says, with its default decision rule (the argmax
  label, which for a two-class softmax is the same as attack probability > 0.5).
  ProtectAI's card runs the pipeline with truncation=True, max_length=512, so inputs
  longer than 512 tokens are truncated (and flagged as such in meta). Prompt Guard 2's
  card says to split longer inputs into segments and scan each, so long inputs are cut
  into 512-token windows and the case is flagged if any window is.

Compute
  CPU only. Threads capped by --threads (default 4). Scoring is batched (cases sorted
  by length, --batch per forward pass). Latency is measured separately, one case at a
  time, because that is what a single request costs; the batched and unbatched passes
  must agree on every verdict, and the runner reports any case where they do not.
"""
import argparse, json, os, statistics, sys, time

HERE = os.path.dirname(os.path.abspath(__file__))
EXT = os.path.dirname(HERE)

MODELS = {
    "protectai": {
        "hf_id": "protectai/deberta-v3-base-prompt-injection-v2",
        "revision": "90c9989b1a342275dd0d1a95aad283c04e075671",
        "attack_labels": {"INJECTION"},
        "max_length": 512,
        "long_input": "truncate",
        "card": "https://huggingface.co/protectai/deberta-v3-base-prompt-injection-v2",
        "gated": False,
    },
    "promptguard2": {
        "hf_id": "meta-llama/Llama-Prompt-Guard-2-86M",
        "revision": "a8ded8e697ce7c355e395a0df51f94adb4a2fd27",
        "attack_labels": {"MALICIOUS", "LABEL_1"},
        "max_length": 512,
        "long_input": "chunk",
        "card": "https://huggingface.co/meta-llama/Llama-Prompt-Guard-2-86M",
        "gated": True,
    },
}

# set name -> (default case file relative to benchmarks/external, SafePrompt results
# directory, SafePrompt results-file suffix)
SETS = {
    "tensortrust-200":    ("tensortrust/cases.json",   "tensortrust",   ""),
    "tensortrust-ext100": (None,                       "tensortrust",   "-ext100"),
    "bipia-200":          ("bipia/cases.json",         "bipia",         ""),
    "gandalf-pilot":      ("gandalf/cases-pilot.json", "gandalf",       "-pilot"),
    "notinject-full":     ("notinject/cases-full.json", "notinject",    ""),
    "deepset-full":       ("deepset/cases-full.json",  "deepset",       ""),
    "hackaprompt-1000":   ("hackaprompt/cases.json",   "hackaprompt",   ""),
    "suite-safe-219":     (None,                       "safe-suite-v3", ""),
}

# Keys that could carry prompt text never reach a results row.
_TEXT_KEYS = {"prompt", "text", "context", "attack", "access_code", "user_input"}


def case_path(name, override):
    if override:
        return override
    env = os.environ.get("SP_CASES_DIR")
    if env:
        return os.path.join(env, f"{name}.json")
    rel = SETS[name][0]
    if rel is None:
        sys.exit(f"{name}: no public builder; pass --cases PATH or set SP_CASES_DIR")
    return os.path.join(EXT, rel)


def safeprompt_ids(name):
    """IDs in SafePrompt's committed results for this set (strict, then default)."""
    _, d, suf = SETS[name]
    out = {}
    for mode in ("strict", "default"):
        p = os.path.join(EXT, d, f"results-{mode}{suf}.jsonl")
        if os.path.exists(p):
            out[mode] = {json.loads(l)["id"] for l in open(p) if l.strip()}
    return out


class Classifier:
    def __init__(self, key, threads):
        import torch
        from transformers import AutoTokenizer, AutoModelForSequenceClassification
        torch.set_num_threads(threads)
        torch.set_num_interop_threads(1)
        self.torch = torch
        self.spec = MODELS[key]
        token = os.environ.get("HF_TOKEN") or None
        kw = {"revision": self.spec["revision"], "token": token}
        self.tok = AutoTokenizer.from_pretrained(self.spec["hf_id"], **kw)
        self.model = AutoModelForSequenceClassification.from_pretrained(self.spec["hf_id"], **kw)
        self.model.eval()
        id2label = {int(k): v for k, v in self.model.config.id2label.items()}
        hits = [i for i, l in id2label.items() if l.upper() in self.spec["attack_labels"]]
        if len(hits) != 1:
            sys.exit(f"cannot identify the attack label in {id2label}")
        self.attack_idx = hits[0]
        self.id2label = id2label

    def _windows(self, texts):
        """Tokenize. Returns (encodings, owner index per row, token count per text)."""
        L = self.spec["max_length"]
        if self.spec["long_input"] == "truncate":
            enc = self.tok(texts, truncation=True, max_length=L, padding=True, return_tensors="pt")
            owner = list(range(len(texts)))
        else:
            enc = self.tok(texts, truncation=True, max_length=L, padding=True,
                           return_overflowing_tokens=True, stride=0, return_tensors="pt")
            owner = enc.pop("overflow_to_sample_mapping").tolist()
        return enc, owner

    def score(self, texts):
        """Per text: (attack probability, label, number of windows scored)."""
        enc, owner = self._windows(texts)
        enc = {k: v for k, v in enc.items() if k in ("input_ids", "attention_mask", "token_type_ids")}
        with self.torch.no_grad():
            probs = self.torch.softmax(self.model(**enc).logits, dim=-1)
        best = {}
        for row, i in enumerate(owner):
            p = probs[row]
            flagged = int(p.argmax()) == self.attack_idx
            prev = best.get(i)
            cand = (flagged, float(p[self.attack_idx]), self.id2label[int(p.argmax())])
            # A case is flagged if any window is; report that window's label and the
            # highest attack probability across windows.
            if prev is None:
                best[i] = [cand[0], cand[1], cand[2], 1]
            else:
                prev[3] += 1
                if cand[0] and not prev[0]:
                    prev[0], prev[2] = True, cand[2]
                prev[1] = max(prev[1], cand[1])
        return [best[i] for i in range(len(texts))]

    def n_tokens(self, text):
        return len(self.tok(text, add_special_tokens=True, truncation=False)["input_ids"])


def pct(xs, q):
    xs = sorted(xs)
    k = (len(xs) - 1) * q
    lo, hi = int(k), min(int(k) + 1, len(xs) - 1)
    return xs[lo] + (xs[hi] - xs[lo]) * (k - lo)


def run_set(clf, model_key, name, cases_override, batch, out_dir):
    path = case_path(name, cases_override)
    cases = json.load(open(path))
    ids = [c["id"] for c in cases]
    if len(set(ids)) != len(ids):
        sys.exit(f"{name}: duplicate case ids in {path}")
    sp = safeprompt_ids(name)
    for mode, s in sp.items():
        if s != set(ids):
            sys.exit(f"{name}: case ids differ from SafePrompt's {mode} results "
                     f"({len(set(ids) & s)} shared of {len(ids)} / {len(s)}); "
                     "the rebuild did not reproduce the scored cases")
    spec = MODELS[model_key]
    print(f"  {name}: {len(cases)} cases from {path}", flush=True)

    # Batched scoring, shortest first so padding stays small.
    order = sorted(range(len(cases)), key=lambda i: len(cases[i]["prompt"]))
    verdict = {}
    t0 = time.perf_counter()
    for s in range(0, len(order), batch):
        idx = order[s:s + batch]
        for i, r in zip(idx, clf.score([cases[i]["prompt"] for i in idx])):
            verdict[i] = r
    batched_s = time.perf_counter() - t0

    # Single-case latency pass, in file order. Also a consistency check on the verdicts.
    lat, disagree = [], []
    for i, c in enumerate(cases):
        t = time.perf_counter()
        r = clf.score([c["prompt"]])[0]
        lat.append((time.perf_counter() - t) * 1000.0)
        if r[0] != verdict[i][0]:
            disagree.append(c["id"])

    os.makedirs(out_dir, exist_ok=True)
    out = os.path.join(out_dir, f"results-{name}.jsonl")
    rows = []
    with open(out, "w") as f:
        for i, c in enumerate(cases):
            flagged, conf, label, windows = verdict[i]
            ntok = clf.n_tokens(c["prompt"])
            meta = {k: v for k, v in (c.get("meta") or {}).items() if k not in _TEXT_KEYS}
            meta.update({"n_tokens": ntok, "over_max_length": ntok > spec["max_length"],
                         "windows_scored": windows, "latency_ms": round(lat[i], 2)})
            row = {"id": c["id"], "expect_flagged": c["expect_flagged"], "got_flagged": flagged,
                   "correct": flagged == c["expect_flagged"], "category": label,
                   "method": spec["hf_id"], "confidence": round(conf, 6), "meta": meta}
            rows.append(row)
            f.write(json.dumps(row) + "\n")

    pos = [r for r in rows if r["expect_flagged"]]
    neg = [r for r in rows if not r["expect_flagged"]]
    summ = {
        "cases": len(rows),
        "attacks": len(pos), "attacks_caught": sum(r["got_flagged"] for r in pos),
        "ordinary": len(neg), "ordinary_passed": sum(not r["got_flagged"] for r in neg),
        "over_max_length": sum(r["meta"]["over_max_length"] for r in rows),
        "latency_ms_single_case": {"median": round(statistics.median(lat), 1),
                                   "p95": round(pct(lat, 0.95), 1),
                                   "max": round(max(lat), 1)},
        "batched_ms_per_case": round(batched_s * 1000.0 / len(rows), 1),
        "batched_vs_single_verdict_disagreements": disagree,
        "safeprompt_id_match": sorted(sp) or "no SafePrompt results found",
        "results_file": os.path.relpath(out, EXT),
    }
    print(f"    attacks {summ['attacks_caught']}/{summ['attacks']}  "
          f"ordinary passed {summ['ordinary_passed']}/{summ['ordinary']}  "
          f"latency median {summ['latency_ms_single_case']['median']} ms  "
          f"p95 {summ['latency_ms_single_case']['p95']} ms", flush=True)
    return summ


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--model", required=True, choices=sorted(MODELS))
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--set", choices=sorted(SETS))
    g.add_argument("--all", action="store_true")
    ap.add_argument("--cases", help="explicit case file (only with --set)")
    ap.add_argument("--batch", type=int, default=16)
    ap.add_argument("--threads", type=int, default=4)
    a = ap.parse_args()
    if a.cases and a.all:
        sys.exit("--cases needs --set")

    import torch, transformers
    clf = Classifier(a.model, a.threads)
    spec = MODELS[a.model]
    out_dir = os.path.join(HERE, a.model)
    summ_path = os.path.join(HERE, f"summary-{a.model}.json")
    summary = json.load(open(summ_path)) if os.path.exists(summ_path) else {"sets": {}}
    summary["model"] = {
        "key": a.model, "hf_id": spec["hf_id"], "revision": spec["revision"],
        "model_card": spec["card"], "id2label": clf.id2label,
        "attack_label": clf.id2label[clf.attack_idx],
        "decision_rule": "argmax label (equivalently attack probability > 0.5); model-card default, untuned",
        "max_length_tokens": spec["max_length"],
        "long_input_policy": (
            "truncate to the first 512 tokens (model card: pipeline truncation=True, max_length=512)"
            if spec["long_input"] == "truncate" else
            "split into consecutive 512-token windows, flag if any window is flagged "
            "(model card: split longer inputs into segments and scan each)"),
        "confidence": "softmax probability of the attack label (max across windows when chunked)",
    }
    summary["runtime"] = {
        "device": "cpu", "torch_threads": a.threads, "batch_size": a.batch,
        "torch": torch.__version__, "transformers": transformers.__version__,
        "cpu": _cpu_name(), "run_at_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "latency_note": "latency_ms_single_case = one case per forward pass, wall clock, "
                        "including tokenization, on a shared CPU host under nice 10",
    }
    names = sorted(SETS) if a.all else [a.set]
    for n in names:
        summary["sets"][n] = run_set(clf, a.model, n, a.cases, a.batch, out_dir)
        json.dump(summary, open(summ_path, "w"), indent=1)
    print(f"  summary: {summ_path}")


def _cpu_name():
    try:
        for l in open("/proc/cpuinfo"):
            if l.startswith("model name"):
                return l.split(":", 1)[1].strip()
    except OSError:
        pass
    return None


if __name__ == "__main__":
    main()
