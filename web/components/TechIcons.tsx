'use client';

import React, { useState } from 'react';

/**
 * 1. Thinking Icon: Matrix of green illuminated square dots with center pulse
 */
export function ThinkingIcon({ size = 28 }: { size?: number }) {
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '2px',
        padding: '2px',
      }}
    >
      {[...Array(16)].map((_, i) => {
        const isCenter = [5, 6, 9, 10].includes(i);
        const isCorner = [0, 3, 12, 15].includes(i);
        const opacity = isCenter ? 1 : isCorner ? 0.35 : 0.75;
        const delay = (i % 4) * 0.15;
        return (
          <div
            key={i}
            style={{
              backgroundColor: '#10b981',
              borderRadius: '1px',
              opacity,
              boxShadow: isCenter ? '0 0 6px #10b981' : 'none',
              animation: 'pulse-ring 2s infinite ease-in-out',
              animationDelay: `${delay}s`,
            }}
          />
        );
      })}
    </div>
  );
}

/**
 * 2. Reading Docs Icon: Red/Orange triangular constellation of interconnected nodes
 */
export function ReadingDocsIcon({ size = 28 }: { size?: number }) {
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
        {/* Background matrix dots */}
        <circle cx="8" cy="8" r="1" fill="rgba(239, 68, 68, 0.2)" />
        <circle cx="16" cy="8" r="1" fill="rgba(239, 68, 68, 0.2)" />
        <circle cx="24" cy="8" r="1" fill="rgba(239, 68, 68, 0.2)" />
        <circle cx="8" cy="16" r="1" fill="rgba(239, 68, 68, 0.2)" />
        <circle cx="24" cy="16" r="1" fill="rgba(239, 68, 68, 0.2)" />
        <circle cx="8" cy="24" r="1" fill="rgba(239, 68, 68, 0.2)" />
        <circle cx="16" cy="24" r="1" fill="rgba(239, 68, 68, 0.2)" />
        <circle cx="24" cy="24" r="1" fill="rgba(239, 68, 68, 0.2)" />

        {/* Triangle connecting lines */}
        <polygon
          points="16,6 26,24 6,24"
          stroke="#ef4444"
          strokeWidth="1.5"
          fill="rgba(239, 68, 68, 0.08)"
          strokeDasharray="28"
          strokeDashoffset="0"
          style={{
            filter: 'drop-shadow(0 0 4px rgba(239, 68, 68, 0.6))',
          }}
        />

        {/* Vertices */}
        <circle cx="16" cy="6" r="2.5" fill="#ef4444" style={{ filter: 'drop-shadow(0 0 6px #ef4444)' }} />
        <circle cx="26" cy="24" r="2.5" fill="#ef4444" style={{ filter: 'drop-shadow(0 0 6px #ef4444)' }} />
        <circle cx="6" cy="24" r="2.5" fill="#ef4444" style={{ filter: 'drop-shadow(0 0 6px #ef4444)' }} />
      </svg>
    </div>
  );
}

/**
 * 3. Analysing Icon: Circular radar sweep ring of glitchy cyan dots
 */
export function AnalysingIcon({ size = 28 }: { size?: number }) {
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        style={{
          animation: 'radar-sweep 4s linear infinite',
        }}
      >
        <circle cx="16" cy="16" r="12" stroke="rgba(0, 242, 254, 0.2)" strokeWidth="1" strokeDasharray="2 3" />
        <circle cx="16" cy="4" r="1.8" fill="#00f2fe" style={{ filter: 'drop-shadow(0 0 5px #00f2fe)' }} />
        <circle cx="24" cy="8" r="1.4" fill="#00f2fe" opacity="0.8" />
        <circle cx="28" cy="16" r="1.8" fill="#00f2fe" opacity="0.6" />
        <circle cx="24" cy="24" r="1.2" fill="#00f2fe" opacity="0.4" />
        <circle cx="16" cy="28" r="1.6" fill="#00f2fe" opacity="0.3" />
        <circle cx="8" cy="24" r="1.4" fill="#00f2fe" opacity="0.5" />
        <circle cx="4" cy="16" r="1.8" fill="#00f2fe" opacity="0.7" />
        <circle cx="8" cy="8" r="1.4" fill="#00f2fe" opacity="0.9" />
      </svg>
    </div>
  );
}

/**
 * 4. Debugging Icon: Isometric blue illuminated matrix blocks
 */
export function DebuggingIcon({ size = 28 }: { size?: number }) {
  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size}px`,
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '2px',
        padding: '2px',
        transform: 'rotate(-10deg) skewX(-10deg)',
      }}
    >
      {[...Array(16)].map((_, i) => {
        const col = i % 4;
        const row = Math.floor(i / 4);
        const isLit = col + row >= 2;
        const opacity = isLit ? 0.9 : 0.25;
        return (
          <div
            key={i}
            style={{
              backgroundColor: '#38bdf8',
              borderRadius: '2px',
              opacity,
              boxShadow: isLit ? '0 0 6px #38bdf8' : 'none',
              animation: 'pulse-ring 2.5s infinite ease-in-out',
              animationDelay: `${(col + row) * 0.2}s`,
            }}
          />
        );
      })}
    </div>
  );
}

/**
 * StatusChip: Replicating the exact pills from references/icons.png
 */
export function StatusChip({
  type,
  text,
  onClick,
}: {
  type: 'thinking' | 'reading' | 'analysing' | 'debugging';
  text: string;
  onClick?: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  const getIcon = () => {
    switch (type) {
      case 'thinking':
        return <ThinkingIcon size={26} />;
      case 'reading':
        return <ReadingDocsIcon size={26} />;
      case 'analysing':
        return <AnalysingIcon size={26} />;
      case 'debugging':
        return <DebuggingIcon size={26} />;
    }
  };

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '14px',
        padding: '12px 24px',
        borderRadius: '16px',
        backgroundColor: '#0a0c10',
        border: `1px solid ${hovered ? 'rgba(255, 107, 0, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
        boxShadow: hovered ? '0 0 20px rgba(255, 107, 0, 0.15)' : '0 4px 16px rgba(0, 0, 0, 0.5)',
        cursor: 'pointer',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        transform: hovered ? 'translateY(-2px)' : 'none',
        userSelect: 'none',
      }}
    >
      <div>{getIcon()}</div>
      <span
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '17px',
          fontWeight: 600,
          color: '#ffffff',
          letterSpacing: '-0.01em',
        }}
      >
        {text}
      </span>
    </div>
  );
}
