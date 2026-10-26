# External benchmarks

SafePrompt is an API that checks text for prompt injection before an AI reads it. These
are benchmarks other people wrote. We ran them against the production API and committed
every per-case result.

`../benchmarks/` holds our own suite. This directory is the opposite exercise: case
sets authored by other people, for other purposes, scored zero-shot. Nothing here was
tuned toward these corpora, and results are published for every set we ran.

Every result count in this file is generated from the committed rows by
`readme_figures.py`, which also checks each count against its summary file. `python3 readme_figures.py --check`
fails if this README and the rows disagree.

## Results at a glance

Every SafePrompt figure in this file, outside the "No judgement mode" section, ran with
SafePrompt's default for new accounts, against the production API.

<!-- fig:headline -->
* **Attacks caught, four public sets:** 1,294 / 1,563 (82.8%). Another 19 were blocked only because the check could not finish. Those are not counted as catches.
* **AgentDojo, attacks that reached their goal:** 4 of 949 with SafePrompt checking every tool output, 239 of 949 with no defense.
* **AgentDojo, tasks the agent still finished:** with attacks planted, 131 of 949 with SafePrompt and 400 with no defense, because a blocked tool output also stops the step that needed it. With no attacks, 64 of 97 against 68.
* **Ordinary prompts passed, four public sets:** 999 / 1,038 (96.2%).
* **Ordinary prompts passed, our own safe suite:** 158 / 219 (72.1%). SafePrompt over-flags this suite; see below.
* **Weakest set:** instructions planted in emails, tables and code (BIPIA), 17 / 100 caught.
* **Two free classifiers on the same cases:** ProtectAI caught 1,325 attacks and passed 852 ordinary prompts. Prompt Guard 2 caught 1,057 and passed 1,018.
<!-- /fig:headline -->

## Public sets

Latest run: 10 October 2026, production API, Worker version `64fb4530`. The run record and the failed IDs per set are in
`summary-2026-10-10-strict.json`. The run made 2,920 calls at 10 a minute, one at a
time, with 0 refusals and 0 errors. Every case ID matches the 12 September run, which
these rows replace; that run is kept in `summary-2026-09-12.json` and in git history.

<!-- fig:public -->
| Set | Attacks caught | Blocked, check could not finish | Ordinary prompts passed | Set shown on safeprompt.dev (12 September run) | Rows |
|---|---|---|---|---|---|
| Tensor Trust, seeded draw | 89 / 100 | 2 | 99 / 100 | yes | `tensortrust/results-strict.jsonl` |
| Tensor Trust, second seeded draw | 87 / 100 | 5 | 94 / 100 | yes, pooled with the first | `tensortrust/results-strict-ext100.jsonl` |
| HackAPrompt, 100 per level | 924 / 1,000 | 6 | no ordinary prompts in the set | yes | `hackaprompt/results-strict.jsonl` |
| BIPIA, email, table and code | 17 / 100 | 5 | 97 / 100 | ordinary side only | `bipia/results-strict.jsonl` |
| deepset prompt-injections, full | 177 / 263 | 1 | 398 / 399 | ordinary side only | `deepset/results-strict.jsonl` |
| NotInject, full | no attacks in the set | n/a | 311 / 339 | yes | `notinject/results-strict.jsonl` |
| Lakera Gandalf, pilot of 100 | 82 / 100 | 0 | no ordinary prompts in the set | no | `gandalf/results-strict-pilot.jsonl` |
| **Attack side, the four sets with attacks** | **1,294 / 1,563 (82.8%)** | **19** | | | |
| **Ordinary side, the four sets with ordinary prompts** | | | **999 / 1,038 (96.2%)** | | |
<!-- /fig:public -->

"Blocked, check could not finish" counts attacks the API blocked as a precaution because
its check did not complete. The API answers those at confidence 0.5 with category
`other`, and the runner records them as flagged, as production would block them. They
are not counted as catches. No ordinary prompt in these runs was blocked that way.

