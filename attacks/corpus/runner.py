"""
attacks/corpus/runner.py

CorpusRunner: executes a list of attack probe dicts against a Harness and
returns scored AttackTrace objects.
"""

from __future__ import annotations

import logging
from typing import Any

from contracts.interfaces import Harness
from contracts.schemas import AttackTrace
from attacks.detectors.scoring import partial_score

logger = logging.getLogger(__name__)


class CorpusRunner:
    """
    Drives a collection of attack probes through the execution harness.

    Usage
    -----
    runner = CorpusRunner(harness=my_harness)
    traces = runner.run_all(SYSTEM_PROMPT_PROBES)
    """

    def __init__(self, harness: Harness, seed: int = 42) -> None:
        self._harness = harness
        self._seed = seed

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def run_probe(self, probe: dict[str, Any]) -> AttackTrace:
        """
        Execute a single probe dict through the harness and annotate score.

        Parameters
        ----------
        probe:
            A dict following the structure defined in ``system_prompt_probes.py``
            (keys: task_id, injection, target_tool, target_args, probe_id).

        Returns
        -------
        AttackTrace with ``outcome.partial_score`` filled in.
        """
        task_id = probe["task_id"]
        injection = probe["injection"]
        target_tool = probe.get("target_tool", "")
        target_args = probe.get("target_args", {})
        probe_id = probe.get("probe_id", "unknown")

        logger.info("Running corpus probe %s against task %s", probe_id, task_id)

        trace = self._harness.run_attack(
            task_id=task_id,
            injection=injection,
            seed=self._seed,
        )

        # Annotate with partial score
        score = partial_score(trace, target_tool, target_args)
        # Pydantic models are immutable by default — use model_copy
        updated_outcome = trace.outcome.model_copy(update={"partial_score": score})
        trace = trace.model_copy(
            update={
                "attack_variant_id": f"corpus:{probe_id}",
                "outcome": updated_outcome,
            }
        )

        logger.info(
            "Probe %s → score=%.2f succeeded=%s",
            probe_id,
            score,
            trace.outcome.succeeded,
        )
        return trace

    def run_all(self, probes: list[dict[str, Any]]) -> list[AttackTrace]:
        """Run all probes and return their traces in order."""
        results: list[AttackTrace] = []
        for probe in probes:
            try:
                trace = self.run_probe(probe)
                results.append(trace)
            except Exception as exc:
                logger.error("Probe %s failed: %s", probe.get("probe_id"), exc)
        return results
