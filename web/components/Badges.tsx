/**
 * web/components/Badges.tsx
 * Visual status badges with honest fallback labeling.
 */

import React from 'react';
import { RunMode, Severity, Verdict } from '../../contracts/ts/types';

export function RunModeBadge({ mode }: { mode: RunMode | string }) {
  const isLive = mode === 'live';
  return (
    <span
      id={`badge-runmode-${mode}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '3px 8px',
        borderRadius: '9999px',
        fontSize: '11px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        background: isLive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
        color: isLive ? '#34d399' : '#fbbf24',
        border: `1px solid ${isLive ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.4)'}`,
      }}
    >
      <span
        style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          background: isLive ? '#10b981' : '#f59e0b',
          boxShadow: isLive ? '0 0 6px #10b981' : '0 0 6px #f59e0b',
        }}
      />
      {isLive ? 'Live Execution' : 'Recorded Run'}
    </span>
  );
}

export function SyntheticBadge() {
  return (
    <span
      id="badge-synthetic"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '3px 8px',
        borderRadius: '9999px',
        fontSize: '11px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        background: 'rgba(217, 119, 6, 0.15)',
        color: '#f59e0b',
        border: '1px solid rgba(217, 119, 6, 0.3)',
      }}
    >
      Synthetic
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: Severity | string }) {
  const colors: Record<string, { bg: string; color: string; border: string }> = {
    critical: { bg: 'rgba(244, 63, 94, 0.15)', color: '#fb7185', border: 'rgba(244, 63, 94, 0.4)' },
    high: { bg: 'rgba(249, 115, 22, 0.15)', color: '#fb923c', border: 'rgba(249, 115, 22, 0.4)' },
    medium: { bg: 'rgba(234, 179, 8, 0.15)', color: '#facc15', border: 'rgba(234, 179, 8, 0.4)' },
    low: { bg: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: 'rgba(56, 189, 248, 0.4)' },
  };

  const style = colors[severity?.toLowerCase()] || colors.medium;

  return (
    <span
      id={`badge-severity-${severity}`}
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: 700,
        textTransform: 'uppercase',
        background: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
      }}
    >
      {severity}
    </span>
  );
}

export function AdaptiveVerdictBadge({ verdict }: { verdict?: string | null }) {
  if (!verdict || verdict === 'not_tested') {
    return (
      <span
        id="badge-adaptive-not-tested"
        style={{
          padding: '4px 10px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: 600,
          background: 'rgba(100, 116, 139, 0.15)',
          color: '#94a3b8',
          border: '1px solid rgba(100, 116, 139, 0.3)',
        }}
      >
        Not Tested
      </span>
    );
  }

  const isBypassed = verdict.toLowerCase() === 'bypassed';

  return (
    <span
      id={`badge-adaptive-${verdict}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '5px 12px',
        borderRadius: '8px',
        fontSize: '12px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        background: isBypassed ? 'rgba(225, 29, 72, 0.2)' : 'rgba(16, 185, 129, 0.2)',
        color: isBypassed ? '#f43f5e' : '#10b981',
        border: `1px solid ${isBypassed ? '#f43f5e' : '#10b981'}`,
        boxShadow: isBypassed ? '0 0 12px rgba(244, 63, 94, 0.25)' : '0 0 12px rgba(16, 185, 129, 0.25)',
      }}
    >
      <span>{isBypassed ? '⚠️ Bypassed (Attacker Adapted)' : '🛡️ Robust (Defense Held)'}</span>
    </span>
  );
}
