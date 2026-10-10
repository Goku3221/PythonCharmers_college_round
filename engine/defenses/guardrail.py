"""
engine/defenses/guardrail.py
Prompt Guardrail Defense.
Scans incoming messages and user inputs for known prompt injection and instruction override patterns.
Headline demo defense: Effective against static attacks, but bypassable by adaptive search (TAP-TC).
"""

import re


class PromptGuardrail:
    """Prompt guardrail that checks for malicious prompt injection heuristics."""

    INJECTION_PATTERNS = [
        r"(?i)ignore\s+(all\s+)?(previous|prior)\s+instructions",
        r"(?i)system\s+override",
        r"(?i)important\s+override",
        r"(?i)new\s+system\s+prompt",
        r"(?i)you\s+must\s+now\s+act\s+as",
        r"(?i)forward\s+(all\s+)?.*(financial|confidential|password|secret)",
        r"(?i)disregard\s+(the\s+)?(above|previous)",
        r"(?i)urgent:\s*forward\s+all",
    ]

    def __init__(self, sensitivity: float = 0.8):
        self.sensitivity = sensitivity
        self.compiled_patterns = [re.compile(p) for p in self.INJECTION_PATTERNS]

    def scan_text(self, text: str) -> tuple[bool, str | None]:
        """
        Scans a piece of text.
        Returns (is_blocked, reason).
        """
        for pattern in self.compiled_patterns:
            if pattern.search(text):
                return True, f"Guardrail triggered by pattern: {pattern.pattern}"
        return False, None

    def filter_messages(self, messages: list[dict[str, str]]) -> tuple[bool, str | None]:
        """Scans a series of messages."""
        for msg in messages:
            content = msg.get("content", "")
            blocked, reason = self.scan_text(content)
            if blocked:
                return True, reason
        return False, None
