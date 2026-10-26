"""
SafePrompt as an AgentDojo defense.

AgentDojo measures two things that matter and that a detection-only benchmark
cannot: whether an attack succeeds against a real agent, AND whether the defense
breaks the agent's legitimate work. A detector that blocks everything scores
perfectly on security and destroys utility. Both numbers must be reported.

Integration point: AgentDojo's PromptInjectionDetector is applied to TOOL OUTPUTS,
which is exactly the untrusted-content boundary SafePrompt is meant to sit on.
This is indirect injection, the category our own held-out probe flagged as our
weakest (the H01 miss).

Register with:
    python -m agentdojo.scripts.benchmark \
        --module-to-load safeprompt_defense --defense safeprompt ...
"""
import hashlib
import json
import os
import time

import requests
from agentdojo.agent_pipeline.agent_pipeline import DEFENSES
from agentdojo.agent_pipeline.pi_detector import PromptInjectionDetector

API_BASE = os.environ.get("SAFEPROMPT_API_BASE", "https://api.safeprompt.dev")
API_KEY = os.environ.get("SAFEPROMPT_API_KEY")
USER_IP = os.environ.get("SAFEPROMPT_USER_IP", "203.0.113.10")
SENSITIVITY = os.environ.get("SAFEPROMPT_SENSITIVITY", "balanced")
MIN_INTERVAL_S = float(os.environ.get("SAFEPROMPT_MIN_INTERVAL_S", "2.9"))
WINDOW_CHARS = 45_000  # under the API's 50,000-character limit, with margin
WINDOW_OVERLAP = 2_000
# Every API answer is appended here (no text, only a hash), keyed to the AgentDojo run.
CALL_LOG = os.environ.get("SAFEPROMPT_CALL_LOG")
UNAVAILABLE_RETRIES = 2  # the API marks validation_unavailable as retryable

_last = [0.0]


class SafePromptDetector(PromptInjectionDetector):
    """Calls the production SafePrompt API on each tool output."""

    def __init__(self, mode="message", raise_on_injection=False):
        super().__init__(mode=mode, raise_on_injection=raise_on_injection)
        self.calls = 0
        self.errors = 0
        self.unavailable = 0  # checks still validation_unavailable after retries

    def detect(self, tool_output: str):
        if not tool_output or not tool_output.strip():
            return False, 0.0
        if not API_KEY:
            raise RuntimeError("SAFEPROMPT_API_KEY not set")

        # Check the whole tool output. The API accepts up to 50,000 characters, so
        # longer outputs go in overlapping windows and any flagged window flags the
        # output. (Until 2026-10-15 this sent only the first 20,000 characters, which
        # left the end of long workspace outputs unchecked.)
        if len(tool_output) <= WINDOW_CHARS:
            return self._check(tool_output)
        flagged, conf = False, 0.0
        step = WINDOW_CHARS - WINDOW_OVERLAP
        for start in range(0, len(tool_output), step):
            f, c = self._check(tool_output[start:start + WINDOW_CHARS])
            flagged, conf = flagged or f, max(conf, c)
            if start + WINDOW_CHARS >= len(tool_output):
                break
        return flagged, conf

    def _check(self, text: str):
        # A check the API could not finish comes back as safe:false with outcome
        # validation_unavailable. That is a precautionary block, not a detection, so it is
        # retried, logged, and counted apart from detections.
        for retry in range(UNAVAILABLE_RETRIES + 1):
            flagged, conf, outcome = self._send(text, retry)
            if outcome != "validation_unavailable":
                return flagged, conf
        self.unavailable += 1
        return flagged, conf

    def _log(self, row):
        if not CALL_LOG:
            return
        try:
            from agentdojo.logging import Logger
            ctx = getattr(Logger.get(), "context", {}) or {}
        except Exception:
            ctx = {}
        row.update({k: ctx.get(k) for k in ("suite_name", "user_task_id", "injection_task_id")})
        with open(CALL_LOG, "a") as f:
            f.write(json.dumps(row) + "\n")

    def _send(self, text: str, retry: int):
        # Pace against the production origin's rate limit.
        d = time.monotonic() - _last[0]
        if d < MIN_INTERVAL_S:
            time.sleep(MIN_INTERVAL_S - d)
        _last[0] = time.monotonic()

        for attempt in range(4):
            try:
                r = requests.post(
                    f"{API_BASE}/api/v1/validate",
                    headers={"x-api-key": API_KEY, "X-User-IP": USER_IP,
                             "Content-Type": "application/json"},
                    json={"prompt": text, "sensitivity": SENSITIVITY},
                    timeout=90,
                )
            except requests.RequestException:
                time.sleep(2 ** attempt * 4)
                continue
            if r.status_code in (403, 429) or r.status_code >= 500:
                time.sleep(2 ** attempt * 12)
                continue
            if not r.ok:
                break
            b = r.json()
            self.calls += 1
            if "safe" not in b:
                break
            outcome = b.get("outcome") or ("safe" if b["safe"] else "blocked")
            self._log({"t": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "retry": retry,
                       "chars": len(text), "sha16": hashlib.sha256(text.encode()).hexdigest()[:16],
                       "safe": b["safe"], "outcome": outcome, "confidence": b.get("confidence"),
                       "category": b.get("category"), "cached": b.get("cached")})
            return (not b["safe"]), float(b.get("confidence") or 0.0), outcome

        # Fail OPEN and record it. Failing closed here would silently inflate the
        # security score by blocking tool outputs the detector never actually saw.
        self.errors += 1
        self._log({"t": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "retry": retry,
                   "chars": len(text), "outcome": "error"})
        return False, 0.0, "error"


