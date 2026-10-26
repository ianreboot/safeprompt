"""Regenerate every figure block in README.md from the committed rows.

Usage:
  python3 readme_figures.py           rewrite the blocks in README.md in place
  python3 readme_figures.py --check   exit 1 if README.md differs from the rows
  python3 readme_figures.py --json    print the counts as JSON

A block runs from <!-- fig:NAME --> to <!-- /fig:NAME -->. Text outside the blocks is
hand-written and carries no counts. Each count is taken from the results-*.jsonl rows
and checked against the matching summary file, so a summary that disagrees with its rows
stops the script instead of reaching the README.

The files named *strict* and the AgentDojo `safeprompt` arm hold rows run with
sensitivity=strict, SafePrompt's default for new accounts since 21 October 2026. The
files named *default* and the AgentDojo `safeprompt-default` arm hold no judgement mode
(sensitivity=balanced), which was the API default when they were named.
"""
import collections, datetime, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
README = os.path.join(HERE, "README.md")


def rows(path):
    with open(os.path.join(HERE, path)) as f:
        return [json.loads(line) for line in f if line.strip()]


def jload(path):
    with open(os.path.join(HERE, path)) as f:
        return json.load(f)


def check_failed(r):
    # The API answers a check it could not finish with safe:false at confidence 0.5,
    # category "other". The runner scores that as flagged, as production would block it.
    return r["got_flagged"] and r["confidence"] == 0.5 and r["category"] == "other"


def count_set(path):
    c = collections.Counter()
    for r in rows(path):
        if r["expect_flagged"]:
            c["attacks"] += 1
            if r["got_flagged"]:
                c["check_failed" if check_failed(r) else "caught"] += 1
        else:
            c["ordinary"] += 1
            if not r["got_flagged"]:
                c["passed"] += 1
            elif check_failed(r):
                c["ordinary_check_failed"] += 1
    return {k: c[k] for k in ("attacks", "caught", "check_failed", "ordinary", "passed",
                              "ordinary_check_failed")}


# key, label, latest rows, no judgement mode rows, baseline set key, shown on safeprompt.dev
PUBLIC = [
    ("tensortrust-200", "Tensor Trust, seeded draw", "tensortrust/results-strict.jsonl",
     "tensortrust/results-default.jsonl", "yes"),
    ("tensortrust-ext100", "Tensor Trust, second seeded draw", "tensortrust/results-strict-ext100.jsonl",
     "tensortrust/results-default-ext100.jsonl", "yes, pooled with the first"),
    ("hackaprompt-1000", "HackAPrompt, 100 per level", "hackaprompt/results-strict.jsonl",
     "hackaprompt/results-default.jsonl", "yes"),
    ("bipia-200", "BIPIA, email, table and code", "bipia/results-strict.jsonl",
     "bipia/results-default.jsonl", "ordinary side only"),
    ("deepset-full", "deepset prompt-injections, full", "deepset/results-strict.jsonl",
     "deepset/results-default.jsonl", "ordinary side only"),
    ("notinject-full", "NotInject, full", "notinject/results-strict.jsonl",
     "notinject/results-default.jsonl", "yes"),
    ("gandalf-pilot", "Lakera Gandalf, pilot of 100", "gandalf/results-strict-pilot.jsonl",
     "gandalf/results-default-pilot.jsonl", "no"),
]
ATTACK_SETS = ["tensortrust-200", "tensortrust-ext100", "hackaprompt-1000", "bipia-200", "deepset-full"]
ORDINARY_SETS = ["tensortrust-200", "tensortrust-ext100", "bipia-200", "deepset-full", "notinject-full"]
SAFE_SUITE = "safe-suite-v3/results-strict.jsonl"
SAFE_SUITE_NJ = "safe-suite-v3/results-default.jsonl"
PILOTS_SEPT = [("deepset pilot (100 cases):", "deepset/results-strict-pilot.jsonl"),
               ("NotInject pilot (100 cases):", "notinject/results-strict-pilot.jsonl")]
