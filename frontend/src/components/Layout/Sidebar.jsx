import React, { useState } from 'react';
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
  { id: 'impact',     label: 'Impact',  icon: HiOutlineLightningBolt, color: '#f43f5e' },
  { id: 'flow',       label: 'Flow',    icon: HiOutlineClock,         color: '#22d3ee' },
  { id: 'search',     label: 'Search',  icon: HiOutlineSearch,        color: '#10b981' },
  { id: 'explain',    label: 'Explain', icon: HiOutlineCode,          color: '#f59e0b' },
  { id: 'smells',     label: 'Smells',  icon: HiOutlineExclamation,   color: '#f97316' },
  { id: 'onboarding', label: 'Onboard', icon: HiOutlineMap,           color: '#ec4899' },
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const STYLES = `
  .sn-root {
    font-family: 'Inter', sans-serif;
    width: 56px;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: rgba(6, 8, 16, 0.97);
    border-right: 1px solid rgba(255,255,255,0.055);
    position: relative;
    z-index: 50;
    flex-shrink: 0;
    padding: 10px 0 12px;
    gap: 0;
  }

  /* right accent line */
  .sn-root::after {
    content: '';
    position: absolute;
    top: 0; right: 0; bottom: 0;
    width: 1px;
    background: linear-gradient(
      180deg,
      transparent 0%,
      rgba(99,102,241,0.35) 25%,
      rgba(139,92,246,0.35) 50%,
      rgba(99,102,241,0.35) 75%,
      transparent 100%
    );
    pointer-events: none;
  }

  /* ── Logo ── */
  .sn-logo-wrap {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 800;
    color: #fff;
    letter-spacing: -0.02em;
    box-shadow: 0 0 14px rgba(99,102,241,0.4);
    flex-shrink: 0;
    margin-bottom: 4px;
    cursor: default;
    user-select: none;
  }

  .sn-brand-dot {
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: #10b981;
    box-shadow: 0 0 6px rgba(16,185,129,0.7);
    margin-bottom: 14px;
    animation: sn-pulse 2.5s ease-in-out infinite;
  }

  .sn-brand-dot.offline {
    background: rgba(148,163,184,0.2);
    box-shadow: none;
    animation: none;
  }

  @keyframes sn-pulse {
    0%, 100% { opacity: 1; box-shadow: 0 0 6px rgba(16,185,129,0.7); }
    50%       { opacity: 0.5; box-shadow: 0 0 3px rgba(16,185,129,0.3); }
  }

  /* ── Divider ── */
  .sn-divider {
    width: 22px;
    height: 1px;
    background: rgba(255,255,255,0.06);
    margin: 6px 0;
    flex-shrink: 0;
  }

  /* ── Nav items ── */
  .sn-nav {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    width: 100%;
    padding: 0 8px;
  }

  .sn-btn {
    position: relative;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    padding: 7px 0;
    border-radius: 10px;
    border: 1px solid transparent;
    background: transparent;
    cursor: pointer;
    font-family: inherit;
    transition: all 0.15s;
    flex-shrink: 0;
  }

  .sn-btn:disabled {
    opacity: 0.18;
    cursor: not-allowed;
  }

  .sn-btn:hover:not(:disabled):not(.active) {
    background: rgba(255,255,255,0.05);
    border-color: rgba(255,255,255,0.07);
  }

  .sn-btn.active {
    border-color: transparent;
  }

  /* left active bar */
  .sn-btn.active::before {
    content: '';
    position: absolute;
    left: -8px;
    top: 20%;
    bottom: 20%;
    width: 2.5px;
    border-radius: 0 2px 2px 0;
  }

  .sn-btn svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    transition: transform 0.15s;
  }

  .sn-btn:hover:not(:disabled) svg {
    transform: scale(1.1);
  }

  .sn-btn-label {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    line-height: 1;
    transition: color 0.15s;
  }

  /* ── Tooltip ── */
  .sn-tooltip {
    position: absolute;
    left: calc(100% + 10px);
    top: 50%;
    transform: translateY(-50%);
    background: rgba(12,15,26,0.97);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 7px;
    padding: 5px 10px;
    font-size: 11px;
    font-weight: 500;
    color: rgba(226,232,240,0.9);
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.12s, transform 0.12s;
    transform: translateY(-50%) translateX(-4px);
    z-index: 100;
    box-shadow: 0 4px 16px rgba(0,0,0,0.4);
  }

  .sn-btn:hover .sn-tooltip {
    opacity: 1;
    transform: translateY(-50%) translateX(0);
  }

  /* tooltip arrow */
  .sn-tooltip::before {
    content: '';
    position: absolute;
    right: 100%;
    top: 50%;
    transform: translateY(-50%);
    border: 5px solid transparent;
    border-right-color: rgba(255,255,255,0.1);
    margin-right: -1px;
  }

  .sn-tooltip::after {
    content: '';
    position: absolute;
    right: calc(100% - 1px);
    top: 50%;
    transform: translateY(-50%);
    border: 5px solid transparent;
    border-right-color: rgba(12,15,26,0.97);
  }

  /* ── Bottom section ── */
  .sn-bottom {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    width: 100%;
    padding: 0 8px;
    flex-shrink: 0;
  }

  /* ── Stats strip ── */
  .sn-stats {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 8px 4px;
    background: rgba(255,255,255,0.02);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 9px;
    margin-bottom: 4px;
  }

  .sn-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
    padding: 3px 0;
    width: 100%;
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }
  .sn-stat:last-child { border-bottom: none; }

  .sn-stat-num {
    font-size: 12px;
    font-weight: 700;
    color: rgba(226,232,240,0.85);
    font-family: 'Courier New', monospace;
    line-height: 1;
  }

  .sn-stat-label {
    font-size: 8px;
    font-weight: 600;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: rgba(148,163,184,0.35);
  }

  /* ── Load button ── */
  .sn-load-btn {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3px;
    padding: 7px 0;
    border-radius: 10px;
    border: 1px solid rgba(99,102,241,0.28);
    background: rgba(99,102,241,0.1);
    cursor: pointer;
    font-family: inherit;
    transition: all 0.15s;
    flex-shrink: 0;
  }

  .sn-load-btn:hover {
    background: rgba(99,102,241,0.18);
    border-color: rgba(99,102,241,0.45);
  }

  .sn-load-btn:active {
    transform: scale(0.96);
  }

  .sn-load-btn svg {
    width: 15px;
    height: 15px;
    color: #818cf8;
    transition: transform 0.15s;
  }

  .sn-load-btn:hover svg {
    transform: scale(1.1);
  }

  .sn-load-btn-label {
    font-size: 8px;
    font-weight: 600;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: #818cf8;
    line-height: 1;
  }

  /* repo name chip */
  .sn-repo-chip {
    max-width: 40px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 8px;
    font-family: 'Courier New', monospace;
    color: rgba(148,163,184,0.4);
    text-align: center;
    padding: 0 2px;
  }
`;

