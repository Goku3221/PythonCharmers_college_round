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
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 12px',
            borderRadius: '9999px',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            color: '#34d399',
            fontSize: '11px',
            fontWeight: 700,
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            marginBottom: '10px',
          }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
          DEFENSE BENCHMARK MATRIX // EMPIRICAL K=5 & ADAPTIVE STRESS
        </div>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(26px, 3vw, 36px)',
            fontWeight: 400,
            color: '#ffffff',
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
          }}
        >
          Defense Validation
          <br />
          <span style={{ fontStyle: 'italic', color: '#10b981' }}>Adaptive Resilience Scorecard</span>
        </h1>
        <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '8px' }}>
          Validating runtime defenses against static historical replays (k=5 live trials) and dynamic adaptive adversarial search (TAP-TC).
        </p>
      </div>

      {/* Action Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
          borderTop: '3px solid #10b981',
        }}
      >
        <div style={{ maxWidth: '600px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>Run Live Defense Evaluation</h3>
          <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px', lineHeight: 1.5 }}>
            Applies defense filter, executes k=5 live stochastic trials, runs benign regression suite, and measures true bypass rate.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <select
            id="select-eval-defense"
            className="glass-select"
            value={selectedDefenseId}
            onChange={(e) => setSelectedDefenseId(e.target.value)}
            style={{ minWidth: '220px' }}
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
            className="btn-cyber-primary"
          >
            <span>{evaluatingDefense ? 'Evaluating Live Suite (k=5)...' : 'Evaluate Defense (k=5 Live)'}</span>
            <span style={{ fontSize: '12px' }}>✦</span>
          </button>
        </div>
      </div>

      {/* Scorecard Table */}
      <div className="glass-panel" style={{ padding: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '19px', fontWeight: 700, color: '#ffffff' }}>
              Defense Evaluation Scorecard
            </h2>
            <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '2px' }}>
              Static block rate vs benign utility preservation vs adaptive bypass under tree-search.
            </p>
          </div>
          <span
            style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              color: '#10b981',
              background: 'rgba(16, 185, 129, 0.1)',
              padding: '3px 10px',
              borderRadius: '9999px',
              border: '1px solid rgba(16, 185, 129, 0.25)',
            }}
          >
            K=5 Live Trials
          </span>
        </div>

        {loading ? (
          <div style={{ color: '#9ca3af', padding: '30px', textAlign: 'center' }}>Loading evaluations...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#9ca3af' }}>
                  <th style={{ padding: '12px 10px' }}>Defense Name</th>
                  <th style={{ padding: '12px 10px' }}>Defense Type</th>
                  <th style={{ padding: '12px 10px' }}>Static Block Rate (k=5)</th>
                  <th style={{ padding: '12px 10px' }}>Benign Utility (&gt;=95%)</th>
                  <th style={{ padding: '12px 10px' }}>Adaptive Stress Result (Headline)</th>
                  <th style={{ padding: '12px 10px' }}>Verdict</th>
                </tr>
              </thead>
              <tbody>
                {evalResults.map((res) => (
                  <tr
                    key={res.eval_id}
                    id={`defense-row-${res.defense_id}`}
                    style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}
                  >
                    <td style={{ padding: '16px 10px', fontWeight: 600, color: '#ffffff' }}>
                      {res.defense_id === 'prompt_guardrail'
                        ? 'Prompt Guardrail'
                        : res.defense_id === 'allowlist'
                        ? 'Strict Allowlist (oracle-assisted)'
                        : 'Output Scanner'}
                    </td>
                    <td style={{ padding: '16px 10px', color: '#9ca3af' }}>{res.defense_type}</td>
                    <td style={{ padding: '16px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '60px', height: '6px', borderRadius: '3px', background: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${(res.block_rate * 100).toFixed(0)}%`,
                              height: '100%',
                              background: res.block_rate >= 0.9 ? '#10b981' : '#f59e0b',
                            }}
                          />
                        </div>
                        <span
                          style={{
                            fontWeight: 700,
                            color: res.block_rate >= 0.9 ? '#34d399' : '#f59e0b',
                            fontFamily: 'var(--font-mono)',
                          }}
                        >
                          {(res.block_rate * 100).toFixed(0)}%
                        </span>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          ({res.attacks_blocked}/{res.attacks_blocked + res.attacks_succeeded})
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '60px', height: '6px', borderRadius: '3px', background: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${(res.benign_task_utility * 100).toFixed(0)}%`,
                              height: '100%',
                              background: res.benign_task_utility >= 0.95 ? '#06b6d4' : '#f43f5e',
                            }}
                          />
                        </div>
                        <span style={{ fontWeight: 600, color: res.benign_task_utility >= 0.95 ? '#38bdf8' : '#f43f5e', fontFamily: 'var(--font-mono)' }}>
                          {(res.benign_task_utility * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 10px' }}>
                      <AdaptiveVerdictBadge verdict={res.adaptive_verdict} />
                    </td>
                    <td style={{ padding: '16px 10px' }}>
                      <span
                        style={{
                          padding: '4px 10px',
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
                          border: `1px solid ${
                            res.verdict === 'effective'
                              ? 'rgba(16, 185, 129, 0.3)'
                              : res.verdict === 'partial'
                              ? 'rgba(234, 179, 8, 0.3)'
                              : 'rgba(244, 63, 94, 0.3)'
                          }`,
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <h2 style={{ fontSize: '19px', fontWeight: 700, color: '#ffffff' }}>
              Side-by-Side Execution Diff: Attack vs. Defended Replay
            </h2>
            <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '2px' }}>
              Direct comparison showing how the active defense intercepts the multi-stage tool call chain.
            </p>
          </div>
          <DiffView originalTrace={undefendedTrace} defendedTrace={defendedTrace} />
        </div>
      )}
    </div>
  );
}
