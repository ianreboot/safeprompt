# External benchmarks

Benchmarks SafePrompt did not write, run against the production API, with the raw
per-case results committed.

`../benchmarks/` holds our own suite. This directory is the opposite exercise: case
sets authored by other people, for other purposes, scored zero-shot. Nothing here was
tuned toward these corpora, and the numbers are published whatever they say.

## Every set we ran, in one table

Two modes, both on today's detector. The strict columns (`sensitivity=strict`) are a
re-run on 10 October 2026; the default columns (`sensitivity=balanced`, which is what a
request gets when it names no sensitivity) were run on 8 October 2026. No detection code
changed between the two runs, so the gap between the columns is the mode alone. Both
runs used the identical case files. See "Strict and default re-runs" below. This table includes the sets that safeprompt.dev does not show. The
rules that decided what it shows are below the table, quoted from the run record.

| Set | Strict: attacks caught | Strict: ordinary passed | Default: attacks caught | Default: ordinary passed | On safeprompt.dev |
|---|---|---|---|---|---|
| Tensor Trust, seeded draw (`tensortrust/results-strict.jsonl`) | 91 / 100 | 99 / 100 | 70 / 100 | 99 / 100 | yes |
| Tensor Trust, second seeded draw (`tensortrust/results-strict-ext100.jsonl`) | 92 / 100 | 94 / 100 | 73 / 100 | 99 / 100 | yes, pooled with the first |
| HackAPrompt, 100 per level | 930 / 1000 | no ordinary prompts in the set | 510 / 1000 | no ordinary prompts in the set | yes |
| BIPIA, email, table and code | 22 / 100 | 97 / 100 | 10 / 100 | 100 / 100 | ordinary side only |
| deepset prompt-injections, full | 178 / 263 | 398 / 399 | 132 / 263 | 399 / 399 | ordinary side only |
| NotInject, full | no attacks in the set | 311 / 339 | no attacks in the set | 327 / 339 | yes |
| AgentDojo banking, attack runs stopped, September detector | 144 / 144 (undefended: 86 / 144) | see AgentDojo below | not re-run | not re-run | yes |
| AgentDojo slack, attack runs stopped, September detector | 105 / 105 (undefended: 42 / 105) | see AgentDojo below | not re-run | not re-run | yes |
| Lakera Gandalf (`gandalf_ignore_instructions`), pilot only | 82 / 100 | no ordinary prompts in the set | 80 / 100 | no ordinary prompts in the set | no |
| deepset pilot (subset of the full run), September detector | 39 / 50 | 50 / 50 | in the full re-run | in the full re-run | no |
| NotInject pilot (subset of the full run), September detector | no attacks in the set | 91 / 100 | no attacks in the set | in the full re-run | no |
| Our own safe suite v3, strict | no attacks in the set | 158 / 219 (72.1%) | see next row | see next row | no |
| Our own safe suite v3, default (`balanced`), September detector | see previous row | see previous row | no attacks in the set | 211 / 219 (96.3%) | no |

**What strict costs.** On our own 219-prompt safe suite, strict passes 72.1% of ordinary
prompts and default passes 96.3%. Strict blocks credential-, exfiltration- and
code-shaped safe prompts. Every external row above is strict, so read each one with
that cost beside it. The safe suite prompts are ours and are not published here. The
rows in `safe-suite-v3/` carry the case ID and suite ID only.

**What the agent defense costs.** In AgentDojo, SafePrompt stopped every measured
attack, and the agent finished fewer tasks while under attack: banking 28.5% with
SafePrompt against 42.4% undefended, slack 16.2% against 53.3%.

**Attack-side total.** Across the six sets with an attack side in the main run
(Tensor Trust both draws, HackAPrompt, BIPIA, deepset, AgentDojo banking and slack),
SafePrompt caught or stopped 1,562 of 1,812 (86.2%), the same total as the September
run. safeprompt.dev quotes 1,359 of 1,449 across four of them from the September run,
leaving out BIPIA and deepset; on today's detector those four give 1,362 of 1,449. Adding the Gandalf pilot
gives 1,644 of 1,912 (86.0%).

### Strict and default re-runs (8 and 10 October 2026)

Every external set above except AgentDojo was run in default mode on 8 October 2026 and
re-run in strict mode on 10 October 2026, on the identical case files (every case ID
matches the September run). 2,701 calls each, plus the 219-prompt safe suite in the
strict run, all to the production API at 10 a minute, one in flight, 0 refusals, 0
errors. AgentDojo was not re-run, because it needs a paid agent model for every task.

Detector: the default run used the production worker deployed 6 October 2026 (`main` at
`c6404902`, inferred, since that deploy was made by hand). The strict run used the
worker deployed 9 October 2026 (`main` at `3eeeceda`). The commits between the two touch
privacy, stats, feedback and a CORS header only; no detection code changed. Per-set
counts and failed IDs for the strict run are in `summary-2026-10-10-strict.json`.

