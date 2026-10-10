'use client';

import React from 'react';
import { AttackTrace } from '../../contracts/ts/types';
import { SpanTree } from './SpanTree';

export function DiffView({
  originalTrace,
  defendedTrace,
}: {
  originalTrace: AttackTrace;
  defendedTrace: AttackTrace;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px',
        marginTop: '16px',
      }}
    >
      {/* Original Attack Column */}
      <div
        className="glass-panel"
        style={{
          padding: '20px',
          borderTop: '4px solid #f43f5e',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#f43f5e' }}>
              Original Run (Undefended)
            </h4>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>ID: {originalTrace.trace_id}</div>
          </div>
          <span
            style={{
              padding: '3px 8px',
              borderRadius: '6px',
              backgroundColor: 'rgba(244, 63, 94, 0.2)',
              color: '#fb7185',
              fontSize: '11px',
              fontWeight: 700,
            }}
          >
            ATTACK SUCCEEDED
          </span>
        </div>
        <SpanTree steps={originalTrace.steps} />
      </div>

      {/* Defended Replay Column */}
      <div
        className="glass-panel"
        style={{
          padding: '20px',
          borderTop: '4px solid #10b981',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: '#10b981' }}>
              Defended Run (Active Filter)
            </h4>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>ID: {defendedTrace.trace_id}</div>
          </div>
          <span
            style={{
              padding: '3px 8px',
              borderRadius: '6px',
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              color: '#34d399',
              fontSize: '11px',
              fontWeight: 700,
            }}
          >
            ATTACK BLOCKED
          </span>
        </div>
        <SpanTree steps={defendedTrace.steps} />
      </div>
    </div>
  );
}