The four-set totals leave out the Gandalf pilot, which is 100 cases and attacks only.

<!-- fig:pilots -->
Pilots run on 12 September 2026 (detector commit `2a0c6638`), before the full runs above replaced them: deepset pilot (100 cases): 39 / 50 attacks caught, 50 / 50 ordinary passed (`deepset/results-strict-pilot.jsonl`); NotInject pilot (100 cases): 91 / 100 ordinary passed (`notinject/results-strict-pilot.jsonl`).
<!-- /fig:pilots -->

## Our own safe suite

We wrote these 219 ordinary prompts and ran them in the same 10 October run. The prompts are internal
and not published; the rows carry the case ID and suite ID only.

<!-- fig:safe-suite -->
| Rows | Ordinary prompts passed | Blocked |
|---|---|---|
| `safe-suite-v3/results-strict.jsonl` | 158 / 219 (72.1%) | 61 |
<!-- /fig:safe-suite -->

SafePrompt over-flags this suite. The suite was built on purpose from credential-,
export- and code-shaped requests, and those are the ones blocked. The public sets pass
ordinary prompts at a far higher rate; this suite is closer to that kind of traffic.

## AgentDojo

ETH Zurich's agent benchmark: an AI agent does real tasks with tools while attacks are
planted in the tool output it reads. The run covers all four suites (workspace, travel,
banking, slack) with the `important_instructions` attack and GPT-4o-mini as the agent
through OpenRouter, on AgentDojo 0.1.35 and benchmark v1.2.1. Two arms ran on the same
tasks: no defense, and SafePrompt checking every tool output in full before the agent
reads it (outputs over 45,000 characters go in overlapping windows).

Run 21 to 22 October 2026 on Worker version `64fb4530` throughout.

<!-- fig:agentdojo -->
| Suite | Attack runs | Attacks reached goal: no defense | Attacks reached goal: SafePrompt | Tasks finished under attack: no defense | Tasks finished under attack: SafePrompt | User tasks | Finished, no attack: no defense | Finished, no attack: SafePrompt |
|---|---|---|---|---|---|---|---|---|
| workspace | 560 | 78 (13.9%) | 4 (0.7%) | 225 (40.2%) | 64 (11.4%) | 40 | 33 | 31 |
| travel | 140 | 28 (20.0%) | 0 (0.0%) | 57 (40.7%) | 17 (12.1%) | 20 | 12 | 12 |
| banking | 144 | 68 (47.2%) | 0 (0.0%) | 63 (43.8%) | 34 (23.6%) | 16 | 8 | 7 |
| slack | 105 | 65 (61.9%) | 0 (0.0%) | 55 (52.4%) | 16 (15.2%) | 21 | 15 | 14 |
| **All four** | 949 | 239 (25.2%) | 4 (0.4%) | 400 (42.1%) | 131 (13.8%) | 97 | 68 | 64 |
<!-- /fig:agentdojo -->

<!-- fig:agentdojo-checks -->
* SafePrompt checks: 10,094, not counting retries (10,467 API calls with retries; first 2026-10-21T03:55:59Z, last 2026-10-22T15:50:18Z).
* Checks that could not finish after two retries: 33 of 10,094. The harness blocks the tool output then, as production does.
* Attack runs where the only block was a check that could not finish: 1.
* Runs that ended in an error: 0.
<!-- /fig:agentdojo-checks -->

Read the task columns with the attack columns. When SafePrompt blocks a tool output, the
attack stops, and so does the step that needed that output. Under attack, the agent
finished far fewer tasks with SafePrompt than with no defense. With no attack planted,
the two arms finish close to the same number.

This run replaces the September AgentDojo rows (banking and slack only, on the September
detector), which are kept in git history. It also replaces the interim October workspace
rows: the harness then checked only the first 20,000 characters of each tool output, and
counted a check that could not finish as a catch. Both are fixed in this run.