Against the September freeze (`2a0c6638`), the strict re-run moved by a case or two per
set and gave identical totals: 1,313 of 1,563 attacks caught and 999 of 1,038 ordinary
prompts passed on the four sets below.

What default gives up, on these sets:

* Attack side, the four sets with attacks scored in both modes (Tensor Trust both draws,
  HackAPrompt, BIPIA, deepset): default caught 795 of 1,563 (50.9%); strict caught 1,313 of 1,563
  (84.0%).
* Ordinary side, the four sets with ordinary prompts (Tensor Trust both draws, BIPIA,
  deepset, NotInject): default passed 1,024 of 1,038;
  strict passed 999 of 1,038. On our own safe suite the gap is wider: 96.3% against
  72.1%.

Default is what a request gets when it names no sensitivity. Pick strict only if a
missed attack costs you more than a blocked ordinary message.

### How the sets on safeprompt.dev were chosen

Quoted from the run record, unedited:

* deepset and NotInject: "Full runs where the pilot showed a benign-side win (deepset
  100% benign passed; NotInject 91%); Gandalf skipped (82% caught, below the 85% page
  bar)."
* NotInject: "/benchmarks if 90%+ (page tier)".
* Gandalf: "record only (below the 85% page bar); no full run".
* Strict safe suite: "record only".
* "Skipped by ruling: PINT (Lakera-only dataset). Not run: BIPIA other environments,
  HackAPrompt full 5,000 on the new freeze (cap), jailbreak-classification (out of
  scope)."

So sets were run as pilots first, and a set reached the page only if it cleared a bar.
No detector code was changed toward any set, but which sets to show was decided after
seeing results. Every set that was run, pilot or full, is in this directory.

### The comparison page

