# AgentBreak — Implementation Plan: Person C (Product, API & Dashboard)

> **Role:** Product, API & Dashboard Lead  
> **Key Modules:** Next.js Dashboard, FastAPI Backend, Fixtures, TS Types, Demo Coordination  
> **Assigned Folders:** `api/`, `web/`, `fixtures/`, `requirements/api.txt`, `tests/api/`, `docs/`, `README.md`, `Makefile`  
> **Strict Boundaries:** NEVER commit to or modify `engine/` or `attacks/`.

---

## 1. Ownership & Responsibilities

| Responsibility | Description |
|---|---|
| **Fixtures (`fixtures/`)** | Initial mock trace JSON files at Hour 1.0 to unblock the entire team. |
| **API Layer (`api/`)** | FastAPI service providing clean REST endpoints. Supports `FAKE=1` mode for development. |
| **Frontend UI (`web/`)** | Next.js dark-mode evaluation dashboard: SpanTree, Defense Scorecard, Loop Monitor. |
| **Type Generation (`contracts/ts/`)** | Generates TypeScript interfaces from Person A's Pydantic schemas. |
| **Demo & Delivery** | 4-minute demo choreography, fallback UI states, video recording, submission writeup. |

---

## 2. Hour-by-Hour Timeline & Milestones

### Hours 0–1: Scaffolding, Contracts & Initial Fixtures
- Initialize FastAPI skeleton in `api/` and Next.js app in `web/`.
- Review contracts with Person A and B. Freeze schemas at Hour 1.0.
- Run type generation to output TypeScript interfaces into `contracts/ts/`.
- **Write 3 Realistic Mock Fixtures in `fixtures/traces/` (Hour 1.0 Milestone):**
  - `trace_01_email_exfil.json`: Multi-step email injection (`succeeded=true`, `severity="critical"`, `run_mode="live"`).
  - `trace_02_guardrail_blocked.json`: Defended run blocked by prompt filter (`succeeded=false`, `run_mode="live"`).
  - `trace_03_rag_synthetic.json`: Document retrieval poison (`synthetic=true`, `run_mode="recorded"`).

### Hours 1–1.5: FAKE=1 Mode & Attack Overview Page
- Implement `api/deps.py` with `FAKE=1` fallback reading directly from `fixtures/`.
- Build **Page 1: Attack Overview**:
  - Key metric cards: Total Runs, Confirmed Vulnerabilities, Critical Findings, Overall Block Rate.
  - Trace list table filterable by `attack_type`, `severity`, and `run_mode`.
  - Badges: `RunModeBadge` (Green "Live" vs Amber "Recorded Run") and `SyntheticBadge` (Amber "Synthetic").

### Hours 2–6: Trace Detail, SpanTree & Findings (Toward Sync 1)
- Build **Page 2: Trace Detail**:
  - `SpanTree` component: Collapsible nested view of `TraceStep` items (`llm_call`, `tool_call`, `reasoning`).
  - Flagged steps highlighted in red with reasons.
  - Partial-credit indicator per step (0.25, 0.50, 0.75, 1.0).
  - Side panel: Injection payload, outcome summary, OWASP tag (`LLM01`, `LLM06`, `LLM08`).
  - **Replay Button (Cassette):** Triggers `POST /traces/{id}/replay` and displays reproduced trace in <3 seconds.
- Build **Page 3: Vulnerability Findings**:
  - Finding cards with severity, affected tool, reproduction steps, and OWASP badges.
- Wire API routes: `GET /traces`, `GET /traces/{id}`, `GET /findings`, `POST /traces/{id}/replay`.
- **SYNC 1 (Hour 6 Gate):** Switch `FAKE=0` as Person A connects the real SQLite store. Confirm live UI loads real traces.

### Hours 6–10: Defense Evaluation & Loop Monitor (Toward Sync 2)
- Build **Page 4: Defense Evaluation**:
  - Defense comparison table: Undefended ASR vs Static Replay Block Rate vs Adaptive ASR.
  - `DiffView` component: Side-by-side span tree comparing original attack vs defended replay.
  - `AdaptiveVerdictBadge`: Bold headline badges — "Robust" (Green) vs "Bypassed" (Red).
  - Hook up `POST /defenses/eval` (triggering live k-trial replay + adaptive eval).
