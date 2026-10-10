'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

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
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '0 24px',
      }}
    >
      <div
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Brand */}
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #ff6b00 0%, #ff8522 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '15px',
              color: '#000000',
              boxShadow: '0 0 20px rgba(255, 107, 0, 0.4)',
            }}
          >
            AB
          </div>
          <div>
            <span style={{ fontWeight: 800, fontSize: '18px', letterSpacing: '-0.02em', color: '#ffffff' }}>
              Agent<span style={{ color: '#ff6b00' }}>Break</span>
            </span>
            <span
              style={{
                marginLeft: '8px',
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(255, 107, 0, 0.12)',
                color: '#ff8522',
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-mono)',
              }}
            >
              RED TEAM
            </span>
          </div>
        </Link>

        {/* Navigation links */}
        <nav style={{ display: 'flex', gap: '6px' }}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                id={`nav-link-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#ffffff' : '#a1a1aa',
                  backgroundColor: isActive ? 'rgba(255, 107, 0, 0.12)' : 'transparent',
                  border: `1px solid ${isActive ? 'rgba(255, 107, 0, 0.35)' : 'transparent'}`,
                  transition: 'all 0.15s ease',
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Operational badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '5px 12px',
            borderRadius: '9999px',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              boxShadow: '0 0 8px #10b981',
            }}
          />
          <span style={{ fontSize: '11px', color: '#d4d4d8', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
            Gemini 2.5 Flash
          </span>
        </div>
      </div>
    </header>
  );
}
