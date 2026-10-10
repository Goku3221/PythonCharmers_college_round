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

// 3D Isometric projection math for the full-bleed hero floor plane
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

  // Full-bleed 1920px wide canvas geometry spanning edge-to-edge
  const canvasW = 1920;
  const canvasH = 620;
  const center2D: Point2D = { x: canvasW / 2, y: 310 };

  // Central Hub Cube geometry (same 3D cube UI with WHITE side glow)
  const hubSize = 64; // half-width (128px total)
  const hubHeight = 32; // 3D vertical thickness
  const hubRadius = 18; // rounded corners
  const hubZ = 22; // raised elevation

  // 8 Satellite nodes placed along strictly non-overlapping corridors on the isometric floor grid
  // Every node has its own port, its own perpendicular corridor, and smooth rounded fillets ensuring ZERO overlapping!
  const satelliteNodes = [
    {
      id: 'node-top',
      label: 'Cloud VPC',
      hubPort: { x: -36, y: -64 }, // emerges from top-back left edge
      corner: { x: -36, y: -180 },
      target: { x: -180, y: -180 },
      filletRadius: 24,
    },
    {
      id: 'node-top-right',
      label: 'Identity Broker',
      hubPort: { x: 25, y: -64 }, // emerges from top-back right edge
      corner: { x: 25, y: -240 },
      target: { x: 110, y: -240 },
      filletRadius: 24,
    },
    {
      id: 'node-right',
      label: 'Tool Dispatcher',
      hubPort: { x: 64, y: -25 }, // emerges from top-right edge
      corner: { x: 240, y: -25 },
      target: { x: 240, y: -90 },
      filletRadius: 22,
    },
    {
      id: 'node-bottom-right',
      label: 'Endpoint Mesh',
      hubPort: { x: 64, y: 35 }, // emerges from bottom-right edge
      corner: { x: 220, y: 35 },
      target: { x: 220, y: 160 },
      filletRadius: 24,
    },
    {
      id: 'node-bottom',
      label: 'API Gateway',
      hubPort: { x: 25, y: 64 }, // emerges from bottom-front right edge
      corner: { x: 25, y: 260 },
      target: { x: 90, y: 260 },
      filletRadius: 22,
    },
    {
      id: 'node-bottom-left',
      label: 'Agent Runtime',
      hubPort: { x: -36, y: 64 }, // emerges from bottom-front left edge
      corner: { x: -36, y: 210 },
      target: { x: -160, y: 210 },
      filletRadius: 24,
    },
    {
      id: 'node-left',
      label: 'Database Cluster',
      hubPort: { x: -64, y: 30 }, // emerges from bottom-left edge
      corner: { x: -250, y: 30 },
      target: { x: -250, y: 80 },
      filletRadius: 20,
    },
    {
      id: 'node-far-left',
      label: 'Policy Engine',
      hubPort: { x: -64, y: -25 }, // emerges from top-left edge
      corner: { x: -380, y: -25 },
      target: { x: -380, y: 70 },
      filletRadius: 24,
    },
  ];

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

  // Render a thick 3D rounded cube
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
        {/* Solid 3D Left Wall: White-hot emission on central block */}
        <path
          d={leftHullD}
          fill={isCenter ? 'url(#hub-left-side-white)' : '#141824'}
          stroke={isCenter ? '#ffffff' : 'rgba(255, 255, 255, 0.16)'}
          strokeWidth={isCenter ? '2' : '1.2'}
          filter={isCenter ? 'url(#white-side-glow)' : undefined}
        />

        {/* Solid 3D Right Wall: White-to-mint emission on central block */}
        <path
          d={rightHullD}
          fill={isCenter ? 'url(#hub-right-side-white)' : '#0d1017'}
          stroke={isCenter ? '#ffffff' : 'rgba(255, 255, 255, 0.16)'}
          strokeWidth={isCenter ? '2' : '1.2'}
          filter={isCenter ? 'url(#white-side-glow)' : undefined}
        />

        {/* Upper Bevel Highlight: Pure bright white specular rim */}
        <path
          d={topBevelHighlightD}
          fill="none"
          stroke={isCenter ? '#ffffff' : isHovered ? '#10b981' : 'rgba(255, 255, 255, 0.35)'}
          strokeWidth={isCenter ? '2.8' : '1.5'}
          filter={isCenter ? 'url(#white-hot-rim)' : undefined}
        />

        {/* Top Rounded Surface */}
        <path
          d={topPathD}
          fill={isCenter ? '#0a0f16' : '#121622'}
          stroke={isCenter ? '#ffffff' : isHovered ? '#10b981' : 'rgba(255, 255, 255, 0.28)'}
          strokeWidth={isCenter ? '2' : '1.2'}
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
            <circle cx={projTop[0].x} cy={projTop[0].y} r="3" fill="#ffffff" filter="url(#white-hot-rim)" />
            <circle cx={projTop[6].x} cy={projTop[6].y} r="3" fill="#06b6d4" />
            <circle cx={projTop[12].x} cy={projTop[12].y} r="3" fill="#ffffff" filter="url(#white-hot-rim)" />
            <circle cx={projTop[18].x} cy={projTop[18].y} r="3" fill="#a3e635" />
          </g>
        ) : (
          <circle cx={projTop[6].x} cy={projTop[6].y} r="1.8" fill="#ff8522" />
        )}
      </g>
    );
  };

  // Helper to construct a smoothly rounded isometric circuit path (fillet curve at 90-deg turn in 3D grid)
  const buildIsometricCircuitTrace = (
    start3D: { x: number; y: number },
    corner3D: { x: number; y: number },
    end3D: { x: number; y: number },
    radius: number = 22
  ): {
    pathD: string;
    startPt: Point2D;
    cornerPt: Point2D;
    endPt: Point2D;
  } => {
    // Vector 1 (start to corner along isometric grid)
    const v1x = corner3D.x - start3D.x;
    const v1y = corner3D.y - start3D.y;
    const len1 = Math.sqrt(v1x * v1x + v1y * v1y);
    const u1x = len1 > 0 ? v1x / len1 : 0;
    const u1y = len1 > 0 ? v1y / len1 : 0;

    // Vector 2 (corner to end along orthogonal isometric grid)
    const v2x = end3D.x - corner3D.x;
    const v2y = end3D.y - corner3D.y;
    const len2 = Math.sqrt(v2x * v2x + v2y * v2y);
    const u2x = len2 > 0 ? v2x / len2 : 0;
    const u2y = len2 > 0 ? v2y / len2 : 0;

    const r = Math.min(radius, len1 * 0.45, len2 * 0.45);

    // Tangent points before and after corner in (x, y) floor grid space
    const pre3D = { x: corner3D.x - u1x * r, y: corner3D.y - u1y * r };
    const post3D = { x: corner3D.x + u2x * r, y: corner3D.y + u2y * r };

    // Project all points to 2D screen space (on floor elevation z = 0)
    const startPt = projectIso({ x: start3D.x, y: start3D.y, z: 0 }, center2D);
    const prePt = projectIso({ x: pre3D.x, y: pre3D.y, z: 0 }, center2D);
    const cornerPt = projectIso({ x: corner3D.x, y: corner3D.y, z: 0 }, center2D);
    const postPt = projectIso({ x: post3D.x, y: post3D.y, z: 0 }, center2D);
    const endPt = projectIso({ x: end3D.x, y: end3D.y, z: 0 }, center2D);

    const pathD = `M ${startPt.x.toFixed(1)} ${startPt.y.toFixed(1)} L ${prePt.x.toFixed(1)} ${prePt.y.toFixed(1)} Q ${cornerPt.x.toFixed(1)} ${cornerPt.y.toFixed(1)} ${postPt.x.toFixed(1)} ${postPt.y.toFixed(1)} L ${endPt.x.toFixed(1)} ${endPt.y.toFixed(1)}`;

    return { pathD, startPt, cornerPt, endPt };
  };

  // Render a clean, non-overlapping rounded circuit trace with a high-definition pulse every 2 seconds
  const renderCircuitTraceWith2sPulse = (node: (typeof satelliteNodes)[0]) => {
    const { pathD, startPt, cornerPt, endPt } = buildIsometricCircuitTrace(
      node.hubPort,
      node.corner,
      node.target,
      node.filletRadius
    );

    return (
      <g key={`trace-clean-${node.id}`}>
        {/* Subtle wide ambient conduit backing */}
        <path
          d={pathD}
          fill="none"
          stroke="rgba(16, 185, 129, 0.12)"
          strokeWidth="3.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Crisp metallic circuit trace with rounded corner */}
        <path
          d={pathD}
          fill="none"
          stroke="rgba(255, 255, 255, 0.22)"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Center Cube Port Pin: Smooth rounded terminal socket connecting to center cube */}
        <circle cx={startPt.x} cy={startPt.y} r="3" fill="#ffffff" filter="url(#white-pulse-core)" />
        <circle cx={startPt.x} cy={startPt.y} r="5.5" fill="none" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="1" />

        {/* Corner Junction Dot: Inline circuit pad */}
        <circle cx={cornerPt.x} cy={cornerPt.y} r="2" fill="#10b981" opacity="0.8" />
        <circle cx={cornerPt.x} cy={cornerPt.y} r="4.2" fill="none" stroke="rgba(16, 185, 129, 0.35)" strokeWidth="0.8" />

        {/* Target Cube Terminal Socket */}
        <circle cx={endPt.x} cy={endPt.y} r="3" fill="#10b981" />
        <circle cx={endPt.x} cy={endPt.y} r="6" fill="none" stroke="rgba(16, 185, 129, 0.5)" strokeWidth="1" />

        {/* High-Definition 2-Second Pulse Packet traveling from center cube to target cube */}
        <g>
          {/* Motion path: exactly 2s duration, repeats indefinitely */}
          <animateMotion
            path={pathD}
            dur="2s"
            repeatCount="indefinite"
            keyTimes="0; 0.82; 1"
            keyPoints="0; 1; 1"
            calcMode="spline"
            keySplines="0.25 0.1 0.25 1; 0 0 1 1"
            rotate="auto"
          />

          {/* Smooth opacity envelope: emerges gracefully from center cube, shines intensely, dissolves at destination */}
          <animate
            attributeName="opacity"
            values="0; 0.3; 1; 1; 0; 0"
            keyTimes="0; 0.05; 0.15; 0.78; 0.85; 1"
            dur="2s"
            repeatCount="indefinite"
          />

          {/* Outer Emerald Radiant Halo Ring */}
          <circle
            r="8"
            fill="none"
            stroke="#10b981"
            strokeWidth="1.8"
            opacity="0.9"
            filter="url(#pulse-halo-glow)"
          />

          {/* Concentric Cyan Energy Ring */}
          <circle
            r="5"
            fill="none"
            stroke="#06b6d4"
            strokeWidth="1.4"
            opacity="0.95"
          />

          {/* Trailing Comet Energy Particles (orient along motion tangent) */}
          <ellipse cx="-4.5" cy="0" rx="4" ry="2" fill="#34d399" opacity="0.75" />
          <circle cx="-8" cy="0" r="1.5" fill="#06b6d4" opacity="0.5" />

          {/* Ultra-Bright White-Hot Core Bead */}
          <circle r="3.6" fill="#ffffff" filter="url(#white-pulse-core)" />
        </g>
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
          width: '1400px',
          height: '750px',
          background:
            'radial-gradient(ellipse at 50% 30%, rgba(16, 185, 129, 0.15) 0%, rgba(6, 78, 59, 0.08) 45%, rgba(8, 9, 10, 0) 75%)',
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

        {/* Single Primary CTA Button */}
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

      {/* FULL-WIDTH EDGE-TO-EDGE 3D ISOMETRIC PLANE (Extends 100vw from left to right) */}
      <div
        style={{
          position: 'relative',
          width: '100vw',
          left: '50%',
          transform: 'translateX(-50%)',
          height: '620px',
          marginTop: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${canvasW} ${canvasH}`}
          preserveAspectRatio="xMidYMid slice"
          style={{ width: '100%', height: '100%', display: 'block' }}
        >
          <defs>
            {/* RADIAL FADE MASK FOR THE GRID: Strongest at center, smoothly fading outwards */}
            <radialGradient id="grid-radial-fade-grad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="25%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="55%" stopColor="#ffffff" stopOpacity="0.45" />
              <stop offset="80%" stopColor="#ffffff" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
            <mask id="grid-fade-mask" maskUnits="userSpaceOnUse" x="0" y="0" width={canvasW} height={canvasH}>
              <rect x="0" y="0" width={canvasW} height={canvasH} fill="url(#grid-radial-fade-grad)" />
            </mask>

            {/* Radiant Mint/Cyan Bloom Glow with WHITE-HOT CENTER underneath central hub */}
            <radialGradient id="hub-bloom-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="20%" stopColor="#34d399" stopOpacity="0.85" />
              <stop offset="45%" stopColor="#06b6d4" stopOpacity="0.55" />
              <stop offset="75%" stopColor="#059669" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#08090a" stopOpacity="0" />
            </radialGradient>

            {/* White-Hot Side Views Gradients for the main isometric block */}
            <linearGradient id="hub-left-side-white" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
              <stop offset="35%" stopColor="#a7f3d0" stopOpacity="0.9" />
              <stop offset="70%" stopColor="#10b981" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#064e3b" stopOpacity="0.95" />
            </linearGradient>

            <linearGradient id="hub-right-side-white" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="40%" stopColor="#6ee7b7" stopOpacity="0.88" />
              <stop offset="75%" stopColor="#059669" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#022c22" stopOpacity="0.95" />
            </linearGradient>

            {/* Glowing Filters */}
            <filter id="white-side-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#ffffff" floodOpacity="0.65" />
              <feDropShadow dx="0" dy="0" stdDeviation="12" floodColor="#10b981" floodOpacity="0.5" />
            </filter>

            <filter id="white-hot-rim" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#ffffff" floodOpacity="0.9" />
            </filter>

            <filter id="hub-shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="12" stdDeviation="22" floodColor="#10b981" floodOpacity="0.6" />
            </filter>

            {/* High-Definition 2s Pulse Glow Filters */}
            <filter id="white-pulse-core" x="-100%" y="-100%" width="300%" height="300%">
              <feDropShadow dx="0" dy="0" stdDeviation="3.2" floodColor="#ffffff" floodOpacity="1" />
              <feDropShadow dx="0" dy="0" stdDeviation="7" floodColor="#34d399" floodOpacity="0.85" />
            </filter>

            <filter id="pulse-halo-glow" x="-100%" y="-100%" width="300%" height="300%">
              <feDropShadow dx="0" dy="0" stdDeviation="5.5" floodColor="#10b981" floodOpacity="0.8" />
            </filter>
          </defs>

          {/* FULL-BLEED GROUND GRID: Extends from extreme left to extreme right, masked to fade from center */}
          <g mask="url(#grid-fade-mask)">
            {/* Horizontal & Diagonal isometric grid lines spanning full width */}
            {[-900, -750, -600, -450, -300, -150, 0, 150, 300, 450, 600, 750, 900].map((step, i) => {
              const start1 = projectIso({ x: step, y: -500, z: 0 }, center2D);
              const end1 = projectIso({ x: step, y: 500, z: 0 }, center2D);
              const start2 = projectIso({ x: -900, y: step * 0.7, z: 0 }, center2D);
              const end2 = projectIso({ x: 900, y: step * 0.7, z: 0 }, center2D);
              return (
                <g key={`iso-grid-span-${i}`}>
                  <line
                    x1={start1.x}
                    y1={start1.y}
                    x2={end1.x}
                    y2={end1.y}
                    stroke="rgba(255, 255, 255, 0.16)"
                    strokeWidth="1"
                  />
                  <line
                    x1={start2.x}
                    y1={start2.y}
                    x2={end2.x}
                    y2={end2.y}
                    stroke="rgba(255, 255, 255, 0.16)"
                    strokeWidth="1"
                  />
                </g>
              );
            })}
          </g>

          {/* Central Radial Light Bloom underneath the 3D hub with WHITE-HOT core */}
          <ellipse
            cx={projectIso({ x: 0, y: 0, z: 0 }, center2D).x}
            cy={projectIso({ x: 0, y: 0, z: 0 }, center2D).y + 18}
            rx="230"
            ry="130"
            fill="url(#hub-bloom-glow)"
          />

          {/* Clean, Non-Overlapping Circuit Traces with 2-Second Pulses traveling from center outward */}
          {satelliteNodes.map((node) => renderCircuitTraceWith2sPulse(node))}

          {/* Connected 3D Satellite Cubes around the perimeter with Radar Beacon Pulses */}
          {satelliteNodes.map((node) => {
            const centerScreen = projectIso({ x: node.target.x, y: node.target.y, z: 24 }, center2D);
            const isHovered = hoveredNodeId === node.id;
            return (
              <g
                key={`sat-group-${node.id}`}
                id={`sat-node-${node.id}`}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
              >
                {/* Active radar beacon pulse expanding synchronously every 2 seconds */}
                <circle
                  cx={centerScreen.x}
                  cy={centerScreen.y}
                  r="20"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="1.4"
                >
                  <animate
                    attributeName="r"
                    values="16; 34"
                    keyTimes="0; 1"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.75; 0"
                    keyTimes="0; 1"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle
                  cx={centerScreen.x}
                  cy={centerScreen.y}
                  r="18"
                  fill="none"
                  stroke="rgba(16, 185, 129, 0.4)"
                  strokeWidth="1.2"
                />

                {/* Solid 3D Rounded Cube for the satellite node */}
                {render3DCube(
                  node.target.x,
                  node.target.y,
                  26,
                  26,
                  18,
                  8,
                  6,
                  false,
                  node.label,
                  isHovered
                )}
              </g>
            );
          })}

          {/* ELEVATED CENTRAL THICK 3D CUBE HUB WITH WHITE-HOT SIDE EMISSION */}
          {render3DCube(
            0,
            0,
            hubSize,
            hubSize,
            hubHeight,
            hubRadius,
            hubZ,
            true
          )}
        </svg>
      </div>
    </section>
  );
}
