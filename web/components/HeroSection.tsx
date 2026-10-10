'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { StatusChip } from './TechIcons';

export function HeroSection({ onScrollToStack }: { onScrollToStack?: () => void }) {
  const [activeNode, setActiveNode] = useState<string | null>('send_email');

  const nodes = [
    { id: 'email_read', label: 'get_unread_emails()', x: '18%', y: '65%', type: 'source', status: 'clean' },
    { id: 'calendar', label: 'search_calendar()', x: '28%', y: '35%', type: 'tool', status: 'clean' },
    { id: 'core', label: 'AgentBreak Core', x: '50%', y: '50%', type: 'core', status: 'inspecting' },
    { id: 'send_email', label: 'send_email() [Breach Target]', x: '72%', y: '65%', type: 'target', status: 'vulnerable' },
    { id: 'files', label: 'list_files()', x: '70%', y: '32%', type: 'tool', status: 'clean' },
    { id: 'e2b', label: 'E2B code_exec()', x: '42%', y: '80%', type: 'sandbox', status: 'clean' },
  ];

  return (
    <section
      style={{
        position: 'relative',
        minHeight: '88vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '60px 20px 40px 20px',
        overflow: 'hidden',
      }}
    >
      {/* Perspective 3D Grid from hero.png */}
      <div className="perspective-grid" />

      {/* Hero Badge */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: '9999px',
          backgroundColor: 'rgba(255, 107, 0, 0.08)',
          border: '1px solid rgba(255, 107, 0, 0.3)',
          marginBottom: '24px',
          boxShadow: '0 0 20px rgba(255, 107, 0, 0.15)',
        }}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: '#ff6b00',
            boxShadow: '0 0 8px #ff6b00',
          }}
        />
        <span
          style={{
            fontSize: '12px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#ff8522',
            fontFamily: 'var(--font-mono)',
          }}
        >
          AUTONOMOUS AI RED TEAM RUNTIME
        </span>
      </div>

      {/* Heading matching hero.png Editorial Styling */}
      <h1
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 'clamp(42px, 6vw, 76px)',
          fontWeight: 800,
          lineHeight: 1.06,
          letterSpacing: '-0.03em',
          maxWidth: '920px',
          color: '#ffffff',
          textShadow: '0 0 60px rgba(255, 255, 255, 0.15)',
        }}
      >
        Autonomous Security Intelligence for AI Agents
      </h1>

      {/* Subheading */}
      <p
        style={{
          fontSize: 'clamp(16px, 1.8vw, 19px)',
          color: '#a1a1aa',
          maxWidth: '720px',
          margin: '22px 0 36px 0',
          lineHeight: 1.6,
          fontWeight: 400,
        }}
      >
        AgentBreak stress-tests tool-calling agents against multi-stage hijacking, indirect prompt injection, and
        memory poisoning—discovering unmapped attack trees before adversaries exploit them.
      </p>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', zIndex: 10 }}>
        <button
          id="btn-hero-explore-stack"
          onClick={onScrollToStack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            padding: '14px 28px',
            borderRadius: '12px',
            backgroundColor: '#ff6b00',
            color: '#000000',
            fontWeight: 800,
            fontSize: '15px',
            border: 'none',
            boxShadow: '0 0 30px rgba(255, 107, 0, 0.45)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <span>Explore 3D Agent Stack</span>
          <span style={{ fontSize: '18px' }}>↓</span>
        </button>

        <Link
          href="/traces"
          id="btn-hero-inspect-traces"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            padding: '14px 28px',
            borderRadius: '12px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            color: '#ffffff',
            fontWeight: 600,
            fontSize: '15px',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.2s ease',
          }}
        >
          <span>Inspect Live Traces</span>
          <span style={{ fontSize: '16px', color: '#ff6b00' }}>→</span>
        </Link>
      </div>

      {/* Micro-interaction Status Chips from references/icons.png */}
      <div
        style={{
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginTop: '48px',
          zIndex: 10,
        }}
      >
        <StatusChip type="thinking" text="Thinking" />
        <StatusChip type="reading" text="Reading Docs" />
        <StatusChip type="analysing" text="Analysing" />
        <StatusChip type="debugging" text="Debugging" />
      </div>

      {/* 3D Perspective Connected Node Map from references/hero.png */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '1000px',
          height: '320px',
          marginTop: '40px',
          zIndex: 5,
        }}
      >
        {/* SVG circuit traces linking nodes to core */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        >
          <line x1="18%" y1="65%" x2="50%" y2="50%" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1.5" strokeDasharray="4 4" />
          <line x1="28%" y1="35%" x2="50%" y2="50%" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1.5" strokeDasharray="4 4" />
          <line x1="72%" y1="65%" x2="50%" y2="50%" stroke="rgba(239, 68, 68, 0.5)" strokeWidth="2" strokeDasharray="6 3" />
          <line x1="70%" y1="32%" x2="50%" y2="50%" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1.5" strokeDasharray="4 4" />
          <line x1="42%" y1="80%" x2="50%" y2="50%" stroke="rgba(255, 255, 255, 0.12)" strokeWidth="1.5" strokeDasharray="4 4" />
        </svg>

        {/* Nodes */}
        {nodes.map((node) => {
          const isCore = node.type === 'core';
          const isVulnerable = node.status === 'vulnerable';
          const isSelected = activeNode === node.id;

          return (
            <div
              key={node.id}
              onClick={() => setActiveNode(node.id)}
              style={{
                position: 'absolute',
                left: node.x,
                top: node.y,
                transform: 'translate(-50%, -50%)',
                cursor: 'pointer',
                transition: 'all 0.25s ease',
              }}
            >
              <div
                style={{
                  padding: isCore ? '16px 24px' : '10px 16px',
                  borderRadius: isCore ? '16px' : '10px',
                  backgroundColor: isCore
                    ? '#0a0d14'
                    : isVulnerable
                    ? 'rgba(239, 68, 68, 0.15)'
                    : 'rgba(10, 13, 20, 0.85)',
                  border: `1px solid ${
                    isCore
                      ? '#ff6b00'
                      : isVulnerable
                      ? '#ef4444'
                      : isSelected
                      ? '#00f2fe'
                      : 'rgba(255, 255, 255, 0.12)'
                  }`,
                  backdropFilter: 'blur(16px)',
                  boxShadow: isCore
                    ? '0 0 35px rgba(255, 107, 0, 0.45)'
                    : isVulnerable
                    ? '0 0 25px rgba(239, 68, 68, 0.4)'
                    : '0 4px 20px rgba(0, 0, 0, 0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transform: isSelected ? 'scale(1.08)' : 'scale(1)',
                }}
              >
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: isCore ? '#ff6b00' : isVulnerable ? '#ef4444' : '#10b981',
                    boxShadow: `0 0 8px ${isCore ? '#ff6b00' : isVulnerable ? '#ef4444' : '#10b981'}`,
                  }}
                />
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: isCore ? '14px' : '12px',
                    fontWeight: 700,
                    color: isCore ? '#ffffff' : isVulnerable ? '#f87171' : '#e4e4e7',
                  }}
                >
                  {node.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