BASELINES = [("protectai", "ProtectAI DeBERTa v3 v2"), ("promptguard2", "Llama Prompt Guard 2 86M")]
SUITES = ["workspace", "travel", "banking", "slack"]


def long_date(iso):
    t = datetime.date.fromisoformat(iso[:10])
    return f"{t.day} {t:%B %Y}"


def pct(n, d):
    return f"{100.0 * n / d:.1f}%" if d else "n/a"


def frac(n, d, with_pct=False):
    s = f"{n:,} / {d:,}"
    return f"{s} ({pct(n, d)})" if with_pct else s


def collect():
    out = {"public": {}, "public_nj": {}, "baselines": {}, "agentdojo": {}}
    summ = jload("summary-2026-10-10-strict.json")
    by_file = {v["file"]: v for v in summ["sets"].values()}
    for key, label, latest, nj, site in PUBLIC:
        c = count_set(latest)
        s = by_file[latest]
        assert (s["attacks"], s["attacks_caught"], s["benign"], s["benign_passed"]) == \
            (c["attacks"], c["caught"] + c["check_failed"], c["ordinary"], c["passed"]), latest
        out["public"][key] = dict(c, label=label, file=latest, site=site)
        out["public_nj"][key] = dict(count_set(nj), label=label, file=nj)
    out["run"] = summ["run"]
    ss = count_set(SAFE_SUITE)
    s = by_file[SAFE_SUITE]
    assert (s["benign"], s["benign_passed"]) == (ss["ordinary"], ss["passed"]), SAFE_SUITE
    out["safe_suite"] = ss
    out["safe_suite_nj"] = count_set(SAFE_SUITE_NJ)
    out["pilots_sept"] = [(label, path, count_set(path)) for label, path in PILOTS_SEPT]
    out["freeze_sept"] = jload("summary-2026-09-12.json")["freeze"]

    sp_files = {key: v["file"] for key, v in out["public"].items()}
    sp_files["suite-safe-219"] = SAFE_SUITE
    for model, name in BASELINES:
        summ_b = jload(f"baselines/summary-{model}.json")
        per = {}
        for key, sp_file in sp_files.items():
            path = f"baselines/{model}/results-{key}.jsonl"
            b = rows(path)
            assert {r["id"] for r in b} == {r["id"] for r in rows(sp_file)}, (path, sp_file)
            c = collections.Counter()
            for r in b:
                if r["expect_flagged"]:
                    c["attacks"] += 1; c["caught"] += r["got_flagged"]
                else:
                    c["ordinary"] += 1; c["passed"] += not r["got_flagged"]
            s = summ_b["sets"][key]
            assert (s["attacks"], s["attacks_caught"], s["ordinary"], s["ordinary_passed"]) == \
                (c["attacks"], c["caught"], c["ordinary"], c["passed"]), path
            per[key] = dict(c, over_max_length=s["over_max_length"])
        out["baselines"][model] = dict(name=name, run_at=summ_b["runtime"]["run_at_utc"],
                                       revision=summ_b["model"]["revision"], sets=per)

    for arm in ("baseline", "safeprompt", "safeprompt-default"):
        per, t = {}, collections.Counter()
        for suite in SUITES:
            rs = rows(f"agentdojo/results-{suite}-{arm}.jsonl")
            att = [r for r in rs if r["run_kind"] == "attack"]
            ut = [r for r in rs if r["run_kind"] == "no_attack" and r["user_task_id"].startswith("user_task")]
            c = collections.Counter(
                attack_runs=len(att), through=sum(r["attack_succeeded"] for r in att),
                util_attack=sum(r["utility"] for r in att), user_tasks=len(ut),
                util_no_attack=sum(r["utility"] for r in ut), errors=sum(bool(r["error"]) for r in rs))
            s = jload(f"agentdojo/summary-{suite}-{arm}.json")
            assert s["n_attack_runs"] == c["attack_runs"] and s["user_tasks"] == c["user_tasks"], (suite, arm)
            assert s["attack_success_pct"] == round(100.0 * c["through"] / c["attack_runs"], 1), (suite, arm)
            assert s["utility_under_attack_pct"] == round(100.0 * c["util_attack"] / c["attack_runs"], 1), (suite, arm)
            assert s["utility_no_attack_pct"] == round(100.0 * c["util_no_attack"] / c["user_tasks"], 1), (suite, arm)
            if arm != "baseline":
                calls = rows(f"agentdojo/calls-{suite}-{arm}.jsonl")
                c["checks"] = sum(1 for x in calls if x["retry"] == 0)
                c["calls"] = len(calls)
                assert s["safeprompt_calls"] == c["calls"], (suite, arm)
                c["unavailable"] = sum(1 for x in calls if x["retry"] == 2 and x["outcome"] == "validation_unavailable")
                assert s["safeprompt_unavailable"] == c["unavailable"] and s["safeprompt_errors"] == 0, (suite, arm)
                run = collections.defaultdict(lambda: [False, False])
                for x in calls:
                    if x.get("injection_task_id"):
                        k = (x["user_task_id"], x["injection_task_id"])
                        run[k][0] |= x["outcome"] == "blocked"
                        run[k][1] |= x["retry"] == 2 and x["outcome"] == "validation_unavailable"
                c["runs_only_unavailable"] = sum(1 for b, u in run.values() if u and not b)
                c["first_call"] = min(x["t"] for x in calls)
                c["last_call"] = max(x["t"] for x in calls)
            per[suite] = c
            for k, v in c.items():
                if isinstance(v, int):
                    t[k] += v
        if arm != "baseline":
            t["first_call"] = min(per[s]["first_call"] for s in SUITES)
            t["last_call"] = max(per[s]["last_call"] for s in SUITES)
        out["agentdojo"][arm] = {"suites": {k: dict(v) for k, v in per.items()}, "total": dict(t)}

    rec = jload("run-record.json")
    deps = sorted(rec["deployments"]["versions"], key=lambda v: v["created_utc"])
    runs = {r["key"]: r for r in rec["runs"]}
    adj = runs["agentdojo"]
    assert adj["start_utc"] == min(A["total"]["first_call"] for a, A in out["agentdojo"].items() if a != "baseline")
    assert adj["end_utc"] == max(A["total"]["last_call"] for a, A in out["agentdojo"].items() if a != "baseline")
    pub = runs["public"]
    assert (pub["start_utc"], pub["end_utc"]) == (summ["run"]["started_utc"], summ["run"]["finished_utc"])
    for r in rec["runs"]:
        live = [v for v in deps if v["created_utc"] <= r["start_utc"]][-1]
        inside = [v for v in deps if r["start_utc"] < v["created_utc"] <= r["end_utc"]]
        assert live["version"] == r["version"] and not inside, f"detector changed during {r['key']}"
    later = [v for v in deps if v["created_utc"] > max(r["end_utc"] for r in rec["runs"])]
    out["record"] = dict(runs=runs, later=later, read_at=rec["deployments"]["read_at_utc"])
    return out


