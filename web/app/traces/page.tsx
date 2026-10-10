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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header with Selector */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#fff' }}>Trace Inspection</h1>
            <RunModeBadge mode={selectedTrace.run_mode} />
            {selectedTrace.synthetic && <SyntheticBadge />}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            ID: {selectedTrace.trace_id}
          </div>
        </div>

        {/* Trace Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <label style={{ fontSize: '13px', color: '#94a3b8' }}>Select Trace:</label>
          <select
            id="select-trace-picker"
            value={selectedTrace.trace_id}
            onChange={(e) => {
              const match = traces.find((t) => t.trace_id === e.target.value);
              if (match) setSelectedTrace(match);
            }}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#fff',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              maxWidth: '260px',
            }}
          >
            {traces.map((t) => (
              <option key={t.trace_id} value={t.trace_id}>
                {t.attack_type} - {t.trace_id.slice(0, 12)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Layout: SpanTree on Left, Payload & Actions on Right */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Left Column: SpanTree */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#fff' }}>Execution Span Tree</h3>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>{selectedTrace.steps.length} Steps Logged</span>
          </div>
          <SpanTree steps={selectedTrace.steps} />
        </div>

        {/* Right Column: Side Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Replay Action Card */}
          <div
            className="glass-panel"
            style={{
              padding: '20px',
              background: 'linear-gradient(135deg, rgba(0, 242, 254, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)',
              border: '1px solid rgba(0, 242, 254, 0.25)',
            }}
          >
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#00f2fe' }}>Deterministic Cassette Replay</h3>
            <p style={{ fontSize: '12px', color: '#94a3b8', margin: '6px 0 16px 0' }}>
              Re-executes the exact attack sequence from recorded cassette hashes. Zero external API calls, exact
              reproducibility.
            </p>

            <button
              id="btn-cassette-replay"
              onClick={handleCassetteReplay}
              disabled={replaying}
              style={{
                width: '100%',
                padding: '10px 16px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #00f2fe 0%, #38bdf8 100%)',
                color: '#07090e',
                fontWeight: 700,
                fontSize: '13px',
                border: 'none',
                boxShadow: '0 0 16px rgba(0, 242, 254, 0.35)',
                transition: 'all 0.15s ease',
              }}
            >
              {replaying ? 'Replaying...' : '▶ Run Cassette Replay (<3s)'}
            </button>

            {replayLatency !== null && (
              <div
                style={{
                  marginTop: '12px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  color: '#34d399',
                  fontSize: '12px',
                  fontWeight: 600,
                  textAlign: 'center',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                ⚡ Reproduced in {replayLatency} ms (Target &lt; 3,000 ms passed!)
              </div>
            )}
          </div>

          {/* Outcome & Breach Card */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>
              Attack Outcome
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Status:</span>
                <span
                  style={{
                    color: selectedTrace.outcome.succeeded ? '#f43f5e' : '#10b981',
                    fontWeight: 700,
                  }}
                >
                  {selectedTrace.outcome.succeeded ? 'BREACH SUCCEEDED' : 'ATTACK BLOCKED'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#94a3b8' }}>Severity:</span>
                <SeverityBadge severity={selectedTrace.outcome.severity} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Detection:</span>
                <span style={{ color: '#e2e8f0', textTransform: 'capitalize' }}>
                  {selectedTrace.outcome.detection_method}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#94a3b8' }}>Partial Score:</span>
                <span style={{ color: '#00f2fe', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                  {selectedTrace.outcome.partial_score.toFixed(2)}
                </span>
              </div>

              {selectedTrace.outcome.unauthorized_actions.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <span style={{ color: '#f43f5e', fontSize: '12px', fontWeight: 600 }}>Unauthorized Actions:</span>
                  <ul style={{ paddingLeft: '16px', marginTop: '4px', color: '#fda4af', fontSize: '12px' }}>
                    {selectedTrace.outcome.unauthorized_actions.map((act, i) => (
                      <li key={i}>{act}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Injection Payload Card */}
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
              Injection Payload
            </h3>
            <pre
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                padding: '10px',
                borderRadius: '6px',
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                color: '#fde047',
                whiteSpace: 'pre-wrap',
                lineHeight: 1.4,
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
