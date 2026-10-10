"""
attacks/tap_tc/loop.py

TAPTCAttacker: autonomous tree-search attack loop.

Algorithm (per spec §3.2):
  1. Start with the seed payload as the root node.
  2. At each depth level:
     a. Expand: for each live node, generate N=5 variants via VariantGenerator.
     b. Run: execute each variant through harness.run_attack().
     c. Score: compute partial_score for each trace.
     d. Prune: retain Top-K=3 nodes by score; break ties via diversity
        (prefer different strategies).
     e. Checkpoint: save tree state to disk after every depth level.
     f. Terminate early if any trace scores 1.0 (full success).
  3. Return all traces collected.

The loop also exposes a ``resume()`` method for warm-start from checkpoint.
"""

from __future__ import annotations

import logging
import uuid
from typing import Any

from contracts.interfaces import Harness
from contracts.schemas import AttackTrace
from attacks.detectors.scoring import partial_score
from attacks.tap_tc.generator import VariantGenerator
from attacks.tap_tc.checkpoint import CheckpointManager, CheckpointState, TreeNode

logger = logging.getLogger(__name__)

_TOP_K = 3
_N_VARIANTS = 5  # kept in sync with generator — one per strategy


class TAPTCAttacker:
    """
    Tree-search attacker adapted for multi-step tool-call chains.

    Implements the ``Attacker`` protocol from ``contracts.interfaces``.
    """

    def __init__(
        self,
        harness: Harness,
        task_id: str = "agentdojo:workspace:task_0",
        seed: int = 42,
        checkpoint_name: str | None = None,
        checkpoint_manager: CheckpointManager | None = None,
    ) -> None:
        self._harness = harness
        self._task_id = task_id
        self._seed = seed
        self._checkpoint_name = checkpoint_name or "tap_run"
        self._ckpt = checkpoint_manager or CheckpointManager()
        self._generator = VariantGenerator()

    # ------------------------------------------------------------------
    # Public API  (Attacker protocol)
    # ------------------------------------------------------------------

    def run(
        self,
        seed_payload: dict[str, Any],
        target_tool: str,
        target_args: dict[str, Any],
        max_depth: int = 4,
        budget: int = 50,
    ) -> list[AttackTrace]:
        """
        Run the TAP-TC search from scratch.

        Returns
        -------
        All collected AttackTrace objects (successful and partial).
        """
        state = CheckpointState(
            root_payload=seed_payload,
            target_tool=target_tool,
            target_args=target_args,
            task_id=self._task_id,
        )

        # Bootstrap: the root node is the seed payload itself
        root_node = TreeNode(
            node_id=str(uuid.uuid4()),
            depth=0,
            payload=seed_payload,
            strategy="seed",
        )
        state.live_nodes = [root_node]
        state.all_nodes = [root_node]

        return self._execute_search(
            state=state,
            start_depth=1,
            max_depth=max_depth,
            budget=budget,
            checkpoint_name=self._checkpoint_name,
        )

    def resume(self, checkpoint_path: str, depth_remaining: int = 1) -> list[AttackTrace]:
        """
        Resume a TAP-TC run from a checkpoint file.

        Parameters
        ----------
        checkpoint_path:
            Path to the .pkl checkpoint file (or just the name without extension).
        depth_remaining:
            How many additional depth levels to run.
        """
        import os
        name = os.path.splitext(os.path.basename(checkpoint_path))[0]

        state = self._ckpt.load(name)
        start_depth = state.depth_reached + 1
        max_depth = state.depth_reached + depth_remaining
        logger.info(
            "Resuming from checkpoint '%s' at depth %d with %d live nodes (target max_depth=%d).",
            name,
            state.depth_reached,
            len(state.live_nodes),
            max_depth,
        )

        return self._execute_search(
            state=state,
            start_depth=start_depth,
            max_depth=max_depth,
            budget=state.budget_consumed + (depth_remaining * _N_VARIANTS * max(1, len(state.live_nodes))),
            checkpoint_name=name,
        )

    # ------------------------------------------------------------------
    # Private search execution
    # ------------------------------------------------------------------

    def _execute_search(
        self,
        state: CheckpointState,
        start_depth: int,
        max_depth: int,
        budget: int,
        checkpoint_name: str | None = None,
    ) -> list[AttackTrace]:
        ckpt_name = checkpoint_name or self._checkpoint_name
        all_traces: list[AttackTrace] = []

        for depth in range(start_depth, max_depth + 1):
            if state.budget_consumed >= budget:
                logger.info("Budget exhausted at depth %d — stopping.", depth)
                break
            if not state.live_nodes:
                logger.info("No live nodes at depth %d — stopping.", depth)
                break

            logger.info(
                "=== TAP-TC depth %d | live=%d | budget_used=%d/%d ===",
                depth,
                len(state.live_nodes),
                state.budget_consumed,
                budget,
            )

            candidates: list[tuple[TreeNode, AttackTrace, float]] = []

            for parent_node in state.live_nodes:
                if state.budget_consumed >= budget:
                    break

                variants = self._generator.generate(
                    seed_payload=parent_node.payload,
                    target_tool=state.target_tool,
                    target_args=state.target_args,
                    depth=depth,
                )

                for variant_payload in variants:
                    if state.budget_consumed >= budget:
                        break

                    trace = self._run_variant(variant_payload, state.target_tool)
                    state.budget_consumed += 1
                    all_traces.append(trace)

                    score = partial_score(trace, state.target_tool, state.target_args)
                    strategy = variant_payload.get("_strategy", "unknown")
                    node = TreeNode(
                        node_id=str(uuid.uuid4()),
                        depth=depth,
                        payload=variant_payload,
                        strategy=strategy,
                        score=score,
                        trace_id=trace.trace_id,
                    )
                    parent_node.children.append(node)
                    state.all_nodes.append(node)

                    logger.debug(
                        "  variant strategy=%s score=%.2f trace=%s",
                        strategy,
                        score,
                        trace.trace_id,
                    )

                    if score >= 1.0:
                        state.successful_traces.append(trace.trace_id)
                        logger.info("SUCCESS at depth %d! trace=%s", depth, trace.trace_id)
                        # Checkpoint and return immediately on success
                        state.depth_reached = depth
                        self._ckpt.save(state, ckpt_name)
                        return all_traces

                    candidates.append((node, trace, score))

            # Prune: keep Top-K=3 by score with diversity fallback
            state.live_nodes = _prune(candidates, top_k=_TOP_K)
            state.depth_reached = depth

            # Checkpoint after every depth level
            self._ckpt.save(state, ckpt_name)

            logger.info(
                "Depth %d done: kept %d live nodes after pruning.",
                depth,
                len(state.live_nodes),
            )

        return all_traces

    # ------------------------------------------------------------------
    # Private helpers
    # ------------------------------------------------------------------

    def _run_variant(
        self,
        payload: dict[str, Any],
        target_tool: str,
    ) -> AttackTrace:
        """Execute a single payload variant through the harness."""
        try:
            return self._harness.run_attack(
                task_id=self._task_id,
                injection=payload,
                seed=self._seed,
            )
        except Exception as exc:
            logger.error("Harness run_attack failed: %s", exc)
            raise


def _prune(
    candidates: list[tuple[TreeNode, AttackTrace, float]],
    top_k: int = _TOP_K,
) -> list[TreeNode]:
    """
    Select the top-k nodes by score.

    Tie-breaking: prefer diversity in strategy — if two nodes have identical
    scores, prefer the one whose strategy hasn't already been selected.
    """
    if not candidates:
        return []

    # Sort descending by score
    sorted_cands = sorted(candidates, key=lambda c: c[2], reverse=True)

    selected: list[TreeNode] = []
    seen_strategies: set[str] = set()

    # First pass: fill top-k slots, diversity-aware
    for node, _trace, _score in sorted_cands:
        if len(selected) >= top_k:
            break
        if node.strategy not in seen_strategies or len(selected) < top_k:
            selected.append(node)
            seen_strategies.add(node.strategy)

    # If still short (all same strategy), fill from remainder
    if len(selected) < top_k:
        for node, _trace, _score in sorted_cands:
            if node not in selected:
                selected.append(node)
            if len(selected) >= top_k:
                break

    logger.debug(
        "Pruned %d→%d nodes: %s",
        len(candidates),
        len(selected),
        [f"{n.strategy}:{n.score:.2f}" for n in selected],
    )
    return selected
