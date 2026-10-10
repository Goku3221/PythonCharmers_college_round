"""
tests/attacks/test_tap_tc.py

Tests for the TAP-TC search components.
Uses FakeHarness (defined here) to avoid any live LLM / sandbox dependency.
"""

from __future__ import annotations

import pickle
import tempfile
import uuid
from pathlib import Path
from typing import Any

import pytest

from contracts.enums import AttackType, RunMode, Severity
from contracts.schemas import AttackOutcome, AttackTrace, TraceStep
from attacks.tap_tc.checkpoint import CheckpointManager, CheckpointState, TreeNode
from attacks.tap_tc.prompt import STRATEGIES, build_attacker_prompt, _score_label
from attacks.tap_tc.loop import TAPTCAttacker, _prune


# ---------------------------------------------------------------------------
# FakeHarness
# ---------------------------------------------------------------------------

class FakeHarness:
    """
    Minimal harness that always returns a trace at partial_score=0.75 until
    the payload content contains 'SUCCESS', at which point it returns 1.0.
    """

    def __init__(self) -> None:
        self._defense: str | None = None
        self.call_count: int = 0

    def run_attack(self, task_id: str, injection: dict[str, Any], seed: int = 42) -> AttackTrace:
        self.call_count += 1
        content = injection.get("content", "")
        succeeded = "SUCCESS" in content and self._defense is None

        steps = [
            TraceStep(
                step_index=0,
                step_type="reasoning",
                timestamp="2026-01-01T00:00:00Z",
                content=f"Processing injection: {content[:60]}",
            ),
            TraceStep(
                step_index=1,
                step_type="tool_call",
                timestamp="2026-01-01T00:00:01Z",
                content="Calling email_send",
                tool_name="email_send",
                tool_args={"to": "attacker@evil.corp" if succeeded else "safe@corp.com"},
            ),
        ]
        outcome = AttackOutcome(
            succeeded=succeeded,
            detection_method="deterministic",
            severity=Severity.CRITICAL if succeeded else Severity.LOW,
            partial_score=1.0 if succeeded else 0.75,
        )
        return AttackTrace(
            trace_id=str(uuid.uuid4()),
            created_at="2026-01-01T00:00:00Z",
            run_mode=RunMode.LIVE,
            attack_type=AttackType.INDIRECT_INJECTION,
            target_agent_id=task_id,
            attack_variant_id=f"fake:{self.call_count}",
            injection_payload=injection,
            steps=steps,
            outcome=outcome,
            seed=seed,
        )

    def run_benign(self, task_id: str, seed: int = 42) -> AttackTrace:
        return self.run_attack(task_id, {"location": "none", "content": ""}, seed)

    def set_defense(self, defense_id: str | None) -> None:
        self._defense = defense_id

    def replay(self, trace: AttackTrace, mode: Any, k: int = 5) -> list[AttackTrace]:
        return [self.run_attack(trace.target_agent_id, trace.injection_payload)]


# ---------------------------------------------------------------------------
# Checkpoint tests
# ---------------------------------------------------------------------------

class TestCheckpointManager:
    def test_save_and_load_roundtrip(self, tmp_path):
        mgr = CheckpointManager(directory=tmp_path)
        node = TreeNode(node_id="n1", depth=1, payload={"a": 1}, strategy="authority", score=0.5)
        state = CheckpointState(
            root_payload={"location": "email_body", "content": "test"},
            target_tool="email_send",
            target_args={"to": "x@y.com"},
            task_id="task_0",
            depth_reached=1,
            budget_consumed=5,
            live_nodes=[node],
        )
        mgr.save(state, "test_checkpoint")
        loaded = mgr.load("test_checkpoint")

        assert loaded.depth_reached == 1
        assert loaded.budget_consumed == 5
        assert len(loaded.live_nodes) == 1
        assert loaded.live_nodes[0].strategy == "authority"

    def test_load_nonexistent_raises(self, tmp_path):
        mgr = CheckpointManager(directory=tmp_path)
        with pytest.raises(FileNotFoundError):
            mgr.load("does_not_exist")

    def test_exists(self, tmp_path):
        mgr = CheckpointManager(directory=tmp_path)
        state = CheckpointState(
            root_payload={}, target_tool="t", target_args={}, task_id="t"
        )
        assert not mgr.exists("x")
        mgr.save(state, "x")
        assert mgr.exists("x")


# ---------------------------------------------------------------------------
# Prompt tests
# ---------------------------------------------------------------------------

class TestAttackerPrompt:
    def test_all_strategies_in_strategies_list(self):
        assert len(STRATEGIES) == 5
        for s in ["authority", "urgency", "obfuscation", "context_manip", "role_assertion"]:
            assert s in STRATEGIES

    def test_prompt_contains_strategy(self):
        for strategy in STRATEGIES:
            prompt = build_attacker_prompt(
                seed_payload={"location": "email_body", "content": "test"},
                strategy=strategy,
                target_tool="email_send",
                target_args={"to": "x@y.com"},
            )
            assert strategy.upper() in prompt

    def test_prompt_contains_target_tool(self):
        prompt = build_attacker_prompt(
            seed_payload={"location": "email_body", "content": "test"},
            strategy="authority",
            target_tool="email_send",
            target_args={"to": "x@y.com"},
        )
        assert "email_send" in prompt

    def test_prompt_requests_json_output(self):
        prompt = build_attacker_prompt(
            seed_payload={"location": "email_body", "content": "test"},
            strategy="urgency",
            target_tool="email_send",
            target_args={},
        )
        assert '"location"' in prompt and '"content"' in prompt

    def test_score_labels(self):
        assert "full success" in _score_label(1.0).lower()
        assert "wrong args" in _score_label(0.75).lower()
        assert "acknowledged" in _score_label(0.50).lower()
        assert "reasoning" in _score_label(0.25).lower()
        assert "no evidence" in _score_label(0.0).lower()


