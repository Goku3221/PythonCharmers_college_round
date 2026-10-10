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

      {/* 3. TECHNICAL ARCHITECTURE & METHODOLOGY (4 PILLARS) */}
      <section
        style={{
          padding: '60px 0',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '36px',
        }}
      >
        <div style={{ maxWidth: '820px' }}>
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
              marginBottom: '14px',
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
            AI Red-Team Architecture // 4 Core Pillars
          </div>
          <h2
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 'clamp(28px, 3.4vw, 42px)',
              fontWeight: 400,
              color: '#ffffff',
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
            }}
          >
            How AgentBreak Autonomously Red-Teams
            <br />
            <span style={{ fontStyle: 'italic', color: '#10b981' }}>Agent Runtimes</span>
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '15px', marginTop: '12px', lineHeight: 1.68 }}>
            Traditional security tools test static text strings. Autonomous AI agents have memory, execute multi-turn
            reasoning, and invoke real tools. AgentBreak evaluates the complete execution chain under adaptive pressure.
          </p>
        </div>

        {/* 4 Pillars Grid with Custom SVG Icons */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
          }}
        >
          <div
            className="glass-panel"
            style={{
              padding: '28px',
              borderTop: '3px solid #10b981',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div style={{ width: '24px', height: '24px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2px' }}>
                  {[...Array(9)].map((_, i) => (
                    <div key={i} style={{ background: '#10b981', borderRadius: '1px', opacity: [0, 4, 8].includes(i) ? 1 : 0.4 }} />
                  ))}
                </div>
              </div>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '9999px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                TREE SEARCH
              </span>
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#ffffff' }}>
              1. TAP-TC Search Tree
            </h3>
            <p style={{ fontSize: '13px', color: '#9ca3af', lineHeight: 1.65 }}>
              Adapts Tree-of-Attacks with a <strong style={{ color: '#fff' }}>5-level partial credit ladder</strong> (0.0 to 1.0). Searches across
              multi-step tool chains and prunes unpromising variants autonomously instead of relying on binary success.
            </p>
          </div>

          <div
            className="glass-panel"
            style={{
              padding: '28px',
              borderTop: '3px solid #06b6d4',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(6, 182, 212, 0.1)',
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <circle cx="8" cy="12" r="3" />
                  <circle cx="16" cy="12" r="3" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
              </div>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#06b6d4', background: 'rgba(6, 182, 212, 0.1)', padding: '2px 8px', borderRadius: '9999px', border: '1px solid rgba(6, 182, 212, 0.2)' }}>
                &lt;3s REPLAY
              </span>
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#ffffff' }}>
              2. Deterministic Cassette Replay
            </h3>
            <p style={{ fontSize: '13px', color: '#9ca3af', lineHeight: 1.65 }}>
              Records prompt hashes and raw outputs to replay identical attack sequences in <strong style={{ color: '#fff' }}>&lt;3 seconds</strong> without
              LLM API drift. Essential for regression verification and instant demo reproduction.
            </p>
          </div>

          <div
            className="glass-panel"
            style={{
              padding: '28px',
              borderTop: '3px solid #a3e635',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(163, 230, 53, 0.1)',
                  border: '1px solid rgba(163, 230, 53, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#a3e635" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </div>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#a3e635', background: 'rgba(163, 230, 53, 0.1)', padding: '2px 8px', borderRadius: '9999px', border: '1px solid rgba(163, 230, 53, 0.2)' }}>
                OWASP LLM08
              </span>
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#ffffff' }}>
              3. Privilege & BFLA Auditing
            </h3>
            <p style={{ fontSize: '13px', color: '#9ca3af', lineHeight: 1.65 }}>
              Audits permitted task tools vs called tools. Identifies unauthorized tool invocations (<strong style={{ color: '#fff' }}>Excessive Agency</strong>)
              and exfiltration recipients (OWASP LLM01) before code executes in sandbox environments.
            </p>
          </div>

          <div
            className="glass-panel"
            style={{
              padding: '28px',
              borderTop: '3px solid #f43f5e',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(244, 63, 94, 0.1)',
                  border: '1px solid rgba(244, 63, 94, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#f43f5e', background: 'rgba(244, 63, 94, 0.1)', padding: '2px 8px', borderRadius: '9999px', border: '1px solid rgba(244, 63, 94, 0.2)' }}>
                ADAPTIVE K=5
              </span>
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#ffffff' }}>
              4. Adaptive Defense Validation
            </h3>
            <p style={{ fontSize: '13px', color: '#9ca3af', lineHeight: 1.65 }}>
              Evaluates defenses not just against static past runs (k=5 live trials), but subjects them to
              <strong style={{ color: '#fff' }}> adaptive TAP-TC pressure</strong> to prove whether an adapting attacker can still find a bypass.
            </p>
          </div>
        </div>
      </section>

      {/* 4. TELEMETRY & ATTACK TRACES LIST */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* Executive Stats Bar */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
          }}
        >
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              TOTAL RUNS LOGGED
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
              <span style={{ fontSize: '32px', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                {totalRuns}
              </span>
              <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>Active Store</span>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px', borderLeft: '3px solid #f43f5e' }}>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              CONFIRMED BREACHES
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
              <span style={{ fontSize: '32px', fontWeight: 800, color: '#f43f5e', fontFamily: 'var(--font-mono)' }}>
                {confirmedFindings}
              </span>
              <span style={{ fontSize: '12px', color: '#fb7185' }}>Score 1.0 Exploits</span>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px', borderLeft: '3px solid #10b981' }}>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              BASELINE BLOCK RATE
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
              <span style={{ fontSize: '32px', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                {overallBlockRate}%
              </span>
              <span style={{ fontSize: '12px', color: '#34d399' }}>Static Guard</span>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '20px', borderLeft: '3px solid #06b6d4' }}>
            <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              TARGET RUNTIME
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#06b6d4' }}>
                AgentDojo
              </span>
              <span style={{ fontSize: '12px', color: '#9ca3af' }}>Workspace Suite</span>
            </div>
          </div>
        </div>

        {/* Traces Table Container */}
        <div className="glass-panel" style={{ padding: '28px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '22px',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#ffffff' }}>Attack Execution Telemetry</h2>
              <p style={{ fontSize: '13px', color: '#9ca3af', marginTop: '4px' }}>
                Cryptographically hashed execution traces with full span step trees and reproduction cassettes.
              </p>
            </div>

            {/* Filter Dropdowns */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <select
                id="filter-runmode"
                className="glass-select"
                value={runModeFilter}
                onChange={(e) => setRunModeFilter(e.target.value)}
              >
                <option value="all">All Execution Modes</option>
                <option value="live">Live Execution</option>
                <option value="recorded">Recorded Run</option>
              </select>

              <select
                id="filter-severity"
                className="glass-select"
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
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
            <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>Loading attack traces...</div>
          ) : traces.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af' }}>No attack traces found.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#9ca3af' }}>
                    <th style={{ padding: '12px 10px' }}>Trace ID</th>
                    <th style={{ padding: '12px 10px' }}>Target Agent</th>
                    <th style={{ padding: '12px 10px' }}>Attack Type</th>
                    <th style={{ padding: '12px 10px' }}>Execution Mode</th>
                    <th style={{ padding: '12px 10px' }}>Severity</th>
                    <th style={{ padding: '12px 10px' }}>Outcome</th>
                    <th style={{ padding: '12px 10px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {traces.map((trace) => (
                    <tr
                      key={trace.trace_id}
                      id={`trace-row-${trace.trace_id}`}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <td style={{ padding: '14px 10px', fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
                        {trace.trace_id.slice(0, 16)}...
                      </td>
                      <td style={{ padding: '14px 10px', color: '#f3f4f6', fontWeight: 500 }}>{trace.target_agent_id}</td>
                      <td style={{ padding: '14px 10px', color: '#d1d5db' }}>
                        <span style={{ textTransform: 'capitalize' }}>{trace.attack_type.replace('_', ' ')}</span>
                        {trace.synthetic && <span style={{ marginLeft: '6px' }}><SyntheticBadge /></span>}
                      </td>
                      <td style={{ padding: '14px 10px' }}>
                        <RunModeBadge mode={trace.run_mode} />
                      </td>
                      <td style={{ padding: '14px 10px' }}>
                        <SeverityBadge severity={trace.outcome.severity} />
                      </td>
                      <td style={{ padding: '14px 10px' }}>
                        {trace.outcome.succeeded ? (
                          <span style={{ color: '#f43f5e', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f43f5e', boxShadow: '0 0 6px #f43f5e' }} />
                            Breached (1.0)
                          </span>
                        ) : (
                          <span style={{ color: '#10b981', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                            Blocked ({trace.outcome.partial_score})
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '14px 10px', textAlign: 'right' }}>
                        <Link
                          href={`/traces?id=${trace.trace_id}`}
                          id={`btn-view-${trace.trace_id}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 14px',
                            borderRadius: '8px',
                            background: 'rgba(6, 182, 212, 0.1)',
                            color: '#38bdf8',
                            border: '1px solid rgba(6, 182, 212, 0.3)',
                            fontSize: '12px',
                            fontWeight: 600,
                            textDecoration: 'none',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <span>Inspect</span>
                          <span style={{ fontSize: '11px' }}>→</span>
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
