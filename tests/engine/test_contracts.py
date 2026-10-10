"""
tests/engine/test_contracts.py
Verifies that all contracts, schemas, and enums conform to specifications and serialize cleanly.
"""

import json
import unittest

from contracts.enums import AttackType, ReplayMode, RunMode, Severity, Verdict
from contracts.schemas import (
    AttackOutcome,
    AttackTrace,
    DefenseEvalResult,
    TraceStep,
    VulnerabilityFinding,
)


class TestContracts(unittest.TestCase):
    def test_enums(self):
        self.assertEqual(AttackType.INDIRECT_INJECTION, "indirect_injection")
        self.assertEqual(Severity.CRITICAL, "critical")
        self.assertEqual(ReplayMode.CASSETTE, "cassette")
        self.assertEqual(ReplayMode.LIVE, "live")
        self.assertEqual(RunMode.LIVE, "live")
        self.assertEqual(RunMode.RECORDED, "recorded")
        self.assertEqual(Verdict.EFFECTIVE, "effective")

    def test_attack_trace_serialization(self):
        step = TraceStep(
            step_index=0,
            step_type="tool_call",
            timestamp="2026-10-10T12:00:00Z",
            content="calling tool",
            tool_name="email_read",
            tool_args={"id": "msg_1"},
            partial_score=0.25,
        )
        outcome = AttackOutcome(
            succeeded=True,
            detection_method="deterministic",
            severity=Severity.HIGH,
            unauthorized_actions=["email_read"],
            partial_score=1.0,
        )
        trace = AttackTrace(
            trace_id="trace-test-1",
            created_at="2026-10-10T12:00:00Z",
            run_mode=RunMode.LIVE,
            synthetic=False,
            attack_type=AttackType.INDIRECT_INJECTION,
            target_agent_id="test_agent",
            attack_variant_id="variant_1",
            injection_payload={"content": "injection payload"},
            steps=[step],
            outcome=outcome,
            seed=42,
        )

        data = trace.model_dump()
        json_str = trace.model_dump_json()
        self.assertIn("trace-test-1", json_str)

        deserialized = AttackTrace.model_validate(json.loads(json_str))
        self.assertEqual(deserialized.trace_id, trace.trace_id)
        self.assertTrue(deserialized.outcome.succeeded)
        self.assertEqual(deserialized.steps[0].tool_name, "email_read")

    def test_vulnerability_finding(self):
        finding = VulnerabilityFinding(
            finding_id="vf-1",
            trace_id="trace-test-1",
            vulnerability_type=AttackType.INDIRECT_INJECTION,
            affected_tool="email_read",
            owasp_category="LLM01",
            severity=Severity.CRITICAL,
            description="Prompt injection in email read",
            reproduction_steps=["step 1", "step 2"],
            first_found_at="2026-10-10T12:00:00Z",
        )
        self.assertEqual(finding.owasp_category, "LLM01")
        self.assertEqual(finding.severity, Severity.CRITICAL)

    def test_defense_eval_result(self):
        res = DefenseEvalResult(
            eval_id="eval-1",
            defense_id="guardrail_1",
            defense_type="prompt_guardrail",
            attacks_blocked=5,
            attacks_succeeded=0,
            block_rate=1.0,
            benign_tasks_passed=10,
            benign_task_utility=1.0,
            evaluated_at="2026-10-10T12:00:00Z",
            verdict=Verdict.EFFECTIVE,
        )
        self.assertEqual(res.block_rate, 1.0)
        self.assertEqual(res.verdict, Verdict.EFFECTIVE)


if __name__ == "__main__":
    unittest.main()
