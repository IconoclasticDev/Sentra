"""LLM abstraction.

Three providers behind one interface, so the model router page is demonstrating a real
seam rather than a drawing:

  * ``MockLLM``  — deterministic, dependency-free synthesiser. Default.
  * ``LocalLLM`` — talks to a locally served model (Ollama / llama.cpp / vLLM).
  * ``APILLM``   — optional external frontier model.

The default is MockLLM and the API says so, because claiming a real model is running
when it is not would be dishonest product copy.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class LLMRequest:
    prompt: str
    system: str = ""
    temperature: float = 0.1
    max_tokens: int = 900
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class LLMResponse:
    text: str
    provider: str
    model: str
    latency_ms: int = 0
    prompt_tokens: int = 0
    completion_tokens: int = 0
    route: str = "LOCAL_PRIVATE"
    simulated: bool = True


class BaseLLM:
    name = "base"
    model = "none"
    simulated = True

    def available(self) -> bool:
        return True

    def complete(self, request: LLMRequest) -> LLMResponse:  # pragma: no cover - interface
        raise NotImplementedError
