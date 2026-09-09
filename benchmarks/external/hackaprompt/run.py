import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from runner_common import run, summarise
cases = json.load(open(os.path.join(HERE, "cases.json")))
out = os.path.join(HERE, "results.jsonl")
try:
    run(cases, out, "HackAPrompt (stratified sample, recall-only)")
except Exception as e:
    print(f"  run halted: {e}")
finally:
    if os.path.exists(out):
        import collections
        rows = [json.loads(l) for l in open(out)]
        det = sum(1 for r in rows if r["got_flagged"])
        print("\n  === HackAPrompt result (recall only) ===")
        print(f"    scored: {len(rows)}  detected: {det}  recall: {100.0*det/len(rows):.1f}%")
        by = collections.defaultdict(lambda: [0, 0])
        for r in rows:
            lv = r["meta"].get("level")
            by[lv][1] += 1
            if r["got_flagged"]:
                by[lv][0] += 1
        print("    by level:")
        for lv in sorted(by, key=lambda x: (x is None, x)):
            d, t = by[lv]
            print(f"      level {lv}: {d}/{t}  {100.0*d/t:.0f}%")
        json.dump({"scored": len(rows), "detected": det,
                   "recall_pct": round(100.0*det/len(rows), 2),
                   "by_level": {str(k): v for k, v in by.items()}},
                  open(os.path.join(HERE, "summary.json"), "w"), indent=1)