- Build **Page 5: Adaptive Loop Monitor**:
  - Live search tree visualization showing search depth, variants tested, and partial score progression.
  - Polls `GET /attacks/{run_id}` every 2 seconds via `setInterval`.
  - "Resume from Checkpoint" button for the live demo warm-start flow.
- **SYNC 2 (Hour 10 Gate):** Full defense evaluation flow and live adaptive monitor verified end-to-end.

### Hours 10–12: UI Polish, Honest Fallbacks & Feature Freeze
- Ensure all fallback triggers display explicit honest labels (e.g., Amber "Recorded Run" badge).
- Verify Cassette Replay executes in <3s reliably.
- Complete visual styling: modern dark-mode palette, clean typography, glassmorphism cards.
- **FEATURE FREEZE (Hour 12):** No new code features after this point.

### Hours 12–16: Rehearsal, Submission & Recording
- Conduct two complete 4-minute demo rehearsals with Person A and Person B.
- Record high-quality demo video walkthrough.
- Finalize submission documentation and publish final artifacts.

---

## 3. Detailed API & UI Specifications

### 3.1 FastAPI Endpoints (`api/routes/`)
```
POST /attacks/run          -> Triggers harness run; returns run_id immediately
GET  /attacks/{run_id}     -> Polls current AttackTrace/Tree state (every 2s from UI)
POST /defenses/eval        -> Runs DefenseReplayer + adaptive_eval; returns eval_id
GET  /defenses/{eval_id}   -> Returns DefenseEvalResult
GET  /traces               -> Lists AttackTraces (filters: attack_type, severity, run_mode)
GET  /traces/{trace_id}    -> Returns single AttackTrace
POST /traces/{id}/replay   -> Cassette replay (<3s, exact reproduction)
GET  /findings             -> Lists VulnerabilityFinding records
```

### 3.2 UI Screen Hierarchy

```
[ Navigation Bar: Overview | Traces | Findings | Defense Eval | Loop Monitor ]
       │
       ├── Overview: Metric cards, severity breakdown, run mode filter
       ├── Trace Detail: Collapsible SpanTree, Cassette Replay (<3s), payload panel
       ├── Findings: OWASP category cards, reproduction steps, severity tags
       ├── Defense Eval: Side-by-side diff, block rate scorecard, Adaptive Verdict badge
       └── Loop Monitor: Search tree depth visualization, variant history, checkpoint resume
```

### 3.3 Strict Fallback Labeling Policy
- **Never conceal a pre-recorded run:** If a live API call fails or times out, clicking "Load Recorded Run" must display an amber badge:
  `[ Amber Badge: Recorded Run ]`
- **Synthetic data transparency:** Module 3 RAG traces must display:
  `[ Amber Badge: Synthetic ]`

---

## 4. 4-Minute Demo Script Choreography

| Time | Screen | Action & Narrative | Fallback |
|---|---|---|---|
| **0:00–1:00** | Overview | Introduce the problem: tool-using agents hijacked by untrusted inputs. Show 12 traces, 4 findings, 2 critical. | Pre-seeded SQLite store |
| **1:00–2:00** | Trace Detail | Walk through email exfiltration span tree. Show unauthorized tool call flagged red. Click **Cassette Replay** (<3s reproduction). | If replay lags, narrate original trace |
| **2:00–3:00** | Loop Monitor | Click **Resume Adaptive Attack** (warm start from checkpoint). Shows 1 live depth-1 expansion (~15–20s). New variant bypasses defenses. | Click "Load Recorded Run" (amber badge) |
| **3:00–4:00** | Defense Eval | Apply **Prompt Guardrail** → Static blocks 97% → Adaptive shows red **"Bypassed"** badge. Then show **Allowlist** (green **"Robust"** badge, note oracle assumption). | Pre-computed DefenseEvalResult card |

---

## 5. Verification & Testing Checklist

- [ ] TS type generator outputs valid interfaces matching `contracts/schemas.py`.
- [ ] Next.js app renders all 5 pages cleanly with `FAKE=1` on fixture JSONs.
- [ ] SpanTree correctly renders collapsible nested steps with partial scores.
- [ ] Cassette replay returns a verified trace in <3 seconds without calling external LLMs.
- [ ] Loop Monitor polls `/attacks/{run_id}` smoothly without UI freezing.
- [ ] Side-by-side defense diff clearly visualizes the blocked tool call.
- [ ] Demo rehearsal completes within the 4-minute time limit.
