import json, sys
import os
HERE = os.path.dirname(os.path.abspath(__file__))
# Results file to analyse; pass another on the command line to analyse the strict run.
RESULTS = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'results-default.jsonl')
# cases.json is not redistributed (see ../README.md); build it with build_cases.py first.
CASES = os.path.join(HERE, 'cases.json')
res=[json.loads(l) for l in open(RESULTS)]
cases={c['id']:c for c in json.load(open(CASES))}

special=[r for r in res if r['expect_flagged'] and
         ('<|' in cases[r['id']]['prompt'] or 'endoftext' in cases[r['id']]['prompt'])]
d=sum(1 for r in special if r['got_flagged'])
print(f"  special-token attacks (<|endoftext|> etc): {len(special)} total, {d} detected"
      + (f" ({100*d/len(special):.0f}%)" if special else ""))
print("\n  examples MISSED:")
n=0
for r in special:
    if not r['got_flagged']:
        n+=1
        if n>4: break
        print(f"    {' '.join(cases[r['id']]['prompt'].split())[:150]!r}")

# repetition/flooding, counted properly on raw characters
def is_flood(p):
    s=''.join(p.split())
    return len(s)>60 and len(set(s))<=4
flood=[r for r in res if r['expect_flagged'] and is_flood(cases[r['id']]['prompt'])]
d2=sum(1 for r in flood if r['got_flagged'])
print(f"\n  character-flooding attacks: {len(flood)} total, {d2} detected"
      + (f" ({100*d2/len(flood):.0f}%)" if flood else ""))
