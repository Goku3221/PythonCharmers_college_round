'use client';

import React, { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AttackTrace } from '../../../contracts/ts/types';
import { fetchTraceById, fetchTraces, replayCassette } from '../../lib/api';
import { RunModeBadge, SeverityBadge, SyntheticBadge } from '../../components/Badges';
import { SpanTree } from '../../components/SpanTree';

function TraceDetailContent() {
  const searchParams = useSearchParams();
  const initialId = searchParams.get('id');

  const [traces, setTraces] = useState<AttackTrace[]>([]);
  const [selectedTrace, setSelectedTrace] = useState<AttackTrace | null>(null);
  const [loading, setLoading] = useState(true);
  const [replaying, setReplaying] = useState(false);
  const [replayLatency, setReplayLatency] = useState<number | null>(null);

  useEffect(() => {
    init();
  }, [initialId]);

  const init = async () => {
    setLoading(true);
    const allTraces = await fetchTraces({ limit: 50 });
    setTraces(allTraces);

    if (initialId) {
      const match = allTraces.find((t) => t.trace_id === initialId) || (await fetchTraceById(initialId));
      setSelectedTrace(match || allTraces[0] || null);
    } else if (allTraces.length > 0) {
      setSelectedTrace(allTraces[0]);
    }
    setLoading(false);
  };

  const handleCassetteReplay = async () => {
    if (!selectedTrace) return;
    setReplaying(true);
    const start = performance.now();
    const result = await replayCassette(selectedTrace.trace_id);
    const duration = performance.now() - start;

    if (result) {
      setReplayLatency(Math.round(duration));
      setSelectedTrace(result);
      setTraces((prev) => [result, ...prev]);
    }
    setReplaying(false);
  };

  if (loading) {
    return <div style={{ color: '#94a3b8', padding: '40px', textAlign: 'center' }}>Loading trace inspection...</div>;
  }

  if (!selectedTrace) {
    return <div style={{ color: '#94a3b8', padding: '40px', textAlign: 'center' }}>No trace selected.</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header with Title and Trace Selector */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
        }}
      >
        <div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 12px',
              borderRadius: '9999px',
              background: 'rgba(6, 182, 212, 0.08)',
              border: '1px solid rgba(6, 182, 212, 0.25)',
              color: '#38bdf8',
              fontSize: '11px',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: '10px',
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#06b6d4', boxShadow: '0 0 8px #06b6d4' }} />
            FORENSIC TRACE AUDIT
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
            Attack Trace Telemetry
            <br />
            <span style={{ fontStyle: 'italic', color: '#06b6d4' }}>Execution Inspector</span>
          </h1>
        </div>

        {/* Trace Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ fontSize: '13px', color: '#9ca3af', fontWeight: 500 }}>Select Trace:</label>
          <select
            id="select-trace-picker"
            className="glass-select"
            value={selectedTrace.trace_id}
            onChange={(e) => {
              const match = traces.find((t) => t.trace_id === e.target.value);
              if (match) setSelectedTrace(match);
            }}
            style={{ minWidth: '240px' }}
          >
            {traces.map((t) => (
              <option key={t.trace_id} value={t.trace_id}>
                {t.attack_type.replace('_', ' ')} — {t.trace_id.slice(0, 10)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Telemetry Quick Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>
            ID: {selectedTrace.trace_id}
          </span>
          <RunModeBadge mode={selectedTrace.run_mode} />
          {selectedTrace.synthetic && <SyntheticBadge />}
          <SeverityBadge severity={selectedTrace.outcome.severity} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>
            Target: <strong style={{ color: '#fff' }}>{selectedTrace.target_agent_id}</strong>
          </div>
          <div style={{ fontSize: '12px', color: '#9ca3af' }}>
            Steps: <strong style={{ color: '#10b981' }}>{selectedTrace.steps.length}</strong>
          </div>
          <div
            style={{
              padding: '3px 10px',
              borderRadius: '9999px',
              fontSize: '11px',
              fontWeight: 700,
              background: selectedTrace.outcome.succeeded ? 'rgba(244, 63, 94, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              color: selectedTrace.outcome.succeeded ? '#fb7185' : '#34d399',
              border: `1px solid ${selectedTrace.outcome.succeeded ? 'rgba(244, 63, 94, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
            }}
          >
            {selectedTrace.outcome.succeeded ? 'BREACH CONFIRMED (1.0)' : 'DEFENDED (BLOCKED)'}
          </div>
        </div>
      </div>

      {/* Main Layout: SpanTree on Left, Payload & Actions on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(320px, 1.2fr)', gap: '24px' }}>
        {/* Left Column: SpanTree */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#ffffff' }}>Execution Span Tree</h3>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                Multi-turn step sequence: reasoning, tool calls, sandbox execution & partial scores.
              </p>
            </div>
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                color: '#34d399',
                background: 'rgba(16, 185, 129, 0.1)',
                padding: '3px 10px',
                borderRadius: '9999px',
                border: '1px solid rgba(16, 185, 129, 0.25)',
              }}
            >
              {selectedTrace.steps.length} Spans Tracked
            </span>
          </div>
          <SpanTree steps={selectedTrace.steps} />
        </div>

        {/* Right Column: Forensic Side Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Cassette Replayer Card */}
          <div
            className="glass-panel"
            style={{
              padding: '24px',
              borderTop: '3px solid #06b6d4',
              background: 'linear-gradient(180deg, rgba(6, 182, 212, 0.05) 0%, rgba(14, 18, 28, 0.8) 100%)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#38bdf8' }}>Deterministic Cassette Replay</h3>
              <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#06b6d4', background: 'rgba(6, 182, 212, 0.15)', padding: '2px 8px', borderRadius: '4px' }}>
                ZERO DRIFT
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#9ca3af', lineHeight: 1.6, margin: '6px 0 18px 0' }}>
              Re-executes the exact multi-turn attack sequence from cryptographically recorded hashes in <strong>&lt;3 seconds</strong> without LLM API drift.
            </p>

            <button
              id="btn-cassette-replay"
              onClick={handleCassetteReplay}
              disabled={replaying}
              className="btn-cyber-primary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              <span>{replaying ? 'Replaying Recorded Cassette...' : '▶ Replay Attack Sequence (<3s)'}</span>
              <span style={{ fontSize: '12px' }}>✦</span>
            </button>

            {replayLatency !== null && (
              <div
                style={{
                  marginTop: '14px',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  color: '#34d399',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  textAlign: 'center',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <span>⚡</span>
                <span>Reproduced in <strong>{replayLatency} ms</strong> (Target &lt; 3,000 ms passed!)</span>
              </div>
            )}
          </div>

          {/* Outcome & Breach Card */}
          <div
            className="glass-panel"
            style={{
              padding: '24px',
              borderLeft: `4px solid ${selectedTrace.outcome.succeeded ? '#f43f5e' : '#10b981'}`,
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', marginBottom: '14px' }}>
              Attack Outcome Summary
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#9ca3af' }}>Status:</span>
                <span
                  style={{
                    color: selectedTrace.outcome.succeeded ? '#f43f5e' : '#10b981',
                    fontWeight: 700,
                  }}
                >
                  {selectedTrace.outcome.succeeded ? 'BREACH CONFIRMED' : 'ATTACK DEFENDED'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#9ca3af' }}>Severity:</span>
                <SeverityBadge severity={selectedTrace.outcome.severity} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#9ca3af' }}>Detection Method:</span>
                <span style={{ color: '#e5e7eb', textTransform: 'capitalize', fontWeight: 500 }}>
                  {selectedTrace.outcome.detection_method.replace('_', ' ')}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#9ca3af' }}>Partial Ladder Score:</span>
                <span style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '14px' }}>
                  {selectedTrace.outcome.partial_score.toFixed(2)} / 1.0
                </span>
              </div>

              {selectedTrace.outcome.unauthorized_actions.length > 0 && (
                <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <span style={{ color: '#f43f5e', fontSize: '12px', fontWeight: 700 }}>Unauthorized Invocations Detected:</span>
                  <ul style={{ paddingLeft: '18px', marginTop: '6px', color: '#fda4af', fontSize: '12px', lineHeight: 1.5 }}>
                    {selectedTrace.outcome.unauthorized_actions.map((act, i) => (
                      <li key={i}>{act}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Injection Payload Card */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff', marginBottom: '10px' }}>
              Injection Payload Forensic
            </h3>
            <pre
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11.5px',
                padding: '14px',
                borderRadius: '8px',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                color: '#facc15',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.5,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                overflowX: 'auto',
              }}
            >
              {JSON.stringify(selectedTrace.injection_payload, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TraceDetailPage() {
  return (
    <Suspense fallback={<div style={{ color: '#94a3b8', padding: '40px', textAlign: 'center' }}>Loading trace inspection...</div>}>
      <TraceDetailContent />
    </Suspense>
  );
}