DEFENSES.append("safeprompt")


# ---------------------------------------------------------------------------
# AgentDojo builds defenses through an if-chain in AgentPipeline.from_config
# rather than a registry, so appending to DEFENSES only makes the CLI accept the
# name. Wrap from_config to construct our detector, mirroring the structure of
# the built-in transformers_pi_detector branch.
# ---------------------------------------------------------------------------
from functools import partial as _partial

from agentdojo.agent_pipeline.agent_pipeline import AgentPipeline as _AP
from agentdojo.agent_pipeline.agent_pipeline import MODEL_PROVIDERS as _MP
from agentdojo.agent_pipeline.agent_pipeline import get_llm as _get_llm
from agentdojo.agent_pipeline.basic_elements import InitQuery as _InitQuery
from agentdojo.agent_pipeline.basic_elements import SystemMessage as _SystemMessage
from agentdojo.agent_pipeline.tool_execution import ToolsExecutionLoop as _Loop
from agentdojo.agent_pipeline.tool_execution import ToolsExecutor as _Executor
from agentdojo.agent_pipeline.tool_execution import tool_result_to_str as _fmt
from agentdojo.models import ModelsEnum as _ModelsEnum

_orig_from_config = _AP.from_config.__func__

# One detector instance per process so call/error counts aggregate across tasks.
SHARED_DETECTOR = SafePromptDetector(mode="message", raise_on_injection=False)


@classmethod
def _from_config(cls, config):
    if getattr(config, "defense", None) != "safeprompt":
        return _orig_from_config(cls, config)

    llm = (
        _get_llm(_MP[_ModelsEnum(config.llm)], config.llm, config.model_id, config.tool_delimiter)
        if isinstance(config.llm, str) else config.llm
    )
    llm_name = config.llm if isinstance(config.llm, str) else llm.name

    import json as _json
    formatter = _partial(_fmt, dump_fn=_json.dumps) if config.tool_output_format == "json" else _fmt

    tools_loop = _Loop([_Executor(formatter), SHARED_DETECTOR, llm])
    pipeline = cls([
        _SystemMessage(config.system_message),
        _InitQuery(),
        llm,
        tools_loop,
    ])
    pipeline.name = f"{llm_name}-safeprompt"
    return pipeline


_AP.from_config = _from_config
