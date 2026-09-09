import json, sys
from collections import Counter
import os
HERE = os.path.dirname(os.path.abspath(__file__))
# Results file to analyse; pass another on the command line to analyse the strict run.
RESULTS = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'results-default.jsonl')
# cases.json is not redistributed (see ../README.md); build it with build_cases.py first.
CASES = os.path.join(HERE, 'cases.json')
res=[json.loads(l) for l in open(RESULTS)]
cases={c['id']:c for c in json.load(open(CASES))}
pos=[r for r in res if r['expect_flagged']]; neg=[r for r in res if not r['expect_flagged']]

def sec(r): return r['got_flagged'] and r['method']!='reference_detection'
tp=sum(1 for r in pos if r['got_flagged']); tps=sum(1 for r in pos if sec(r))
fp=sum(1 for r in neg if r['got_flagged']); fps=sum(1 for r in neg if sec(r))
print(f"  attacks {len(pos)}: detected {tp} ({100*tp/len(pos):.1f}%)  security-only {tps} ({100*tps/len(pos):.1f}%)")
print(f"  access codes {len(neg)}: flagged {fp} ({100*fp/len(neg):.1f}%)  security-only {fps} ({100*fps/len(neg):.1f}%)")
print("\n  what it said on flagged access codes:")
for k,n in Counter((r['category'],r['method']) for r in neg if r['got_flagged']).most_common():
    print(f"    {str(k):<44} {n}")
print("\n=== flagged ACCESS CODES (should be legitimate) ===")
n=0
for r in neg:
    if r['got_flagged']:
        n+=1
        if n>5: break
        print(f"    [{r['category']}] {' '.join(cases[r['id']]['prompt'].split())[:150]!r}")
print("\n=== MISSED human attacks ===")
n=0
for r in pos:
    if not r['got_flagged']:
        n+=1
        if n>5: break
        print(f"    {' '.join(cases[r['id']]['prompt'].split())[:170]!r}")
