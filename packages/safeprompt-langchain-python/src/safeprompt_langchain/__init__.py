"""SafePrompt LangChain integration.

Drop ``SafePromptCallbackHandler`` into any LangChain chain or agent to validate
every prompt (and tool output) through the SafePrompt prompt-injection API before
it reaches the LLM.
"""

from .callback import SafePromptCallbackHandler
from .client import DEFAULT_PROVIDER, SafePromptAPIError, validate
from .types import SafePromptBlockedError, ValidationResult

__all__ = [
    "SafePromptCallbackHandler",
    "validate",
    "DEFAULT_PROVIDER",
    "SafePromptAPIError",
    "SafePromptBlockedError",
    "ValidationResult",
]

__version__ = "0.1.0"