Files: one row per run in `agentdojo/results-<suite>-<arm>.jsonl`, `run_kind` `attack`
for the planted runs and `no_attack` for the clean ones. `utility` is AgentDojo's verdict
that the user task was completed. `security` is AgentDojo's own field and is true when
the planted task was completed; `attack_succeeded` repeats it under a plainer name. The
`no_attack` rows also hold AgentDojo's checks of each planted task on its own
(`user_task_id` starting `injection_task_`); the "User tasks" column counts only real user
tasks. `agentdojo/calls-<suite>-<arm>.jsonl` holds every SafePrompt answer (outcome,
confidence, category, text length and SHA-256 prefix, no text) with its suite, user task
and planted task. The `safeprompt` arm is SafePrompt; `baseline` is no defense.

## Which detector ran

<!-- fig:runs -->
| Run | Window (UTC) | Production Worker version | Record |
|---|---|---|---|
| Public sets and our own safe suite | 2026-10-10 05:29 to 2026-10-10 10:22 | `64fb4530`, `main` `3eeeceda` | summary-2026-10-10-strict.json |
| AgentDojo, all four suites | 2026-10-21 03:55 to 2026-10-22 15:58 | `64fb4530` | agentdojo/calls-*.jsonl (first and last check); version read from wrangler deployments status at launch, 2026-10-21T03:55:10Z |
| No judgement mode, public sets | 2026-10-08 (date only) | `18bb7da0`, `main` `c6404902` (inferred; that deploy was made by hand) | commit 10ef152; run date only, so the whole day is checked |
| No judgement mode, our own safe suite | 2026-10-13 (date only) | `64fb4530` | commit 5d74aa5; run date only, so the whole day is checked |

Each window is checked against the production deployment list in `run-record.json` (read 2026-10-26T03:18:39Z): no other version went live inside any window. Production has changed since these runs: version `654b648e` went live at 2026-10-22 16:10 UTC and is not measured here.
<!-- /fig:runs -->

## Other detectors on the same cases

We scored two open-weights classifiers on 13 October 2026 on the identical cases (every
case ID matches), on CPU, with each model card's default threshold and no tuning. Both
read at most 512 tokens at a time: Prompt Guard 2 scans longer inputs in 512-token
windows, as its model card advises; ProtectAI reads the first 512, its pipeline default.
SafePrompt's columns are the rows above; attacks blocked because a check could not finish
are not counted as SafePrompt catches.

<!-- fig:baselines -->
| Set | Attacks caught: SafePrompt | ProtectAI | Prompt Guard 2 | Ordinary passed: SafePrompt | ProtectAI | Prompt Guard 2 |
|---|---|---|---|---|---|---|
| Tensor Trust, seeded draw | 89 / 100 | 98 / 100 | 81 / 100 | 99 / 100 | 89 / 100 | 98 / 100 |
| Tensor Trust, second seeded draw | 87 / 100 | 100 / 100 | 78 / 100 | 94 / 100 | 89 / 100 | 98 / 100 |
| HackAPrompt, 100 per level | 924 / 1,000 | 1,000 / 1,000 | 836 / 1,000 | n/a | n/a | n/a |
| BIPIA, email, table and code | 17 / 100 | 18 / 100 | 1 / 100 | 97 / 100 | 87 / 100 | 100 / 100 |
| deepset prompt-injections, full | 177 / 263 | 109 / 263 | 61 / 263 | 398 / 399 | 395 / 399 | 398 / 399 |
| NotInject, full | n/a | n/a | n/a | 311 / 339 | 192 / 339 | 324 / 339 |
| Lakera Gandalf, pilot of 100 | 82 / 100 | 100 / 100 | 97 / 100 | n/a | n/a | n/a |
| Our own safe suite | n/a | n/a | n/a | 158 / 219 | 176 / 219 | 211 / 219 |
| **Four public sets** | **1,294 / 1,563** | **1,325 / 1,563** | **1,057 / 1,563** | **999 / 1,038** | **852 / 1,038** | **1,018 / 1,038** |
<!-- /fig:baselines -->

