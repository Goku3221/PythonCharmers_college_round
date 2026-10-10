"""
engine/replay/live.py
Live k-trial replay runner for empirical defense evaluation and regression testing.
Executes k stochastic runs through the harness.
"""

from typing import Any
from contracts.enums import RunMode
from contracts.schemas import AttackTrace


def replay_live(harness: Any, trace: AttackTrace, k: int = 5) -> list[AttackTrace]:
    """
    Executes k live trials through the harness.
    Used for empirical defense evaluation (computing block_rate) and regression testing.
    Never relies on cassette recording because defenses alter prompt/tool behaviors.
    """
    traces: list[AttackTrace] = []
    base_seed = trace.seed

    for trial_idx in range(k):
        # Vary the seed deterministically per trial
        seed = base_seed + trial_idx * 101
        run_res = harness.run_attack(
            task_id=trace.target_agent_id,
            injection=trace.injection_payload,
            seed=seed,
        )
        run_res.run_mode = RunMode.LIVE
        traces.append(run_res)

    return traces
