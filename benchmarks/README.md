# SafePrompt Benchmarks

Reproducible detection benchmark for the SafePrompt API.

## What this measures

Each prompt in `prompts.json` is labelled with the verdict the API _should_
produce — `safe` means SafePrompt should pass it through, `attack` means
SafePrompt should block it. The runner:

1. POSTs each prompt to `https://api.safeprompt.dev/api/v1/validate`
2. Compares actual vs expected
3. Reports **TPR** (attack catch rate), **FPR** (false-positive rate),
   per-prompt confusion, mean latency, and writes the raw results to
   `results/<timestamp>.json`

## Suite v2.2

- 85 safe prompts across 13 categories (everyday, factual, tech,
  fp-prone-security, fp-prone-llm, fp-prone-imperative, fp-prone-keyword,
  business, creative, content-policy-knowledge, content-policy-uncomfortable,
  user-supplied-artifact, …)
- 80 attack prompts across 9 categories (instruction-override,
  jailbreak-roleplay, system-prompt-extraction, code-injection,
  obfuscation, deployed-credential-extraction, social-engineering,
  ai-manipulation, hybrid-gen-exfil)

The suite is versioned (`prompts.json` → `version`) and frozen — adding
prompts is a PR-only operation so historical numbers stay comparable.

## Run it

```bash
# 1. get a key (free tier works): https://safeprompt.dev
export SAFEPROMPT_API_KEY=sp_live_...

# 2. run the harness
node benchmarks/run.js
```

Optional flags:

| Flag | Default | Notes |
|---|---|---|
| `--mode=optimized\|fast` | `optimized` | `fast` skips Pass-2 AI validation |
| `--concurrency=N` | `8` | API has per-key rate limits — bump cautiously |
| `--base-url=URL` | `api.safeprompt.dev` | Point at a self-hosted gateway |
| `--output=path.json` | `results/<ts>.json` | Custom output path |

## Reference numbers

SafePrompt runs this exact suite against the production API **every 6 hours** and
publishes the results as a range, not a point estimate. Current values are
rendered on [safeprompt.dev](https://safeprompt.dev) at every deploy, derived
directly from the measurement store (trailing 30 days, current suite version).
A single run of this harness should land inside the published range.

<!-- BENCHMARK-TABLE-START -->
| Metric | Where to find it |
|---|---|
| TPR (attack catch rate) | Published as range + median at [safeprompt.dev](https://safeprompt.dev), updated every deploy |
| FPR (false-positive rate) | Same, published alongside TPR |
| Latency | AI-path median and p95 from production `api_logs`, same page |
| Cases | 165 (85 safe + 80 attack), suite v2.2 |
| Cadence | Every 6 hours against the production API; every run and every failure retained |
<!-- BENCHMARK-TABLE-END -->

**History, stated plainly.** An earlier version of this README reported a single
run at 100% TPR / 0% FPR. Two corrections: (1) continuous measurement since has
never reproduced a perfect run on the current suite — the honest figure is a
range in the mid-to-high 90s for TPR with a low single-digit FPR, which is why
we publish the range; (2) the perfect runs on record were **suite v1.0 at 100
prompts (50 safe / 50 attack)** in April 2026, not the 150-example v2.0 this
README previously attributed them to. A number you can confirm beats a number
you have to take on faith.

**Curation disclosure.** `prompts.json` contains a `manual_only_safe` list: two
known false positives that were moved out of automated scoring (both are
user-supplied-artifact cases the detector over-blocks). The runner ignores them;
they are kept in the file so the exclusion is visible rather than silent. If you
score them as safe cases, expect the FPR to rise accordingly.

> [!IMPORTANT]
> SafePrompt is **integration-boundary security**, not content moderation.
> It blocks prompt injection, jailbreaks, system-prompt extraction, code
> injection, and deployed-credential exfiltration. It does **not** block
> "harmful topic" knowledge questions (e.g. _"what is a keylogger"_,
> _"how do firewalls work"_) — those are a content-policy concern and
> should be paired with your LLM provider's moderation layer.
>
> The published numbers are against this scope. A different rubric
> (one that treats harmful-topic questions as attacks) will produce
> different numbers — your scope must match what you measure.

## Methodology notes

- The runner uses the same public API endpoint customers use — no special
  test bypass, no fixtures.
- Each prompt is independent (no session continuity); multi-turn detection
  is measured separately.
- TPR/FPR are computed over completed responses only; transport errors are
  reported separately and do not skew the headline metrics.
- Categories are kept on each result row so you can slice (e.g. "what is
  the FPR on `fp-prone-security`?").

## Adding prompts

Open a PR editing `prompts.json`. Bump `version` when the change is
material (added category, removed category, large reshape). Keep label
correctness conservative — every entry should be defensible to a reviewer
who has not seen the PR before.
