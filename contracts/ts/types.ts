/**
 * contracts/ts/types.ts
 * TypeScript interfaces matching contracts/schemas.py and contracts/enums.py.
 * Generated for Person C (Frontend UI & API Client).
 */

export type AttackType =
  | 'indirect_injection'
  | 'tool_permission'
  | 'rag_poison'
  | 'adaptive'
  | 'instruction_override';

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export type ReplayMode = 'cassette' | 'live';

export type RunMode = 'live' | 'recorded';

export type Verdict = 'effective' | 'partial' | 'ineffective' | 'regression';

export interface TraceStep {
  step_index: number;
  step_type: 'llm_call' | 'tool_call' | 'tool_response' | 'reasoning' | string;
  timestamp: string;
  content: string;
  tool_name?: string | null;
  tool_args?: Record<string, any> | null;
  tool_response?: Record<string, any> | null;
  llm_response_raw?: string | null;
  is_flagged: boolean;
  flag_reason?: string | null;
  partial_score?: number | null;
}

export interface AttackOutcome {
  succeeded: boolean;
  detection_method: 'deterministic' | 'llm_judge' | string;
  deterministic_signal?: Record<string, any> | null;
  llm_judge_score?: number | null;
  severity: Severity;
  unauthorized_actions: string[];
  partial_score: number;
}

export interface AttackTrace {
  trace_id: string;
  created_at: string;
  run_mode: RunMode;
  synthetic: boolean;
  attack_type: AttackType;
  target_agent_id: string;
  attack_variant_id: string;
  injection_payload: Record<string, any>;
  steps: TraceStep[];
  outcome: AttackOutcome;
  seed: number;
  cassette?: Array<{ prompt_hash: string; response: string }> | null;
  langfuse_trace_id?: string | null;
  langfuse_session_id?: string | null;
}

export interface VulnerabilityFinding {
  finding_id: string;
  trace_id: string;
  vulnerability_type: AttackType | string;
  affected_tool: string;
  owasp_category: string; // e.g. "LLM01", "LLM08", "LLM06"
  severity: Severity;
  description: string;
  reproduction_steps: string[];
  first_found_at: string;
  confirmed_at?: string | null;
}

export interface DefenseEvalResult {
  eval_id: string;
  defense_id: string;
  defense_type: string;
  defense_config: Record<string, any>;
  attack_traces_tested: string[];
  k_trials_per_trace: number;
  attacks_blocked: number;
  attacks_succeeded: number;
  block_rate: number; // fraction blocked = 1.0 - ASR
  benign_tasks_tested: string[];
  benign_tasks_passed: number;
  benign_task_utility: number; // 0.0 - 1.0
  adaptive_asr?: number | null;
  adaptive_traces: string[];
  adaptive_verdict?: 'robust' | 'bypassed' | 'not_tested' | null;
  evaluated_at: string;
  verdict: Verdict;
}

export interface AdaptiveTreeNode {
  id: string;
  depth: number;
  payload: string;
  strategy: string;
  partial_score: number;
  status: 'pending' | 'running' | 'success' | 'pruned';
  children?: AdaptiveTreeNode[];
}
