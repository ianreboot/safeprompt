"""
Construct BIPIA cases for a DETECTOR.

BIPIA measures whether an LLM *follows* an injected instruction. SafePrompt is a
detector, so the question is reframed: given a context with an injection embedded,
does the detector flag it, and given the same context clean, does it stay quiet.

Coverage: email, table and code contexts ship in the repo. The WebQA and
Summarization contexts do NOT - they require licence-gated corpora (NewsQA and
others) built via the upstream scripts. Any result from this runner is therefore a
PARTIAL BIPIA run and must be labelled as such. Claiming "we ran BIPIA" off three
of five task types would be the exact overclaim the audit told us to stop making.

Positives embed the attack at the END of the context, which is BIPIA's own
placement for these tasks.
"""
import json, sys, urllib.request, random, os

RAW = "https://raw.githubusercontent.com/microsoft/BIPIA/main/benchmark"
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from runner_common import case_id


def fetch(path):
    with urllib.request.urlopen(f"{RAW}/{path}", timeout=60) as r:
        return r.read().decode("utf-8")


def jsonl(text):
    return [json.loads(l) for l in text.splitlines() if l.strip()]


def flatten_attacks(obj):
    out = []
    for cat, items in obj.items():
        for a in items:
            out.append((cat, a))
    return out


def build(n_per_task=60, seed=20260821):
    rng = random.Random(seed)
    text_attacks = flatten_attacks(json.loads(fetch("text_attack_test.json")))
    code_attacks = flatten_attacks(json.loads(fetch("code_attack_test.json")))

    tasks = {
        "email": (jsonl(fetch("email/test.jsonl")), text_attacks),
        "table": (jsonl(fetch("table/test.jsonl")), text_attacks),
        "code":  (jsonl(fetch("code/test.jsonl")),  code_attacks),
    }

    cases = []
    for task, (ctxs, attacks) in tasks.items():
        rng.shuffle(ctxs)
        picked = ctxs[: n_per_task * 2]
        half = len(picked) // 2
        # positives: context + injected attack
        for c in picked[:half]:
            ctx = str(c.get("context", ""))[:6000]
            cat, atk = attacks[rng.randrange(len(attacks))]
            prompt = f"{ctx}\n{atk}"
            cases.append({
                "id": case_id(prompt), "prompt": prompt, "expect_flagged": True,
                "meta": {"task": task, "attack_category": cat, "kind": "injected"},
            })
        # negatives: the same kind of context, clean
        for c in picked[half:]:
            ctx = str(c.get("context", ""))[:6000]
            q = str(c.get("question", "")).strip()
            prompt = f"{ctx}\n{q}" if q else ctx
            cases.append({
                "id": case_id(prompt), "prompt": prompt, "expect_flagged": False,
                "meta": {"task": task, "kind": "clean"},
            })

    # de-dup by id, preserving order
    seen, uniq = set(), []
    for c in cases:
        if c["id"] not in seen:
            seen.add(c["id"]); uniq.append(c)
    return uniq


if __name__ == "__main__":
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 60
    cs = build(n)
    with open(os.path.join(HERE, "cases.json"), "w") as f:
        json.dump(cs, f, indent=1)
    pos = sum(1 for c in cs if c["expect_flagged"])
    print(f"  built {len(cs)} cases: {pos} injected / {len(cs)-pos} clean")
    from collections import Counter
    print("  by task:", dict(Counter(c["meta"]["task"] for c in cs)))
