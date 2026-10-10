"""
api/deps.py
Dependency injection providers for FastAPI.
Supports FAKE=1 mode (reading from fixtures/ for offline development) and FAKE=0 mode (live SQLite & Harness).
"""

import json
import os
from pathlib import Path
from typing import Any
from dotenv import load_dotenv

from contracts.interfaces import Harness, TraceStore
from contracts.schemas import AttackTrace, DefenseEvalResult, VulnerabilityFinding
from engine.harness.fake import FakeHarness
from engine.harness.harness import AgentBreakHarness
from engine.trace.store import SQLiteTraceStore

load_dotenv()

FAKE_MODE = os.getenv("FAKE", "0").lower() in ("1", "true", "yes")
FIXTURES_DIR = Path(__file__).resolve().parent.parent / "fixtures"
DB_PATH = Path(os.getenv("DATABASE_URL", "sqlite:///data/agentbreak.db").replace("sqlite:///", ""))


class FixtureTraceStore:
    """Fallback TraceStore that reads and caches fixture JSON files."""

    def __init__(self, fixtures_dir: Path = FIXTURES_DIR):
        self.fixtures_dir = fixtures_dir
        self.traces_dir = fixtures_dir / "traces"
        self._in_memory_traces: dict[str, AttackTrace] = {}
        self._load_fixtures()

    def _load_fixtures(self) -> None:
        if self.traces_dir.exists():
            for p in self.traces_dir.glob("*.json"):
                try:
                    with open(p, "r", encoding="utf-8") as f:
                        data = json.load(f)
                        trace = AttackTrace.model_validate(data)
                        self._in_memory_traces[trace.trace_id] = trace
                except Exception:
                    pass

    def save(self, trace: AttackTrace) -> None:
        self._in_memory_traces[trace.trace_id] = trace

    def get(self, trace_id: str) -> AttackTrace | None:
        return self._in_memory_traces.get(trace_id)

    def list_traces(
        self,
        attack_type: str | None = None,
        severity: str | None = None,
        run_mode: str | None = None,
        limit: int = 100,
    ) -> list[AttackTrace]:
        res = list(self._in_memory_traces.values())
        if attack_type:
            res = [t for t in res if t.attack_type.value == attack_type]
        if severity:
            res = [t for t in res if t.outcome.severity.value == severity]
        if run_mode:
            res = [t for t in res if t.run_mode.value == run_mode]
        return res[:limit]

    def list_confirmed_findings(self) -> list[AttackTrace]:
        return [t for t in self._in_memory_traces.values() if t.outcome.succeeded]


_store_instance: TraceStore | None = None
_harness_instance: Harness | None = None


def get_trace_store() -> TraceStore:
    global _store_instance
    if _store_instance is None:
        if FAKE_MODE:
            _store_instance = FixtureTraceStore()
        else:
            _store_instance = SQLiteTraceStore(db_path=DB_PATH)
            # If database is fresh/empty, seed from fixtures so UI immediately has data
            if not _store_instance.list_traces():
                fixture_store = FixtureTraceStore()
                for tr in fixture_store.list_traces():
                    _store_instance.save(tr)
    return _store_instance


def get_harness() -> Harness:
    global _harness_instance
    if _harness_instance is None:
        if FAKE_MODE:
            _harness_instance = FakeHarness()
        else:
            _harness_instance = AgentBreakHarness()
    return _harness_instance


def is_fake_mode() -> bool:
    return FAKE_MODE
