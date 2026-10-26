"""Score one rebuilt case set against the API with the unedited runner_common.py.

Usage: run_set.py <set dir> <full|pilot>
  e.g. python3 build_hf_sets.py && SAFEPROMPT_SENSITIVITY=strict python3 run_set.py deepset full

Reads <set dir>/cases-<which>.json (written by build_hf_sets.py) and appends verdicts to
<set dir>/results.jsonl, resumable. The committed results-*.jsonl files are not touched."""
import json, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from runner_common import run, summarise

name, which = sys.argv[1], sys.argv[2]
d = os.path.join(HERE, name)
cases = json.load(open(os.path.join(d, f"cases-{which}.json")))
out = os.path.join(d, "results.jsonl")
run(cases, out, f"{name}-{which}")
s = summarise(out)
print(json.dumps(s, indent=1))
json.dump(s, open(os.path.join(d, "summary.json"), "w"), indent=1)
