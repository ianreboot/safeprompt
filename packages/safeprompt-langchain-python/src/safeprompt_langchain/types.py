"""Result and error types for the SafePrompt LangChain adapter."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class ValidationResult:
    """Parsed response from the SafePrompt ``/api/v1/validate`` endpoint.

    The fields below cover the stable response surface; ``raw`` always holds the
    full decoded JSON so newly-added API fields remain accessible without an
    adapter upgrade.
    """

    safe: bool
    threats: List[str] = field(default_factory=list)
    confidence: float = 0.0
    severity: Optional[str] = None
    category: Optional[str] = None
    reasoning: Optional[str] = None
    detection_method: Optional[str] = None
    processing_time: Optional[float] = None
    has_external_references: bool = False
    cached: bool = False
    request_id: Optional[str] = None
    raw: Dict[str, Any] = field(default_factory=dict)

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ValidationResult":
        return cls(
            safe=bool(data.get("safe", False)),
            threats=list(data.get("threats") or []),
            confidence=float(data.get("confidence") or 0.0),
            severity=data.get("severity"),
            category=data.get("category"),
            reasoning=data.get("reasoning"),
            detection_method=data.get("detectionMethod"),
            processing_time=data.get("processingTime"),
            has_external_references=bool(data.get("hasExternalReferences", False)),
            cached=bool(data.get("cached", False)),
            request_id=data.get("request_id"),
            raw=data,
        )


class SafePromptBlockedError(Exception):
    """Raised when SafePrompt flags a prompt unsafe and enforcement is ``block``.

    Carries the offending ``prompt`` and the full ``result`` so callers can
    surface the detected threats to the end user.
    """

    def __init__(self, prompt: str, result: ValidationResult) -> None:
        summary = ", ".join(result.threats) if result.threats else "unsafe"
        super().__init__(f"SafePrompt blocked prompt ({summary})")
        self.prompt = prompt
        self.result = result