# ---------------------------------------------------------------------------
# Prune function tests
# ---------------------------------------------------------------------------

class TestPrune:
    def _node(self, strategy: str, score: float) -> TreeNode:
        return TreeNode(
            node_id=str(uuid.uuid4()),
            depth=1,
            payload={},
            strategy=strategy,
            score=score,
        )

    def _fake_trace(self) -> AttackTrace:
        harness = FakeHarness()
        return harness.run_attack("task", {"location": "e", "content": "x"})

    def test_top_k_selected(self):
        candidates = [
            (self._node("authority", 0.75), self._fake_trace(), 0.75),
            (self._node("urgency", 0.50), self._fake_trace(), 0.50),
            (self._node("obfuscation", 0.25), self._fake_trace(), 0.25),
            (self._node("context_manip", 0.0), self._fake_trace(), 0.0),
        ]
        selected = _prune(candidates, top_k=3)
        assert len(selected) == 3
        scores = [n.score for n in selected]
        assert 0.75 in scores and 0.50 in scores and 0.25 in scores

    def test_diversity_prefers_different_strategies(self):
        # Two nodes with same score but different strategies — both should survive
        candidates = [
            (self._node("authority", 0.75), self._fake_trace(), 0.75),
            (self._node("urgency", 0.75), self._fake_trace(), 0.75),
            (self._node("authority", 0.50), self._fake_trace(), 0.50),
        ]
        selected = _prune(candidates, top_k=2)
        strategies = {n.strategy for n in selected}
        assert "authority" in strategies
        assert "urgency" in strategies

    def test_empty_candidates(self):
        assert _prune([], top_k=3) == []


# ---------------------------------------------------------------------------
# TAPTCAttacker integration test (no Gemini — stub generator)
# ---------------------------------------------------------------------------

class TestTAPTCAttackerIntegration:
    """
    Smoke test using FakeHarness. The generator is monkey-patched to return
    deterministic payloads without calling Gemini.
    """

    def test_run_returns_traces(self, monkeypatch, tmp_path):
        harness = FakeHarness()

        # Stub the generator so no Gemini calls are made
        def fake_generate(self_gen, seed_payload, target_tool, target_args,
                           last_trace=None, last_score=0.0, depth=0):
            return [
                {"location": "email_body", "content": f"variant_{i}", "_strategy": s}
                for i, s in enumerate(STRATEGIES)
            ]

        from attacks.tap_tc import generator as gen_module
        monkeypatch.setattr(gen_module.VariantGenerator, "generate", fake_generate)

        attacker = TAPTCAttacker(
            harness=harness,
            checkpoint_name="test_run",
            checkpoint_manager=CheckpointManager(directory=tmp_path),
        )
        traces = attacker.run(
            seed_payload={"location": "email_body", "content": "seed"},
            target_tool="email_send",
            target_args={"to": "attacker@evil.corp"},
            max_depth=2,
            budget=15,
        )
        assert len(traces) > 0
        assert harness.call_count > 0

    def test_checkpoint_saved_after_depth(self, monkeypatch, tmp_path):
        harness = FakeHarness()

        def fake_generate(self_gen, seed_payload, **kwargs):
            return [{"location": "e", "content": "v", "_strategy": "authority"}]

        from attacks.tap_tc import generator as gen_module
        monkeypatch.setattr(gen_module.VariantGenerator, "generate", fake_generate)

        mgr = CheckpointManager(directory=tmp_path)
        attacker = TAPTCAttacker(
            harness=harness,
            checkpoint_name="ckpt_test",
            checkpoint_manager=mgr,
        )
        attacker.run(
            seed_payload={"location": "e", "content": "seed"},
            target_tool="email_send",
            target_args={"to": "attacker@evil.corp"},
            max_depth=1,
            budget=10,
        )
        assert mgr.exists("ckpt_test")

    def test_success_payload_terminates_early(self, monkeypatch, tmp_path):
        """A variant containing 'SUCCESS' causes the loop to exit immediately."""
        harness = FakeHarness()

        def fake_generate_success(self_gen, seed_payload, **kwargs):
            return [{"location": "e", "content": "SUCCESS", "_strategy": "authority"}]

        from attacks.tap_tc import generator as gen_module
        monkeypatch.setattr(gen_module.VariantGenerator, "generate", fake_generate_success)

        mgr = CheckpointManager(directory=tmp_path)
        attacker = TAPTCAttacker(
            harness=harness,
            checkpoint_name="success_test",
            checkpoint_manager=mgr,
        )
        traces = attacker.run(
            seed_payload={"location": "e", "content": "seed"},
            target_tool="email_send",
            target_args={"to": "attacker@evil.corp"},
            max_depth=5,
            budget=50,
        )
        # Should have stopped after the first successful trace
        success_traces = [t for t in traces if t.outcome.succeeded]
        assert len(success_traces) >= 1
        # Harness should only have been called once (early termination)
        assert harness.call_count == 1
