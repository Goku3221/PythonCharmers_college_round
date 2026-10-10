"""
attacks/tap_tc/generator.py

Variant generator: calls Gemini 2.5 Flash to produce N payload variants
across the 5 persuasion strategies.
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any

from attacks.tap_tc.prompt import STRATEGIES, build_attacker_prompt
from contracts.schemas import AttackTrace

logger = logging.getLogger(__name__)

_N_VARIANTS = 5  # one per strategy


def _call_gemini(prompt: str) -> str:
    """
    Call Gemini 2.5 Flash and return the raw text response.

    Falls back to a deterministic stub if google-genai is unavailable or
    GEMINI_API_KEY is not set (useful for offline unit testing).
    """
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        logger.warning("GEMINI_API_KEY not set — returning stub payload.")
        return json.dumps({"location": "email_body", "content": prompt[:80]})

    try:
        from google import genai  # type: ignore[import]
        from google.genai import types  # type: ignore[import]

        client = genai.Client(api_key=api_key)
        preferred_model = os.environ.get("GEMINI_MODEL", "gemini-3-flash-preview")
        candidate_models = [preferred_model, "gemini-3.5-flash", "gemini-2.5-flash", "gemini-flash-latest"]

        # Permissive safety thresholds for autonomous security evaluation benchmarks
        config = types.GenerateContentConfig(
            safety_settings=[
                types.SafetySetting(
                    category=types.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold=types.HarmBlockThreshold.BLOCK_NONE,
                ),
                types.SafetySetting(
                    category=types.HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold=types.HarmBlockThreshold.BLOCK_NONE,
                ),
                types.SafetySetting(
                    category=types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                    threshold=types.HarmBlockThreshold.BLOCK_NONE,
                ),
                types.SafetySetting(
                    category=types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold=types.HarmBlockThreshold.BLOCK_NONE,
                ),
            ]
        )

        for model in candidate_models:
            try:
                response = client.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=config,
                )
                if response.text and response.text.strip():
                    return response.text
            except Exception as m_exc:
                logger.debug("Model %s failed: %s, trying next candidate...", model, m_exc)

        return json.dumps({"location": "email_body", "content": f"[simulated] {prompt[:60]}"})
    except Exception as exc:
        logger.error("Gemini call failed: %s", exc)
        return json.dumps({"location": "email_body", "content": f"[stub] {prompt[:60]}"})


def _parse_payload(raw: str) -> dict[str, Any] | None:
    """Extract and validate the JSON payload from the LLM response."""
    import re

    text = raw.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        text = "\n".join(
            l for l in lines if not l.startswith("```")
        ).strip()

    try:
        obj = json.loads(text)
        if isinstance(obj, dict) and "location" in obj and "content" in obj:
            return obj
    except json.JSONDecodeError:
        pass

    # Try extracting JSON object via regex
    match = re.search(r"\{[^{}]*\"location\"[^{}]*\"content\"[^{}]*\}", raw, re.DOTALL)
    if match:
        try:
            obj = json.loads(match.group(0))
            if isinstance(obj, dict) and "location" in obj and "content" in obj:
                return obj
        except Exception:
            pass

    # Clean fallback
    if text:
        return {"location": "email_body", "content": text[:300]}
    return None


class VariantGenerator:
    """
    Generates N=5 attack payload variants from Gemini 2.5 Flash, one per
    persuasion strategy.

    Usage
    -----
    gen = VariantGenerator()
    variants = gen.generate(
        seed_payload={"location": "email_body", "content": "..."},
        target_tool="email_send",
        target_args={"to": "attacker@evil.corp"},
        last_trace=trace,
        last_score=0.50,
        depth=1,
    )
    """

    def generate(
        self,
        seed_payload: dict[str, Any],
        target_tool: str,
        target_args: dict[str, Any],
        last_trace: AttackTrace | None = None,
        last_score: float = 0.0,
        depth: int = 0,
    ) -> list[dict[str, Any]]:
        """
        Produce one variant per strategy.  Returns up to N=5 payload dicts.
        Failed generations are skipped (logged as warnings).
        """
        variants: list[dict[str, Any]] = []

        for strategy in STRATEGIES:
            prompt = build_attacker_prompt(
                seed_payload=seed_payload,
                strategy=strategy,
                target_tool=target_tool,
                target_args=target_args,
                last_trace=last_trace,
                last_score=last_score,
                depth=depth,
            )

            raw = _call_gemini(prompt)
            payload = _parse_payload(raw)

            if payload is None:
                logger.warning("Strategy %s produced unparseable payload — skipping.", strategy)
                continue

            payload["_strategy"] = strategy  # tag for diversity tracking
            variants.append(payload)
            logger.debug("Strategy %s → payload location=%s", strategy, payload.get("location"))

        logger.info("Generated %d/%d variants at depth %d", len(variants), _N_VARIANTS, depth)
        return variants