// ─── SideNav ──────────────────────────────────────────────────────────────────

export default function SideNav({ activeTab, onTabChange, isAnalyzed, repoPath, stats, onUploadClick }) {
  return (
    <>
      <style>{STYLES}</style>
      <aside className="sn-root">

        {/* Logo */}
        <div className="sn-logo-wrap">P</div>
        <div className={`sn-brand-dot${isAnalyzed ? '' : ' offline'}`} />

        <div className="sn-divider" />

        {/* Nav items */}
        <nav className="sn-nav">
          {NAV_ITEMS.map(item => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                disabled={!isAnalyzed}
                onClick={() => onTabChange(isActive ? 'graph' : item.id)}
                className={`sn-btn${isActive ? ' active' : ''}`}
                style={isActive ? {
                  background:  `${item.color}12`,
                  borderColor: `${item.color}25`,
                } : {}}
              >
                {/* left active bar */}
                {isActive && (
                  <style>{`
                    .sn-btn.active::before {
                      background: ${item.color};
                      box-shadow: 0 0 8px ${item.color}90;
                    }
                  `}</style>
                )}

                <Icon style={{ color: isActive ? item.color : 'rgba(148,163,184,0.5)' }} />
                <span
                  className="sn-btn-label"
                  style={{ color: isActive ? item.color : 'rgba(148,163,184,0.38)' }}
                >
                  {item.label}
                </span>

                {/* Tooltip */}
                <span className="sn-tooltip">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sn-divider" />

        {/* Bottom: stats + load */}
        <div className="sn-bottom">

          {/* Stats */}
          {stats && (
            <div className="sn-stats">
              <div className="sn-stat">
                <span className="sn-stat-num">{stats.total_files}</span>
                <span className="sn-stat-label">files</span>
              </div>
              <div className="sn-stat">
                <span className="sn-stat-num">{stats.total_functions}</span>
                <span className="sn-stat-label">fn</span>
              </div>
              <div className="sn-stat">
                <span className="sn-stat-num">{stats.total_classes}</span>
                <span className="sn-stat-label">cls</span>
              </div>
            </div>
          )}

          {/* Load / Change repo */}
          <button className="sn-load-btn" onClick={onUploadClick}>
            <HiOutlineFolder />
            <span className="sn-load-btn-label">
              {repoPath ? 'Change' : 'Load'}
            </span>
          </button>

          {/* Repo name */}
          {repoPath && (
            <div className="sn-repo-chip" title={repoPath}>
              {repoPath.split('/').pop()}
            </div>
          )}

        </div>
      </aside>
    </>
  );
}
