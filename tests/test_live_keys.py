"""
tests/test_live_keys.py
Live integration test suite testing real API credentials:
- E2B Cloud Sandbox
- Langfuse Cloud SDK
- Gemini GenAI Model API
- SQLite -> Langfuse Dual Persistence
"""

import os
import unittest
from dotenv import dotenv_values

vals = dotenv_values(".env")
for k, v in vals.items():
    if v and k not in os.environ:
        os.environ[k] = v

from engine.sandbox.manager import E2BSandboxManager
from engine.trace.sink import get_langfuse_client, push_trace_to_langfuse
from engine.trace.store import SQLiteTraceStore
from contracts.schemas import AttackTrace, TraceStep, AttackOutcome
from contracts.enums import AttackType, Severity, RunMode


class TestLiveKeysIntegration(unittest.TestCase):

    def test_e2b_live_sandbox(self):
        """Verifies real isolated Python execution inside an E2B cloud microVM."""
        e2b_key = os.getenv("E2B_API_KEY")
        if not e2b_key:
            self.skipTest("E2B_API_KEY not configured")

        manager = E2BSandboxManager(api_key=e2b_key)
        res = manager.execute_code("x = 40 + 2; print(f'RESULT={x}')")
        self.assertIn("RESULT=42", res.stdout)
        self.assertIsNone(res.error)
        self.assertGreater(res.duration, 0.0)

    def test_langfuse_live_connectivity(self):
        """Verifies authentication and live project access on Langfuse Cloud."""
        client = get_langfuse_client()
        if not client:
            self.skipTest("Langfuse credentials not configured")
        self.assertTrue(client.auth_check())

    def test_gemini_live_generation(self):
        """Verifies content generation against Google Gemini."""
        gemini_key = os.getenv("GEMINI_API_KEY")
        if not gemini_key:
            self.skipTest("GEMINI_API_KEY not configured")

        from google import genai
        client = genai.Client(api_key=gemini_key)
        model = os.getenv("GEMINI_MODEL", "gemini-3-flash-preview")
        resp = client.models.generate_content(
            model=model,
            contents="Respond with the exact string: OPERATIONAL",
        )
        self.assertIsNotNone(resp.text)
        self.assertIn("OPERATIONAL", resp.text.upper())

    def test_sqlite_langfuse_dual_persistence(self):
        """Verifies that saving a trace to SQLite automatically syncs with Langfuse."""
        client = get_langfuse_client()
        if not client:
            self.skipTest("Langfuse credentials not configured")

        store = SQLiteTraceStore(db_path="data/test_live_dual.db")
        trace = AttackTrace(
            trace_id="trace-test-dual-sync",
            created_at="2026-10-11T02:45:00Z",
            run_mode=RunMode.LIVE,
            synthetic=False,
            attack_type=AttackType.INDIRECT_INJECTION,
            target_agent_id="agentdojo:workspace:user_task_0",
            attack_variant_id="test_dual_variant",
            injection_payload={"location": "email_body", "content": "Live dual persistence test payload"},
            steps=[
                TraceStep(
                    step_index=0,
                    step_type="llm_call",
                    timestamp="2026-10-11T02:45:01Z",
                    content="Live test step",
                    llm_response_raw="Acknowledged",
                    is_flagged=False,
                    partial_score=0.25,
                )
            ],
            outcome=AttackOutcome(
                succeeded=False,
                detection_method="deterministic",
                severity=Severity.LOW,
                unauthorized_actions=[],
                partial_score=0.25,
            ),
            seed=101,
            cassette=[],
        )

        try:
            store.save(trace)
            self.assertIsNotNone(trace.langfuse_trace_id)
            loaded = store.get("trace-test-dual-sync")
            self.assertIsNotNone(loaded)
            self.assertEqual(loaded.langfuse_trace_id, trace.langfuse_trace_id)
        finally:
            if os.path.exists("data/test_live_dual.db"):
                os.remove("data/test_live_dual.db")


if __name__ == "__main__":
    unittest.main()
