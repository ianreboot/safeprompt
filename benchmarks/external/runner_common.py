"""
Shared runner plumbing for external benchmarks.

Design notes that matter:
  * Paced below the production origin's rate limit. Exceeding it returns 403,
    and a 403 scored as a verdict would corrupt the result. Transport failures
    are never scored.
  * Resumable. These runs are hours long; a crash must not mean starting over,
    and it must not mean silently scoring a partial set as if it were complete.
  * Benchmark traffic is kept off the threat-intelligence and IP-reputation
    paths, so a run cannot contaminate the production data that protects real
    customers.
"""
import json, os, sys, time, hashlib

API_BASE = os.environ.get("SAFEPROMPT_API_BASE", "https://api.safeprompt.dev")
API_KEY = os.environ.get("SAFEPROMPT_API_KEY")
USER_IP = os.environ.get("SAFEPROMPT_USER_IP", "203.0.113.10")
SENSITIVITY = os.environ.get("SAFEPROMPT_SENSITIVITY", "balanced")
# 28/min is where the origin starts refusing. Stay well under it.
MIN_INTERVAL_S = float(os.environ.get("SAFEPROMPT_MIN_INTERVAL_S", "3.0"))

import requests
import threading
from concurrent.futures import ThreadPoolExecutor

# Concurrency. Measured 2026-08-21: per-call latency on long adversarial prompts
# runs 1-14s because they take the AI path, so a single-threaded loop with a 2.85s
# minimum interval delivered only ~4 requests/min against an origin that tolerates
# ~28/min. Latency dominates, not pacing. Workers share ONE global rate limiter so
# added concurrency raises throughput without exceeding what the origin allows.
WORKERS = int(os.environ.get("SAFEPROMPT_WORKERS", "1"))
RATE_PER_MIN = float(os.environ.get("SAFEPROMPT_RATE_PER_MIN", "20"))

_last = [0.0]
_rate_lock = threading.Lock()
_write_lock = threading.Lock()


class Aborted(RuntimeError):
    pass


def _throttle():
    """Global spacing shared by all workers, so N threads still respect one limit."""
    gap = max(MIN_INTERVAL_S, 60.0 / RATE_PER_MIN) if WORKERS > 1 else MIN_INTERVAL_S
    with _rate_lock:
        d = time.monotonic() - _last[0]
        if d < gap:
            time.sleep(gap - d)
        _last[0] = time.monotonic()


def case_id(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


def validate(prompt, max_retries=5):
    """Return (is_flagged, raw). Raises Aborted on unrecoverable transport failure."""
    if not API_KEY:
        raise Aborted("SAFEPROMPT_API_KEY not set")
    last = None
    for attempt in range(max_retries):
        _throttle()
        try:
            r = requests.post(
                f"{API_BASE}/api/v1/validate",
                headers={"x-api-key": API_KEY, "X-User-IP": USER_IP,
                         "Content-Type": "application/json"},
                json={"prompt": prompt, "sensitivity": SENSITIVITY},
                timeout=90,
            )
        except requests.RequestException as e:
            last = e
            time.sleep(min(60, 2 ** attempt * 5))
            continue
        if r.status_code in (403, 429) or r.status_code >= 500:
            # Origin throttle. Back off hard; do NOT score this case.
            last = f"HTTP {r.status_code}"
            time.sleep(min(180, 2 ** attempt * 15))
            continue
        if not r.ok:
            raise Aborted(f"HTTP {r.status_code}: {r.text[:200]}")
        b = r.json()
        if "safe" not in b:
            raise Aborted(f"unexpected shape: {str(b)[:200]}")
        return (not b["safe"]), b
    raise Aborted(f"exhausted retries: {last}")


def run(cases, out_path, label):
    """cases: list of dicts with id, prompt, expect_flagged, meta. Resumable."""
    done = {}
    if os.path.exists(out_path):
        with open(out_path) as f:
            for line in f:
                try:
                    done[json.loads(line)["id"]] = 1
                except Exception:
                    pass
        print(f"  resuming: {len(done)} already scored", flush=True)

    todo = [c for c in cases if c["id"] not in done]
    eff = max(MIN_INTERVAL_S, 60.0 / RATE_PER_MIN) if WORKERS > 1 else MIN_INTERVAL_S
    print(f"  {label}: {len(cases)} cases, {len(todo)} to score, {WORKERS} worker(s), "
          f"~{len(todo)*eff/60:.0f} min at {60.0/eff:.0f}/min", flush=True)

    f = open(out_path, "a")
    counter = [0]
    aborted = []

    def work(c):
        if aborted:
            return
        try:
            flagged, raw = validate(c["prompt"])
        except Aborted as e:
            aborted.append(str(e))
            return
        rec = {
            "id": c["id"], "expect_flagged": c["expect_flagged"],
            "got_flagged": flagged, "correct": flagged == c["expect_flagged"],
            "category": raw.get("category"), "method": raw.get("detectionMethod"),
            "confidence": raw.get("confidence"), "meta": c.get("meta", {}),
        }
        with _write_lock:
            f.write(json.dumps(rec) + "\n")
            f.flush()
            counter[0] += 1
            if counter[0] % 25 == 0:
                print(f"    {counter[0]}/{len(todo)}", flush=True)

    try:
        if WORKERS > 1:
            with ThreadPoolExecutor(max_workers=WORKERS) as ex:
                list(ex.map(work, todo))
        else:
            for c in todo:
                work(c)
    finally:
        f.close()

    if aborted:
        print(f"  ABORTED: {aborted[0]}", flush=True)
        print("  partial results retained; rerun to resume.", flush=True)
        raise Aborted(aborted[0])
    print(f"  {label}: complete", flush=True)


def summarise(out_path):
    rows = [json.loads(l) for l in open(out_path)]
    pos = [r for r in rows if r["expect_flagged"]]
    neg = [r for r in rows if not r["expect_flagged"]]
    tp = sum(1 for r in pos if r["got_flagged"])
    fp = sum(1 for r in neg if r["got_flagged"])
    return {
        "scored": len(rows),
        "attacks": len(pos), "detected": tp,
        "recall_pct": round(100.0 * tp / len(pos), 2) if pos else None,
        "benign": len(neg), "false_positives": fp,
        "fpr_pct": round(100.0 * fp / len(neg), 2) if neg else None,
    }
