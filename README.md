# AgentBreak: Autonomous AI Red Team

AgentBreak is an autonomous, adaptive red-teaming framework that discovers multi-stage tool-use vulnerabilities in AI agents, verifies defense efficacy under adaptive pressure, and guarantees reproducible attack traces.

## Architecture

- **Engine (`engine/`):** Isolation sandboxes (E2B), unified agent harness, SQLite & cassette trace store, replay runners, and defense wrappers.
- **Attacks (`attacks/`):** Autonomous attack discovery loop (TAP-TC), AgentDojo corpus runner, permission auditor, and multi-tier detectors.
- **Product (`api/`, `web/`):** FastAPI backend and Next.js evaluation dashboard for attack replay, defense scorecard, and live loop monitoring.

## Team Plans

- [Person A — Engine & Harness Plan](file:///docs/PLAN_A.md)
- [Person B — Attacks & Autonomous Loop Plan](file:///docs/PLAN_B.md)
- [Person C — Product, API & Dashboard Plan](file:///docs/PLAN_C.md)
- [Master Implementation Guide](file:///docs/UPDATED_IMPLEMENTATION.md)
