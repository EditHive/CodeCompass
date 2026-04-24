import React, { useState } from 'react';
import {
  HiOutlineLightningBolt,
  HiOutlineSearch,
  HiOutlineCode,
  HiOutlineMap,
  HiOutlineClock,
  HiOutlineExclamation,
  HiOutlineFolder,
  HiOutlineUpload,
} from 'react-icons/hi';

// ─── Constants ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: 'impact', label: 'Impact', icon: HiOutlineLightningBolt, color: '#f43f5e', glow: '244,63,94' },
  { id: 'flow', label: 'Flow', icon: HiOutlineClock, color: '#22d3ee', glow: '34,211,238' },
  { id: 'search', label: 'Search', icon: HiOutlineSearch, color: '#10b981', glow: '16,185,129' },
  { id: 'explain', label: 'Explain', icon: HiOutlineCode, color: '#f59e0b', glow: '245,158,11' },
  { id: 'smells', label: 'Smells', icon: HiOutlineExclamation, color: '#f97316', glow: '249,115,22' },
  { id: 'onboarding', label: 'Onboard', icon: HiOutlineMap, color: '#38bdf8', glow: '56,189,248' },
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const STYLES = `
  @keyframes tn-gradient-shift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  @keyframes tn-orbit {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes tn-float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-2px); }
  }

  @keyframes tn-shimmer {
    0% { left: -100%; }
    100% { left: 200%; }
  }

  @keyframes tn-ripple {
    0% { transform: scale(0.8); opacity: 1; }
    100% { transform: scale(2.5); opacity: 0; }
  }

  @keyframes tn-glow-pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 0.8; }
  }

  @keyframes tn-border-flow {
    0% { background-position: 0% 0%; }
    100% { background-position: 200% 0%; }
  }

  @keyframes tn-stat-count {
    from { transform: scale(0.5); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }

  /* ── Root ── */
  .tn-root {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    height: 64px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    position: relative;
    z-index: 50;
    flex-shrink: 0;
    background: linear-gradient(
      180deg,
      rgba(11, 13, 11, 0.95) 0%,
      rgba(15, 19, 16, 0.88) 100%
    );
    backdrop-filter: blur(20px) saturate(1.5);
    border-bottom: 1px solid transparent;
    overflow: visible;
  }

  /* Animated gradient border bottom */
  .tn-root::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      rgba(249, 115, 22, 0.0) 5%,
      rgba(249, 115, 22, 0.5) 20%,
      rgba(245, 158, 11, 0.6) 35%,
      rgba(20, 184, 166, 0.5) 50%,
      rgba(34, 211, 238, 0.5) 65%,
      rgba(249, 115, 22, 0.5) 80%,
      rgba(249, 115, 22, 0.0) 95%,
      transparent 100%
    );
    background-size: 200% 100%;
    animation: tn-border-flow 4s linear infinite;
  }

  /* Top highlight line */
  .tn-root::before {
    content: '';
    position: absolute;
    top: 0;
    left: 10%;
    right: 10%;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.06),
      transparent
    );
  }

  /* ── Left Section ── */
  .tn-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  /* ── Logo ── */
  .tn-logo-group {
    display: flex;
    align-items: center;
    gap: 10px;
    position: relative;
    cursor: default;
    user-select: none;
    padding-right: 16px;
  }

  .tn-logo-group::after {
    content: '';
    position: absolute;
    right: 0;
    top: 15%;
    bottom: 15%;
    width: 1px;
    background: linear-gradient(
      180deg,
      transparent,
      rgba(249, 115, 22, 0.3),
      transparent
    );
  }

  .tn-logo-container {
    position: relative;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  /* Orbiting ring */
  .tn-logo-orbit {
    position: absolute;
    inset: -3px;
    border-radius: 50%;
    border: 1.5px solid transparent;
    border-top-color: rgba(99, 102, 241, 0.5);
    border-right-color: rgba(20, 184, 166, 0.3);
    animation: tn-orbit 6s linear infinite;
  }

  .tn-logo-core {
    width: 30px;
    height: 30px;
    border-radius: 10px;
    background: linear-gradient(135deg, #f97316 0%, #f59e0b 48%, #14b8a6 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 800;
    color: #fff;
    letter-spacing: -0.02em;
    box-shadow:
      0 0 20px rgba(249, 115, 22, 0.35),
      0 0 40px rgba(20, 184, 166, 0.15),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);
    position: relative;
    z-index: 1;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }

  .tn-logo-container:hover .tn-logo-core {
    transform: scale(1.08) rotate(-5deg);
    box-shadow:
      0 0 25px rgba(249, 115, 22, 0.5),
      0 0 50px rgba(20, 184, 166, 0.25),
      inset 0 1px 0 rgba(255, 255, 255, 0.25);
  }

  .tn-logo-container:hover .tn-logo-orbit {
    animation-duration: 2s;
  }

  .tn-brand-text {
    display: flex;
    flex-direction: column;
    gap: 0px;
    line-height: 1;
  }

  .tn-brand-name {
    font-size: 14px;
    font-weight: 800;
    letter-spacing: 0.08em;
    background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 50%, #94a3b8 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .tn-brand-name .tn-brand-highlight {
    background: linear-gradient(135deg, #fb923c 0%, #f59e0b 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .tn-brand-tagline {
    font-size: 9px;
    font-weight: 500;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: rgba(148, 163, 184, 0.4);
    margin-top: 2px;
  }

  /* ── Repo Chip ── */
  .tn-repo-chip {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    border-radius: 20px;
    background: rgba(16, 185, 129, 0.08);
    border: 1px solid rgba(16, 185, 129, 0.18);
    transition: all 0.25s ease;
  }

  .tn-repo-chip:hover {
    background: rgba(16, 185, 129, 0.12);
    border-color: rgba(16, 185, 129, 0.3);
  }

  .tn-repo-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #10b981;
    box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
    position: relative;
  }

  .tn-repo-dot::after {
    content: '';
    position: absolute;
    inset: -3px;
    border-radius: 50%;
    border: 1px solid rgba(16, 185, 129, 0.3);
    animation: tn-ripple 2s ease-out infinite;
  }

  .tn-repo-label {
    font-size: 11px;
    font-weight: 600;
    color: rgba(16, 185, 129, 0.85);
    font-family: 'SF Mono', 'Fira Code', 'Courier New', monospace;
    letter-spacing: 0.02em;
  }

  /* ── Center Navigation ── */
  .tn-center {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
  }

  .tn-nav {
    display: flex;
    align-items: center;
    gap: 3px;
    padding: 4px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.025);
    border: 1px solid rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
  }

  /* ── Nav Button ── */
  .tn-btn {
    position: relative;
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    border-radius: 10px;
    border: 1px solid transparent;
    background: transparent;
    font-size: 12px;
    font-weight: 550;
    font-family: inherit;
    color: rgba(148, 163, 184, 0.55);
    cursor: pointer;
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    white-space: nowrap;
    letter-spacing: 0.01em;
    overflow: hidden;
  }

  /* Shimmer effect on hover */
  .tn-btn::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 60%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.05),
      transparent
    );
    transition: none;
    pointer-events: none;
  }

  .tn-btn:hover:not(:disabled)::before {
    animation: tn-shimmer 0.6s ease forwards;
  }

  .tn-btn:hover:not(:disabled) {
    color: rgba(226, 232, 240, 0.95);
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.08);
    transform: translateY(-1px);
  }

  .tn-btn:active:not(:disabled) {
    transform: translateY(0) scale(0.98);
  }

  .tn-btn:disabled {
    opacity: 0.18;
    cursor: not-allowed;
  }

  .tn-btn svg {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    transition: transform 0.2s ease;
  }

  .tn-btn:hover:not(:disabled) svg {
    transform: scale(1.15);
  }

  /* ── Active Nav Button ── */
  .tn-btn.active {
    border-color: transparent;
    background: transparent;
    transform: translateY(-1px);
    animation: tn-float 3s ease-in-out infinite;
  }

  .tn-btn.active svg {
    filter: drop-shadow(0 0 4px currentColor);
  }

  /* Active indicator dot */
  .tn-active-dot {
    position: absolute;
    bottom: 2px;
    left: 50%;
    transform: translateX(-50%);
    width: 16px;
    height: 3px;
    border-radius: 3px;
  }

  .tn-active-dot::after {
    content: '';
    position: absolute;
    inset: -3px -6px;
    border-radius: 6px;
    animation: tn-glow-pulse 2s ease-in-out infinite;
  }

  /* ── Right Section ── */
  .tn-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  /* ── Stats ── */
  .tn-stats {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 3px;
    border-radius: 12px;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.05);
  }

  .tn-stat {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 5px 10px;
    border-radius: 9px;
    transition: all 0.2s ease;
    cursor: default;
  }

  .tn-stat:hover {
    background: rgba(255, 255, 255, 0.04);
  }

  .tn-stat-icon {
    width: 14px;
    height: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    flex-shrink: 0;
  }

  .tn-stat-icon svg {
    width: 10px;
    height: 10px;
  }

  .tn-stat-value {
    font-size: 13px;
    font-weight: 700;
    font-family: 'SF Mono', 'Fira Code', 'Courier New', monospace;
    line-height: 1;
    letter-spacing: -0.02em;
    animation: tn-stat-count 0.3s ease-out;
  }

  .tn-stat-label {
    font-size: 9px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: rgba(148, 163, 184, 0.35);
    line-height: 1;
  }

  .tn-stat-divider {
    width: 1px;
    height: 18px;
    background: rgba(255, 255, 255, 0.06);
    margin: 0 2px;
  }

  /* ── Load Button ── */
  .tn-load-btn {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 18px;
    border-radius: 12px;
    border: none;
    background: linear-gradient(135deg, #f97316 0%, #f59e0b 50%, #14b8a6 100%);
    background-size: 200% 200%;
    animation: tn-gradient-shift 4s ease infinite;
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    white-space: nowrap;
    letter-spacing: 0.03em;
    overflow: hidden;
    box-shadow:
      0 2px 12px rgba(249, 115, 22, 0.25),
      0 4px 24px rgba(249, 115, 22, 0.1);
  }

  .tn-load-btn::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 12px;
    padding: 1px;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0.2),
      transparent 40%,
      transparent 60%,
      rgba(255, 255, 255, 0.1)
    );
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
  }

  /* shimmer on load btn */
  .tn-load-btn::after {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 60%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.15),
      transparent
    );
    pointer-events: none;
  }

  .tn-load-btn:hover::after {
    animation: tn-shimmer 0.7s ease forwards;
  }

  .tn-load-btn:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow:
      0 4px 20px rgba(249, 115, 22, 0.4),
      0 8px 32px rgba(249, 115, 22, 0.15);
  }

  .tn-load-btn:active {
    transform: translateY(0) scale(0.98);
    box-shadow:
      0 1px 6px rgba(249, 115, 22, 0.3);
  }

  .tn-load-btn svg {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    transition: transform 0.2s ease;
  }

  .tn-load-btn:hover svg {
    transform: rotate(-10deg) scale(1.1);
  }

  /* ── Waiting state ── */
  .tn-waiting {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 14px;
    border-radius: 20px;
    background: rgba(245, 158, 11, 0.06);
    border: 1px solid rgba(245, 158, 11, 0.15);
  }

  .tn-waiting-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #f59e0b;
    box-shadow: 0 0 8px rgba(245, 158, 11, 0.5);
    animation: tn-glow-pulse 1.5s ease-in-out infinite;
  }

  .tn-waiting-text {
    font-size: 11px;
    font-weight: 500;
    color: rgba(245, 158, 11, 0.7);
    letter-spacing: 0.02em;
  }
`;

