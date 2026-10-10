"""
api/routes/findings.py
Vulnerability Findings endpoints for listing discovered vulnerabilities and OWASP tags.
"""

import json
from fastapi import APIRouter, Depends, Query

from contracts.interfaces import TraceStore
from contracts.schemas import VulnerabilityFinding
from api.deps import FIXTURES_DIR, get_trace_store

router = APIRouter(prefix="/findings", tags=["Findings"])

_cached_findings: list[VulnerabilityFinding] = []


def _load_findings() -> None:
    findings_file = FIXTURES_DIR / "findings.json"
    if findings_file.exists():
        try:
            with open(findings_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                for item in data:
                    _cached_findings.append(VulnerabilityFinding.model_validate(item))
        except Exception:
            pass


_load_findings()


@router.get("", response_model=list[VulnerabilityFinding])
def list_findings(
    severity: str | None = Query(None, description="Filter by severity"),
    owasp_category: str | None = Query(None, description="Filter by OWASP category, e.g. LLM01"),
    store: TraceStore = Depends(get_trace_store),
):
    """Lists vulnerability findings tagged with OWASP categories and reproduction steps."""
    findings = list(_cached_findings)

    # Dynamically augment findings from any newly confirmed traces in store
    known_trace_ids = {f.trace_id for f in findings}
    for trace in store.list_confirmed_findings():
        if trace.trace_id not in known_trace_ids:
            findings.append(
                VulnerabilityFinding(
                    finding_id=f"vf-{trace.trace_id[:8]}",
                    trace_id=trace.trace_id,
                    vulnerability_type=trace.attack_type,
                    affected_tool="send_email",
                    owasp_category="LLM01" if trace.attack_type.value == "indirect_injection" else "LLM08",
                    severity=trace.outcome.severity,
                    description=f"Automated finding: {trace.attack_type.value} leading to unauthorized tool actions.",
                    reproduction_steps=[
                        f"Target task: {trace.target_agent_id}",
                        f"Injection: {trace.injection_payload.get('content', '')[:60]}...",
                        "Agent executes unauthorized action sequence.",
                    ],
                    first_found_at=trace.created_at,
                    confirmed_at=trace.created_at,
                )
            )

    if severity:
        findings = [f for f in findings if f.severity.value == severity]
    if owasp_category:
        findings = [f for f in findings if f.owasp_category == owasp_category]

    return findings
