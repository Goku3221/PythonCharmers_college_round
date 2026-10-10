"""
engine/trace/store.py
SQLite implementation of the TraceStore Protocol for AgentBreak.
Handles persistence, filtering, and retrieval of AttackTraces.
"""

from contextlib import contextmanager
import json
from pathlib import Path
import sqlite3
from typing import Any, Generator

from contracts.schemas import AttackTrace


class SQLiteTraceStore:
    """SQLite-backed trace store for AgentBreak."""

    def __init__(self, db_path: str | Path = "data/agentbreak.db"):
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    @contextmanager
    def _connection(self) -> Generator[sqlite3.Connection, None, None]:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()

    def _init_db(self) -> None:
        with self._connection() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS traces (
                    trace_id TEXT PRIMARY KEY,
                    created_at TEXT NOT NULL,
                    run_mode TEXT NOT NULL,
                    synthetic INTEGER NOT NULL,
                    attack_type TEXT NOT NULL,
                    target_agent_id TEXT NOT NULL,
                    attack_variant_id TEXT NOT NULL,
                    severity TEXT NOT NULL,
                    succeeded INTEGER NOT NULL,
                    partial_score REAL NOT NULL,
                    raw_json TEXT NOT NULL
                );
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_traces_attack_type ON traces(attack_type);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_traces_severity ON traces(severity);")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_traces_run_mode ON traces(run_mode);")
            conn.commit()

    def save(self, trace: AttackTrace) -> None:
        """Saves or updates an AttackTrace."""
        raw_json = trace.model_dump_json()
        with self._connection() as conn:
            conn.execute(
                """
                INSERT INTO traces (
                    trace_id, created_at, run_mode, synthetic, attack_type,
                    target_agent_id, attack_variant_id, severity, succeeded,
                    partial_score, raw_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(trace_id) DO UPDATE SET
                    created_at=excluded.created_at,
                    run_mode=excluded.run_mode,
                    synthetic=excluded.synthetic,
                    attack_type=excluded.attack_type,
                    target_agent_id=excluded.target_agent_id,
                    attack_variant_id=excluded.attack_variant_id,
                    severity=excluded.severity,
                    succeeded=excluded.succeeded,
                    partial_score=excluded.partial_score,
                    raw_json=excluded.raw_json;
                """,
                (
                    trace.trace_id,
                    trace.created_at,
                    trace.run_mode.value,
                    1 if trace.synthetic else 0,
                    trace.attack_type.value,
                    trace.target_agent_id,
                    trace.attack_variant_id,
                    trace.outcome.severity.value,
                    1 if trace.outcome.succeeded else 0,
                    trace.outcome.partial_score,
                    raw_json,
                ),
            )
            conn.commit()

    def get(self, trace_id: str) -> AttackTrace | None:
        """Retrieves a single AttackTrace by trace_id."""
        with self._connection() as conn:
            row = conn.execute("SELECT raw_json FROM traces WHERE trace_id = ?", (trace_id,)).fetchone()
            if row:
                return AttackTrace.model_validate(json.loads(row["raw_json"]))
        return None

    def list_traces(
        self,
        attack_type: str | None = None,
        severity: str | None = None,
        run_mode: str | None = None,
        limit: int = 100,
    ) -> list[AttackTrace]:
        """Lists traces with optional filters."""
        query = "SELECT raw_json FROM traces WHERE 1=1"
        params: list[Any] = []

        if attack_type:
            query += " AND attack_type = ?"
            params.append(attack_type)
        if severity:
            query += " AND severity = ?"
            params.append(severity)
        if run_mode:
            query += " AND run_mode = ?"
            params.append(run_mode)

        query += " ORDER BY created_at DESC LIMIT ?"
        params.append(limit)

        with self._connection() as conn:
            rows = conn.execute(query, params).fetchall()
            return [AttackTrace.model_validate(json.loads(r["raw_json"])) for r in rows]

    def list_confirmed_findings(self) -> list[AttackTrace]:
        """Lists all traces that resulted in confirmed successful attacks."""
        query = "SELECT raw_json FROM traces WHERE succeeded = 1 ORDER BY created_at DESC"
        with self._connection() as conn:
            rows = conn.execute(query).fetchall()
            return [AttackTrace.model_validate(json.loads(r["raw_json"])) for r in rows]
