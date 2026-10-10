"""
contracts/enums.py
Core Enumerations for AgentBreak.
Frozen at Hour 1.0 — Any changes require 3-way signoff.
"""

from enum import Enum


class AttackType(str, Enum):
    INDIRECT_INJECTION = "indirect_injection"
    TOOL_PERMISSION = "tool_permission"
    RAG_POISON = "rag_poison"
    ADAPTIVE = "adaptive"
    INSTRUCTION_OVERRIDE = "instruction_override"


class Severity(str, Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class ReplayMode(str, Enum):
    CASSETTE = "cassette"  # exact replay of original attack only (<3s)
    LIVE = "live"          # k-trial live LLM re-run for defense/regression


class RunMode(str, Enum):
    LIVE = "live"
    RECORDED = "recorded"  # Shown with amber "Recorded Run" badge in UI


class Verdict(str, Enum):
    EFFECTIVE = "effective"
    PARTIAL = "partial"
    INEFFECTIVE = "ineffective"
    REGRESSION = "regression"
