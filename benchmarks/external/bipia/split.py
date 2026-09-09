import json, sys
from collections import defaultdict

import os
HERE = os.path.dirname(os.path.abspath(__file__))
# Results file to analyse; pass another on the command line to analyse the strict run.
RESULTS = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'results-default.jsonl')
# cases.json is not redistributed (see ../README.md); build it with build_cases.py first.
CASES = os.path.join(HERE, 'cases.json')
res = [json.loads(l) for l in open(RESULTS)]

# BIPIA's attack taxonomy mixes two very different things. Split explicitly so the
# result is not one averaged number hiding both.
MALICIOUS = {
    'Data Eavesdropping','Compromising Computers','Keylogging','Screen Scraping',
    'Encrypting Documents and Demanding Ransom (Ransomware)','Scams & Fraud',
    'Blocking Internet Connection','Corrupting an Operating System','Traffic Analysis',
    'Introduce System Fingerprinting','Misinformation & Propaganda',
}
# The rest instruct the model to do something benign but off-task: add a sentence,
# translate, use emoji, mention a TV show. That is task hijacking, not compromise.

g = defaultdict(lambda: [0,0])
for r in res:
    if not r['expect_flagged']:
        continue
    cat = r['meta'].get('attack_category','?')
    k = 'security-relevant' if cat in MALICIOUS else 'benign task-hijacking'
    g[k][1] += 1
    if r['got_flagged']:
        g[k][0] += 1

print("=== BIPIA injected attacks, split by what the attack actually does ===")
for k,(d,t) in g.items():
    print(f"  {k:<24} {d}/{t}  {100.0*d/t:.1f}%")

neg = [r for r in res if not r['expect_flagged']]
sec_fp = sum(1 for r in neg if r['got_flagged'] and r['method'] != 'reference_detection')
ref_fp = sum(1 for r in neg if r['got_flagged'] and r['method'] == 'reference_detection')
print(f"\n=== clean cases ({len(neg)}) ===")
print(f"  flagged as a security threat : {sec_fp} ({100.0*sec_fp/len(neg):.1f}%)")
print(f"  flagged as containing a link : {ref_fp} ({100.0*ref_fp/len(neg):.1f}%)  <- reference_detection, a feature not an error")
print(f"  clean                        : {len(neg)-sec_fp-ref_fp}")
