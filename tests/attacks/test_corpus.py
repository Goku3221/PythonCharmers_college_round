"""
tests/attacks/test_corpus.py

Tests for attacks/corpus/ runner and system prompt probes.
Validates execution against FakeHarness as specified in Hour 1-1.5 milestones.
"""

from __future__ import annotations

import pytest

from engine.harness.fake import FakeHarness
from attacks.corpus.runner import CorpusRunner
from attacks.corpus.system_prompt_probes import SYSTEM_PROMPT_PROBES


class TestCorpusRunner:
    def test_system_prompt_probes_definition(self):
        """Verify the 3 required direct-injection probes are defined with correct structure."""
        assert len(SYSTEM_PROMPT_PROBES) >= 3
        probe_ids = {p["probe_id"] for p in SYSTEM_PROMPT_PROBES}
        assert "sp_override_01" in probe_ids
        assert "sp_override_02" in probe_ids
        assert "sp_override_03" in probe_ids

        for probe in SYSTEM_PROMPT_PROBES:
            assert "task_id" in probe
            assert "injection" in probe
            assert "target_tool" in probe
            assert "target_args" in probe

    def test_run_probes_against_fake_harness(self):
        """CorpusRunner executes all probes through FakeHarness and computes partial scores."""
        harness = FakeHarness()
        runner = CorpusRunner(harness=harness)

        traces = runner.run_all(SYSTEM_PROMPT_PROBES)
        assert len(traces) == len(SYSTEM_PROMPT_PROBES)

        for trace, probe in zip(traces, SYSTEM_PROMPT_PROBES):
            assert trace.attack_variant_id == f"corpus:{probe['probe_id']}"
            assert trace.target_agent_id == probe["task_id"]
            assert trace.outcome.partial_score is not None
            assert 0.0 <= trace.outcome.partial_score <= 1.0

    def test_run_single_probe(self):
        """CorpusRunner correctly executes and scores a single probe."""
        harness = FakeHarness()
        runner = CorpusRunner(harness=harness)

        probe = SYSTEM_PROMPT_PROBES[0]
        trace = runner.run_probe(probe)
        assert trace.attack_variant_id == f"corpus:{probe['probe_id']}"
        assert trace.outcome.partial_score >= 0.0
