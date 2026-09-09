"""
HackAPrompt cases for a DETECTOR.

Source: hackaprompt/hackaprompt-dataset (gated; licence accepted by the account
owner 2026-08-21). 601,757 submissions from a public prompt-hacking competition,
415,254 of them unique user inputs.

Selection: only rows with correct == True, i.e. attacks that DEMONSTRABLY worked
against the target model (GPT-3, FlanT5-XXL or ChatGPT). 77,936 qualify. These are
the strongest possible positives: not merely intended as attacks, but proven
effective against a real LLM.

Stratified across all 11 levels, since level encodes difficulty and sampling
without stratification would be dominated by the heavily-played levels.

RECALL ONLY. This dataset contains no benign inputs, so it cannot produce a
false-positive rate. Any "HackAPrompt score" from it is a recall stress test and
must be reported as such. FPR comes from BIPIA and Tensor Trust.

Sample size: the recommendation package asks for 50,000 cases. At the pacing the
production origin tolerates (~3.5s between calls to stay under its ~28/min limit)
that is roughly 48 hours of continuous synthetic load on an origin serving real
customers. This builds a smaller stratified sample; the full 50,000 needs either a
dedicated capacity decision or an in-process harness, and is an operator call.
"""
import json, sys, os, random, hashlib
import pyarrow.parquet as pq

# The dataset is gated on HuggingFace. Create an account, accept the terms at
# https://huggingface.co/datasets/hackaprompt/hackaprompt-dataset and download the
# parquet, then point HACKAPROMPT_PARQUET at it (default: alongside this script).
SRC = os.environ.get(
    'HACKAPROMPT_PARQUET',
    os.path.join(os.path.dirname(os.path.abspath(__file__)), 'hackaprompt.parquet'))
HERE = os.path.dirname(os.path.abspath(__file__))


def case_id(t):
    return hashlib.sha256(t.encode('utf-8')).hexdigest()[:16]


def build(n_total=1000, seed=20260821):
    t = pq.read_table(SRC, columns=['level', 'user_input', 'correct', 'model'])
    rows = t.to_pylist()
    ok = [r for r in rows
          if r['correct'] and r['user_input'] and r['user_input'].strip()
          and len(r['user_input']) < 6000]
    print(f"  successful attacks available: {len(ok):,}")

    by_level = {}
    for r in ok:
        by_level.setdefault(r['level'], []).append(r)

    rng = random.Random(seed)
    per = max(1, n_total // len(by_level))
    cases, seen = [], set()
    for lvl in sorted(by_level):
        pool = by_level[lvl]
        rng.shuffle(pool)
        taken = 0
        for r in pool:
            if taken >= per:
                break
            ui = r['user_input'].strip()
            cid = case_id(ui)
            if cid in seen:
                continue
            seen.add(cid)
            cases.append({
                'id': cid, 'prompt': ui, 'expect_flagged': True,
                'meta': {'source': 'hackaprompt', 'level': lvl, 'target_model': r['model']},
            })
            taken += 1
        print(f"    level {lvl}: {taken} (pool {len(pool):,})")
    rng.shuffle(cases)
    return cases


if __name__ == '__main__':
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 1000
    cs = build(n)
    json.dump(cs, open(os.path.join(HERE, 'cases.json'), 'w'), indent=1)
    print(f"  built {len(cs)} cases (all positives; dataset has no benign set)")
