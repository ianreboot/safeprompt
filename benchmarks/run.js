#!/usr/bin/env node
/**
 * SafePrompt detection benchmark runner.
 *
 * Runs every prompt in prompts.json against the public SafePrompt API and
 * compares the verdict to the labelled expected outcome. Reports TPR / FPR
 * and writes the raw result set to results/<timestamp>.json.
 *
 * Usage:
 *   SAFEPROMPT_API_KEY=sp_live_... node benchmarks/run.js
 *
 * Optional:
 *   --mode=optimized       (default; alt: fast)
 *   --concurrency=8        (default 8)
 *   --base-url=https://... (default https://api.safeprompt.dev)
 *   --output=path.json     (default results/<timestamp>.json)
 */

const fs = require("fs");
const path = require("path");

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  })
);

const API_KEY = process.env.SAFEPROMPT_API_KEY;
if (!API_KEY) {
  console.error("error: SAFEPROMPT_API_KEY is required");
  console.error("get a free key: https://safeprompt.dev");
  process.exit(2);
}

const BASE_URL = args["base-url"] || "https://api.safeprompt.dev";
const MODE = args.mode || "optimized";
const CONCURRENCY = Number(args.concurrency || 8);

const suite = JSON.parse(
  fs.readFileSync(path.join(__dirname, "prompts.json"), "utf8")
);

const cases = [
  ...suite.safe.map((c) => ({ ...c, expected: true })),
  ...suite.attack.map((c) => ({ ...c, expected: false })),
];

async function check(prompt) {
  const res = await fetch(`${BASE_URL}/api/v1/validate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": API_KEY,
    },
    body: JSON.stringify({ prompt, mode: MODE }),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

async function runPool(items, worker, n) {
  const results = new Array(items.length);
  let i = 0;
  const next = async () => {
    while (i < items.length) {
      const idx = i++;
      try {
        results[idx] = await worker(items[idx]);
      } catch (err) {
        results[idx] = { error: String(err) };
      }
    }
  };
  await Promise.all(Array.from({ length: n }, () => next()));
  return results;
}

(async () => {
  const t0 = Date.now();
  console.log(
    `running ${cases.length} prompts (${suite.safe.length} safe + ${suite.attack.length} attack), mode=${MODE}, concurrency=${CONCURRENCY}\n`
  );

  const results = await runPool(
    cases,
    async (c) => {
      const r = await check(c.prompt);
      return {
        prompt: c.prompt,
        category: c.category,
        expected: c.expected,
        actual: r.safe,
        threats: r.threats || [],
        latency_ms: r.processing_time_ms,
        confidence: r.confidence,
      };
    },
    CONCURRENCY
  );

  const errors = results.filter((r) => r.error).length;
  const ok = results.filter((r) => !r.error);

  const tp = ok.filter((r) => r.expected === false && r.actual === false).length; // attack -> blocked
  const fn = ok.filter((r) => r.expected === false && r.actual === true).length;  // attack -> passed (miss)
  const tn = ok.filter((r) => r.expected === true && r.actual === true).length;   // safe   -> passed
  const fp = ok.filter((r) => r.expected === true && r.actual === false).length;  // safe   -> blocked (false positive)

  const tpr = tp / (tp + fn);
  const fpr = fp / (fp + tn);
  const meanLat =
    ok.reduce((s, r) => s + (r.latency_ms || 0), 0) / Math.max(ok.length, 1);

  const summary = {
    timestamp: new Date().toISOString(),
    mode: MODE,
    suite_version: suite.version,
    cases: cases.length,
    errors,
    tp,
    fn,
    tn,
    fp,
    tpr,
    fpr,
    mean_latency_ms: Math.round(meanLat),
    duration_ms: Date.now() - t0,
  };

  console.log("Detection ─────────────────────────────────────");
  console.log(`  TPR (attack catch rate)        ${(tpr * 100).toFixed(2)}%`);
  console.log(`  FPR (false-positive rate)      ${(fpr * 100).toFixed(2)}%`);
  console.log(`  Confusion                      TP=${tp} FN=${fn} TN=${tn} FP=${fp}`);
  console.log(`  Errors                         ${errors}`);
  console.log(`  Mean latency                   ${summary.mean_latency_ms}ms`);
  console.log("");

  // Show misses and false positives so they are reproducible.
  const misses = ok.filter((r) => r.expected === false && r.actual === true);
  const falsePos = ok.filter((r) => r.expected === true && r.actual === false);
  if (misses.length) {
    console.log("Missed attacks (expected block, got pass):");
    for (const m of misses) console.log(`  - [${m.category}] ${m.prompt}`);
    console.log("");
  }
  if (falsePos.length) {
    console.log("False positives (expected pass, got block):");
    for (const m of falsePos)
      console.log(`  - [${m.category}] ${m.prompt} -> ${(m.threats || []).map((t) => t.type).join(",")}`);
    console.log("");
  }

  const outDir = path.join(__dirname, "results");
  fs.mkdirSync(outDir, { recursive: true });
  const out = args.output || path.join(outDir, `${summary.timestamp.replace(/[:.]/g, "-")}.json`);
  fs.writeFileSync(out, JSON.stringify({ summary, results }, null, 2));
  console.log(`wrote ${out}`);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
