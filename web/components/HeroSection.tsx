'use client';

import React, { useState } from 'react';
import { CyvanceDeltaLogo } from './Navbar';

interface Point3D {
  x: number;
  y: number;
  z: number;
}

interface Point2D {
  x: number;
  y: number;
}

// 3D Isometric projection math for the hero floor plane
function projectIso(p: Point3D, center: Point2D, scale: number = 1): Point2D {
  const cos30 = 0.8660254; // cos(30 deg)
  const sin30 = 0.5; // sin(30 deg)

  return {
    x: center.x + (p.x - p.y) * cos30 * scale,
    y: center.y + (p.x + p.y) * sin30 * scale - p.z * scale,
  };
}

// Generate perimeter points for a rounded rectangle in isometric view
function getRoundedRectPerimeter(
  halfW: number,
  halfD: number,
  radius: number,
  pointsPerCorner: number = 6
): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  const corners = [
    { cx: halfW - radius, cy: -halfD + radius, startAngle: -Math.PI / 2, endAngle: 0 },
    { cx: halfW - radius, cy: halfD - radius, startAngle: 0, endAngle: Math.PI / 2 },
    { cx: -halfW + radius, cy: halfD - radius, startAngle: Math.PI / 2, endAngle: Math.PI },
    { cx: -halfW + radius, cy: -halfD + radius, startAngle: Math.PI, endAngle: (3 * Math.PI) / 2 },
  ];

  for (const c of corners) {
    for (let i = 0; i < pointsPerCorner; i++) {
      const angle = c.startAngle + (c.endAngle - c.startAngle) * (i / (pointsPerCorner - 1));
      pts.push({
        x: c.cx + radius * Math.cos(angle),
        y: c.cy + radius * Math.sin(angle),
      });
    }
  }
  return pts;
}

