# AgentBreak — Team Decisions Log

> **Protocol:** Keep this file updated as a team. One line per decision. Prevents arguments at hour 9. Tie-breaker is whoever owns the affected folder.

| Decision | Chosen | Rationale | Owner | Status |
|---|---|---|---|---|
| LLM for victim | Gemini 2.5 Flash | All runs must use the same model. Traces are non-comparable across models. | A | LOCKED |
| LLM for attacker | Gemini 2.5 Flash | Same model as victim for comparability. | B | LOCKED |
| Langfuse deployment | Cloud (30-min kill switch) | Self-hosted v3 requires Postgres+ClickHouse+Redis — not hackathon-viable. | A | ACTIVE |
| Replay mode for defence eval | Live k-trial only (k=5) | Cassette cannot be used: defence changes prompt/blocks tool calls → recording diverges. | A | LOCKED |
| Replay mode for original attack | Cassette (preferred) | Exact reproduction, <3 s, zero API calls. | A | LOCKED |
| Demo adaptive target | Prompt guardrail | Allowlist blocks by construction (oracle); guardrail bypass is the interesting result. | B | LOCKED |
| AgentDojo integration | AgentPipeline + GoogleLLM | Native runner uses google-genai, outputs messages history for TraceStep mapping, built-in utility/security evaluators, and pipeline defenses. | A | LOCKED |
| TAP-TC demo mode | Warm start (checkpoint) | Sequential full run is 3–8 min on stage. Warm start is ~15–20 s. | B | LOCKED |
| Severity matrix | Easy+High → Critical | Easy to exploit + high impact = worst case. Matrix was inverted in previous version. | B | LOCKED |
| Fallback labeling | Amber "Recorded Run" badge | Judges forgive pre-recorded demos; they penalise deception. | C | LOCKED |