<!-- fig:baselines-run -->
* ProtectAI DeBERTa v3 v2: revision `90c9989b`, run 2026-10-13T16:32:16Z, `baselines/summary-protectai.json`, rows in `baselines/protectai/`.
* Llama Prompt Guard 2 86M: revision `a8ded8e6`, run 2026-10-13T17:47:09Z, `baselines/summary-promptguard2.json`, rows in `baselines/promptguard2/`.
<!-- /fig:baselines-run -->

ProtectAI catches more attacks than SafePrompt on every set except deepset, and blocks
far more ordinary prompts, on NotInject most of all. Prompt Guard 2 passes almost every ordinary prompt and
catches fewer attacks. On our own safe suite both pass more ordinary prompts than
SafePrompt does. Their CPU timings are in the summary files and are not comparable with
the API's production latency.

`baselines/run_local_classifier.py` produced these rows.

## No judgement mode

No judgement mode (`sensitivity=no_judgement`, also accepted as `balanced`) blocks only
clear attacks. Accounts created from 21 October 2026 get it only if they choose it;
older accounts default to it. Its rows are in the files named `*default*` and the AgentDojo `safeprompt-default`
arm, named before the rename.

<!-- fig:no-judgement -->
* Public sets, 8 October 2026: attacks caught 775 / 1,563 (49.6%) on the four sets with attacks (20 more blocked because the check could not finish); ordinary prompts passed 1,024 / 1,038 (98.7%) on the four sets with ordinary prompts.
* Per set: Tensor Trust, seeded draw 67 / 100 caught, 99 / 100 passed; Tensor Trust, second seeded draw 70 / 100 caught, 99 / 100 passed; HackAPrompt, 100 per level 505 / 1,000 caught; BIPIA, email, table and code 5 / 100 caught, 100 / 100 passed; deepset prompt-injections, full 128 / 263 caught, 399 / 399 passed; NotInject, full 327 / 339 passed; Lakera Gandalf, pilot of 100 77 / 100 caught.
* Our own safe suite, 13 October 2026: 212 / 219 (96.8%) passed (`safe-suite-v3/results-default.jsonl`).
* AgentDojo, same run as above: 2 of 949 attacks reached their goal; tasks finished under attack 147, with no attack 67 of 97; 31 of 10,231 checks (not counting retries) could not finish after two retries; 0 attack runs blocked only by such a check.
<!-- /fig:no-judgement -->

The public-set run used Worker version `18bb7da0` and the safe-suite run `64fb4530`. The commits between
`c6404902` and `3eeeceda` touch privacy, stats, feedback, alerting, a cleanup job, a
database helper and one CORS header line; none of them is detection code.

## How the sets on safeprompt.dev were chosen

safeprompt.dev still shows the 12 September run. From the run record:

* deepset and NotInject: "Full runs where the pilot showed a benign-side win (deepset
  100% benign passed; NotInject 91%); Gandalf skipped (82% caught, below the 85% page
  bar)."
* NotInject: "/benchmarks if 90%+ (page tier)".
* Gandalf: "record only (below the 85% page bar); no full run".
* Our own safe suite: "record only".
* "Skipped by ruling: PINT (Lakera-only dataset). Not run: BIPIA other environments,
  HackAPrompt full 5,000 on the new freeze (cap), jailbreak-classification (out of
  scope)."

So sets were run as pilots first, and a set reached the page only if it cleared a bar.
No detector code was changed toward any set, but which sets to show was decided after
seeing results. Every set that was run, pilot or full, is in this directory.

