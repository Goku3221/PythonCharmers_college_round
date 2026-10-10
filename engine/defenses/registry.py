"""
engine/defenses/registry.py
Defense Registry for AgentBreak.
Maps defense IDs to defense configurations and filter implementations.
"""

from typing import Any, Callable


class DefenseRegistry:
    """Registry managing available defenses."""

    _registry: dict[str, dict[str, Any]] = {}

    @classmethod
    def register(cls, defense_id: str, defense_type: str, description: str, config: dict[str, Any] | None = None) -> None:
        cls._registry[defense_id] = {
            "defense_id": defense_id,
            "defense_type": defense_type,
            "description": description,
            "config": config or {},
        }

    @classmethod
    def get(cls, defense_id: str) -> dict[str, Any] | None:
        return cls._registry.get(defense_id)

    @classmethod
    def list_defenses(cls) -> list[dict[str, Any]]:
        return list(cls._registry.values())


# Register core defenses
DefenseRegistry.register(
    defense_id="prompt_guardrail",
    defense_type="prompt_guardrail",
    description="Instruction-filtering prompt guardrail. Blocks common override and injection patterns.",
    config={"sensitivity": 0.8},
)

DefenseRegistry.register(
    defense_id="allowlist",
    defense_type="allowlist",
    description="Strict tool allowlist (oracle-assisted). Disallows tools not explicitly listed in task definition.",
    config={"strict": True},
)

DefenseRegistry.register(
    defense_id="output_scanner",
    defense_type="output_scanner",
    description="Post-hoc recipient and content verification. Blocks emails and shares to untrusted domains.",
    config={"blocked_domains": ["evil.corp", "attacker.net"]},
)
