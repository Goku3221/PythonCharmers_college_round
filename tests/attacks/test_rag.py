"""
tests/attacks/test_rag.py

Tests for attacks/rag/poison_agent.py:
- Synthetic poison documents validation
- RAGPoisonAgent live fallback and seeded mode
- Trace schema compliance and synthetic flag verification
"""

from __future__ import annotations

from pathlib import Path
import pytest

from contracts.enums import AttackType, RunMode, Severity
from attacks.rag.poison_agent import SYNTHETIC_POISON_DOCS, RAGPoisonAgent


class TestRAGPoisonAgent:
    def test_synthetic_docs_structure(self):
        """Verify the predefined synthetic poison documents contain necessary camouflage and directives."""
        assert len(SYNTHETIC_POISON_DOCS) >= 3
        for doc in SYNTHETIC_POISON_DOCS:
            assert "doc_id" in doc
            assert "topic" in doc
            assert "camouflage" in doc
            assert len(doc["camouflage"]) > 20

    def test_poison_seeded_returns_valid_traces(self, tmp_path, monkeypatch):
        """poison_seeded generates AttackTrace objects with synthetic=True and valid steps."""
        monkeypatch.setattr("attacks.rag.poison_agent._SEEDS_TRACES_DIR", tmp_path)

        agent = RAGPoisonAgent(collection_name="test_collection")
        traces = agent.poison_seeded(save_to_seeds=True)

        assert len(traces) == len(SYNTHETIC_POISON_DOCS)
        for trace in traces:
            assert trace.synthetic is True
            assert trace.attack_type == AttackType.RAG_POISON
            assert trace.run_mode == RunMode.RECORDED
            assert trace.outcome.succeeded is True
            assert trace.outcome.severity == Severity.CRITICAL
            assert len(trace.steps) == 4

            # Verify file was written to disk
            path = tmp_path / f"{trace.trace_id}.json"
            assert path.exists()

    def test_poison_live_fallback_to_synthetic(self):
        """When ChromaDB server is not running, poison_live gracefully records a synthetic trace."""
        agent = RAGPoisonAgent(chroma_host="nonexistent.host.local", chroma_port=9999)
        trace = agent.poison_live(target_tool="email_send", target_args={"to": "attacker@evil.corp"})

        assert trace.attack_type == AttackType.RAG_POISON
        assert trace.run_mode == RunMode.RECORDED
        assert trace.outcome.succeeded is True