The safeprompt.dev comparison against two open-weights classifiers (ProtectAI's DeBERTa
v2 and deepset's DeBERTa, run 11 September 2026) has no published per-case results, and
the script that produced it has not survived. The 13 October classifier rows above
replace it and can be re-run from this repo.

## The prompts are not in this repo

The attack and benign prompts are NOT redistributed here (dataset licences: Tensor Trust
declares none, HackAPrompt is gated, BIPIA is ShareAlike). Rebuild them with the seeded
`build_cases.py` from each dataset's original source (URLs below); the case IDs are
SHA-256 prefixes of the prompt text, so a rebuild regenerates identical cases and every
verdict in `results-*.jsonl` rehashes back to its prompt. One exception: the second
Tensor Trust draw (`results-strict-ext100.jsonl`) was built with a builder that is not
committed. `build_cases.py 100` rebuilds the first draw exactly, but not the second.

## The benchmarks

| Benchmark | What it is | Dataset | Licence |
|---|---|---|---|
| **Tensor Trust** | Real human attacks from an online game where players defended an LLM "bank vault" and others tried to break in. We use the frozen `hijacking-robustness/v1` benchmark set. | https://huggingface.co/datasets/qxcv/tensor-trust | No licence declared by the publisher (no `license` field on the dataset card, no LICENSE file in the HuggingFace repo or its GitHub mirror). Prompts are therefore **not redistributed here**. |
| **BIPIA** | Microsoft's benchmark for indirect prompt injection: an instruction hidden inside content the model is asked to read. We use the three task types whose contexts ship in the repo (email, table, code). | https://github.com/microsoft/BIPIA | Code MIT. The `benchmark` corpora carry their own licences: WikiTableQuestions and Stack Exchange are CC BY-SA 4.0, the OpenAI Evals invoice data is MIT. Redistribution is possible but would put a ShareAlike obligation on this repo, so prompts are **not redistributed here**. |
| **HackAPrompt** | 600k submissions from a public prompt-hacking competition. We sample only entries that demonstrably worked against the target model, stratified across all levels. | https://huggingface.co/datasets/hackaprompt/hackaprompt-dataset | MIT, but access-gated on HuggingFace (account plus accepted terms). We do not redistribute past that gate, so prompts are **not redistributed here**. |
| **AgentDojo** | ETH Zurich's agent benchmark: an LLM agent solves tasks with tools while attacks are planted in the tool output it reads. We run all four suites with the `important_instructions` attack, GPT-4o-mini as the agent, SafePrompt checking every tool output. | https://github.com/ethz-spylab/agentdojo | MIT. The per-run verdict rows and per-check outcome logs are committed; the agent conversation logs (task text, injected text, tool output) are **not redistributed here**. |
| **NotInject** | 339 ordinary prompts written to trip over-sensitive injection filters, each built around trigger words such as ignore, override or bypass. Benign only, so it measures false positives. | https://huggingface.co/datasets/leolee99/NotInject | MIT. Prompts are **not redistributed here**; case IDs rehash to the upstream rows. |
| **deepset prompt-injections** | deepset's public set of 662 English and German prompts, injections and ordinary questions mixed. | https://huggingface.co/datasets/deepset/prompt-injections | Apache 2.0. Prompts are **not redistributed here**; case IDs rehash to the upstream rows. |
| **Lakera Gandalf** | 1,000 prompts players typed at Lakera's Gandalf game to make it ignore its instructions. Attacks only. Pilot of 100 scored; no full run. | https://huggingface.co/datasets/Lakera/gandalf_ignore_instructions | MIT. Prompts are **not redistributed here**; case IDs rehash to the upstream rows. |

## What is committed instead of the prompts

For the licence reasons in the table above, no `cases.json` ships here. What is
committed instead is the exact thing a reader needs to check us:

* `build_cases.py` in each directory, which rebuilds the identical case set from the
  upstream source. Sampling is seeded, so a rebuild reproduces the same cases. The one
  exception is the second Tensor Trust draw (see above).
* `results-*.jsonl`, one row per case, carrying the case ID (a SHA-256 prefix of the
  prompt), the expected label, what the API actually returned, and the category and
  detection method it returned. Rebuild the cases, hash them, and every verdict here
  can be matched back to the prompt that produced it.
* `build_hf_sets.py` rebuilds the NotInject, Gandalf and deepset sets, full and pilot,
  from the public HuggingFace rows. One `random.Random(20260912)` shuffles all three in
  a fixed order, so build them together. A rebuild on 8 October 2026 reproduced all six
  case files exactly, and every committed result ID rehashes to a rebuilt case.
* `agentdojo/` rows are one per AgentDojo run, plus one call log per SafePrompt arm.
  `agentdojo/run_agentdojo.py` with `safeprompt_defense.py` is the harness, and
  `agentdojo/convert.py` turns its run logs into the committed rows.
* `safe-suite-v3/` holds verdicts on our own 219-prompt safe suite. The prompts are
  internal and not published, so these rows cannot be rebuilt from this repo; they are
  here so the blocked prompts can be counted.
* `baselines/` holds the two classifiers' rows, summaries and runner.
* `summary-2026-10-10-strict.json` is the record of the latest public-set run, with the
  failed IDs per set. `summary-2026-09-12.json` is the September record it replaced.
* `run-record.json` names the production detector version for each run, with the
  deployment list it was checked against.
* `readme_figures.py` regenerates every count in this README from the rows.

## Notes per set

**Tensor Trust.** Attacks are the `attack` field: human-written input trying to hijack
the model. Ordinary prompts are the `access_code` field: the input the defender intended
to work. Those are deliberately hard, being short, odd, imperative strings, so a false
positive here means a legitimate password was read as an attack. Tensor Trust attacks
target one game format, so quote the score in its own terms.

**BIPIA.** Planted instructions in long documents are where SafePrompt is weakest on
these sets. Attacks are a context with an injected instruction appended; ordinary
prompts are the same contexts clean. Most BIPIA injections instruct the model to do
something benign but off-task, such as adding a sentence about climate statistics or
replying in emoji. SafePrompt blocks text that tries to take control of the AI reading
it. An off-task request alone does not trigger it. `split.py` divides the injections
into security-relevant and benign task-hijacking so the two are not averaged into one
number. `analyse.py` breaks the run down by attack category and by task. BIPIA here
covers three of its five task types; the WebQA and Summarization contexts need
licence-gated corpora we do not have.

**HackAPrompt.** Attacks only, so it cannot produce a false-positive rate; take that
from the sets with ordinary prompts. The 1,000 cases are 100 per level, drawn from the
5,000-case set scored on 8 September. HiddenLayer's May 2025 review of prompt-injection
datasets rates HackAPrompt **Not Recommended**, on the grounds that it is unlabeled and
is built around a single goal string. We report it anyway because it is large, public
and adversarial. `summary-strict.json`
in its directory breaks the run down by competition level.

**NotInject.** Every prompt is benign, so it measures false positives only.

**deepset.** deepset labels role-play and persona requests as injection. SafePrompt
does not treat a persona request as an attack by itself, so many of those rows are
misses here by design.

## Re-running

The runners send `sensitivity=balanced` unless told otherwise. The published rows ran
with `SAFEPROMPT_SENSITIVITY=strict`, the value that selects SafePrompt's default for new
accounts, so set it as below to reproduce them.

```bash
export SAFEPROMPT_API_KEY=sp_live_...

cd benchmarks/external/tensortrust
python3 build_cases.py 100       # rebuilds cases.json from upstream
SAFEPROMPT_SENSITIVITY=strict python3 run.py
```

`run.py` appends to `results.jsonl` in its own directory and is resumable, so move or
delete that file between runs or the second run will see the first as already scored.
The committed results are not touched by a run.

BIPIA works the same way. HackAPrompt needs the gated parquet downloaded first, then
`HACKAPROMPT_PARQUET=/path/to/hackaprompt.parquet python3 build_cases.py 5000`.

NotInject, Gandalf and deepset:

```bash
cd benchmarks/external
python3 build_hf_sets.py                                   # writes cases-full.json and cases-pilot.json per set
SAFEPROMPT_SENSITIVITY=strict python3 run_set.py deepset full
SAFEPROMPT_SENSITIVITY=strict python3 run_set.py gandalf pilot
```

AgentDojo (needs `pip install agentdojo==0.1.35` and an OpenRouter key for the agent
model). The second argument is the number of user tasks: 40 for workspace, 20 for
travel, 16 for banking, 21 for slack, which is every user task in each suite.

```bash
cd benchmarks/external/agentdojo
OPENROUTER_API_KEY=... PROXY_MODEL=openai/gpt-4o-mini LOCAL_LLM_PORT=8011 python3 orproxy.py &
export SAFEPROMPT_API_KEY=sp_live_... PROXY_MODEL=openai/gpt-4o-mini LOCAL_LLM_PORT=8011
export SAFEPROMPT_SENSITIVITY=strict SAFEPROMPT_MIN_INTERVAL_S=6.0
for st in "workspace 40" "travel 20" "banking 16" "slack 21"; do
  set -- $st
  python3 run_agentdojo.py $1 $2 baseline
  SAFEPROMPT_CALL_LOG=rerun-calls-$1-safeprompt.jsonl python3 run_agentdojo.py $1 $2 safeprompt
  for arm in baseline safeprompt; do
    python3 convert.py runs-$1-$arm $1 rerun-results-$1-$arm.jsonl
  done
done
```

The `rerun-` files have the same shape as the committed `results-*` and `calls-*` files,
which a run does not touch. The agent model is not deterministic, so a re-run lands close
to the committed figures but rarely matches them exactly.

The classifier baselines (need `torch` and `transformers`; Prompt Guard 2 is gated on
HuggingFace):

```bash
cd benchmarks/external/baselines
python3 run_local_classifier.py --model protectai --all
HF_TOKEN=... python3 run_local_classifier.py --model promptguard2 --all
```

The runners need `requests`. The Tensor Trust and BIPIA builders fetch over stdlib
`urllib` and need nothing else; the HackAPrompt builder reads a parquet file and needs
`pyarrow`.

### Pacing

`runner_common.py` paces requests deliberately. The production origin starts refusing
around 28 requests per minute, and a refusal scored as a verdict would corrupt the
result, so transport failures are never scored and the runner backs off instead.
Defaults are one worker at a 3 second minimum interval. `SAFEPROMPT_WORKERS` and
`SAFEPROMPT_RATE_PER_MIN` raise throughput against a self-hosted gateway, where all
workers still share one global rate limiter. At the default pacing the 5000 case
HackAPrompt run takes several hours.

| Variable | Default | Notes |
|---|---|---|
| `SAFEPROMPT_API_KEY` | none | Required. |
| `SAFEPROMPT_API_BASE` | `https://api.safeprompt.dev` | Point at a self-hosted gateway. |
| `SAFEPROMPT_SENSITIVITY` | `balanced` | `strict` reproduces the published rows; `balanced` is no judgement mode. |
| `SAFEPROMPT_MIN_INTERVAL_S` | `3.0` | Minimum gap between requests. |
| `SAFEPROMPT_WORKERS` | `1` | Shared rate limiter across workers. |
| `SAFEPROMPT_RATE_PER_MIN` | `20` | Applies when workers > 1. |

## Limits of these numbers

* These are **externally created** benchmarks that **we ran ourselves**. That is not
  the same as an independently executed evaluation, and neither is a third-party
  verified result.
* The figures describe the Worker version named with each run. A later deploy is not
  measured here until it is re-run.
* At 100 attacks, one Tensor Trust or BIPIA miss moves recall by a full point. Each
  AgentDojo suite has 16 to 40 user tasks, so one task moves a suite's no-attack figure
  by 2.5 to 6 points.
* Every case ID is committed, hit and miss alike. Public-set misses are listed by ID in
  `summary-2026-10-10-strict.json`, and every AgentDojo run has its own row.
