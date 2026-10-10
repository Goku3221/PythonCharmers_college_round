"""
engine/harness/harness.py
Unified AgentBreakHarness implementing the Harness Protocol.
Coordinates the target agent adapter, defenses, trace persistence, and two replay modes.
"""

from typing import Any

from contracts.enums import ReplayMode
from contracts.interfaces import Harness
from contracts.schemas import AttackTrace
from engine.harness.agentdojo_adapter import AgentDojoAdapter
from engine.replay.cassette import replay_cassette
from engine.replay.live import replay_live


class AgentBreakHarness:
    """Unified execution harness for AgentBreak."""

    def __init__(self, benchmark_version: str = "v1", suite_name: str = "workspace"):
        self.adapter = AgentDojoAdapter(benchmark_version=benchmark_version, suite_name=suite_name)
        self.active_defense_id: str | None = None

    def set_defense(self, defense_id: str | None) -> None:
        """Configures or clears the active defense."""
        self.active_defense_id = defense_id
        self.adapter.set_defense(defense_id)

    def run_attack(self, task_id: str, injection: dict[str, Any], seed: int = 42) -> AttackTrace:
        """Executes an attack on the target agent."""
        return self.adapter.run_attack(task_id=task_id, injection=injection, seed=seed)

    def run_benign(self, task_id: str, seed: int = 42) -> AttackTrace:
        """Executes a benign run for regression evaluation."""
        return self.adapter.run_benign(task_id=task_id, seed=seed)

    def replay(self, trace: AttackTrace, mode: ReplayMode, k: int = 5) -> list[AttackTrace]:
        """
        Executes replay in one of two modes:
        - CASSETTE: Deterministic exact reproduction from stored cassette in <3 seconds.
        - LIVE: Stochastic k-trial evaluation for defense and regression verification.
        """
        if mode == ReplayMode.CASSETTE:
            return [replay_cassette(trace)]
        return replay_live(self, trace, k=k)
