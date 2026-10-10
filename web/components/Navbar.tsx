'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function CyvanceDeltaLogo({ size = 26, color = '#ffffff' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Geometric stylized delta logo matching references/hero.png */}
      <path
        d="M16 4.5L5.5 24.5H26.5L16 4.5Z"
        stroke={color}
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M16 11.5L10.5 22H21.5L16 11.5Z"
        fill={color}
        fillOpacity="0.9"
      />
      <circle cx="16" cy="18.5" r="2.2" fill="#08090a" />
    </svg>
  );
}

export function Navbar() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Overview', href: '/' },
    { label: 'Attack Traces', href: '/traces' },
    { label: 'Vulnerability Findings', href: '/findings' },
    { label: 'Defense Scorecard', href: '/defenses' },
    { label: 'Adaptive Loop Monitor', href: '/loop-monitor' },
  ];

  return (
    <div
      style={{
        position: 'sticky',
        top: '16px',
        zIndex: 50,
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        padding: '0 16px',
        pointerEvents: 'none',
      }}
    >
      <header
        style={{
          pointerEvents: 'auto',
          width: '100%',
          maxWidth: '1240px',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          borderRadius: '9999px',
          backgroundColor: 'rgba(12, 14, 18, 0.82)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Left: Brand with Stylized Delta Logo */}
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
          }}
        >
          <CyvanceDeltaLogo size={24} color="#ffffff" />
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 800,
                fontSize: '17px',
                letterSpacing: '-0.02em',
                color: '#ffffff',
              }}
            >
              Agent<span style={{ color: '#10b981' }}>Break</span>
            </span>
            <span
              style={{
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                color: '#ff8522',
                fontWeight: 700,
                letterSpacing: '0.04em',
                padding: '1px 5px',
                borderRadius: '4px',
                backgroundColor: 'rgba(255, 107, 0, 0.12)',
                border: '1px solid rgba(255, 107, 0, 0.25)',
              }}
            >
              RED TEAM
            </span>
          </div>
        </Link>

        {/* Center: ALL Original App Navigation Links */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
          className="hidden md:flex"
        >
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                id={`nav-link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                style={{
                  padding: '7px 14px',
                  borderRadius: '9999px',
                  fontSize: '13px',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#ffffff' : '#9ca3af',
                  backgroundColor: isActive ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                  border: `1px solid ${isActive ? 'rgba(16, 185, 129, 0.4)' : 'transparent'}`,
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Live Model Status Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              fontSize: '12px',
              fontFamily: 'var(--font-mono)',
              color: '#d1d5db',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                boxShadow: '0 0 8px #10b981',
              }}
            />
            <span>Gemini 2.5 Flash</span>
          </div>
        </div>
      </header>
    </div>
  );
}
