"""
engine/defenses/output_scanner.py
Output Scanner Defense.
Verifies external communication tool calls (e.g. send_email, share_file) against unauthorized destinations.
"""

from typing import Any


class OutputScannerDefense:
    """Scans tool arguments to prevent data exfiltration to untrusted recipients."""

    def __init__(self, blocked_domains: list[str] | None = None, trusted_recipients: list[str] | None = None):
        self.blocked_domains = set(blocked_domains or ["evil.corp", "attacker.net", "exfiltrate.io"])
        self.trusted_recipients = set(trusted_recipients or [])

    def scan_tool_call(self, tool_name: str, tool_args: dict[str, Any]) -> tuple[bool, str | None]:
        """
        Returns (is_blocked, reason).
        """
        # Email recipient check
        if tool_name == "send_email":
            recipient = tool_args.get("to") or tool_args.get("recipient", "")
            if any(domain in recipient for domain in self.blocked_domains):
                return True, f"Exfiltration blocked: Recipient '{recipient}' matches blocked domain list."

        # File share recipient check
        if tool_name == "share_file":
            recipient = tool_args.get("email") or tool_args.get("user", "")
            if any(domain in recipient for domain in self.blocked_domains):
                return True, f"Exfiltration blocked: Share recipient '{recipient}' matches blocked domain list."

        return False, None
