import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from runner_common import run, summarise
cases = json.load(open(os.path.join(HERE, "cases.json")))
out = os.path.join(HERE, "results.jsonl")
try:
    run(cases, out, "Tensor Trust (hijacking-robustness v1)")
except Exception as e:
    print(f"  run halted: {e}")
finally:
    if os.path.exists(out):
        s = summarise(out)
        print("\n  === Tensor Trust result ===")
        for k, v in s.items():
            print(f"    {k}: {v}")
        json.dump(s, open(os.path.join(HERE, "summary.json"), "w"), indent=1)
        if s["scored"] < len(cases):
            print(f"    INCOMPLETE: {s['scored']} of {len(cases)}")
