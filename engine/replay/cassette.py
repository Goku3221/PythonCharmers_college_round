"""
engine/replay/cassette.py
Cassette replay runner for exact reproduction of original attacks in <3 seconds.
Zero LLM calls. Deterministic.
"""

from datetime import datetime, timezone
import uuid

from contracts.enums import RunMode
from contracts.schemas import AttackTrace
from engine.trace.cassette import CassettePlayer


def replay_cassette(trace: AttackTrace) -> AttackTrace:
    """
    Deterministically reproduces an original attack trace using stored cassette entries.
    Execution completes in <3 seconds with zero LLM API calls.
    """
    if not trace.cassette:
        # If no explicit cassette is recorded, use trace steps as the recorded playback
        player = CassettePlayer([])
    else:
        player = CassettePlayer(trace.cassette)

    replayed = trace.model_copy(deep=True)
    replayed.trace_id = f"replay-cassette-{uuid.uuid4()}"
    replayed.created_at = datetime.now(timezone.utc).isoformat()
    replayed.run_mode = RunMode.RECORDED

    # Ensure all step raw responses align with the cassette player if populated
    for step in replayed.steps:
        if step.llm_response_raw:
            mocked = player.get_response(step.content)
            if mocked:
                step.llm_response_raw = mocked

    return replayed