def total(sets, keys, field):
    return sum(sets[k][field] for k in keys)


def blocks(d):
    P, B, A = d["public"], {}, d["agentdojo"]
    att = {f: total(P, ATTACK_SETS, f) for f in ("attacks", "caught", "check_failed")}
    ordn = {f: total(P, ORDINARY_SETS, f) for f in ("ordinary", "passed")}
    ss = d["safe_suite"]
    sp, bl = A["safeprompt"]["total"], A["baseline"]["total"]

    bs = d["baselines"]
    pa_att = sum(bs["protectai"]["sets"][k]["caught"] for k in ATTACK_SETS)
    pg_att = sum(bs["promptguard2"]["sets"][k]["caught"] for k in ATTACK_SETS)
    pa_ord = sum(bs["protectai"]["sets"][k]["passed"] for k in ORDINARY_SETS)
    pg_ord = sum(bs["promptguard2"]["sets"][k]["passed"] for k in ORDINARY_SETS)
    bip = P["bipia-200"]
    B["headline"] = "\n".join([
        f"* **Attacks caught, four public sets:** {frac(att['caught'], att['attacks'], True)}. "
        f"Another {att['check_failed']} were blocked only because the check could not finish. "
        f"Those are not counted as catches.",
        f"* **AgentDojo, attacks that reached their goal:** {sp['through']} of {sp['attack_runs']:,} "
        f"with SafePrompt checking every tool output, {bl['through']} of {bl['attack_runs']:,} with no defense.",
        f"* **AgentDojo, tasks the agent still finished:** with attacks planted, {sp['util_attack']} of "
        f"{sp['attack_runs']:,} with SafePrompt and {bl['util_attack']} with no defense, because a blocked tool "
        f"output also stops the step that needed it. With no attacks, {sp['util_no_attack']} of "
        f"{sp['user_tasks']} against {bl['util_no_attack']}.",
        f"* **Ordinary prompts passed, four public sets:** {frac(ordn['passed'], ordn['ordinary'], True)}.",
        f"* **Ordinary prompts passed, our own safe suite:** {frac(ss['passed'], ss['ordinary'], True)}. "
        f"SafePrompt over-flags this suite; see below.",
        f"* **Weakest set:** instructions planted in emails, tables and code (BIPIA), "
        f"{frac(bip['caught'], bip['attacks'])} caught.",
        f"* **Two free classifiers on the same cases:** ProtectAI caught {pa_att:,} attacks and passed "
        f"{pa_ord:,} ordinary prompts. Prompt Guard 2 caught {pg_att:,} and passed {pg_ord:,}.",
    ])

    lines = ["| Set | Attacks caught | Blocked, check could not finish | Ordinary prompts passed | Set shown on safeprompt.dev | Rows |",
             "|---|---|---|---|---|---|"]
    for key, *_ in PUBLIC:
        c = P[key]
        a = frac(c["caught"], c["attacks"]) if c["attacks"] else "no attacks in the set"
        f = str(c["check_failed"]) if c["attacks"] else "n/a"
        o = frac(c["passed"], c["ordinary"]) if c["ordinary"] else "no ordinary prompts in the set"
        lines.append(f"| {c['label']} | {a} | {f} | {o} | {c['site']} | `{c['file']}` |")
    lines.append(f"| **Attack side, the four sets with attacks** | **{frac(att['caught'], att['attacks'], True)}** "
                 f"| **{att['check_failed']}** | | | |")
    lines.append(f"| **Ordinary side, the four sets with ordinary prompts** | | | "
                 f"**{frac(ordn['passed'], ordn['ordinary'], True)}** | | |")
    B["public"] = "\n".join(lines)

    pil = "; ".join(f"{label} {frac(c['caught'], c['attacks']) + ' attacks caught, ' if c['attacks'] else ''}"
                    f"{frac(c['passed'], c['ordinary'])} ordinary passed (`{path}`)"
                    for label, path, c in d["pilots_sept"])
    B["pilots"] = (f"Pilots run on {long_date(d['freeze_sept']['captured_at_utc'])} (detector commit "
                   f"`{d['freeze_sept']['commit'][:8]}`), before the full runs above replaced them: {pil}.")

    B["safe-suite"] = (f"| Rows | Ordinary prompts passed | Blocked |\n|---|---|---|\n"
                       f"| `{SAFE_SUITE}` | {frac(ss['passed'], ss['ordinary'], True)} | "
                       f"{ss['ordinary'] - ss['passed']} |")

    lines = ["| Suite | Attack runs | Attacks reached goal: no defense | Attacks reached goal: SafePrompt "
             "| Tasks finished under attack: no defense | Tasks finished under attack: SafePrompt "
             "| User tasks | Finished, no attack: no defense | Finished, no attack: SafePrompt |",
             "|---|---|---|---|---|---|---|---|---|"]
    for suite in SUITES + ["total"]:
        b = bl if suite == "total" else A["baseline"]["suites"][suite]
        s = sp if suite == "total" else A["safeprompt"]["suites"][suite]
        name = "**All four**" if suite == "total" else suite
        n = b["attack_runs"]
        lines.append(f"| {name} | {n:,} | {b['through']} ({pct(b['through'], n)}) | {s['through']} ({pct(s['through'], n)}) "
                     f"| {b['util_attack']} ({pct(b['util_attack'], n)}) | {s['util_attack']} ({pct(s['util_attack'], n)}) "
                     f"| {b['user_tasks']} | {b['util_no_attack']} | {s['util_no_attack']} |")
    B["agentdojo"] = "\n".join(lines)

    B["agentdojo-checks"] = "\n".join([
        f"* SafePrompt checks: {sp['checks']:,}, not counting retries ({sp['calls']:,} API calls with retries; "
        f"first {sp['first_call']}, last {sp['last_call']}).",
        f"* Checks that could not finish after two retries: {sp['unavailable']} of {sp['checks']:,}. "
        f"The harness blocks the tool output then, as production does.",
        f"* Attack runs where the only block was a check that could not finish: {sp['runs_only_unavailable']}.",
        f"* Runs that ended in an error: {sp['errors'] + bl['errors']}.",
    ])

    lines = ["| Set | Attacks caught: SafePrompt | ProtectAI | Prompt Guard 2 | Ordinary passed: SafePrompt | ProtectAI | Prompt Guard 2 |",
             "|---|---|---|---|---|---|---|"]
    sp_sets = dict(P)
    sp_sets["suite-safe-219"] = dict(ss, label="Our own safe suite")
    for key in [k for k, *_ in PUBLIC] + ["suite-safe-219"]:
        c = sp_sets[key]
        pa, pg = bs["protectai"]["sets"][key], bs["promptguard2"]["sets"][key]
        if c["attacks"]:
            a = f"| {frac(c['caught'], c['attacks'])} | {frac(pa['caught'], pa['attacks'])} | {frac(pg['caught'], pg['attacks'])} "
        else:
            a = "| n/a | n/a | n/a "
        if c["ordinary"]:
            o = f"| {frac(c['passed'], c['ordinary'])} | {frac(pa['passed'], pa['ordinary'])} | {frac(pg['passed'], pg['ordinary'])} |"
        else:
            o = "| n/a | n/a | n/a |"
        lines.append(f"| {c['label']} {a}{o}")
    lines.append(f"| **Four public sets** | **{frac(att['caught'], att['attacks'])}** | **{frac(pa_att, att['attacks'])}** "
                 f"| **{frac(pg_att, att['attacks'])}** | **{frac(ordn['passed'], ordn['ordinary'])}** "
                 f"| **{frac(pa_ord, ordn['ordinary'])}** | **{frac(pg_ord, ordn['ordinary'])}** |")
    B["baselines"] = "\n".join(lines)
    B["baselines-run"] = "\n".join(
        f"* {bs[m]['name']}: revision `{bs[m]['revision'][:8]}`, run {bs[m]['run_at']}, "
        f"`baselines/summary-{m}.json`, rows in `baselines/{m}/`." for m, _ in BASELINES)

    N, nss = d["public_nj"], d["safe_suite_nj"]
    runs = d["record"]["runs"]
    natt = {f: total(N, ATTACK_SETS, f) for f in ("attacks", "caught", "check_failed")}
    nord = {f: total(N, ORDINARY_SETS, f) for f in ("ordinary", "passed", "ordinary_check_failed")}
    nj = A["safeprompt-default"]["total"]
    per_set = "; ".join(
        f"{N[k]['label']} " + ", ".join(
            x for x in [f"{frac(N[k]['caught'], N[k]['attacks'])} caught" if N[k]["attacks"] else "",
                        f"{frac(N[k]['passed'], N[k]['ordinary'])} passed" if N[k]["ordinary"] else ""] if x)
        for k, *_ in PUBLIC)
    B["no-judgement"] = "\n".join([
        f"* Public sets, {long_date(runs['nj-public']['start_utc'])}: attacks caught {frac(natt['caught'], natt['attacks'], True)} on the four "
        f"sets with attacks ({natt['check_failed']} more blocked because the check could not finish); ordinary "
        f"prompts passed {frac(nord['passed'], nord['ordinary'], True)} on the four sets with ordinary prompts.",
        f"* Per set: {per_set}.",
        f"* Our own safe suite, {long_date(runs['nj-safe-suite']['start_utc'])}: {frac(nss['passed'], nss['ordinary'], True)} passed (`{SAFE_SUITE_NJ}`).",
        f"* AgentDojo, same run as above: {nj['through']} of {nj['attack_runs']:,} attacks reached their goal; "
        f"tasks finished under attack {nj['util_attack']}, with no attack {nj['util_no_attack']} of {nj['user_tasks']}; "
        f"{nj['unavailable']} of {nj['checks']:,} checks (not counting retries) could not finish after two retries; "
        f"{nj['runs_only_unavailable']} attack runs blocked only by such a check.",
    ])
    lines = ["| Run | Window (UTC) | Production Worker version | Record |", "|---|---|---|---|"]
    for r in runs.values():
        win = f"{r['start_utc'][:16].replace('T', ' ')} to {r['end_utc'][:16].replace('T', ' ')}"
        if r["start_utc"].endswith("T00:00:00Z"):
            win = f"{r['start_utc'][:10]} (date only)"
        main = ""
        if r.get("main"):
            sha, _, note = r["main"].partition(" ")
            main = f", `main` `{sha}`" + (f" {note}" if note else "")
        lines.append(f"| {r['name']} | {win} | `{r['version'][:8]}`{main} | {r['record']} |")
    later = d["record"]["later"]
    lines.append("")
    lines.append("Each window is checked against the production deployment list in `run-record.json` "
                 f"(read {d['record']['read_at']}): no other version went live inside any window. "
                 + ("Production has changed since these runs: " + "; ".join(
                     f"version `{v['version'][:8]}` went live at {v['created_utc'].replace('T', ' ')[:16]} UTC"
                     for v in later) + " and is not measured here." if later else ""))
    B["runs"] = "\n".join(lines)
    return B


def render(text, B):
    for name, body in B.items():
        pat = re.compile(rf"(<!-- fig:{re.escape(name)} -->\n)(?:.*?\n)?(<!-- /fig:{re.escape(name)} -->)", re.S)
        if not pat.search(text):
            sys.exit(f"README has no fig:{name} block")
        text = pat.sub(lambda m: m.group(1) + body + "\n" + m.group(2), text)
    left = set(re.findall(r"<!-- fig:([\w-]+) -->", text)) - set(B)
    if left:
        sys.exit(f"README has blocks this script does not fill: {sorted(left)}")
    return text


def main():
    d = collect()
    if "--json" in sys.argv:
        print(json.dumps(d, indent=1, default=str))
        return
    with open(README) as f:
        old = f.read()
    new = render(old, blocks(d))
    if "--check" in sys.argv:
        if new != old:
            sys.exit("README.md figures are out of date; run python3 readme_figures.py")
        print("README.md figures match the committed rows")
        return
    with open(README, "w") as f:
        f.write(new)
    print("README.md figures regenerated")


if __name__ == "__main__":
    main()
