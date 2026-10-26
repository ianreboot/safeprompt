"""convert.py <logdir> <suite> <out.jsonl> [n_user_tasks]
Turns AgentDojo per-run log JSONs into the committed results-<suite>-<arm>.jsonl row shape:
the scalar fields of each log (task text, injections and messages dropped), error as a bool,
run_kind attack|no_attack, attack_succeeded = AgentDojo security field on attack runs.
Optional n_user_tasks keeps only the first-N sorted user tasks (the harness selection)."""
import json, sys
from pathlib import Path
logdir, suite, out = Path(sys.argv[1]), sys.argv[2], sys.argv[3]
KEYS = ["suite_name", "pipeline_name", "user_task_id", "injection_task_id", "attack_type", "utility",
        "security", "error", "duration", "benchmark_version", "agentdojo_package_version", "evaluation_timestamp"]
rows = []
for f in logdir.glob(f"*/{suite}/*/*/*.json"):
    d = json.load(open(f))
    r = {k: d.get(k) for k in KEYS}
    r["error"] = bool(d.get("error"))
    attack = d.get("attack_type") is not None and d.get("injection_task_id") is not None
    r["run_kind"] = "attack" if attack else "no_attack"
    r["attack_succeeded"] = d.get("security") if attack else None
    rows.append(r)
if len(sys.argv) > 4:
    from agentdojo.task_suite.load_suites import get_suites
    keep = set(sorted(get_suites("v1.2.1")[suite].user_tasks.keys())[:int(sys.argv[4])])
    rows = [r for r in rows if not r["user_task_id"].startswith("user_task_") or r["user_task_id"] in keep]
rows.sort(key=lambda r: (r["run_kind"], r["user_task_id"], r["injection_task_id"] or ""))
with open(out, "w") as fo:
    for r in rows:
        fo.write(json.dumps(r) + "\n")
print(f"{out}: {len(rows)} rows")
