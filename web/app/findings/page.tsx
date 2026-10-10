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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#fff' }}>Vulnerability Findings & OWASP Audit</h1>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px' }}>
            Confirmed attack vectors mapped to OWASP Top 10 for LLMs with full reproduction steps.
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <select
            id="filter-findings-severity"
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
          </select>

          <select
            id="filter-findings-owasp"
            value={owaspFilter}
            onChange={(e) => setOwaspFilter(e.target.value)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#fff',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
            }}
          >
            <option value="all">All OWASP Categories</option>
            <option value="LLM01">LLM01 - Prompt Injection</option>
            <option value="LLM06">LLM06 - Sensitive Info Disclosure</option>
            <option value="LLM08">LLM08 - Excessive Agency</option>
          </select>
        </div>
      </div>

      {/* Findings Grid */}
      {loading ? (
        <div style={{ color: '#94a3b8', padding: '40px', textAlign: 'center' }}>Loading vulnerability findings...</div>
      ) : findings.length === 0 ? (
        <div style={{ color: '#94a3b8', padding: '40px', textAlign: 'center' }}>No vulnerability findings found.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
          {findings.map((f) => (
            <div
              key={f.finding_id}
              id={`finding-card-${f.finding_id}`}
              className="glass-panel"
              style={{
                padding: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                borderLeft: `4px solid ${f.severity === 'critical' ? '#f43f5e' : '#f97316'}`,
              }}
            >
              {/* Badges row */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <SeverityBadge severity={f.severity} />
                  <span
                    style={{
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: 'rgba(0, 242, 254, 0.12)',
                      color: '#00f2fe',
                      border: '1px solid rgba(0, 242, 254, 0.25)',
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
              <p style={{ fontSize: '14px', color: '#f1f5f9', lineHeight: 1.5, fontWeight: 500 }}>
                {f.description}
              </p>

              {/* Affected Tool */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                <span style={{ color: '#94a3b8' }}>Affected Tool:</span>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    color: '#38bdf8',
                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                    padding: '2px 6px',
                    borderRadius: '4px',
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
                    padding: '12px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                  }}
                >
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, marginBottom: '6px', textTransform: 'uppercase' }}>
                    Reproduction Steps:
                  </div>
                  <ol style={{ paddingLeft: '18px', fontSize: '12px', color: '#cbd5e1', lineHeight: 1.5 }}>
                    {f.reproduction_steps.map((step, idx) => (
                      <li key={idx} style={{ marginBottom: '3px' }}>
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
