"""
contracts/interfaces.py
Core Protocols and Interfaces for AgentBreak.
Frozen at Hour 1.0 — Any changes require 3-way signoff.
"""

from typing import Protocol, Any
from contracts.schemas import AttackTrace, DefenseEvalResult
from contracts.enums import ReplayMode


class Harness(Protocol):
    """Execution harness for target agent under test."""
    def run_attack(self, task_id: str, injection: dict[str, Any], seed: int = 42) -> AttackTrace:
        ...

    def run_benign(self, task_id: str, seed: int = 42) -> AttackTrace:
        ...

    def set_defense(self, defense_id: str | None) -> None:
        ...

    def replay(self, trace: AttackTrace, mode: ReplayMode, k: int = 5) -> list[AttackTrace]:
        ...


class TraceStore(Protocol):
    """Persistence repository for traces and findings."""
    def save(self, trace: AttackTrace) -> None:
        ...

    def get(self, trace_id: str) -> AttackTrace | None:
        ...

    def list_traces(
        self,
        attack_type: str | None = None,
        severity: str | None = None,
        run_mode: str | None = None,
        limit: int = 100,
    ) -> list[AttackTrace]:
        ...

    def list_confirmed_findings(self) -> list[AttackTrace]:
        ...


class Detector(Protocol):
    """Detector for attack success, tool permissions, and scoring."""
    def detect(self, trace: AttackTrace, target_tool: str, target_args: dict[str, Any]) -> tuple[bool, str]:
        ...


class Attacker(Protocol):
    """Autonomous attack search loop (e.g. TAP-TC)."""
    def run(
        self,
        seed_payload: dict[str, Any],
        target_tool: str,
        target_args: dict[str, Any],
        max_depth: int = 4,
        budget: int = 50,
    ) -> list[AttackTrace]:
        ...

    def resume(self, checkpoint_path: str, depth_remaining: int = 1) -> list[AttackTrace]:
        ...
