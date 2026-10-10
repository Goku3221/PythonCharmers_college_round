'use client';

import React, { useState } from 'react';
import { TraceStep } from '../../contracts/ts/types';

export function SpanTree({ steps }: { steps: TraceStep[] }) {
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>(() => {
    // Expand flagged steps and tool calls by default
    const initial: Record<number, boolean> = {};
    steps.forEach((s) => {
      initial[s.step_index] = s.is_flagged || s.step_type === 'tool_call';
    });
    return initial;
  });

  const toggleStep = (idx: number) => {
    setExpandedSteps((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const getStepColor = (type: string, isFlagged: boolean) => {
    if (isFlagged) return { bg: 'rgba(244, 63, 94, 0.1)', border: '#f43f5e', text: '#fb7185' };
    switch (type) {
      case 'tool_call':
        return { bg: 'rgba(56, 189, 248, 0.08)', border: '#38bdf8', text: '#38bdf8' };
      case 'tool_response':
        return { bg: 'rgba(168, 85, 247, 0.08)', border: '#a855f7', text: '#c084fc' };
      case 'reasoning':
        return { bg: 'rgba(234, 179, 8, 0.08)', border: '#eab308', text: '#fde047' };
      default:
        return { bg: 'rgba(148, 163, 184, 0.08)', border: '#64748b', text: '#94a3b8' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {steps.map((step) => {
        const isExpanded = expandedSteps[step.step_index];
        const colors = getStepColor(step.step_type, step.is_flagged);
        const scorePercentage = (step.partial_score || 0) * 100;

        return (
          <div
            key={step.step_index}
            id={`span-step-${step.step_index}`}
            style={{
              borderRadius: '8px',
              border: `1px solid ${step.is_flagged ? 'rgba(244, 63, 94, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
              backgroundColor: colors.bg,
              overflow: 'hidden',
              boxShadow: step.is_flagged ? '0 0 12px rgba(244, 63, 94, 0.15)' : 'none',
            }}
          >
            {/* Step Header */}
            <div
              onClick={() => toggleStep(step.step_index)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                cursor: 'pointer',
                userSelect: 'none',
                backgroundColor: 'rgba(0, 0, 0, 0.15)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    color: '#64748b',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  }}
                >
                  #{step.step_index}
                </span>

                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: colors.text,
                    border: `1px solid ${colors.border}`,
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}
                >
                  {step.step_type}
                </span>

                {step.tool_name && (
                  <span
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '12.5px',
                      color: '#06b6d4',
                      fontWeight: 600,
                      background: 'rgba(6, 182, 212, 0.1)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      border: '1px solid rgba(6, 182, 212, 0.25)',
                    }}
                  >
                    {step.tool_name}()
                  </span>
                )}

                {step.is_flagged && (
                  <span
                    style={{
                      fontSize: '11px',
                      padding: '2px 10px',
                      borderRadius: '9999px',
                      backgroundColor: 'rgba(244, 63, 94, 0.2)',
                      color: '#fb7185',
                      fontWeight: 700,
                      border: '1px solid rgba(244, 63, 94, 0.4)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}
                  >
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#f43f5e', boxShadow: '0 0 6px #f43f5e' }} />
                    VIOLATION DETECTED
                  </span>
                )}
              </div>

              {/* Progress & Toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                {step.partial_score !== null && step.partial_score !== undefined && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#9ca3af' }}>Ladder:</span>
                    <div style={{ width: '48px', height: '6px', borderRadius: '3px', background: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${scorePercentage}%`,
                          height: '100%',
                          background: scorePercentage === 100 ? '#f43f5e' : 'linear-gradient(90deg, #06b6d4, #10b981)',
                        }}
                      />
                    </div>
                    <span
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        color: scorePercentage === 100 ? '#f43f5e' : '#38bdf8',
                        fontWeight: 700,
                      }}
                    >
                      {step.partial_score.toFixed(2)}
                    </span>
                  </div>
                )}
                <span style={{ fontSize: '12px', color: '#64748b' }}>{isExpanded ? '▲' : '▼'}</span>
              </div>
            </div>

            {/* Step Body */}
            {isExpanded && (
              <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
                {step.flag_reason && (
                  <div
                    style={{
                      padding: '8px 12px',
                      marginBottom: '10px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(244, 63, 94, 0.15)',
                      color: '#fda4af',
                      fontSize: '12px',
                      fontWeight: 500,
                      borderLeft: '3px solid #f43f5e',
                    }}
                  >
                    Reason: {step.flag_reason}
                  </div>
                )}

                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    color: '#e2e8f0',
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {step.content}
                </div>

                {/* Tool args or responses */}
                {step.tool_args && (
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                      Arguments:
                    </div>
                    <pre
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        padding: '8px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        color: '#38bdf8',
                        overflowX: 'auto',
                      }}
                    >
                      {JSON.stringify(step.tool_args, null, 2)}
                    </pre>
                  </div>
                )}

                {step.tool_response && (
                  <div style={{ marginTop: '10px' }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px', fontWeight: 600 }}>
                      Tool Response:
                    </div>
                    <pre
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: '11px',
                        padding: '8px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(0, 0, 0, 0.3)',
                        color: '#c084fc',
                        overflowX: 'auto',
                      }}
                    >
                      {JSON.stringify(step.tool_response, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