export function HeroSection({ onScrollToStack }: { onScrollToStack?: () => void }) {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // Satellite nodes surrounding central hub matching references/hero.png
  // Local coordinates (x, y) relative to central hub (0, 0)
  const satelliteNodes = [
    { id: 'node-top-left', label: 'Cloud VPC', x: -180, y: -90, status: 'locked' },
    { id: 'node-top-center', label: 'Identity Broker', x: 20, y: -180, status: 'locked' },
    { id: 'node-top-right', label: 'Tool Dispatcher', x: 190, y: -90, status: 'locked' },
    { id: 'node-far-left', label: 'Database Cluster', x: -260, y: 30, status: 'locked' },
    { id: 'node-bottom-left', label: 'Agent Runtime', x: -140, y: 150, status: 'locked' },
    { id: 'node-bottom-center', label: 'API Gateway', x: 20, y: 190, status: 'locked' },
    { id: 'node-bottom-right', label: 'Endpoint Mesh', x: 180, y: 120, status: 'locked' },
  ];

  // SVG canvas geometry covering the entire lower section below the CTA
  const canvasW = 1200;
  const canvasH = 580;
  const center2D: Point2D = { x: canvasW / 2, y: 290 };

  // Central Hub Cube geometry (same 3D cube UI as the cube section)
  const hubSize = 64; // half-width (128px total)
  const hubHeight = 30; // 3D vertical thickness
  const hubRadius = 18; // rounded corners
  const hubZ = 20; // raised elevation

  // Helper to extract a continuous perimeter slice
  const getSlice = (pts: Point2D[], startIdx: number, endIdx: number): Point2D[] => {
    const res: Point2D[] = [];
    const N = pts.length;
    let curr = startIdx;
    while (true) {
      res.push(pts[curr]);
      if (curr === endIdx) break;
      curr = (curr + 1) % N;
    }
    return res;
  };

  // Render a thick 3D rounded cube (used for both central hub and satellite nodes)
  const render3DCube = (
    cx: number,
    cy: number,
    halfW: number,
    halfD: number,
    height: number,
    radius: number,
    baseZ: number,
    isCenter: boolean = false,
    label?: string,
    isHovered: boolean = false
  ) => {
    const topZ = baseZ + height;
    const rawPerimeter = getRoundedRectPerimeter(halfW, halfD, radius, 6);

    const projTop = rawPerimeter.map((p) =>
      projectIso({ x: cx + p.x, y: cy + p.y, z: topZ }, center2D)
    );
    const projBot = rawPerimeter.map((p) =>
      projectIso({ x: cx + p.x, y: cy + p.y, z: baseZ }, center2D)
    );
    const centerTop = projectIso({ x: cx, y: cy, z: topZ }, center2D);

    // Find Left, Front, Right silhouette vertices
    let leftIdx = 0;
    let frontIdx = 0;
    let rightIdx = 0;
    for (let i = 1; i < projTop.length; i++) {
      if (projTop[i].x < projTop[leftIdx].x) leftIdx = i;
      if (projTop[i].y > projTop[frontIdx].y) frontIdx = i;
      if (projTop[i].x > projTop[rightIdx].x) rightIdx = i;
    }

    const N = projTop.length;
    const forwardStepsToFront = (frontIdx - leftIdx + N) % N;
    const forwardStepsToRight = (rightIdx - leftIdx + N) % N;
    const isForward = forwardStepsToFront < forwardStepsToRight;

    let leftWallTop: Point2D[] = [];
    let leftWallBot: Point2D[] = [];
    let rightWallTop: Point2D[] = [];
    let rightWallBot: Point2D[] = [];

    if (isForward) {
      leftWallTop = getSlice(projTop, leftIdx, frontIdx);
      leftWallBot = getSlice(projBot, leftIdx, frontIdx);
      rightWallTop = getSlice(projTop, frontIdx, rightIdx);
      rightWallBot = getSlice(projBot, frontIdx, rightIdx);
    } else {
      leftWallTop = getSlice(projTop, frontIdx, leftIdx).reverse();
      leftWallBot = getSlice(projBot, frontIdx, leftIdx).reverse();
      rightWallTop = getSlice(projTop, rightIdx, frontIdx).reverse();
      rightWallBot = getSlice(projBot, rightIdx, frontIdx).reverse();
    }

    const leftHullD = `
      M ${leftWallTop.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}
      L ${leftWallBot.slice().reverse().map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}
      Z
    `;

    const rightHullD = `
      M ${rightWallTop.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}
      L ${rightWallBot.slice().reverse().map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}
      Z
    `;

    const topPathD = `M ${projTop.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')} Z`;
    const topBevelHighlightD = `
      M ${leftWallTop.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}
      L ${rightWallTop.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')}
    `;

    return (
      <g key={`3dcube-${cx}-${cy}`}>
        {/* Solid 3D Left Wall */}
        <path
          d={leftHullD}
          fill={isCenter ? '#062d22' : '#141824'}
          stroke={isCenter ? '#10b981' : 'rgba(255, 255, 255, 0.16)'}
          strokeWidth="1.2"
        />

        {/* Solid 3D Right Wall */}
        <path
          d={rightHullD}
          fill={isCenter ? '#032018' : '#0d1017'}
          stroke={isCenter ? '#06b6d4' : 'rgba(255, 255, 255, 0.16)'}
          strokeWidth="1.2"
        />

        {/* Upper Bevel Highlight */}
        <path
          d={topBevelHighlightD}
          fill="none"
          stroke={isCenter ? '#34d399' : isHovered ? '#10b981' : 'rgba(255, 255, 255, 0.35)'}
          strokeWidth="1.5"
        />

        {/* Top Rounded Surface */}
        <path
          d={topPathD}
          fill={isCenter ? '#0a0f16' : '#121622'}
          stroke={isCenter ? '#ffffff' : isHovered ? '#10b981' : 'rgba(255, 255, 255, 0.28)'}
          strokeWidth={isCenter ? '1.8' : '1.2'}
          strokeLinejoin="round"
          filter={isCenter ? 'url(#hub-shadow)' : undefined}
        />

        {/* Inside Content */}
        {isCenter ? (
          <g transform={`translate(${centerTop.x - 14}, ${centerTop.y - 14})`}>
            <CyvanceDeltaLogo size={28} color="#ffffff" />
          </g>
        ) : (
          <g>
            {/* White Security Lock Badge */}
            <g transform={`translate(${centerTop.x - 9}, ${centerTop.y - 8})`}>
              <path
                d="M 4 5 V 2.5 C 4 1 5.2 0.2 6.8 0.2 C 8.4 0.2 9.6 1 9.6 2.5 V 5"
                fill="none"
                stroke="#ffffff"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <rect x="1.5" y="5" width="10.5" height="9" rx="1.8" fill="#ffffff" />
              <circle cx="6.8" cy="9.5" r="1" fill="#0e121a" />
            </g>

            {/* Constellation data dots beside lock */}
            <g transform={`translate(${centerTop.x + 4}, ${centerTop.y - 8})`}>
              <circle cx="2" cy="1" r="1" fill="#10b981" />
              <circle cx="5" cy="4" r="1.2" fill="#06b6d4" />
              <circle cx="2" cy="7" r="1" fill="#a3e635" />
            </g>
          </g>
        )}

        {/* Glowing Corner LED Pins */}
        {isCenter ? (
          <g>
            <circle cx={projTop[0].x} cy={projTop[0].y} r="2.5" fill="#10b981" />
            <circle cx={projTop[6].x} cy={projTop[6].y} r="2.5" fill="#06b6d4" />
            <circle cx={projTop[12].x} cy={projTop[12].y} r="2.5" fill="#10b981" />
            <circle cx={projTop[18].x} cy={projTop[18].y} r="2.5" fill="#a3e635" />
          </g>
        ) : (
          <circle cx={projTop[6].x} cy={projTop[6].y} r="1.8" fill="#ff8522" />
        )}
      </g>
    );
  };

  // Orthogonal circuit path (90-degree bends)
  const renderCircuitTrace = (node: { id: string; x: number; y: number }) => {
    const hubScreen = projectIso({ x: 0, y: 0, z: hubZ + 10 }, center2D);
    const nodeScreen = projectIso({ x: node.x, y: node.y, z: 12 }, center2D);
    const cornerIso = { x: node.x, y: 0, z: 0 };
    const cornerScreen = projectIso(cornerIso, center2D);

    const pathD = `M ${hubScreen.x} ${hubScreen.y} L ${cornerScreen.x} ${cornerScreen.y} L ${nodeScreen.x} ${nodeScreen.y}`;

    return (
      <g key={`trace-${node.id}`}>
        <path
          d={pathD}
          fill="none"
          stroke="rgba(255, 255, 255, 0.12)"
          strokeWidth="1.2"
        />
        <path
          d={pathD}
          fill="none"
          stroke="url(#trace-pulse-gradient)"
          strokeWidth="1.6"
          strokeDasharray="10 90"
          className="animate-pulse"
        />
        <circle cx={cornerScreen.x} cy={cornerScreen.y} r="2" fill="rgba(16, 185, 129, 0.7)" />
      </g>
    );
  };

  return (
    <section
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '94vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        paddingTop: '50px',
        overflow: 'hidden',
        backgroundColor: '#08090a',
      }}
    >
      {/* Deep Emerald / Green Radial Background Aura matching hero.png */}
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '1200px',
          height: '700px',
          background:
            'radial-gradient(ellipse at 50% 30%, rgba(16, 185, 129, 0.14) 0%, rgba(6, 78, 59, 0.08) 45%, rgba(8, 9, 10, 0) 75%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Main Content Container */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          maxWidth: '820px',
          margin: '0 auto',
          padding: '0 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* High-Contrast Serif Headline matching references/hero.png */}
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 'clamp(46px, 6.2vw, 76px)',
            fontWeight: 400,
            lineHeight: 1.12,
            letterSpacing: '-0.025em',
            color: '#f9fafb',
            margin: '0 0 18px 0',
          }}
        >
          Unified Security
          <br />
          <span style={{ fontStyle: 'italic', fontWeight: 400, color: '#ffffff' }}>
            Intelligence
          </span>
        </h1>

        {/* Subtitle Paragraph matching exact reference copy */}
        <p
          style={{
            fontSize: 'clamp(14px, 1.5vw, 15.5px)',
            color: '#9ca3af',
            lineHeight: 1.68,
            maxWidth: '650px',
            margin: '0 0 32px 0',
            fontWeight: 400,
          }}
        >
          Cyvance seamlessly integrates every component of your digital ecosystem, linking servers,
          cloud platforms, applications, and endpoints. This innovative approach transforms disjointed
          signals into a cohesive, intelligent defense network, enhancing security posture & ensuring
          that all parts of your system work together effectively.
        </p>

        {/* Single Primary CTA Button (Talk to a specialist removed) */}
        <div>
          <button
            onClick={onScrollToStack}
            id="hero-btn-get-started"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '13px 32px',
              borderRadius: '9999px',
              background: 'linear-gradient(90deg, #06b6d4 0%, #10b981 50%, #a3e635 100%)',
              color: '#052e16',
              fontSize: '14.5px',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 0 30px rgba(45, 212, 191, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.4)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.03)';
              e.currentTarget.style.boxShadow = '0 0 40px rgba(45, 212, 191, 0.65)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 0 30px rgba(45, 212, 191, 0.45)';
            }}
          >
            <span>Get Started Now</span>
            <span style={{ fontSize: '14px', fontWeight: 900 }}>✦</span>
          </button>
        </div>
      </div>

      {/* FULL-BLEED 3D ISOMETRIC GRID & 3D CUBES (covers entire section below CTA till bottom) */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '580px',
          marginTop: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg
          width={canvasW}
          height={canvasH}
          viewBox={`0 0 ${canvasW} ${canvasH}`}
          style={{ width: '100%', height: '100%', overflow: 'visible' }}
        >
          <defs>
            {/* Radiant Mint/Cyan Bloom Glow underneath the central 3D cube hub */}
            <radialGradient id="hub-bloom-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.85" />
              <stop offset="35%" stopColor="#06b6d4" stopOpacity="0.5" />
              <stop offset="70%" stopColor="#059669" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#08090a" stopOpacity="0" />
            </radialGradient>

            {/* Trace pulse gradient */}
            <linearGradient id="trace-pulse-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="50%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#a3e635" />
            </linearGradient>

            {/* Hub Drop Shadow */}
            <filter id="hub-shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="10" stdDeviation="18" floodColor="#10b981" floodOpacity="0.55" />
            </filter>
          </defs>

          {/* Full-Bleed Isometric Ground Floor Grid (covers entire lower viewport) */}
          <g opacity="0.9">
            {[-480, -360, -240, -120, 0, 120, 240, 360, 480].map((step, i) => {
              const start1 = projectIso({ x: step, y: -340, z: 0 }, center2D);
              const end1 = projectIso({ x: step, y: 340, z: 0 }, center2D);
              const start2 = projectIso({ x: -480, y: step * 0.7, z: 0 }, center2D);
              const end2 = projectIso({ x: 480, y: step * 0.7, z: 0 }, center2D);
              return (
                <g key={`iso-grid-${i}`}>
                  <line
                    x1={start1.x}
                    y1={start1.y}
                    x2={end1.x}
                    y2={end1.y}
                    stroke="rgba(255, 255, 255, 0.05)"
                    strokeWidth="0.9"
                  />
                  <line
                    x1={start2.x}
                    y1={start2.y}
                    x2={end2.x}
                    y2={end2.y}
                    stroke="rgba(255, 255, 255, 0.05)"
                    strokeWidth="0.9"
                  />
                </g>
              );
            })}
          </g>

          {/* Central Radial Light Bloom underneath the 3D hub */}
          <ellipse
            cx={projectIso({ x: 0, y: 0, z: 0 }, center2D).x}
            cy={projectIso({ x: 0, y: 0, z: 0 }, center2D).y + 16}
            rx="200"
            ry="115"
            fill="url(#hub-bloom-glow)"
          />

          {/* Orthogonal Circuit Traces (90-degree bends) */}
          {satelliteNodes.map((node) => renderCircuitTrace(node))}

          {/* Connected 3D Satellite Cubes around the perimeter with Radar Pulses */}
          {satelliteNodes.map((node) => {
            const centerScreen = projectIso({ x: node.x, y: node.y, z: 12 }, center2D);
            const isHovered = hoveredNodeId === node.id;
            return (
              <g
                key={`sat-group-${node.id}`}
                id={`sat-node-${node.id}`}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
              >
                {/* Active radar beacon pulse around satellite 3D cube */}
                <circle
                  cx={centerScreen.x}
                  cy={centerScreen.y}
                  r="30"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="1.2"
                  opacity="0.55"
                  className="animate-ping"
                />
                <circle
                  cx={centerScreen.x}
                  cy={centerScreen.y}
                  r="20"
                  fill="none"
                  stroke="rgba(16, 185, 129, 0.35)"
                  strokeWidth="1.4"
                />

                {/* Solid 3D Rounded Cube for the satellite node */}
                {render3DCube(
                  node.x,
                  node.y,
                  26, // half-width (52px footprint)
                  26, // half-depth (52px footprint)
                  18, // 3D extruded height
                  8, // rounded corner radius
                  6, // base elevation
                  false,
                  node.label,
                  isHovered
                )}
              </g>
            );
          })}

          {/* ELEVATED CENTRAL THICK 3D CUBE HUB (matching the cube section's 3D architecture) */}
          {render3DCube(
            0,
            0,
            hubSize, // 64 half-width (128px footprint)
            hubSize, // 64 half-depth (128px footprint)
            hubHeight, // 30px substantial 3D vertical thickness
            hubRadius, // 18px smooth rounded corners
            hubZ, // elevated 3D height
            true // is center hub
          )}
        </svg>
      </div>
    </section>
  );
}
