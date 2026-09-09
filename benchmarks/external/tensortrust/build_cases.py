"""
Tensor Trust cases for a DETECTOR.

Tensor Trust is a corpus of real human attacks from an online game where players
defended an LLM "bank vault" and others tried to break in. Two frozen benchmark
sets ship on HuggingFace; we use hijacking-robustness/v1.

Mapping to a detection task:
  * POSITIVE - the `attack` field: adversarial user input written by a human
    trying to hijack the model into granting access.
  * NEGATIVE - the `access_code` field: the legitimate input the defender
    intended to grant access. These are genuinely hard negatives, because they
    are short, odd, imperative strings that look nothing like ordinary prose.

That second half matters more than the first. Any detector can block attacks by
blocking everything; the access codes are what expose over-blocking.

Note: these are HUMAN-authored attacks against a specific game format, not
generic prompt injections. A low score here is not directly comparable to PINT
or BIPIA and should be reported in its own terms.
"""
import json, os, sys, random, urllib.request

URL = ("https://huggingface.co/datasets/qxcv/tensor-trust/resolve/main/"
       "benchmarks/hijacking-robustness/v1/hijacking_robustness_dataset.jsonl")
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from runner_common import case_id


def build(n_pairs=100, seed=20260821):
    req = urllib.request.Request(URL, headers={"User-Agent": "safeprompt-benchmark"})
    with urllib.request.urlopen(req, timeout=120) as r:
        rows = [json.loads(l) for l in r.read().decode("utf-8").splitlines() if l.strip()]
    print(f"  fetched {len(rows)} hijacking records")

    rng = random.Random(seed)
    rng.shuffle(rows)

    cases, seen = [], set()
    for row in rows:
        if len([c for c in cases if c["expect_flagged"]]) >= n_pairs and \
           len([c for c in cases if not c["expect_flagged"]]) >= n_pairs:
            break
        atk = (row.get("attack") or "").strip()
        code = (row.get("access_code") or "").strip()
        if atk and len(atk) < 6000 and case_id(atk) not in seen and \
           len([c for c in cases if c["expect_flagged"]]) < n_pairs:
            seen.add(case_id(atk))
            cases.append({"id": case_id(atk), "prompt": atk, "expect_flagged": True,
                          "meta": {"source": "tensortrust-hijacking", "kind": "human_attack",
                                   "sample_id": row.get("sample_id")}})
        if code and len(code) < 6000 and case_id(code) not in seen and \
           len([c for c in cases if not c["expect_flagged"]]) < n_pairs:
            seen.add(case_id(code))
            cases.append({"id": case_id(code), "prompt": code, "expect_flagged": False,
                          "meta": {"source": "tensortrust-hijacking", "kind": "access_code",
                                   "sample_id": row.get("sample_id")}})
    return cases


if __name__ == "__main__":
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 100
    cs = build(n)
    json.dump(cs, open(os.path.join(HERE, "cases.json"), "w"), indent=1)
    pos = sum(1 for c in cs if c["expect_flagged"])
    print(f"  built {len(cs)} cases: {pos} attacks / {len(cs)-pos} access codes")
