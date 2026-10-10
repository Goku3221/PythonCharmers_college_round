"""
contracts/schemas.py
Core Pydantic Schemas for AgentBreak.
Frozen at Hour 1.0 — Any changes require 3-way signoff.
"""

from typing import Any
from pydantic import BaseModel, Field

from contracts.enums import AttackType, ReplayMode, RunMode, Severity, Verdict


class TraceStep(BaseModel):
    step_index: int
    step_type: str  # "llm_call" | "tool_call" | "tool_response" | "reasoning"
    timestamp: str
    content: str
    tool_name: str | None = None
    tool_args: dict[str, Any] | None = None
    tool_response: dict[str, Any] | None = None
    llm_response_raw: str | None = None  # Stored for cassette replay
    is_flagged: bool = False
    flag_reason: str | None = None
    partial_score: float | None = None   # 0.0–1.0, set by scoring.py


class AttackOutcome(BaseModel):
    succeeded: bool
    detection_method: str  # "deterministic" | "llm_judge"
    deterministic_signal: dict[str, Any] | None = None
    llm_judge_score: float | None = None
    severity: Severity
    unauthorized_actions: list[str] = Field(default_factory=list)
    partial_score: float = 0.0  # highest level reached (0.0–1.0)


class AttackTrace(BaseModel):
    trace_id: str                  # UUID, stable across replays
    created_at: str                # ISO8601
    run_mode: RunMode              # RunMode.LIVE | RunMode.RECORDED (shown in UI)
    synthetic: bool = False        # True for hand-seeded Module 3 traces
    attack_type: AttackType        # indirect_injection | tool_permission | rag_poison | adaptive | instruction_override
    target_agent_id: str           # e.g. "agentdojo:workspace:task_0"
    attack_variant_id: str         # "corpus:N" or "tap_tc:depth:N:variant:M"

    injection_payload: dict[str, Any]  # e.g. {"location": str, "content": str}
    steps: list[TraceStep]
    outcome: AttackOutcome

    # Reproducibility
    seed: int

    # Cassette storage (populated when recording is active for <3s exact replay)
    cassette: list[dict[str, Any]] | None = None  # [{"prompt_hash": str, "response": str}]

    # Langfuse linkage (None if Langfuse is disabled or dropped)
    langfuse_trace_id: str | None = None
    langfuse_session_id: str | None = None


class VulnerabilityFinding(BaseModel):
    finding_id: str
    trace_id: str
    vulnerability_type: AttackType | str
    affected_tool: str
    owasp_category: str            # e.g. "LLM01", "LLM08", "LLM06"
    severity: Severity
    description: str
    reproduction_steps: list[str]
    first_found_at: str
    confirmed_at: str | None = None


class DefenseEvalResult(BaseModel):
    eval_id: str
    defense_id: str
    defense_type: str              # "prompt_guardrail" | "allowlist" | "output_scanner"
    defense_config: dict[str, Any] = Field(default_factory=dict)

    # Static replay (live k-trial mode, never cassette)
    attack_traces_tested: list[str] = Field(default_factory=list)
    k_trials_per_trace: int = 5    # Standard 5 live trials
    attacks_blocked: int
    attacks_succeeded: int
    block_rate: float              # fraction blocked = 1.0 - ASR

    # Regression
    benign_tasks_tested: list[str] = Field(default_factory=list)
    benign_tasks_passed: int
    benign_task_utility: float     # 1.0 = no regression; threshold >= 0.95 for "effective"

    # Adaptive eval (TAP-TC against defended agent — the headline result)
    adaptive_asr: float | None = None      # None if not run
    adaptive_traces: list[str] = Field(default_factory=list)  # trace_ids from TAP-TC vs defended agent
    adaptive_verdict: str | None = None    # "robust" | "bypassed" | "not_tested"

    evaluated_at: str
    verdict: Verdict
