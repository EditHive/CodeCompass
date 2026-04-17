import React from 'react';
import {
  HiOutlineLightningBolt,
  HiOutlineSearch,
  HiOutlineCode,
  HiOutlineMap,
  HiOutlineClock,
  HiOutlineExclamation,
  HiOutlineFolder,
} from 'react-icons/hi';

// ─── Constants ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: 'impact',     label: 'Impact',   icon: HiOutlineLightningBolt, color: '#f43f5e' },
  { id: 'flow',       label: 'Flow',     icon: HiOutlineClock,         color: '#22d3ee' },
  { id: 'search',     label: 'Search',   icon: HiOutlineSearch,        color: '#10b981' },
  { id: 'explain',    label: 'Explain',  icon: HiOutlineCode,          color: '#f59e0b' },
  { id: 'smells',     label: 'Smells',   icon: HiOutlineExclamation,   color: '#f97316' },
  { id: 'onboarding', label: 'Onboard',  icon: HiOutlineMap,           color: '#ec4899' },
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const STYLES = `
  .tn-root {
    font-family: 'Inter', sans-serif;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 14px;
    background: rgba(8, 11, 20, 0.92);
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    backdrop-filter: blur(12px);
    position: relative;
    z-index: 50;
    flex-shrink: 0;
  }

  /* subtle top accent line */
  .tn-root::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg,
      transparent 0%,
      rgba(99,102,241,0.4) 30%,
      rgba(139,92,246,0.4) 50%,
      rgba(99,102,241,0.4) 70%,
      transparent 100%
    );
  }

  /* ── Left ── */
  .tn-left {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .tn-brand {
    display: flex;
    align-items: center;
    gap: 8px;
    padding-right: 12px;
    border-right: 1px solid rgba(255,255,255,0.07);
    height: 20px;
    flex-shrink: 0;
  }

  .tn-logo {
    width: 24px;
    height: 24px;
    border-radius: 7px;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    color: #fff;
    flex-shrink: 0;
    box-shadow: 0 0 10px rgba(99,102,241,0.35);
  }

  .tn-brand-name {
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: #e2e8f0;
  }
  .tn-brand-name span { color: #818cf8; }

  .tn-repo-sep {
    color: rgba(255,255,255,0.15);
    font-size: 13px;
    margin: 0 2px;
  }

  .tn-repo-name {
    font-size: 12px;
    font-weight: 500;
    color: rgba(226,232,240,0.7);
    font-family: 'Courier New', monospace;
  }

  /* ── Nav ── */
  .tn-nav {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .tn-btn {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 5px 9px;
    border-radius: 7px;
    border: 1px solid transparent;
    background: transparent;
    font-size: 11px;
    font-weight: 500;
    font-family: inherit;
    color: rgba(148,163,184,0.6);
    cursor: pointer;
    transition: all 0.14s;
    white-space: nowrap;
    letter-spacing: 0.02em;
    position: relative;
  }

  .tn-btn:hover:not(:disabled) {
    color: rgba(226,232,240,0.9);
    background: rgba(255,255,255,0.05);
    border-color: rgba(255,255,255,0.07);
  }

  .tn-btn:disabled {
    opacity: 0.2;
    cursor: not-allowed;
  }

  .tn-btn.active {
    border-color: transparent;
  }

  /* active bottom indicator */
  .tn-btn.active::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 20%;
    right: 20%;
    height: 2px;
    border-radius: 2px 2px 0 0;
  }

  .tn-btn svg {
    width: 13px;
    height: 13px;
    flex-shrink: 0;
  }

  /* ── Right ── */
  .tn-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .tn-stats {
    display: flex;
    align-items: center;
    gap: 0;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 8px;
    overflow: hidden;
  }

  .tn-stat {
    display: flex;
    align-items: baseline;
    gap: 3px;
    padding: 4px 10px;
    border-right: 1px solid rgba(255,255,255,0.05);
    font-family: 'Courier New', monospace;
  }
  .tn-stat:last-child { border-right: none; }

  .tn-stat-num {
    font-size: 12px;
    font-weight: 600;
    color: rgba(226,232,240,0.85);
    line-height: 1;
  }

  .tn-stat-label {
    font-size: 9px;
    font-weight: 500;
    color: rgba(148,163,184,0.38);
    text-transform: uppercase;
    letter-spacing: 0.06em;
  }

  .tn-load-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 5px 11px;
    border-radius: 7px;
    border: 1px solid rgba(99,102,241,0.3);
    background: rgba(99,102,241,0.1);
    color: #a5b4fc;
    font-size: 11px;
    font-weight: 500;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.14s;
    white-space: nowrap;
    letter-spacing: 0.02em;
  }

  .tn-load-btn:hover {
    background: rgba(99,102,241,0.18);
    border-color: rgba(99,102,241,0.5);
    color: #c7d2fe;
  }

  .tn-load-btn:active {
    transform: scale(0.97);
  }

  .tn-load-btn svg {
    width: 13px;
    height: 13px;
    flex-shrink: 0;
  }

  /* analyzed dot */
  .tn-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #10b981;
    box-shadow: 0 0 5px rgba(16,185,129,0.6);
    flex-shrink: 0;
    animation: tn-pulse 2.5s ease-in-out infinite;
  }

  @keyframes tn-pulse {
    0%, 100% { opacity: 1; }
    50%       { opacity: 0.4; }
  }
`;

// ─── TopNav ───────────────────────────────────────────────────────────────────

export default function TopNav({ activeTab, onTabChange, isAnalyzed, repoPath, stats, onUploadClick }) {
  return (
    <>
      <style>{STYLES}</style>
      <header className="tn-root">

        {/* ── Left: Brand + Nav ── */}
        <div className="tn-left">

          {/* Brand */}
          <div className="tn-brand">
            <div className="tn-logo">P</div>
            <span className="tn-brand-name">PRISM<span>CODE</span></span>
            {repoPath && (
              <>
                <span className="tn-repo-sep">/</span>
                <span className="tn-repo-name">{repoPath.split('/').pop()}</span>
              </>
            )}
            {isAnalyzed && <div className="tn-dot" />}
          </div>

          {/* Nav items */}
          <nav className="tn-nav">
            {NAV_ITEMS.map(item => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  disabled={!isAnalyzed}
                  onClick={() => onTabChange(isActive ? 'graph' : item.id)}
                  className={`tn-btn${isActive ? ' active' : ''}`}
                  style={isActive ? {
                    background:   `${item.color}14`,
                    color:         item.color,
                    borderColor:  `${item.color}28`,
                  } : {}}
                >
                  {/* active underline dot */}
                  {isActive && (
                    <style>{`.tn-btn.active::after { background: ${item.color}; box-shadow: 0 0 6px ${item.color}80; }`}</style>
                  )}
                  <Icon />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* ── Right: Stats + Load ── */}
        <div className="tn-right">
          {stats && (
            <div className="tn-stats">
              <div className="tn-stat">
                <span className="tn-stat-num">{stats.total_files}</span>
                <span className="tn-stat-label">files</span>
              </div>
              <div className="tn-stat">
                <span className="tn-stat-num">{stats.total_functions}</span>
                <span className="tn-stat-label">fn</span>
              </div>
              <div className="tn-stat">
                <span className="tn-stat-num">{stats.total_classes}</span>
                <span className="tn-stat-label">cls</span>
              </div>
            </div>
          )}

          <button className="tn-load-btn" onClick={onUploadClick}>
            <HiOutlineFolder />
            {repoPath ? 'Change Repo' : 'Load Repo'}
          </button>
        </div>

      </header>
    </>
  );
}