The safeprompt.dev comparison against two open-weights classifiers (ProtectAI's
DeBERTa v2 and deepset's DeBERTa, run 11 September 2026 on CPU) has no published
per-case results, and the script that produced those classifier runs has not
survived. Those numbers cannot be reproduced from this repo.

## The prompts are not in this repo

The attack and benign prompts are NOT redistributed here (dataset licences:
TensorTrust none-declared, HackAPrompt gated, BIPIA ShareAlike). Rebuild them with the
seeded `build_cases.py` from each dataset's original source (URLs below); the case IDs
are SHA-256 prefixes of the prompt text, so a rebuild regenerates identical cases and
every verdict in `results-*.jsonl` rehashes back to its prompt.

## The benchmarks

| Benchmark | What it is | Dataset | Licence |
|---|---|---|---|
| **Tensor Trust** | Real human attacks from an online game where players defended an LLM "bank vault" and others tried to break in. We use the frozen `hijacking-robustness/v1` benchmark set. | https://huggingface.co/datasets/qxcv/tensor-trust | No licence declared by the publisher (no `license` field on the dataset card, no LICENSE file in the HuggingFace repo or its GitHub mirror). Prompts are therefore **not redistributed here**. |
| **BIPIA** | Microsoft's benchmark for indirect prompt injection: an instruction hidden inside content the model is asked to read. We use the three task types whose contexts ship in the repo (email, table, code). | https://github.com/microsoft/BIPIA | Code MIT. The `benchmark` corpora carry their own licences: WikiTableQuestions and Stack Exchange are CC BY-SA 4.0, the OpenAI Evals invoice data is MIT. Redistribution is possible but would put a ShareAlike obligation on this repo, so prompts are **not redistributed here**. |
| **HackAPrompt** | 600k submissions from a public prompt-hacking competition. We sample only entries that demonstrably worked against the target model, stratified across all levels. | https://huggingface.co/datasets/hackaprompt/hackaprompt-dataset | MIT, but access-gated on HuggingFace (account plus accepted terms). We do not redistribute past that gate, so prompts are **not redistributed here**. |
| **AgentDojo** | ETH Zurich's agent benchmark: an LLM agent solves tasks with tools while attacks are planted in the tool output it reads. We run the banking and slack suites with the `important_instructions` attack, GPT-4o-mini as the agent, SafePrompt strict checking every tool output. | https://github.com/ethz-spylab/agentdojo | MIT. The per-run verdict rows are committed; the agent conversation logs (task text, injected text, tool output) are **not redistributed here**. |
| **NotInject** | 339 ordinary prompts written to trip over-sensitive injection filters, each built around trigger words such as ignore, override or bypass. Benign only, so it measures false positives. | https://huggingface.co/datasets/leolee99/NotInject | MIT. Prompts are **not redistributed here**; case IDs rehash to the upstream rows. |
| **deepset prompt-injections** | deepset's public set of 662 English and German prompts, injections and ordinary questions mixed. | https://huggingface.co/datasets/deepset/prompt-injections | Apache 2.0. Prompts are **not redistributed here**; case IDs rehash to the upstream rows. |
| **Lakera Gandalf** | 1,000 prompts players typed at Lakera's Gandalf game to make it ignore its instructions. Attacks only. Pilot of 100 scored; no full run. | https://huggingface.co/datasets/Lakera/gandalf_ignore_instructions | MIT. Prompts are **not redistributed here**; case IDs rehash to the upstream rows. |

## What is committed instead of the prompts

For the licence reasons in the table above, no `cases.json` ships here. What is
committed instead is the exact thing a reader needs to check us:

* `build_cases.py` in each directory, which rebuilds the identical case set from the
  upstream source. Sampling is seeded, so a rebuild reproduces the same cases.
* `results-*.jsonl`, one row per case, carrying the case ID (a SHA-256 prefix of the
  prompt), the expected label, what the API actually returned, and the category and
  detection method it returned. Rebuild the cases, hash them, and every verdict here
  can be matched back to the prompt that produced it.
* `build_hf_sets.py` rebuilds the NotInject, Gandalf and deepset sets, full and pilot,
  from the public HuggingFace rows. One `random.Random(20260912)` shuffles all three in
  a fixed order, so build them together. A rebuild on 8 October 2026 reproduced all six
  case files exactly, and every committed result ID rehashes to a rebuilt case.
* `agentdojo/` rows are one per AgentDojo run (suite, user task, injection task,
  utility and security verdict). `agentdojo/run_agentdojo.py` with
  `safeprompt_defense.py` is the harness that produced them.
* `safe-suite-v3/` holds verdicts on our own 219-prompt safe suite, in both modes. The
  prompts are internal and not published, so these rows cannot be rebuilt from this
  repo; they are here so the strict cost is on the record.
* `summary-2026-09-12.json` is the compiled record every set above was scored into,
  including the failed IDs per set.

## Results

Run zero-shot against the production API at `https://api.safeprompt.dev`.
The strict rows are the 10 October 2026 re-run, recorded in
`summary-2026-10-10-strict.json`. They replaced the 12 and 13 September rows (freeze
commit `2a0c6638`, recorded in `summary-2026-09-12.json`); git history keeps those. The
pilots and AgentDojo were not re-run and are still the September rows.

`default` is `sensitivity=balanced`, the setting a new key gets. `strict` is
`sensitivity=strict`, which trades false positives for recall. safeprompt.dev shows
the strict rows, the setting its quickstart sends.

### Tensor Trust

Positives are the `attack` field: human-written input trying to hijack the model.
Negatives are the `access_code` field: the input the defender intended to work. Those
negatives are deliberately hard, being short, odd, imperative strings, so a false
positive here means a legitimate password was read as an attack.

| Mode | Attacks detected | False positives on access codes |
|---|---|---|
| strict, seeded set (`results-strict.jsonl`) | 91 / 100 | 1 / 100 |
| strict, second seeded set (`results-strict-ext100.jsonl`) | 92 / 100 | 6 / 100 |
| default, seeded set, 8 Oct detector (`results-default.jsonl`) | 70 / 100 | 1 / 100 |
| default, second seeded set, 8 Oct detector (`results-default-ext100.jsonl`) | 73 / 100 | 1 / 100 |

### BIPIA

Positives are a context with an injected instruction appended. Negatives are the same
contexts clean, so a false positive means an ordinary email, table or code snippet was
read as an attack.

| Mode | Injections detected | False positives on clean contexts |
|---|---|---|
| strict | 22 / 100 | 3 / 100 |

Read the detection column with the benchmark's own taxonomy in hand. Most BIPIA
injections instruct the model to do something benign but off-task, such as adding a
sentence about climate statistics or replying in emoji. That is task hijacking rather
than compromise, and SafePrompt blocks on a manipulation vector aimed at the reading
AI, not on a request being off-task. `split.py` divides the injections into
security-relevant and benign task-hijacking so the two are not averaged into one
number. `analyse.py` breaks the run down by attack category and by task.

### HackAPrompt

**Recall only.** This dataset contains no benign inputs, so it cannot produce a
false-positive rate. Read the number as a recall stress test and take the
false-positive picture from Tensor Trust and BIPIA.

| Mode | Detected |
|---|---|
| strict | 930 / 1000 (93.0%) |

`summary-*.json` carries the same figure broken down by competition level. The 1000
cases are 100 per level, drawn from the 5000-case set scored on 8 September.

A caveat worth stating plainly: HiddenLayer's May 2025 review of prompt-injection
datasets rates HackAPrompt **Not Recommended**, on the grounds that it is unlabeled
and is built around a single goal string. We report it because it is large, public and
adversarial, not because it is a well-formed detection benchmark.

### AgentDojo

Two arms per suite, same agent model and tasks: `baseline` with no defense, and
`safeprompt` with SafePrompt strict checking every tool output before the agent reads
it. One row per run in `results-<suite>-<arm>.jsonl`, `run_kind` `attack` for the
injected runs and `no_attack` for the clean ones. `utility` is AgentDojo's verdict that
the user task was completed. `security` is AgentDojo's own field and is true when the
injection task was completed, so `attack_succeeded` repeats it under a plainer name.

| Suite | Arm | Attack success | Utility under attack | Utility, no attack | Attack runs |
|---|---|---|---|---|---|
| banking | baseline | 40.3% | 42.4% | 50.0% | 144 |
| banking | safeprompt | 0.0% | 28.5% | 62.5% | 144 |
| slack | baseline | 60.0% | 53.3% | 71.4% | 105 |
| slack | safeprompt | 0.0% | 16.2% | 66.7% | 105 |

Read the utility column with the attack column. The defense that stopped every
measured attack also cost the agent task completion while under attack.

The no-attack rows in each file also hold AgentDojo's own injection-task checks
(`user_task_id` is an `injection_task_*`). The "Utility, no attack" column counts only
the user tasks that were attacked: 16 in banking, 21 in slack.

### NotInject

**False positives only.** Every prompt is benign.

| Mode | Ordinary prompts passed |
|---|---|
| strict | 311 / 339 (91.7%) |

### deepset prompt-injections

| Mode | Injections detected | Ordinary prompts passed |
|---|---|---|
| strict | 178 / 263 | 398 / 399 |

deepset labels role-play and persona requests as injection. SafePrompt blocks on a
manipulation vector aimed at the reading AI, so many of those rows are misses here by
design; the benign side is the number safeprompt.dev quotes.

## Re-running

```bash
export SAFEPROMPT_API_KEY=sp_live_...

cd benchmarks/external/tensortrust
python3 build_cases.py 100       # rebuilds cases.json from upstream
SAFEPROMPT_SENSITIVITY=balanced python3 run.py
SAFEPROMPT_SENSITIVITY=strict   python3 run.py
```

`run.py` appends to `results.jsonl` in its own directory and is resumable, so move or
delete that file between modes or the second run will see the first as already scored.
The committed results are named `results-strict*.jsonl` and `results-default*.jsonl`
and are not touched by a run.

BIPIA works the same way. HackAPrompt needs the gated parquet downloaded first, then
`HACKAPROMPT_PARQUET=/path/to/hackaprompt.parquet python3 build_cases.py 5000`.

NotInject, Gandalf and deepset:

```bash
cd benchmarks/external
python3 build_hf_sets.py                                   # writes cases-full.json and cases-pilot.json per set
SAFEPROMPT_SENSITIVITY=strict python3 run_set.py deepset full
SAFEPROMPT_SENSITIVITY=strict python3 run_set.py gandalf pilot
```

AgentDojo (needs `pip install agentdojo==0.1.35` and an OpenRouter key for the agent model):

```bash
cd benchmarks/external/agentdojo
OPENROUTER_API_KEY=... PROXY_MODEL=openai/gpt-4o-mini LOCAL_LLM_PORT=8011 python3 orproxy.py &
export SAFEPROMPT_API_KEY=sp_live_... PROXY_MODEL=openai/gpt-4o-mini LOCAL_LLM_PORT=8011 SAFEPROMPT_SENSITIVITY=strict
python3 run_agentdojo.py banking 16 baseline
python3 run_agentdojo.py banking 16 safeprompt
python3 run_agentdojo.py slack 21 baseline
python3 run_agentdojo.py slack 21 safeprompt
```

The agent model is not deterministic, so a re-run lands near the committed figures, not
on them.

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
| `SAFEPROMPT_SENSITIVITY` | `balanced` | `balanced` or `strict`. |
| `SAFEPROMPT_MIN_INTERVAL_S` | `3.0` | Minimum gap between requests. |
| `SAFEPROMPT_WORKERS` | `1` | Shared rate limiter across workers. |
| `SAFEPROMPT_RATE_PER_MIN` | `20` | Applies when workers > 1. |

## Reading these numbers honestly

* These are **externally created** benchmarks that **we ran ourselves**. That is not
  the same as an independently executed evaluation, and neither is a third-party
  verified result. Do not blur the three.
* Sample sizes are small on two of the three. At 100 attacks, one Tensor Trust or
  BIPIA miss moves recall by a full point. Treat them as direction, not precision.
* BIPIA here is partial, covering three of its five task types. The WebQA and
  Summarization contexts need licence-gated corpora we do not have.
* Tensor Trust attacks target one specific game format, so a score on it is not
  directly comparable to any other benchmark and should be quoted in its own terms.
* Every case ID is committed, hit and miss alike. The failures are the point.
