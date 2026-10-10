"""
engine/defenses/allowlist.py
Strict Tool Allowlist Defense (Oracle-Assisted).
Disallows any tool invocation that is not explicitly in the task's allowed_tools set.
"""

from typing import Iterable


class ToolAllowlistDefense:
    """Blocks tool calls that are not in the permitted set."""

    def __init__(self, allowed_tools: Iterable[str]):
        self.allowed_tools = set(allowed_tools)

    def is_tool_allowed(self, tool_name: str) -> tuple[bool, str | None]:
        if tool_name not in self.allowed_tools:
            return False, f"Unauthorized tool invocation: '{tool_name}' is not in allowed tools: {sorted(self.allowed_tools)}"
        return True, None
