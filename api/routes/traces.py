"""
api/routes/traces.py
Traces endpoints for listing, viewing, and replaying AttackTraces.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from contracts.enums import ReplayMode
from contracts.interfaces import Harness, TraceStore
from contracts.schemas import AttackTrace
from api.deps import get_harness, get_trace_store

router = APIRouter(prefix="/traces", tags=["Traces"])


@router.get("", response_model=list[AttackTrace])
def list_traces(
    attack_type: str | None = Query(None, description="Filter by attack type"),
    severity: str | None = Query(None, description="Filter by severity"),
    run_mode: str | None = Query(None, description="Filter by run mode (live, recorded)"),
    limit: int = Query(50, ge=1, le=200),
    store: TraceStore = Depends(get_trace_store),
):
    """Lists attack traces with optional filtering."""
    return store.list_traces(attack_type=attack_type, severity=severity, run_mode=run_mode, limit=limit)


@router.get("/{trace_id}", response_model=AttackTrace)
def get_trace(
    trace_id: str,
    store: TraceStore = Depends(get_trace_store),
):
    """Retrieves a single attack trace by trace_id."""
    trace = store.get(trace_id)
    if not trace:
        raise HTTPException(status_code=404, detail=f"Trace '{trace_id}' not found.")
    return trace


@router.post("/{trace_id}/replay", response_model=AttackTrace)
def replay_trace(
    trace_id: str,
    store: TraceStore = Depends(get_trace_store),
    harness: Harness = Depends(get_harness),
):
    """
    Executes cassette replay of an original attack in <3 seconds without calling external LLMs.
    Guarantees exact reproduction.
    """
    trace = store.get(trace_id)
    if not trace:
        raise HTTPException(status_code=404, detail=f"Trace '{trace_id}' not found.")

    replayed_traces = harness.replay(trace, mode=ReplayMode.CASSETTE)
    replayed = replayed_traces[0]
    store.save(replayed)
    return replayed
