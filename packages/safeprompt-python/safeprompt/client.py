"""
SafePrompt Python SDK
API-first prompt injection protection
"""
from __future__ import annotations

import httpx
from typing import Optional, List, Any, Dict


class SafePromptError(Exception):
    """Raised when the SafePrompt API returns an error."""

    def __init__(self, message: str, status_code: int):
        super().__init__(message)
        self.status_code = status_code


class SafePrompt:
    """SafePrompt client for prompt injection protection."""

    DEFAULT_BASE_URL = "https://api.safeprompt.dev"
    USER_AGENT = "safeprompt-python/1.0.0"

    def __init__(self, api_key: str, base_url: Optional[str] = None):
        if not api_key:
            raise ValueError("SafePrompt API key is required")

        self._api_key = api_key
        self._base_url = (base_url or self.DEFAULT_BASE_URL).rstrip("/")
        self._client = httpx.Client(
            headers={
                "X-API-Key": self._api_key,
                "Content-Type": "application/json",
                "User-Agent": self.USER_AGENT,
            },
            timeout=30.0,
        )

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()

    def close(self):
        self._client.close()

    def _handle_response(self, response: httpx.Response) -> Dict[str, Any]:
        if not response.is_success:
            try:
                error_data = response.json()
                message = error_data.get("message", f"API request failed with status {response.status_code}")
            except Exception:
                message = f"API request failed with status {response.status_code}"
            raise SafePromptError(message, response.status_code)
        return response.json()

    def check(
        self,
        prompt: str,
        *,
        user_ip: Optional[str] = None,
        session_token: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Check if a prompt is safe.

        Args:
            prompt: The user input to validate.
            user_ip: Optional IP address of the end user.
            session_token: Optional session token for multi-turn tracking.

        Returns:
            Validation result with keys: safe, threats, confidence,
            processingTimeMs, passesUsed

        Raises:
            SafePromptError: If the API returns an error.
            ValueError: If prompt is empty or not a string.
        """
        if not prompt or not isinstance(prompt, str):
            raise ValueError("Prompt must be a non-empty string")

        body: Dict[str, Any] = {"prompt": prompt}
        if session_token:
            body["sessionToken"] = session_token

        headers = {"X-User-IP": user_ip or "127.0.0.1"}

        try:
            response = self._client.post(
                f"{self._base_url}/api/v1/validate",
                json=body,
                headers=headers,
            )
            return self._handle_response(response)
        except SafePromptError:
            raise
        except httpx.HTTPError as e:
            raise SafePromptError(str(e), 500)

    def check_batch(
        self,
        prompts: List[str],
        *,
        user_ip: Optional[str] = None,
        session_token: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Batch validate multiple prompts.

        Args:
            prompts: List of prompts to validate.
            user_ip: Optional IP address of the end user.
            session_token: Optional session token for multi-turn tracking.

        Returns:
            List of validation results.

        Raises:
            SafePromptError: If the API returns an error.
            ValueError: If prompts is not a non-empty list.
        """
        if not isinstance(prompts, list) or len(prompts) == 0:
            raise ValueError("Prompts must be a non-empty list")

        headers = {"X-User-IP": user_ip or "127.0.0.1"}

        try:
            response = self._client.post(
                f"{self._base_url}/api/v1/validate/batch",
                json={"prompts": prompts},
                headers=headers,
            )
            data = self._handle_response(response)
            return data.get("results", data)
        except SafePromptError:
            raise
        except httpx.HTTPError as e:
            raise SafePromptError(str(e), 500)

    def get_usage(self) -> Dict[str, Any]:
        """
        Get API usage statistics.

        Returns:
            Usage statistics for your API key.

        Raises:
            SafePromptError: If the API returns an error.
        """
        try:
            response = self._client.get(f"{self._base_url}/api/v1/usage")
            return self._handle_response(response)
        except SafePromptError:
            raise
        except httpx.HTTPError as e:
            raise SafePromptError(str(e), 500)


class AsyncSafePrompt:
    """Async SafePrompt client for prompt injection protection."""

    DEFAULT_BASE_URL = "https://api.safeprompt.dev"
    USER_AGENT = "safeprompt-python/1.0.0"

    def __init__(self, api_key: str, base_url: Optional[str] = None):
        if not api_key:
            raise ValueError("SafePrompt API key is required")

        self._api_key = api_key
        self._base_url = (base_url or self.DEFAULT_BASE_URL).rstrip("/")
        self._client = httpx.AsyncClient(
            headers={
                "X-API-Key": self._api_key,
                "Content-Type": "application/json",
                "User-Agent": self.USER_AGENT,
            },
            timeout=30.0,
        )

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        await self.aclose()

    async def aclose(self):
        await self._client.aclose()

    def _handle_response(self, response: httpx.Response) -> Dict[str, Any]:
        if not response.is_success:
            try:
                error_data = response.json()
                message = error_data.get("message", f"API request failed with status {response.status_code}")
            except Exception:
                message = f"API request failed with status {response.status_code}"
            raise SafePromptError(message, response.status_code)
        return response.json()

    async def check(
        self,
        prompt: str,
        *,
        user_ip: Optional[str] = None,
        session_token: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Check if a prompt is safe (async)."""
        if not prompt or not isinstance(prompt, str):
            raise ValueError("Prompt must be a non-empty string")

        body: Dict[str, Any] = {"prompt": prompt}
        if session_token:
            body["sessionToken"] = session_token

        headers = {"X-User-IP": user_ip or "127.0.0.1"}

        try:
            response = await self._client.post(
                f"{self._base_url}/api/v1/validate",
                json=body,
                headers=headers,
            )
            return self._handle_response(response)
        except SafePromptError:
            raise
        except httpx.HTTPError as e:
            raise SafePromptError(str(e), 500)

    async def check_batch(
        self,
        prompts: List[str],
        *,
        user_ip: Optional[str] = None,
        session_token: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """Batch validate multiple prompts (async)."""
        if not isinstance(prompts, list) or len(prompts) == 0:
            raise ValueError("Prompts must be a non-empty list")

        headers = {"X-User-IP": user_ip or "127.0.0.1"}

        try:
            response = await self._client.post(
                f"{self._base_url}/api/v1/validate/batch",
                json={"prompts": prompts},
                headers=headers,
            )
            data = self._handle_response(response)
            return data.get("results", data)
        except SafePromptError:
            raise
        except httpx.HTTPError as e:
            raise SafePromptError(str(e), 500)

    async def get_usage(self) -> Dict[str, Any]:
        """Get API usage statistics (async)."""
        try:
            response = await self._client.get(f"{self._base_url}/api/v1/usage")
            return self._handle_response(response)
        except SafePromptError:
            raise
        except httpx.HTTPError as e:
            raise SafePromptError(str(e), 500)
