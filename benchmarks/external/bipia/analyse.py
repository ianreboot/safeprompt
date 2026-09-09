import json, sys
from collections import Counter, defaultdict

import os
HERE = os.path.dirname(os.path.abspath(__file__))
# Results file to analyse; pass another on the command line to analyse the strict run.
RESULTS = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'results-default.jsonl')
# cases.json is not redistributed (see ../README.md); build it with build_cases.py first.
CASES = os.path.join(HERE, 'cases.json')
res = [json.loads(l) for l in open(RESULTS)]
cases = {c['id']: c for c in json.load(open(CASES))}
print(f"  scored: {len(res)}\n")

pos = [r for r in res if r['expect_flagged']]
neg = [r for r in res if not r['expect_flagged']]

def rate(hits, tot):
    return f"{100.0*hits/tot:.1f}%" if tot else "n/a"

print("=== RAW (safe:false counted as a detection) ===")
tp = sum(1 for r in pos if r['got_flagged']); fp = sum(1 for r in neg if r['got_flagged'])
print(f"  injected {len(pos)}: detected {tp} ({rate(tp,len(pos))})")
print(f"  clean    {len(neg)}: flagged  {fp} ({rate(fp,len(neg))})")

print("\n=== what the detector actually said on CLEAN cases ===")
for cat, n in Counter((r['category'], r['method']) for r in neg if r['got_flagged']).most_common():
    print(f"  {str(cat):<46} {n}")

print("\n=== SECURITY-RELEVANT ONLY (reference_detection excluded) ===")
def sec(r):
    return r['got_flagged'] and r['method'] != 'reference_detection'
tp2 = sum(1 for r in pos if sec(r)); fp2 = sum(1 for r in neg if sec(r))
print(f"  injected {len(pos)}: detected {tp2} ({rate(tp2,len(pos))})")
print(f"  clean    {len(neg)}: flagged  {fp2} ({rate(fp2,len(neg))})  <- the real false-positive rate")

print("\n=== detection by BIPIA attack category (injected cases) ===")
by = defaultdict(lambda: [0,0])
for r in pos:
    c = r['meta'].get('attack_category','?')
    by[c][1] += 1
    if r['got_flagged']: by[c][0] += 1
for c,(d,t) in sorted(by.items(), key=lambda kv: -kv[1][1]):
    print(f"  {c:<26} {d}/{t}  {rate(d,t)}")

print("\n=== by task ===")
byt = defaultdict(lambda: [0,0,0,0])
for r in res:
    t = r['meta'].get('task','?')
    if r['expect_flagged']:
        byt[t][1]+=1; byt[t][0]+= 1 if r['got_flagged'] else 0
    else:
        byt[t][3]+=1; byt[t][2]+= 1 if sec(r) else 0
for t,(d,tot,f,ntot) in byt.items():
    print(f"  {t:<8} detection {d}/{tot} ({rate(d,tot)})   sec-FP {f}/{ntot} ({rate(f,ntot)})")
