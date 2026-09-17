"""Regression tests for the detection-sensitivity parameter.

Same defect as safeprompt-middleware and @safeprompt.dev/langchain, verified against the
live API on 2026-09-07: this package sent {"prompt", "mode"} while documenting `mode` as
detection sensitivity. The API reads `mode` as CACHING behaviour and `sensitivity` as
detection, so mode="strict" was applied as sensitivity="balanced". Anyone asking for
strict silently received balanced.
"""
import json
import pytest

from safeprompt_langchain.client import normalise_sensitivity, validate
from safeprompt_langchain.callback import SafePromptCallbackHandler


class _Resp:
    def __init__(self, payload):
        self._p = json.dumps(payload).encode()
    def read(self):
        return self._p
    def __enter__(self):
        return self
    def __exit__(self, *a):
        return False


@pytest.fixture
def wire(monkeypatch):
    """Capture the request body instead of making a call."""
    seen = {}

    def fake_urlopen(request, timeout=None):
        seen["body"] = json.loads(request.data.decode())
        return _Resp({"safe": True, "threats": [], "confidence": 1.0})

    monkeypatch.setattr("urllib.request.urlopen", fake_urlopen)
    return seen


def _call(wire, **kw):
    validate("hello", api_key="k", user_ip="203.0.113.10", **kw)
    return wire["body"]


def test_sends_sensitivity_never_mode(wire):
    body = _call(wire, sensitivity="strict")
    assert body["sensitivity"] == "strict"
    assert "mode" not in body, "`mode` is the API caching field and must not be sent"


def test_defaults_to_balanced(wire):
    assert _call(wire)["sensitivity"] == "balanced"


def test_deprecated_mode_maps_onto_sensitivity(wire):
    assert _call(wire, mode="strict")["sensitivity"] == "strict"


def test_sensitivity_wins_over_mode(wire):
    assert _call(wire, sensitivity="lenient", mode="strict")["sensitivity"] == "lenient"


@pytest.mark.parametrize("value", ["fast", "nonsense", "", None])
def test_never_sends_a_value_the_api_would_reject(wire, value):
    assert _call(wire, sensitivity=value)["sensitivity"] in ("lenient", "balanced", "strict")


def test_normalise_passes_through_real_values():
    assert normalise_sensitivity("lenient") == "lenient"
    assert normalise_sensitivity("strict") == "strict"


def test_normalise_maps_legacy_fast_to_balanced():
    # 'fast' was never a valid API sensitivity; the API ignored the field, so callers who
    # set it were actually receiving balanced detection. Mapping to balanced preserves
    # exactly the behaviour those callers observed.
    assert normalise_sensitivity("fast") == "balanced"


def test_normalise_falls_back_to_balanced():
    assert normalise_sensitivity(None) == "balanced"
    assert normalise_sensitivity("whatever") == "balanced"


def test_handler_normalises_legacy_fast():
    h = SafePromptCallbackHandler(api_key="k", user_ip="1.2.3.4", mode="fast")
    assert h.sensitivity == "balanced"


def test_handler_accepts_lenient_sensitivity():
    h = SafePromptCallbackHandler(api_key="k", user_ip="1.2.3.4", sensitivity="lenient")
    assert h.sensitivity == "lenient"


def test_handler_rejects_bad_sensitivity():
    with pytest.raises(ValueError):
        SafePromptCallbackHandler(api_key="k", user_ip="1.2.3.4", sensitivity="nope")
