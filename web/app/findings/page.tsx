'use client';

import React, { useEffect, useState } from 'react';
import { VulnerabilityFinding } from '../../../contracts/ts/types';
import { fetchFindings } from '../../lib/api';
import { SeverityBadge } from '../../components/Badges';

export default function FindingsPage() {
  const [findings, setFindings] = useState<VulnerabilityFinding[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('all');
  const [owaspFilter, setOwaspFilter] = useState('all');

  useEffect(() => {
    load();
  }, [severityFilter, owaspFilter]);

  const load = async () => {
    setLoading(true);
    const data = await fetchFindings({
      severity: severityFilter,
      owasp_category: owaspFilter,
    });
    setFindings(data);
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Header */}
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
              background: 'rgba(244, 63, 94, 0.08)',
              border: '1px solid rgba(244, 63, 94, 0.25)',
              color: '#fb7185',
              fontSize: '11px',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              marginBottom: '10px',
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#f43f5e', boxShadow: '0 0 8px #f43f5e' }} />
            OWASP TOP 10 AUDIT // RISK MATRIX
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
            Vulnerability Findings
            <br />
            <span style={{ fontStyle: 'italic', color: '#f43f5e' }}>OWASP LLM Security Audit</span>
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '14px', marginTop: '8px' }}>
            Confirmed attack vectors mapped to the OWASP Top 10 for LLMs with full reproduction steps and affected runtime tools.
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <select
            id="filter-findings-severity"
            className="glass-select"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical Only</option>
            <option value="high">High Only</option>
            <option value="medium">Medium Only</option>
          </select>

          <select
            id="filter-findings-owasp"
            className="glass-select"
            value={owaspFilter}
            onChange={(e) => setOwaspFilter(e.target.value)}
          >
            <option value="all">All OWASP Categories</option>
            <option value="LLM01">LLM01 - Prompt Injection</option>
            <option value="LLM06">LLM06 - Sensitive Info Disclosure</option>
            <option value="LLM08">LLM08 - Excessive Agency</option>
          </select>
        </div>
      </div>

      {/* KPI Overview Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        <div className="glass-panel" style={{ padding: '20px' }}>
          <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            CONFIRMED FINDINGS
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <span style={{ fontSize: '32px', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
              {findings.length}
            </span>
            <span style={{ fontSize: '12px', color: '#f43f5e', fontWeight: 600 }}>Active Risks</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderLeft: '3px solid #f43f5e' }}>
          <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            CRITICAL SEVERITY
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <span style={{ fontSize: '32px', fontWeight: 800, color: '#f43f5e', fontFamily: 'var(--font-mono)' }}>
              {findings.filter((f) => f.severity === 'critical').length}
            </span>
            <span style={{ fontSize: '12px', color: '#fb7185' }}>Immediate Action</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderLeft: '3px solid #f97316' }}>
          <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            HIGH RISK
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <span style={{ fontSize: '32px', fontWeight: 800, color: '#f97316', fontFamily: 'var(--font-mono)' }}>
              {findings.filter((f) => f.severity === 'high').length}
            </span>
            <span style={{ fontSize: '12px', color: '#fdba74' }}>Escalation Vectors</span>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '20px', borderLeft: '3px solid #06b6d4' }}>
          <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            PRIMARY VECTOR
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '6px' }}>
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#06b6d4' }}>
              LLM01 / LLM08
            </span>
            <span style={{ fontSize: '12px', color: '#9ca3af' }}>Tool Hijack</span>
          </div>
        </div>
      </div>

      {/* Findings Grid */}
      {loading ? (
        <div style={{ color: '#9ca3af', padding: '40px', textAlign: 'center' }}>Loading vulnerability findings...</div>
      ) : findings.length === 0 ? (
        <div style={{ color: '#9ca3af', padding: '40px', textAlign: 'center' }}>No vulnerability findings found for current filter.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: '22px' }}>
          {findings.map((f) => (
            <div
              key={f.finding_id}
              id={`finding-card-${f.finding_id}`}
              className="glass-panel"
              style={{
                padding: '26px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                borderLeft: `4px solid ${f.severity === 'critical' ? '#f43f5e' : f.severity === 'high' ? '#f97316' : '#eab308'}`,
                background: 'linear-gradient(180deg, rgba(14, 18, 28, 0.85) 0%, rgba(10, 13, 20, 0.95) 100%)',
              }}
            >
              {/* Badges row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <SeverityBadge severity={f.severity} />
                  <span
                    style={{
                      padding: '3px 10px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: 'rgba(6, 182, 212, 0.1)',
                      color: '#06b6d4',
                      border: '1px solid rgba(6, 182, 212, 0.25)',
                      fontFamily: 'var(--font-mono)',
                    }}
                  >
                    OWASP {f.owasp_category}
                  </span>
                </div>
                <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#64748b' }}>
                  {f.finding_id}
                </span>
              </div>

              {/* Description */}
              <p style={{ fontSize: '14.5px', color: '#f3f4f6', lineHeight: 1.55, fontWeight: 500 }}>
                {f.description}
              </p>

              {/* Affected Tool */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                <span style={{ color: '#9ca3af' }}>Affected Tool:</span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: '#38bdf8',
                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    fontWeight: 600,
                  }}
                >
                  {f.affected_tool}()
                </span>
              </div>

              {/* Reproduction steps */}
              {f.reproduction_steps.length > 0 && (
                <div
                  style={{
                    marginTop: '4px',
                    padding: '14px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(0, 0, 0, 0.45)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <div style={{ fontSize: '11px', color: '#9ca3af', fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
                    REPRODUCTION SEQUENCE:
                  </div>
                  <ol style={{ paddingLeft: '18px', fontSize: '12.5px', color: '#d1d5db', lineHeight: 1.6 }}>
                    {f.reproduction_steps.map((step, idx) => (
                      <li key={idx} style={{ marginBottom: '4px' }}>
                        {step}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
