"""
engine/trace/cassette.py
Cassette recording and matching mechanism for deterministic <3s replays.
Hashes prompt contexts and maps them to recorded raw LLM outputs.
"""

import hashlib
import json
from typing import Any


def hash_prompt(prompt: str | list[dict[str, Any]] | dict[str, Any]) -> str:
    """Computes a SHA256 hash for a prompt or list of messages."""
    if isinstance(prompt, str):
        content = prompt
    else:
        content = json.dumps(prompt, sort_keys=True)
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


class CassetteRecorder:
    """Records (prompt_hash, response) entries during execution."""

    def __init__(self) -> None:
        self.entries: list[dict[str, str]] = []

    def record(self, prompt: str | Any, response: str) -> None:
        p_hash = hash_prompt(prompt)
        self.entries.append({
            "prompt_hash": p_hash,
            "response": response,
        })

    def export(self) -> list[dict[str, str]]:
        return list(self.entries)


class CassettePlayer:
    """Matches prompt hashes against recorded cassette entries."""

    def __init__(self, entries: list[dict[str, str]] | None = None) -> None:
        self.entries = entries or []
        self._lookup: dict[str, str] = {e["prompt_hash"]: e["response"] for e in self.entries}
        self.play_index = 0

    def get_response(self, prompt: str | Any) -> str | None:
        """Looks up by hash first, then falls back to sequential entry if available."""
        p_hash = hash_prompt(prompt)
        if p_hash in self._lookup:
            return self._lookup[p_hash]

        if self.play_index < len(self.entries):
            res = self.entries[self.play_index]["response"]
            self.play_index += 1
            return res

        return None
