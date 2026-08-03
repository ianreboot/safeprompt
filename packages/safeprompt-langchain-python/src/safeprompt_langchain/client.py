"""Minimal HTTP client for the SafePrompt validate API (stdlib only)."""

from __future__ import annotations

import json
import urllib.error
import urllib.request

from .types import ValidationResult

DEFAULT_PROVIDER = "https://api.safeprompt.dev"
_USER_AGENT = "safeprompt-langchain/0.1.0"


class SafePromptAPIError(RuntimeError):
    """Raised when the SafePrompt API returns a non-2xx response or is unreachable."""

    def __init__(self, message: str, status: int | None = None) -> None:
        super().__init__(message)
        self.status = status


def validate(
    prompt: str,
    *,
    api_key: str,
    user_ip: str,
    provider: str = DEFAULT_PROVIDER,
    mode: str = "balanced",
    timeout: float = 30.0,
) -> ValidationResult:
    """POST a single prompt to the SafePrompt API and return the parsed result.

    Raises :class:`SafePromptAPIError` on transport failure or a non-2xx status.
    """
    base = provider.rstrip("/")
    url = f"{base}/api/v1/validate"
    body = json.dumps({"prompt": prompt, "mode": mode}).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=body,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "X-API-Key": api_key,
            "X-User-IP": user_ip,
            "User-Agent": _USER_AGENT,
        },
    )

    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except urllib.error.HTTPError as exc:
        detail = ""
        try:
            detail = exc.read().decode("utf-8", "replace")
        except Exception:  # pragma: no cover - best-effort error body
            pass
        raise SafePromptAPIError(
            f"SafePrompt API returned HTTP {exc.code}: {detail}", status=exc.code
        ) from exc
    except urllib.error.URLError as exc:
        raise SafePromptAPIError(f"SafePrompt API unreachable: {exc.reason}") from exc

    return ValidationResult.from_dict(payload)
