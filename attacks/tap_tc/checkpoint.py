"""
attacks/tap_tc/checkpoint.py

Checkpoint serialisation for the TAP-TC tree search state.

The checkpoint stores:
  - the tree of nodes explored so far
  - which nodes are still "live" (not pruned)
  - depth reached
  - budget consumed

Files are saved to ``seeds/tap_checkpoints/<name>.pkl`` using pickle so that
nested Pydantic models and arbitrary Python objects are preserved faithfully.
"""

from __future__ import annotations

import logging
import pickle
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

# Default checkpoint directory (relative to project root)
_DEFAULT_DIR = Path(__file__).resolve().parents[3] / "seeds" / "tap_checkpoints"


@dataclass
class TreeNode:
    """A single node in the TAP-TC search tree."""

    node_id: str
    depth: int
    payload: dict[str, Any]
    strategy: str
    score: float = 0.0
    trace_id: str | None = None
    children: list["TreeNode"] = field(default_factory=list)
    pruned: bool = False


@dataclass
class CheckpointState:
    """Complete serialisable state of a TAP-TC search run."""

    root_payload: dict[str, Any]
    target_tool: str
    target_args: dict[str, Any]
    task_id: str
    depth_reached: int = 0
    budget_consumed: int = 0
    live_nodes: list[TreeNode] = field(default_factory=list)
    all_nodes: list[TreeNode] = field(default_factory=list)
    successful_traces: list[str] = field(default_factory=list)  # trace_ids


class CheckpointManager:
    """
    Saves and loads TAP-TC search tree checkpoints.

    Usage
    -----
    mgr = CheckpointManager()
    mgr.save(state, "workspace_exfil")      # → seeds/tap_checkpoints/workspace_exfil.pkl
    state = mgr.load("workspace_exfil")
    """

    def __init__(self, directory: Path | str | None = None) -> None:
        self._dir = Path(directory) if directory else _DEFAULT_DIR
        self._dir.mkdir(parents=True, exist_ok=True)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def save(self, state: CheckpointState, name: str) -> Path:
        """
        Serialize *state* to ``<directory>/<name>.pkl``.

        Returns the path of the saved file.
        """
        path = self._dir / f"{name}.pkl"
        tmp = path.with_suffix(".pkl.tmp")
        try:
            with tmp.open("wb") as f:
                pickle.dump(state, f, protocol=pickle.HIGHEST_PROTOCOL)
            tmp.replace(path)  # atomic rename
            logger.info("Checkpoint saved → %s", path)
        except Exception as exc:
            logger.error("Failed to save checkpoint %s: %s", path, exc)
            tmp.unlink(missing_ok=True)
            raise
        return path

    def load(self, name: str) -> CheckpointState:
        """
        Load a checkpoint by name (without .pkl extension).

        Raises FileNotFoundError if the checkpoint does not exist.
        """
        path = self._dir / f"{name}.pkl"
        if not path.exists():
            raise FileNotFoundError(f"Checkpoint not found: {path}")

        with path.open("rb") as f:
            state = pickle.load(f)  # noqa: S301 — internal trusted artifact

        if not isinstance(state, CheckpointState):
            raise TypeError(f"Unexpected object in checkpoint: {type(state)}")

        logger.info(
            "Checkpoint loaded from %s (depth=%d, budget=%d, live_nodes=%d)",
            path,
            state.depth_reached,
            state.budget_consumed,
            len(state.live_nodes),
        )
        return state

    def exists(self, name: str) -> bool:
        return (self._dir / f"{name}.pkl").exists()

    def checkpoint_path(self, name: str) -> Path:
        return self._dir / f"{name}.pkl"
