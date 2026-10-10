'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { AttackTrace } from '../../contracts/ts/types';
import { fetchTraces } from '../lib/api';
import { RunModeBadge, SeverityBadge, SyntheticBadge } from '../components/Badges';
import { HeroSection } from '../components/HeroSection';
import { CubeLayerStack } from '../components/CubeLayerStack';

export default function OverviewPage() {
  const [traces, setTraces] = useState<AttackTrace[]>([]);
  const [loading, setLoading] = useState(true);
  const [runModeFilter, setRunModeFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');

  useEffect(() => {
    loadTraces();
  }, [runModeFilter, severityFilter]);

  const loadTraces = async () => {
    setLoading(true);
    const data = await fetchTraces({
      run_mode: runModeFilter,
      severity: severityFilter,
    });
    setTraces(data);
    setLoading(false);
  };

  const totalRuns = traces.length;
  const confirmedFindings = traces.filter((t) => t.outcome.succeeded).length;
  const criticalCount = traces.filter((t) => t.outcome.severity === 'critical').length;
  const blockedCount = traces.filter((t) => !t.outcome.succeeded).length;
  const overallBlockRate = totalRuns > 0 ? ((blockedCount / totalRuns) * 100).toFixed(0) : '0';

  const scrollToStack = () => {
    const el = document.getElementById('agent-runtime-stack-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
      {/* 1. HERO SECTION WITH 3D PERSPECTIVE GRID & STATUS CHIPS (references/hero.png) */}
      <HeroSection onScrollToStack={scrollToStack} />

      {/* 2. CUBE LAYERED RUNTIME STACK (references/layer_idea.png) */}
      <CubeLayerStack />

      {/* 3. TECHNICAL EXPLAINER: HOW AGENTBREAK OPERATES */}
      <section
        style={{
          padding: '60px 0',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '32px',
        }}
      >
        <div style={{ maxWidth: '780px' }}>
          <div
            style={{
              color: '#ff6b00',
              fontSize: '11px',
              fontWeight: 800,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '8px',
            }}
          >
            TECHNICAL ARCHITECTURE & METHODOLOGY
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
            How AgentBreak Autonomously Red-Teams Agent Runtimes
          </h2>
          <p style={{ color: '#a1a1aa', fontSize: '15px', marginTop: '10px', lineHeight: 1.6 }}>
            Traditional security tools test static text strings. Autonomous AI agents have memory, execute multi-turn
            reasoning, and invoke real tools. AgentBreak tests the entire multi-stage chain.
          </p>
        </div>

        {/* 4 Pillars Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
          }}
        >
          <div
            className="glass-slab"
            style={{
              padding: '28px',
              borderTop: '3px solid #ff6b00',
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '12px' }}>🌳</div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
              1. TAP-TC Search Tree
            </h3>
            <p style={{ fontSize: '13px', color: '#a1a1aa', lineHeight: 1.6 }}>
              Adapts Tree-of-Attacks with a <strong>5-level partial credit ladder</strong> (0.0 to 1.0). Searches across
              multi-step tool chains and prunes unpromising variants autonomously instead of relying on binary success.
            </p>
          </div>

          <div
            className="glass-slab"
            style={{
              padding: '28px',
              borderTop: '3px solid #10b981',
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '12px' }}>📼</div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
              2. Deterministic Cassette Replay
            </h3>
            <p style={{ fontSize: '13px', color: '#a1a1aa', lineHeight: 1.6 }}>
              Records prompt hashes and raw outputs to replay identical attack sequences in <strong>&lt;3 seconds</strong> without
              LLM API drift. Essential for regression verification and instant demo reproduction.
            </p>
          </div>

          <div
            className="glass-slab"
            style={{
              padding: '28px',
              borderTop: '3px solid #00f2fe',
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '12px' }}>🔍</div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
              3. Privilege & BFLA Auditing
            </h3>
            <p style={{ fontSize: '13px', color: '#a1a1aa', lineHeight: 1.6 }}>
              Audits permitted task tools vs called tools. Identifies unauthorized tool invocations (OWASP LLM08 - Excessive
              Agency) and exfiltration recipients (OWASP LLM01) before code executes.
            </p>
          </div>

          <div
            className="glass-slab"
            style={{
              padding: '28px',
              borderTop: '3px solid #ef4444',
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '12px' }}>🛡️</div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
              4. Adaptive Defense Validation
            </h3>
            <p style={{ fontSize: '13px', color: '#a1a1aa', lineHeight: 1.6 }}>
              Evaluates defenses not just against static past runs (k=5 live trials), but subjects them to
              <strong> adaptive TAP-TC pressure</strong> to prove whether an adapting attacker can still find a bypass.
            </p>
          </div>
        </div>
      </section>

      {/* 4. TELEMETRY & ATTACK TRACES LIST */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#ffffff' }}>Attack Execution Telemetry</h2>
            <p style={{ fontSize: '13px', color: '#a1a1aa', marginTop: '4px' }}>
              Persistent execution traces with full span step trees and reproduction cassettes.
            </p>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <div
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <span style={{ fontSize: '11px', color: '#71717a' }}>TOTAL RUNS: </span>
              <span style={{ color: '#ff6b00', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{totalRuns}</span>
            </div>
            <div
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <span style={{ fontSize: '11px', color: '#71717a' }}>BREACHED: </span>
              <span style={{ color: '#ef4444', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{confirmedFindings}</span>
            </div>
            <div
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <span style={{ fontSize: '11px', color: '#71717a' }}>BLOCK RATE: </span>
              <span style={{ color: '#10b981', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{overallBlockRate}%</span>
            </div>
          </div>
        </div>

        {/* Traces Table */}
        <div className="glass-slab" style={{ padding: '24px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', gap: '12px' }}>
              <select
                id="filter-runmode"
                value={runModeFilter}
                onChange={(e) => setRunModeFilter(e.target.value)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#fff',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
              >
                <option value="all">All Execution Modes</option>
                <option value="live">Live Execution</option>
                <option value="recorded">Recorded Run</option>
              </select>

              <select
                id="filter-severity"
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#fff',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                }}
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>Loading attack traces...</div>
          ) : traces.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No attack traces found.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#71717a' }}>
                    <th style={{ padding: '12px 8px' }}>Trace ID</th>
                    <th style={{ padding: '12px 8px' }}>Target Agent</th>
                    <th style={{ padding: '12px 8px' }}>Attack Type</th>
                    <th style={{ padding: '12px 8px' }}>Execution Mode</th>
                    <th style={{ padding: '12px 8px' }}>Severity</th>
                    <th style={{ padding: '12px 8px' }}>Outcome</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {traces.map((trace) => (
                    <tr
                      key={trace.trace_id}
                      id={`trace-row-${trace.trace_id}`}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <td style={{ padding: '12px 8px', fontFamily: 'var(--font-mono)', color: '#ff8522' }}>
                        {trace.trace_id.slice(0, 16)}...
                      </td>
                      <td style={{ padding: '12px 8px', color: '#e4e4e7' }}>{trace.target_agent_id}</td>
                      <td style={{ padding: '12px 8px', color: '#cbd5e1' }}>
                        <span style={{ textTransform: 'capitalize' }}>{trace.attack_type.replace('_', ' ')}</span>
                        {trace.synthetic && <span style={{ marginLeft: '6px' }}><SyntheticBadge /></span>}
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <RunModeBadge mode={trace.run_mode} />
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        <SeverityBadge severity={trace.outcome.severity} />
                      </td>
                      <td style={{ padding: '12px 8px' }}>
                        {trace.outcome.succeeded ? (
                          <span style={{ color: '#ef4444', fontWeight: 700 }}>Breached (Score 1.0)</span>
                        ) : (
                          <span style={{ color: '#10b981', fontWeight: 700 }}>Blocked ({trace.outcome.partial_score})</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                        <Link
                          href={`/traces?id=${trace.trace_id}`}
                          id={`btn-view-${trace.trace_id}`}
                          style={{
                            padding: '6px 14px',
                            borderRadius: '6px',
                            background: 'rgba(255, 107, 0, 0.12)',
                            color: '#ff8522',
                            border: '1px solid rgba(255, 107, 0, 0.35)',
                            fontSize: '12px',
                            fontWeight: 700,
                          }}
                        >
                          Inspect Trace
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