// ─── TopNav ───────────────────────────────────────────────────────────────────

export default function TopNav({ activeTab, onTabChange, isAnalyzed, repoPath, onUploadClick }) {
  const [hoveredBtn, setHoveredBtn] = useState(null);

  return (
    <>
      <style>{STYLES}</style>
      <header className="tn-root">

        {/* ── Left: Logo + Repo ── */}
        <div className="tn-left">

          {/* Logo */}
          <div className="tn-logo-group">
            <div className="tn-logo-container">
              <div className="tn-logo-orbit" />
              <div className="tn-logo-core">C</div>
            </div>
            <div className="tn-brand-text">
              <span className="tn-brand-name">
                Code<span className="tn-brand-highlight">Compass</span>
              </span>
              <span className="tn-brand-tagline">Code Intelligence</span>
            </div>
          </div>

          {/* Repo chip or waiting */}
          {repoPath ? (
            <div className="tn-repo-chip">
              <div className="tn-repo-dot" />
              <span className="tn-repo-label">{repoPath.split('/').pop()}</span>
            </div>
          ) : (
            <div className="tn-waiting">
              <div className="tn-waiting-dot" />
              <span className="tn-waiting-text">No repository loaded</span>
            </div>
          )}
        </div>

        {/* ── Center: Navigation ── */}
        <div className="tn-center">
          <nav className="tn-nav">
            {NAV_ITEMS.map(item => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  disabled={!isAnalyzed}
                  onClick={() => onTabChange(isActive ? 'graph' : item.id)}
                  onMouseEnter={() => setHoveredBtn(item.id)}
                  onMouseLeave={() => setHoveredBtn(null)}
                  className={`tn-btn${isActive ? ' active' : ''}`}
                  style={isActive ? {
                    color: item.color,
                    background: `rgba(${item.glow}, 0.1)`,
                    borderColor: `rgba(${item.glow}, 0.2)`,
                  } : hoveredBtn === item.id ? {
                    borderColor: `rgba(${item.glow}, 0.15)`,
                  } : {}}
                >
                  <Icon />
                  {item.label}

                  {/* Active indicator */}
                  {isActive && (
                    <span
                      className="tn-active-dot"
                      style={{
                        background: item.color,
                        boxShadow: `0 0 10px rgba(${item.glow}, 0.6)`,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* ── Right: Stats + Load ── */}
        <div className="tn-right">



          {/* Load/Change Button */}
          <button className="tn-load-btn" onClick={onUploadClick}>
            <HiOutlineUpload />
            {repoPath ? 'Change Repo' : 'Load Repo'}
          </button>
        </div>

      </header>
    </>
  );
}
