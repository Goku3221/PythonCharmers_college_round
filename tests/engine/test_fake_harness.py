"""
tests/engine/test_fake_harness.py
Verifies that FakeHarness correctly satisfies the Harness Protocol and handles traces.
"""

import unittest

from contracts.enums import ReplayMode, RunMode
from contracts.interfaces import Harness
from engine.harness.fake import FakeHarness


class TestFakeHarness(unittest.TestCase):
    def test_fake_harness_protocol(self):
        harness: Harness = FakeHarness()
        self.assertIsNotNone(harness)

    def test_fake_harness_run_attack(self):
        harness = FakeHarness()
        trace = harness.run_attack(
            task_id="agentdojo:workspace:task_0",
            injection={"location": "email_body", "content": "attack payload"},
            seed=123,
        )
        self.assertIsNotNone(trace.trace_id)
        self.assertEqual(trace.target_agent_id, "agentdojo:workspace:task_0")
        self.assertEqual(trace.injection_payload["content"], "attack payload")
        self.assertEqual(trace.seed, 123)
        self.assertGreater(len(trace.steps), 0)

    def test_fake_harness_replays(self):
        harness = FakeHarness()
        trace = harness.run_attack(
            task_id="agentdojo:workspace:task_0",
            injection={"location": "email_body", "content": "attack payload"},
        )

        # Cassette replay (<3s single deterministic reproduction)
        cassette_traces = harness.replay(trace, mode=ReplayMode.CASSETTE)
        self.assertEqual(len(cassette_traces), 1)
        self.assertEqual(cassette_traces[0].run_mode, RunMode.RECORDED)
        self.assertEqual(cassette_traces[0].outcome.succeeded, trace.outcome.succeeded)

        # Live k-trial replay
        live_traces = harness.replay(trace, mode=ReplayMode.LIVE, k=5)
        self.assertEqual(len(live_traces), 5)
        for t in live_traces:
            self.assertEqual(t.run_mode, RunMode.LIVE)

    def test_fake_harness_with_defense(self):
        harness = FakeHarness()
        harness.set_defense("prompt_guardrail")
        trace = harness.run_attack(
            task_id="agentdojo:workspace:task_0",
            injection={"location": "email_body", "content": "attack payload"},
        )
        self.assertFalse(trace.outcome.succeeded)
        self.assertLessEqual(trace.outcome.partial_score, 0.25)


if __name__ == "__main__":
    unittest.main()
