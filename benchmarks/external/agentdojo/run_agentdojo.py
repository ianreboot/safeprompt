"""
Run AgentDojo with and without SafePrompt as the tool-output defense.

Why both arms: AgentDojo is the only benchmark here that can measure the cost of
a defense as well as its benefit. A detector that blocks every tool output scores
perfectly on security and destroys the agent's ability to do its job. Reporting
security without utility would be exactly the kind of flattering half-number the
audit told us to stop publishing.

Usage:
  run_agentdojo.py <suite> <n_user_tasks> <arm>       arm = baseline | safeprompt
"""
import json, os, sys, time
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from agentdojo.agent_pipeline.agent_pipeline import AgentPipeline, PipelineConfig
from agentdojo.attacks.attack_registry import load_attack
from agentdojo.benchmark import benchmark_suite_with_injections, benchmark_suite_without_injections
from agentdojo.logging import OutputLogger
from agentdojo.task_suite.load_suites import get_suites

SUITE = sys.argv[1] if len(sys.argv) > 1 else "banking"
N_USER = int(sys.argv[2]) if len(sys.argv) > 2 else 3
ARM = sys.argv[3] if len(sys.argv) > 3 else "baseline"
VERSION = "v1.2.1"
ATTACK = os.environ.get("AGENTDOJO_ATTACK", "important_instructions")

suites = get_suites(VERSION)
suite = suites[SUITE]

user_tasks = sorted(suite.user_tasks.keys())[:N_USER]
injection_tasks = sorted(suite.injection_tasks.keys())
print(f"  suite={SUITE} arm={ARM} user_tasks={len(user_tasks)} injection_tasks={len(injection_tasks)}", flush=True)

cfg = PipelineConfig(
    llm="vllm_parsed",
    defense=(ARM if ARM in ("safeprompt", "safeprompt_v2") else None),
    system_message_name=None,
    system_message=None,
    tool_delimiter="tool",
    model_id=os.environ.get("PROXY_MODEL", "meta-llama/llama-3.3-70b-instruct"),
    tool_output_format=None,
)

if ARM == "safeprompt":
    import safeprompt_defense  # registers + patches from_config
elif ARM == "safeprompt_v2":
    import safeprompt_defense_v2  # selective redaction

pipeline = AgentPipeline.from_config(cfg)
print(f"  pipeline: {pipeline.name}", flush=True)

HERE = Path(__file__).resolve().parent
logdir = Path(os.environ.get("AGENTDOJO_LOGDIR", HERE / f"runs-{SUITE}-{ARM}"))
t0 = time.time()

with OutputLogger(str(logdir), live=None):
    util = benchmark_suite_without_injections(
        pipeline, suite, logdir=logdir, force_rerun=False, user_tasks=user_tasks,
        benchmark_version=VERSION)

    attack = load_attack(ATTACK, suite, pipeline)
    sec = benchmark_suite_with_injections(
        pipeline, suite, attack, logdir=logdir, force_rerun=False,
        user_tasks=user_tasks, injection_tasks=injection_tasks,
        verbose=False, benchmark_version=VERSION)


def rate(d):
    vals = list(d.values())
    return round(100.0 * sum(1 for v in vals if v) / len(vals), 1) if vals else None


out = {
    "suite": SUITE, "arm": ARM, "attack": ATTACK, "model": cfg.model_id,
    "user_tasks": len(user_tasks),
    "utility_no_attack_pct": rate(util["utility_results"]),
    "utility_under_attack_pct": rate(sec["utility_results"]),
    "attack_success_pct": rate(sec["security_results"]),
    "n_attack_runs": len(sec["security_results"]),
    "elapsed_s": round(time.time() - t0),
}
if ARM == "safeprompt":
    from safeprompt_defense import SHARED_DETECTOR
    out["safeprompt_calls"] = SHARED_DETECTOR.calls
    out["safeprompt_errors"] = SHARED_DETECTOR.errors
elif ARM == "safeprompt_v2":
    from safeprompt_defense_v2 import SHARED_DETECTOR_V2 as D
    out.update({"safeprompt_calls": D.calls, "safeprompt_errors": D.errors,
                "full_redactions": D.full_redactions, "partial_redactions": D.partial_redactions,
                "segments_removed": D.segments_removed, "segments_total": D.segments_total})

print(json.dumps(out, indent=1))
(HERE / f"summary-{SUITE}-{ARM}.local.json").write_text(json.dumps(out, indent=1))
