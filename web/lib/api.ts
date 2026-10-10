/**
 * web/lib/api.ts
 * The unified client for all frontend API communication with the FastAPI backend.
 */

import { AttackTrace, DefenseEvalResult, VulnerabilityFinding } from '../../contracts/ts/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function fetchTraces(filters?: {
  attack_type?: string;
  severity?: string;
  run_mode?: string;
  limit?: number;
}): Promise<AttackTrace[]> {
  const params = new URLSearchParams();
  if (filters?.attack_type && filters.attack_type !== 'all') params.append('attack_type', filters.attack_type);
  if (filters?.severity && filters.severity !== 'all') params.append('severity', filters.severity);
  if (filters?.run_mode && filters.run_mode !== 'all') params.append('run_mode', filters.run_mode);
  if (filters?.limit) params.append('limit', filters.limit.toString());

  const url = `${API_BASE_URL}/traces${params.toString() ? `?${params.toString()}` : ''}`;
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`Falling back from API: ${err}`);
    return [];
  }
}

export async function fetchTraceById(traceId: string): Promise<AttackTrace | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/traces/${traceId}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`Failed to fetch trace ${traceId}:`, err);
    return null;
  }
}

export async function replayCassette(traceId: string): Promise<AttackTrace | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/traces/${traceId}/replay`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`Cassette replay failed:`, err);
    return null;
  }
}

export async function triggerAttack(payload: {
  task_id?: string;
  injection: Record<string, any>;
  defense_id?: string;
  seed?: number;
}): Promise<{ run_id: string; status: string; trace: AttackTrace } | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/attacks/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task_id: payload.task_id || 'user_task_0',
        injection: payload.injection,
        defense_id: payload.defense_id,
        seed: payload.seed || 42,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`Trigger attack failed:`, err);
    return null;
  }
}

export async function fetchFindings(filters?: {
  severity?: string;
  owasp_category?: string;
}): Promise<VulnerabilityFinding[]> {
  const params = new URLSearchParams();
  if (filters?.severity && filters.severity !== 'all') params.append('severity', filters.severity);
  if (filters?.owasp_category && filters.owasp_category !== 'all') params.append('owasp_category', filters.owasp_category);

  try {
    const res = await fetch(`${API_BASE_URL}/findings${params.toString() ? `?${params.toString()}` : ''}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`Failed to fetch findings: ${err}`);
    return [];
  }
}

export async function fetchDefenses(): Promise<Array<{ defense_id: string; defense_type: string; description: string; config: any }>> {
  try {
    const res = await fetch(`${API_BASE_URL}/defenses`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`Failed to fetch defenses: ${err}`);
    return [];
  }
}

export async function fetchDefenseEvals(): Promise<DefenseEvalResult[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/defenses/evals`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`Failed to fetch defense evals: ${err}`);
    return [];
  }
}

export async function evaluateDefense(
  defenseId: string,
  attackTraceIds: string[] = [],
  k: number = 5,
): Promise<DefenseEvalResult | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/defenses/eval`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        defense_id: defenseId,
        attack_trace_ids: attackTraceIds,
        k: k,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error(`Evaluate defense failed:`, err);
    return null;
  }
}
