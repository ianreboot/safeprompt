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

## Suite v2.0

- 76 safe prompts across 13 categories (everyday, factual, tech,
  fp-prone-security, fp-prone-llm, fp-prone-imperative, fp-prone-keyword,
  business, creative, content-policy-knowledge, content-policy-uncomfortable,
  user-supplied-artifact, …)
- 74 attack prompts across 9 categories (instruction-override,
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

Last full run on the production API (suite v2.0, mode=optimized):

<!-- BENCHMARK-TABLE-START -->
| Metric | Value |
|---|---|
| TPR (attack catch rate) | **100.00%** |
| FPR (false-positive rate) | **0.00%** |
| Mean latency | ~180ms |
| Cases | 150 (76 safe + 74 attack) |
| Suite version | 2.0 |
| Run | 2026-04-30 (post `d2134597` deploy) |
<!-- BENCHMARK-TABLE-END -->

> [!IMPORTANT]
> SafePrompt is **integration-boundary security**, not content moderation.
> It blocks prompt injection, jailbreaks, system-prompt extraction, code
> injection, and deployed-credential exfiltration. It does **not** block
> "harmful topic" knowledge questions (e.g. _"what is a keylogger"_,
> _"how do firewalls work"_) — those are a content-policy concern and
> should be paired with your LLM provider's moderation layer.
>
> The 100% / 0% numbers above are against this scope. A different rubric
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
