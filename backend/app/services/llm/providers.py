"""Providers that talk to a real model, when one has been configured.

Both are import-light and failure-tolerant: if the endpoint is unreachable the caller
receives an unavailable provider and the router falls back to MockLLM rather than
breaking the demo.
"""

from __future__ import annotations

import json
import time
import urllib.error
import urllib.request
from typing import Any, Dict

from ...config import LLM_API_BASE, LLM_API_KEY, LLM_MODEL
from .base import BaseLLM, LLMRequest, LLMResponse


class LocalLLM(BaseLLM):
    """A model served on the company's own network — Ollama-compatible by default."""

    name = "local"
    simulated = False

    def __init__(self, model: str = LLM_MODEL, base_url: str = ""):
        self.model = model
        self.base_url = (base_url or "http://localhost:11434").rstrip("/")

    def available(self) -> bool:
        try:
            req = urllib.request.Request(f"{self.base_url}/api/tags", method="GET")
            with urllib.request.urlopen(req, timeout=1.2) as resp:
                return resp.status == 200
        except Exception:
            return False

    def complete(self, request: LLMRequest) -> LLMResponse:
        started = time.perf_counter()
        body = json.dumps(
            {
                "model": self.model,
                "prompt": f"{request.system}\n\n{request.prompt}".strip(),
                "stream": False,
                "options": {"temperature": request.temperature},
            }
        ).encode("utf-8")
        req = urllib.request.Request(
            f"{self.base_url}/api/generate", data=body, headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        return LLMResponse(
            text=data.get("response", ""),
            provider=self.name,
            model=self.model,
            latency_ms=int((time.perf_counter() - started) * 1000),
            route=request.metadata.get("route", "LOCAL_PRIVATE"),
            simulated=False,
        )


class APILLM(BaseLLM):
    """External frontier model. Only reachable when a policy explicitly permits it."""

    name = "api"
    simulated = False

    def __init__(self, model: str = "", api_key: str = LLM_API_KEY, base_url: str = LLM_API_BASE):
        self.model = model or "claude-sonnet-5"
        self.api_key = api_key
        self.base_url = base_url.rstrip("/")

    def available(self) -> bool:
        return bool(self.api_key)

    def complete(self, request: LLMRequest) -> LLMResponse:
        started = time.perf_counter()
        payload: Dict[str, Any] = {
            "model": self.model,
            "max_tokens": request.max_tokens,
            "temperature": request.temperature,
            "messages": [{"role": "user", "content": request.prompt}],
        }
        if request.system:
            payload["system"] = request.system
        req = urllib.request.Request(
            f"{self.base_url}/v1/messages",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "x-api-key": self.api_key,
                "anthropic-version": "2023-06-01",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=45) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            text = "".join(b.get("text", "") for b in data.get("content", []))
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, ValueError):
            raise LLMUnavailable("External model endpoint unreachable or rejected the request")

        return LLMResponse(
            text=text,
            provider=self.name,
            model=self.model,
            latency_ms=int((time.perf_counter() - started) * 1000),
            route=request.metadata.get("route", "EXTERNAL_ALLOWED"),
            simulated=False,
        )


class LLMUnavailable(RuntimeError):
    pass
