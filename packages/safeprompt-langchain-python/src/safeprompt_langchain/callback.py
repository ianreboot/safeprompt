"""LangChain callback handler backed by the SafePrompt API."""

from __future__ import annotations

import random
from typing import Any, Callable, List, Optional

from langchain_core.callbacks.base import BaseCallbackHandler

from .client import DEFAULT_PROVIDER, SafePromptAPIError, validate
from .types import SafePromptBlockedError, ValidationResult

BlockHook = Callable[[str, ValidationResult], None]
ErrorHook = Callable[[str, Exception], None]

_MODES = ("fast", "balanced", "strict")
_ENFORCEMENT = ("block", "log")
_PROVIDER_ERROR = ("fail-closed", "fail-open")


class SafePromptCallbackHandler(BaseCallbackHandler):
    """Validates every prompt (and agent tool output) through the SafePrompt API
    before it reaches the LLM. Catches jailbreaks, data-extraction attempts,
    authority-signal impersonation, and indirect injection from tool outputs.

    Example::

        from safeprompt_langchain import SafePromptCallbackHandler, SafePromptBlockedError

        handler = SafePromptCallbackHandler(api_key="sp_live_...", user_ip=request_ip)
        try:
            chain.invoke({"input": user_input}, config={"callbacks": [handler]})
        except SafePromptBlockedError as err:
            return {"error": "Prompt blocked for safety", "threats": err.result.threats}
    """

    # Propagate blocked-prompt / provider exceptions so they abort the chain
    # instead of being swallowed-and-logged by LangChain's callback manager.
    raise_error = True
    run_inline = True

    def __init__(
        self,
        *,
        api_key: str,
        user_ip: str,
        provider: str = DEFAULT_PROVIDER,
        mode: str = "balanced",
        enforcement: str = "block",
        on_provider_error: str = "fail-closed",
        sample_rate: float = 1.0,
        on_block: Optional[BlockHook] = None,
        on_error: Optional[ErrorHook] = None,
        timeout: float = 30.0,
    ) -> None:
        super().__init__()
        if not api_key:
            raise ValueError("SafePromptCallbackHandler: api_key is required")
        if not user_ip:
            raise ValueError("SafePromptCallbackHandler: user_ip is required")
        if mode not in _MODES:
            raise ValueError(f"mode must be one of {_MODES}")
        if enforcement not in _ENFORCEMENT:
            raise ValueError(f"enforcement must be one of {_ENFORCEMENT}")
        if on_provider_error not in _PROVIDER_ERROR:
            raise ValueError(f"on_provider_error must be one of {_PROVIDER_ERROR}")

        self.api_key = api_key
        self.user_ip = user_ip
        self.provider = provider
        self.mode = mode
        self.enforcement = enforcement
        self.on_provider_error = on_provider_error
        self.sample_rate = sample_rate
        self.on_block = on_block
        self.on_error = on_error
        self.timeout = timeout

    # -- internal helpers -------------------------------------------------
    def _should_sample(self) -> bool:
        return self.sample_rate >= 1.0 or random.random() <= self.sample_rate

    def _check(self, text: str) -> None:
        """Validate one piece of text; raise on block / fail-closed provider error."""
        if not text:
            return
        try:
            result = validate(
                text,
                api_key=self.api_key,
                user_ip=self.user_ip,
                provider=self.provider,
                mode=self.mode,
                timeout=self.timeout,
            )
        except SafePromptAPIError as exc:
            if self.on_error:
                self.on_error(text, exc)
            if self.on_provider_error == "fail-closed":
                raise
            return

        if not result.safe:
            if self.on_block:
                self.on_block(text, result)
            if self.enforcement == "block":
                raise SafePromptBlockedError(text, result)

    # -- LangChain hooks --------------------------------------------------
    def on_llm_start(self, serialized: Any, prompts: List[str], **kwargs: Any) -> None:
        """Fires before an LLM call with the fully-rendered prompt array."""
        if not self._should_sample():
            return
        for prompt in prompts:
            self._check(prompt)

    def on_chat_model_start(
        self, serialized: Any, messages: List[List[Any]], **kwargs: Any
    ) -> None:
        """Chat-model variant: ``messages`` is one list of messages per prompt."""
        if not self._should_sample():
            return
        for message_list in messages:
            text = "\n".join(_serialize_message(m) for m in message_list).strip()
            self._check(text)

    def on_tool_end(self, output: Any, **kwargs: Any) -> None:
        """Fires when an agent tool returns content, the indirect-injection surface."""
        if not self._should_sample():
            return
        self._check(_coerce_tool_output(output))


def _serialize_message(message: Any) -> str:
    """Best-effort serialization of a LangChain message into a string."""
    if message is None:
        return ""
    if isinstance(message, str):
        return message
    content = getattr(message, "content", None)
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts: List[str] = []
        for chunk in content:
            if isinstance(chunk, str):
                parts.append(chunk)
            elif isinstance(chunk, dict):
                text = chunk.get("text")
                if isinstance(text, str):
                    parts.append(text)
        return "\n".join(p for p in parts if p)
    text = getattr(message, "text", None)
    if isinstance(text, str):
        return text
    return str(message)


def _coerce_tool_output(output: Any) -> str:
    """Reduce a tool result (str, ToolMessage, or other) to a string for checking."""
    if output is None:
        return ""
    if isinstance(output, str):
        return output
    content = getattr(output, "content", None)
    if isinstance(content, str):
        return content
    return str(output)
