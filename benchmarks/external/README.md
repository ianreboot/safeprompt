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

AgentDojo is not included.

### What is committed instead of the prompts

For the licence reasons in the table above, no `cases.json` ships here. What is
committed instead is the exact thing a reader needs to check us:

* `build_cases.py` in each directory, which rebuilds the identical case set from the
  upstream source. Sampling is seeded, so a rebuild reproduces the same cases.
* `results-*.jsonl`, one row per case, carrying the case ID (a SHA-256 prefix of the
  prompt), the expected label, what the API actually returned, and the category and
  detection method it returned. Rebuild the cases, hash them, and every verdict here
  can be matched back to the prompt that produced it.

## Results

Run zero-shot against the production API at `https://api.safeprompt.dev`.
Default runs completed 7 September 2026, strict runs completed 8 September 2026
(server clock, Europe/Berlin).

`default` is `sensitivity=balanced`, the setting a new key gets. `strict` is
`sensitivity=strict`, which trades false positives for recall.

### Tensor Trust

Positives are the `attack` field: human-written input trying to hijack the model.
Negatives are the `access_code` field: the input the defender intended to work. Those
negatives are deliberately hard, being short, odd, imperative strings, so a false
positive here means a legitimate password was read as an attack.

| Mode | Attacks detected | False positives on access codes |
|---|---|---|
| default | 72 / 100 | 0 / 100 |
| strict | 91 / 100 | 1 / 100 |

### BIPIA

Positives are a context with an injected instruction appended. Negatives are the same
contexts clean, so a false positive means an ordinary email, table or code snippet was
read as an attack.

| Mode | Injections detected | False positives on clean contexts |
|---|---|---|
| default | 11 / 100 | 0 / 100 |
| strict | 25 / 100 | 3 / 100 |

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
| default | 2587 / 5000 (51.74%) |
| strict | 4605 / 5000 (92.10%) |

`summary-*.json` carries the same figure broken down by competition level.

A caveat worth stating plainly: HiddenLayer's May 2025 review of prompt-injection
datasets rates HackAPrompt **Not Recommended**, on the grounds that it is unlabeled
and is built around a single goal string. We report it because it is large, public and
adversarial, not because it is a well-formed detection benchmark.

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
The committed results are named `results-default.jsonl` and `results-strict.jsonl` and
are not touched by a run.

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
