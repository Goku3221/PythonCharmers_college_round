"""
engine/trace/sink.py
Langfuse Cloud SDK Sink for AgentBreak.
Pushes AttackTraces to Langfuse Cloud for enterprise observability and red-team auditing.
Protected with non-blocking error handling and kill-switch logic.
"""

import logging
import os
from typing import Any

from contracts.schemas import AttackTrace

logger = logging.getLogger(__name__)

_langfuse_client: Any | None = None
_langfuse_initialized = False


def get_langfuse_client() -> Any | None:
    global _langfuse_client, _langfuse_initialized
    if not _langfuse_initialized:
        _langfuse_initialized = True
        public_key = os.getenv("LANGFUSE_PUBLIC_KEY")
        secret_key = os.getenv("LANGFUSE_SECRET_KEY")
        host = os.getenv("LANGFUSE_BASE_URL") or os.getenv("LANGFUSE_HOST") or "https://cloud.langfuse.com"

        if public_key and secret_key:
            try:
                from langfuse import Langfuse

                client = Langfuse(public_key=public_key, secret_key=secret_key, host=host)
                if client.auth_check():
                    _langfuse_client = client
                    logger.info("Langfuse Cloud sink initialized successfully (%s).", host)
                else:
                    logger.warning("Langfuse auth_check failed. Disabling Langfuse sink.")
            except Exception as e:
                logger.warning("Failed to initialize Langfuse SDK: %s", e)
    return _langfuse_client


def push_trace_to_langfuse(trace: AttackTrace) -> str | None:
    """
    Pushes an AttackTrace to Langfuse Cloud as an observation tree.
    Returns the Langfuse trace_id if successful, or None.
    """
    client = get_langfuse_client()
    if not client:
        return None

    try:
        # Start root observation
        root = client.start_observation(
            name=f"agentbreak:{trace.attack_type.value}",
            as_type="agent",
            input=trace.injection_payload,
            metadata={
                "trace_id": trace.trace_id,
                "attack_variant_id": trace.attack_variant_id,
                "target_agent_id": trace.target_agent_id,
                "severity": trace.outcome.severity.value,
                "run_mode": trace.run_mode.value,
                "synthetic": trace.synthetic,
            },
        )

        # Log trace steps as child observations
        for step in trace.steps:
            obs_type = "tool" if step.step_type == "tool_call" else "span"
            step_obs = root.start_observation(
                name=f"{step.step_type}:{step.tool_name or 'llm'}",
                as_type=obs_type,
                input=step.tool_args or {"content": step.content},
                output=step.tool_response or {"raw": step.llm_response_raw},
                metadata={
                    "step_index": step.step_index,
                    "is_flagged": step.is_flagged,
                    "flag_reason": step.flag_reason,
                    "partial_score": step.partial_score,
                },
            )
            step_obs.end()

        # Update root with outcome
        root.update(
            output={
                "succeeded": trace.outcome.succeeded,
                "partial_score": trace.outcome.partial_score,
                "severity": trace.outcome.severity.value,
                "unauthorized_actions": trace.outcome.unauthorized_actions,
            }
        )
        root.end()

        client.flush()
        lf_id = getattr(root, "trace_id", None)
        if lf_id:
            trace.langfuse_trace_id = str(lf_id)
        return trace.langfuse_trace_id
    except Exception as exc:
        logger.warning("Failed to push trace '%s' to Langfuse: %s", trace.trace_id, exc)
        return None
