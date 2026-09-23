"""Deterministic synthesiser.

This is not an "AI" in the generative sense and the product never claims it is. Given an
already-assembled, already-permission-filtered answer plan (produced by answer_service),
it renders the plan into readable prose. Structure comes from retrieval; this layer only
handles narrative connective tissue.

Because it is deterministic, the same question as the same user always produces the same
answer — which is what you want in a live demonstration.
"""

from __future__ import annotations

import hashlib
import time
from typing import Any, Dict, List, Optional

from .base import BaseLLM, LLMRequest, LLMResponse


class MockLLM(BaseLLM):
    name = "mock"
    model = "deterministic-synthesiser-v1"
    simulated = True

    def complete(self, request: LLMRequest) -> LLMResponse:
        started = time.perf_counter()
        mode = request.metadata.get("mode", "summary")
        payload = request.metadata.get("payload", {})

        if mode == "summary":
            text = self._summarise(payload)
        elif mode == "brief":
            text = self._brief(payload)
        elif mode == "agent":
            text = self._agent(payload)
        else:
            text = payload.get("fallback") or request.prompt

        elapsed = int((time.perf_counter() - started) * 1000)
        return LLMResponse(
            text=text,
            provider=self.name,
            model=self.model,
            latency_ms=elapsed,
            prompt_tokens=len(request.prompt.split()),
            completion_tokens=len(text.split()),
            route=request.metadata.get("route", "LOCAL_PRIVATE"),
            simulated=True,
        )

    # ------------------------------------------------------------------ #

    @staticmethod
    def _pick(options: List[str], seed: str) -> str:
        if not options:
            return ""
        h = int(hashlib.blake2b(seed.encode("utf-8"), digest_size=4).hexdigest(), 16)
        return options[h % len(options)]

    def _summarise(self, payload: Dict[str, Any]) -> str:
        subject = payload.get("subject", "the organisation")
        verdict = payload.get("verdict", "")
        drivers = payload.get("drivers", [])
        if not verdict:
            return f"No synthesised summary was produced for {subject}."

        seed = f"{subject}|{verdict}"
        opener = self._pick(
            [
                f"{subject} {verdict}.",
                f"Across the retrieved record, {subject.lower()} {verdict}.",
                f"The consolidated evidence shows that {subject.lower()} {verdict}.",
            ],
            seed,
        )
        if not drivers:
            return opener
        if len(drivers) == 1:
            return f"{opener} The decisive factor was {drivers[0]}."
        head = ", ".join(drivers[:-1])
        return f"{opener} This rests on {len(drivers)} contributing factors: {head} and {drivers[-1]}."

    def _brief(self, payload: Dict[str, Any]) -> str:
        name = payload.get("name", "the account")
        lines: List[str] = payload.get("lines", [])
        if not lines:
            return f"No authorised material was found for {name}."
        body = " ".join(lines[:6])
        return f"{name}: {body}"

    def _agent(self, payload: Dict[str, Any]) -> str:
        task = payload.get("task", "the requested task")
        allowed = payload.get("allowed_count", 0)
        withheld = payload.get("withheld_count", 0)
        tail = (
            f" {withheld} restricted item(s) were excluded under the requesting agent's policy."
            if withheld
            else " No restricted material was encountered."
        )
        return f"Assembled {allowed} authorised context item(s) for: {task}.{tail}"
