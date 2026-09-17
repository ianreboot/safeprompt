# External benchmarks

Benchmarks SafePrompt did not write, run against the production API, with the raw
per-case results committed.

`../benchmarks/` holds our own suite. This directory is the opposite exercise: case
sets authored by other people, for other purposes, scored zero-shot. Nothing here was
tuned toward these corpora, and the numbers are published whatever they say.

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

## Pending publication

One further run exists and is not yet committed here. Until it is, safeprompt.dev
does not publish a competitor comparison to production; that is a standing condition,
not a preference.

* **Matched open-weights classifier runs** on the identical TensorTrust and BIPIA
  cases (ProtectAI's DeBERTa v2 prompt-injection classifier and deepset's DeBERTa
  injection model, each at its documented default threshold), run 2026-09-11 on CPU.
  Per-case results will land beside the SafePrompt rows so every bar on the
  comparison page rehashes to a prompt.

## What is committed instead of the prompts

For the licence reasons in the table above, no `cases.json` ships here. What is
committed instead is the exact thing a reader needs to check us:

* `build_cases.py` in each directory, which rebuilds the identical case set from the
  upstream source. Sampling is seeded, so a rebuild reproduces the same cases.
* `results-*.jsonl`, one row per case, carrying the case ID (a SHA-256 prefix of the
  prompt), the expected label, what the API actually returned, and the category and
  detection method it returned. Rebuild the cases, hash them, and every verdict here
  can be matched back to the prompt that produced it.
* `notinject/` and `deepset/` ship no builder: the upstream sets were scored whole and
  each ID is the SHA-256 prefix of the upstream prompt text.
  `agentdojo/` rows are one per AgentDojo run (suite, user task, injection task,
  utility and security verdict); AgentDojo's own harness reproduces the runs.
* `summary-2026-09-12.json` is the compiled record every set above was scored into,
  including the failed IDs per set.

## Results

Run zero-shot against the production API at `https://api.safeprompt.dev`.
Strict runs completed 12 and 13 September 2026 (server clock, Europe/Berlin) on one
detector version, freeze commit `2a0c6638`, recorded in `summary-2026-09-12.json`.
The 7 and 8 September rows were replaced by this run so every row shares one detector
version.

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
| strict, second seeded set (`results-strict-ext100.jsonl`) | 91 / 100 | 5 / 100 |

### BIPIA

Positives are a context with an injected instruction appended. Negatives are the same
contexts clean, so a false positive means an ordinary email, table or code snippet was
read as an attack.

| Mode | Injections detected | False positives on clean contexts |
|---|---|---|
| strict | 24 / 100 | 4 / 100 |

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
| strict | 928 / 1000 (92.8%) |

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

### NotInject

**False positives only.** Every prompt is benign.

| Mode | Ordinary prompts passed |
|---|---|
| strict | 311 / 339 (91.7%) |

### deepset prompt-injections

| Mode | Injections detected | Ordinary prompts passed |
|---|---|---|
| strict | 179 / 263 | 398 / 399 |

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
The committed results are named `results-strict.jsonl` and are not touched by a run.

BIPIA works the same way. HackAPrompt needs the gated parquet downloaded first, then
`HACKAPROMPT_PARQUET=/path/to/hackaprompt.parquet python3 build_cases.py 5000`.

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
