"""
attacks package
Exports core attack components for AgentBreak.

Subpackages are importable directly:
  from attacks.detectors.scoring import partial_score
  from attacks.tap_tc.loop import TAPTCAttacker
  from attacks.adaptive_eval import adaptive_eval
  from attacks.rag.poison_agent import RAGPoisonAgent
"""

__all__ = [
    "partial_score",
    "PermissionAuditor",
    "CodeExecDetector",
    "assign_severity",
    "adaptive_eval",
    "TAPTCAttacker",
    "RAGPoisonAgent",
]


def __getattr__(name: str):  # noqa: ANN001
    """Lazy attribute resolution to avoid eager import chain failures."""
    _map = {
        "partial_score":     ("attacks.detectors.scoring",     "partial_score"),
        "PermissionAuditor": ("attacks.detectors.permissions", "PermissionAuditor"),
        "CodeExecDetector":  ("attacks.detectors.code_exec",   "CodeExecDetector"),
        "assign_severity":   ("attacks.detectors.severity",    "assign_severity"),
        "adaptive_eval":     ("attacks.adaptive_eval",         "adaptive_eval"),
        "TAPTCAttacker":     ("attacks.tap_tc.loop",           "TAPTCAttacker"),
        "RAGPoisonAgent":    ("attacks.rag.poison_agent",      "RAGPoisonAgent"),
    }
    if name in _map:
        module_path, attr = _map[name]
        import importlib
        module = importlib.import_module(module_path)
        return getattr(module, attr)
    raise AttributeError(f"module 'attacks' has no attribute {name!r}")
