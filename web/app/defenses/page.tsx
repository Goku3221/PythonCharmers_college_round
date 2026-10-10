'use client';

import React, { useEffect, useState } from 'react';
import { AttackTrace, DefenseEvalResult } from '../../../contracts/ts/types';
import { evaluateDefense, fetchDefenses, fetchDefenseEvals, fetchTraces } from '../../lib/api';
import { AdaptiveVerdictBadge } from '../../components/Badges';
import { DiffView } from '../../components/DiffView';

export default function DefenseScorecardPage() {
  const [evalResults, setEvalResults] = useState<DefenseEvalResult[]>([]);
  const [defenses, setDefenses] = useState<any[]>([]);
  const [traces, setTraces] = useState<AttackTrace[]>([]);
  const [loading, setLoading] = useState(true);
  const [evaluatingDefense, setEvaluatingDefense] = useState(false);
  const [selectedDefenseId, setSelectedDefenseId] = useState('prompt_guardrail');

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    const [evals, defs, allTraces] = await Promise.all([
      fetchDefenseEvals(),
      fetchDefenses(),
      fetchTraces({ limit: 10 }),
    ]);
    setEvalResults(evals);
    setDefenses(defs);
    setTraces(allTraces);
    setLoading(false);
  };

  const handleEvaluateDefense = async () => {
    setEvaluatingDefense(true);
    const newEval = await evaluateDefense(selectedDefenseId, [], 5);
    if (newEval) {
      setEvalResults((prev) => [newEval, ...prev.filter((e) => e.eval_id !== newEval.eval_id)]);
    }
    setEvaluatingDefense(false);
  };

  // Find traces for DiffView
  const undefendedTrace = traces.find((t) => t.outcome.succeeded) || traces[0];
  const defendedTrace = traces.find((t) => !t.outcome.succeeded) || traces[1] || traces[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>Defense Validation & Adaptive Stress Test</h1>
        <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px' }}>
          Validating defenses against known static replays (k=5 live trials) and adaptive adversarial search (TAP-TC).
        </p>
      </div>

      {/* Action Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#00f2fe' }}>Run Live Defense Evaluation</h3>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>
            Applies defense filter, executes k=5 live stochastic trials, runs benign regression suite, and measures bypass rate.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <select
            id="select-eval-defense"
            value={selectedDefenseId}
            onChange={(e) => setSelectedDefenseId(e.target.value)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#fff',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
            }}
          >
            {defenses.map((d) => (
              <option key={d.defense_id} value={d.defense_id}>
                {d.defense_type} — {d.defense_id}
              </option>
            ))}
          </select>

          <button
            id="btn-evaluate-defense"
            onClick={handleEvaluateDefense}
            disabled={evaluatingDefense}
            style={{
              padding: '9px 18px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #10b981 0%, #00f2fe 100%)',
              color: '#07090e',
              fontWeight: 700,
              fontSize: '13px',
              border: 'none',
              boxShadow: '0 0 16px rgba(16, 185, 129, 0.35)',
            }}
          >
            {evaluatingDefense ? 'Evaluating...' : '🛡️ Evaluate Defense (k=5)'}
          </button>
        </div>
      </div>

      {/* Scorecard Table */}
      <div className="glass-panel" style={{ padding: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '16px' }}>
          Defense Evaluation Scorecard
        </h2>

        {loading ? (
          <div style={{ color: '#94a3b8', padding: '30px', textAlign: 'center' }}>Loading evaluations...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}>
                  <th style={{ padding: '12px 8px' }}>Defense Name</th>
                  <th style={{ padding: '12px 8px' }}>Defense Type</th>
                  <th style={{ padding: '12px 8px' }}>Static Block Rate (k=5)</th>
                  <th style={{ padding: '12px 8px' }}>Benign Utility (&gt;=95%)</th>
                  <th style={{ padding: '12px 8px' }}>Adaptive Stress Result (Headline)</th>
                  <th style={{ padding: '12px 8px' }}>Verdict</th>
                </tr>
              </thead>
              <tbody>
                {evalResults.map((res) => (
                  <tr
                    key={res.eval_id}
                    id={`defense-row-${res.defense_id}`}
                    style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}
                  >
                    <td style={{ padding: '14px 8px', fontWeight: 600, color: '#fff' }}>
                      {res.defense_id === 'prompt_guardrail'
                        ? 'Prompt Guardrail'
                        : res.defense_id === 'allowlist'
                        ? 'Strict Allowlist (oracle-assisted)'
                        : 'Output Scanner'}
                    </td>
                    <td style={{ padding: '14px 8px', color: '#94a3b8' }}>{res.defense_type}</td>
                    <td style={{ padding: '14px 8px' }}>
                      <span
                        style={{
                          fontWeight: 700,
                          color: res.block_rate >= 0.9 ? '#10b981' : '#f59e0b',
                        }}
                      >
                        {(res.block_rate * 100).toFixed(0)}% Blocked
                      </span>
                      <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '6px' }}>
                        ({res.attacks_blocked}/{res.attacks_blocked + res.attacks_succeeded})
                      </span>
                    </td>
                    <td style={{ padding: '14px 8px' }}>
                      <span style={{ fontWeight: 600, color: res.benign_task_utility >= 0.95 ? '#38bdf8' : '#f43f5e' }}>
                        {(res.benign_task_utility * 100).toFixed(0)}% Utility
                      </span>
                    </td>
                    <td style={{ padding: '14px 8px' }}>
                      <AdaptiveVerdictBadge verdict={res.adaptive_verdict} />
                    </td>
                    <td style={{ padding: '14px 8px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          fontSize: '11px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          backgroundColor:
                            res.verdict === 'effective'
                              ? 'rgba(16, 185, 129, 0.15)'
                              : res.verdict === 'partial'
                              ? 'rgba(234, 179, 8, 0.15)'
                              : 'rgba(244, 63, 94, 0.15)',
                          color:
                            res.verdict === 'effective'
                              ? '#34d399'
                              : res.verdict === 'partial'
                              ? '#facc15'
                              : '#fb7185',
                        }}
                      >
                        {res.verdict}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Side-by-Side DiffView */}
      {undefendedTrace && defendedTrace && (
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>
            Side-by-Side Execution Diff: Attack vs. Defended Replay
          </h2>
          <p style={{ fontSize: '13px', color: '#94a3b8' }}>
            Direct comparison showing how the active defense intercepts the multi-stage tool call chain.
          </p>
          <DiffView originalTrace={undefendedTrace} defendedTrace={defendedTrace} />
        </div>
      )}
    </div>
  );
}
