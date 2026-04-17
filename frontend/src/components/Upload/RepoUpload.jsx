import React, { useState, useEffect, useRef } from 'react';

// ─── Inline styles & keyframes injected once ───────────────────────────────
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500;600&display=swap');

  :root {
    --bg: #070810;
    --surface: #0d0f1a;
    --surface2: #111425;
    --border: rgba(99,102,241,0.18);
    --border-glow: rgba(99,102,241,0.45);
    --accent: #6366f1;
    --accent2: #4ade80;
    --text: #e8eaf6;
    --text-dim: #7c7fa8;
    --text-muted: #4a4d6e;
    --rose: #f43f5e;
  }

  .pu-root * { box-sizing: border-box; margin: 0; padding: 0; }

  .pu-root {
    position: fixed; inset: 0; z-index: 50;
    display: flex; align-items: center; justify-content: center;
    background: var(--bg);
    font-family: 'Syne', sans-serif;
    overflow: hidden;
  }

  /* ── animated grid bg ── */
  .pu-grid {
    position: absolute; inset: 0; pointer-events: none;
    background-image:
      linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px);
    background-size: 48px 48px;
    mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 100%);
  }

  /* ── floating orbs ── */
  .pu-orb {
    position: absolute; border-radius: 50%; pointer-events: none;
    filter: blur(80px); animation: orbFloat linear infinite;
  }
  .pu-orb1 { width: 500px; height: 500px; background: rgba(99,102,241,0.12); top: -120px; left: -100px; animation-duration: 18s; }
  .pu-orb2 { width: 350px; height: 350px; background: rgba(74,222,128,0.07); bottom: -80px; right: -60px; animation-duration: 22s; animation-direction: reverse; }
  .pu-orb3 { width: 250px; height: 250px; background: rgba(244,63,94,0.06); top: 30%; right: 10%; animation-duration: 15s; }

  @keyframes orbFloat {
    0%   { transform: translate(0, 0) scale(1); }
    33%  { transform: translate(30px, -20px) scale(1.05); }
    66%  { transform: translate(-20px, 15px) scale(0.97); }
    100% { transform: translate(0, 0) scale(1); }
  }

  /* ── scan line sweep ── */
  .pu-scanline {
    position: absolute; inset: 0; pointer-events: none; overflow: hidden;
  }
  .pu-scanline::after {
    content: '';
    position: absolute; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(99,102,241,0.3), transparent);
    animation: scanSweep 6s ease-in-out infinite;
  }
  @keyframes scanSweep {
    0%   { top: -2px; opacity: 0; }
    10%  { opacity: 1; }
    90%  { opacity: 1; }
    100% { top: 100%; opacity: 0; }
  }

  /* ── card ── */
  .pu-card {
    position: relative; z-index: 10;
    width: 480px;
    background: linear-gradient(160deg, rgba(13,15,26,0.95) 0%, rgba(10,12,22,0.98) 100%);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 40px;
    box-shadow:
      0 0 0 1px rgba(99,102,241,0.05) inset,
      0 40px 80px rgba(0,0,0,0.6),
      0 0 60px rgba(99,102,241,0.08);
    animation: cardIn 0.6s cubic-bezier(0.22,1,0.36,1) both;
    backdrop-filter: blur(24px);
  }
  @keyframes cardIn {
    from { opacity: 0; transform: translateY(24px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  /* glowing top border accent */
  .pu-card::before {
    content: '';
    position: absolute; top: 0; left: 20%; right: 20%; height: 1px;
    background: linear-gradient(90deg, transparent, var(--accent), rgba(74,222,128,0.8), var(--accent), transparent);
    border-radius: 1px;
    animation: topGlow 4s ease-in-out infinite alternate;
  }
  @keyframes topGlow {
    from { opacity: 0.5; left: 20%; right: 20%; }
    to   { opacity: 1;   left: 10%; right: 10%; }
  }

  /* ── logo mark ── */
  .pu-logo-wrap {
    display: flex; flex-direction: column; align-items: center; margin-bottom: 32px;
    animation: fadeUp 0.5s 0.1s both;
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .pu-logo-hex {
    width: 56px; height: 56px; margin-bottom: 16px; position: relative;
    animation: hexPulse 3s ease-in-out infinite;
  }
  @keyframes hexPulse {
    0%, 100% { filter: drop-shadow(0 0 8px rgba(99,102,241,0.5)); }
    50%       { filter: drop-shadow(0 0 20px rgba(99,102,241,0.9)); }
  }

  .pu-wordmark {
    font-size: 13px; font-weight: 700; letter-spacing: 0.25em;
    color: var(--text); text-transform: uppercase;
  }
  .pu-wordmark span { color: var(--accent); }

  .pu-tagline {
    margin-top: 4px; font-size: 11px; font-weight: 400;
    color: var(--text-muted); letter-spacing: 0.08em;
    font-family: 'JetBrains Mono', monospace;
  }

  /* ── label ── */
  .pu-label {
    display: flex; align-items: center; gap: 6px;
    font-size: 10px; font-weight: 600; letter-spacing: 0.14em;
    text-transform: uppercase; color: var(--text-dim);
    margin-bottom: 8px;
    font-family: 'JetBrains Mono', monospace;
    animation: fadeUp 0.5s 0.2s both;
  }
  .pu-label-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: var(--accent2);
    box-shadow: 0 0 6px var(--accent2);
    animation: blink 2s ease-in-out infinite;
  }
  @keyframes blink {
    0%, 100% { opacity: 1; } 50% { opacity: 0.3; }
  }

  /* ── input group ── */
  .pu-input-wrap {
    position: relative;
    animation: fadeUp 0.5s 0.25s both;
  }

  .pu-input-icon {
    position: absolute; left: 14px; top: 50%; transform: translateY(-50%);
    width: 16px; height: 16px; color: var(--text-muted);
    transition: color 0.2s;
    pointer-events: none;
  }

  .pu-input-status {
    position: absolute; right: 14px; top: 50%; transform: translateY(-50%);
    font-size: 10px; font-family: 'JetBrains Mono', monospace;
    transition: all 0.3s;
  }

  .pu-input {
    width: 100%; padding: 13px 44px 13px 40px;
    background: rgba(255,255,255,0.03);
    border: 1px solid var(--border);
    border-radius: 12px;
    color: var(--text);
    font-size: 13px; font-family: 'JetBrains Mono', monospace;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
    caret-color: var(--accent);
  }
  .pu-input::placeholder { color: var(--text-muted); }
  .pu-input:focus {
    border-color: var(--border-glow);
    background: rgba(99,102,241,0.04);
    box-shadow: 0 0 0 3px rgba(99,102,241,0.08), 0 0 20px rgba(99,102,241,0.05);
  }
  .pu-input:focus + .pu-input-icon { color: var(--accent); }
  .pu-input.valid { border-color: rgba(74,222,128,0.4); }
  .pu-input.valid:focus { box-shadow: 0 0 0 3px rgba(74,222,128,0.06); }

  /* ── error ── */
  .pu-error {
    margin-top: 8px; padding: 10px 14px;
    background: rgba(244,63,94,0.06); border: 1px solid rgba(244,63,94,0.2);
    border-radius: 10px; font-size: 12px; font-family: 'JetBrains Mono', monospace;
    color: var(--rose); text-align: center;
    animation: shake 0.4s ease, fadeUp 0.3s ease;
  }
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%       { transform: translateX(-6px); }
    60%       { transform: translateX(6px); }
  }

  /* ── CTA button ── */
  .pu-btn {
    position: relative; width: 100%; margin-top: 14px; padding: 14px;
    border: none; border-radius: 12px; cursor: pointer;
    font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700;
    letter-spacing: 0.05em; color: white; overflow: hidden;
    transition: transform 0.15s, box-shadow 0.2s, opacity 0.2s;
    background: linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #4338ca 100%);
    box-shadow: 0 4px 24px rgba(99,102,241,0.35);
    animation: fadeUp 0.5s 0.3s both;
  }
  .pu-btn:not(:disabled):hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 32px rgba(99,102,241,0.5);
  }
  .pu-btn:not(:disabled):active { transform: scale(0.98); }
  .pu-btn:disabled { opacity: 0.35; cursor: not-allowed; }

  /* shimmer sweep on button */
  .pu-btn::after {
    content: '';
    position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
    animation: btnShimmer 3s ease-in-out infinite;
    pointer-events: none;
  }
  @keyframes btnShimmer {
    0%   { left: -100%; }
    50%, 100% { left: 160%; }
  }

  .pu-btn-inner {
    position: relative; display: flex; align-items: center;
    justify-content: center; gap: 8px;
  }

  /* ── spinner ── */
  .pu-spinner {
    width: 16px; height: 16px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.2);
    border-top-color: white;
    animation: spin 0.7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* ── analyzing steps ── */
  .pu-steps {
    margin-top: 14px; padding: 14px 16px;
    background: rgba(255,255,255,0.02); border: 1px solid var(--border);
    border-radius: 12px; animation: fadeUp 0.4s ease;
  }
  .pu-step {
    display: flex; align-items: center; gap: 10px; padding: 4px 0;
    font-size: 11px; font-family: 'JetBrains Mono', monospace;
    color: var(--text-muted); transition: color 0.4s;
  }
  .pu-step.active { color: var(--accent2); }
  .pu-step.done   { color: var(--text-dim); }
  .pu-step-icon {
    width: 14px; height: 14px; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px;
  }
  .pu-step-line {
    flex: 1; height: 1px; margin-left: 4px;
    background: var(--border);
  }
  .pu-step-line.filled { background: var(--accent2); transition: background 0.5s; }

  /* ── divider ── */
  .pu-divider {
    margin: 26px 0; display: flex; align-items: center; gap: 12px;
    animation: fadeUp 0.5s 0.4s both;
  }
  .pu-divider-line {
    flex: 1; height: 1px;
    background: linear-gradient(90deg, transparent, var(--border), transparent);
  }
  .pu-divider-text {
    font-size: 9px; font-weight: 600; letter-spacing: 0.2em;
    text-transform: uppercase; color: var(--text-muted);
    font-family: 'JetBrains Mono', monospace;
  }

  /* ── features grid ── */
  .pu-features {
    display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;
    animation: fadeUp 0.5s 0.45s both;
  }

  .pu-feat {
    position: relative; padding: 12px 8px; border-radius: 12px;
    border: 1px solid rgba(99,102,241,0.1);
    background: rgba(255,255,255,0.02);
    text-align: center; cursor: default;
    transition: border-color 0.25s, background 0.25s, transform 0.2s;
    overflow: hidden;
  }
  .pu-feat:hover {
    border-color: rgba(99,102,241,0.35);
    background: rgba(99,102,241,0.06);
    transform: translateY(-2px);
  }
  .pu-feat::before {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(circle at 50% 0%, rgba(99,102,241,0.1), transparent 70%);
    opacity: 0; transition: opacity 0.25s;
  }
  .pu-feat:hover::before { opacity: 1; }

  .pu-feat-icon {
    font-size: 16px; display: block; margin-bottom: 6px;
    filter: grayscale(0.2);
    transition: transform 0.2s;
  }
  .pu-feat:hover .pu-feat-icon { transform: scale(1.15); }

  .pu-feat-label {
    font-size: 9px; font-weight: 600; letter-spacing: 0.08em;
    text-transform: uppercase; color: var(--text-muted);
    font-family: 'JetBrains Mono', monospace; line-height: 1.3;
  }
  .pu-feat:hover .pu-feat-label { color: var(--text-dim); }

  /* ── footer ── */
  .pu-footer {
    margin-top: 20px; text-align: center;
    font-size: 10px; font-family: 'JetBrains Mono', monospace;
    color: var(--text-muted); letter-spacing: 0.04em;
    animation: fadeUp 0.5s 0.5s both;
  }
  .pu-footer span { color: var(--accent); }

  /* ── dot indicators ── */
  .pu-dots {
    position: absolute; top: 20px; left: 24px;
    display: flex; gap: 7px; align-items: center;
  }
  .pu-dot {
    width: 8px; height: 8px; border-radius: 50%;
  }
  .pu-dot:nth-child(1) { background: #f43f5e; }
  .pu-dot:nth-child(2) { background: #f59e0b; }
  .pu-dot:nth-child(3) { background: var(--accent2); }

  /* ── corner accents ── */
  .pu-corner {
    position: absolute; width: 12px; height: 12px;
    pointer-events: none;
  }
  .pu-corner-tl { top: -1px; left: -1px; border-top: 2px solid var(--accent); border-left: 2px solid var(--accent); border-radius: 4px 0 0 0; }
  .pu-corner-tr { top: -1px; right: -1px; border-top: 2px solid var(--accent); border-right: 2px solid var(--accent); border-radius: 0 4px 0 0; }
  .pu-corner-bl { bottom: -1px; left: -1px; border-bottom: 2px solid var(--accent); border-left: 2px solid var(--accent); border-radius: 0 0 0 4px; }
  .pu-corner-br { bottom: -1px; right: -1px; border-bottom: 2px solid var(--accent); border-right: 2px solid var(--accent); border-radius: 0 0 4px 0; }

  /* version badge */
  .pu-version {
    position: absolute; top: 20px; right: 24px;
    font-size: 9px; font-family: 'JetBrains Mono', monospace;
    color: var(--text-muted); letter-spacing: 0.1em;
    padding: 3px 8px; border: 1px solid var(--border);
    border-radius: 20px;
  }
`;

// ─── Analyzing steps shown during loading ──────────────────────────────────
const ANALYSIS_STEPS = [
  { label: 'Cloning repository', icon: '⬇' },
  { label: 'Parsing AST structure', icon: '🌿' },
  { label: 'Mapping dependencies', icon: '🕸' },
  { label: 'Building embeddings', icon: '🧠' },
  { label: 'Indexing graph store', icon: '📦' },
];

// ─── Hex logo SVG ──────────────────────────────────────────────────────────
function HexLogo() {
  return (
    <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="hg1" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
        <linearGradient id="hg2" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
      </defs>
      {/* hexagon */}
      <path d="M28 4L50 16V40L28 52L6 40V16L28 4Z" fill="url(#hg1)" fillOpacity="0.15" stroke="url(#hg1)" strokeWidth="1.5" />
      {/* inner hex */}
      <path d="M28 12L44 21V39L28 48L12 39V21L28 12Z" fill="url(#hg1)" fillOpacity="0.1" stroke="url(#hg1)" strokeWidth="0.75" strokeDasharray="3 2" />
      {/* P letterform */}
      <text x="50%" y="58%" textAnchor="middle" dominantBaseline="middle"
        fontSize="18" fontWeight="800" fontFamily="Syne, sans-serif" fill="url(#hg1)">P</text>
      {/* accent dot */}
      <circle cx="40" cy="16" r="3" fill="url(#hg2)" />
    </svg>
  );
}

// ─── URL validator ─────────────────────────────────────────────────────────
function validateInput(val) {
  if (!val) return 'idle';
  if (val.startsWith('https://github.com/') && val.split('/').length >= 5) return 'github';
  if (val.startsWith('https://') || val.startsWith('http://')) return 'url';
  if (val.startsWith('/') || val.match(/^[A-Za-z]:\\/)) return 'local';
  if (val.length > 3) return 'typing';
  return 'idle';
}

// ─── Main component ────────────────────────────────────────────────────────
export default function RepoUpload({ onAnalyze, loading, error }) {
  const [path, setPath] = useState('');
  const [step, setStep] = useState(0);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);

  // Cycle through analysis steps when loading
  useEffect(() => {
    if (!loading) { setStep(0); return; }
    const t = setInterval(() => setStep(s => s < ANALYSIS_STEPS.length - 1 ? s + 1 : s), 1200);
    return () => clearInterval(t);
  }, [loading]);

  const validity = validateInput(path);
  const isValid = ['github', 'url', 'local'].includes(validity);

  const statusLabel = {
    github: { text: '⬡ GitHub', color: '#4ade80' },
    url: { text: '⬡ URL', color: '#6366f1' },
    local: { text: '⬡ local', color: '#f59e0b' },
    typing: { text: '…', color: '#7c7fa8' },
    idle: { text: null, color: null },
  }[validity];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (path.trim() && !loading) onAnalyze(path.trim());
  };

  const FEATURES = [
    { icon: '🕸️', label: 'Dep Graph' },
    { icon: '⚡', label: 'Impact Sim' },
    { icon: '🔍', label: 'Semantic Search' },
    { icon: '🗺️', label: 'City View' },
    { icon: '🔄', label: 'Exec Flow' },
    { icon: '⚠️', label: 'Risk Detect' },
    { icon: '💬', label: 'Ask Code' },
    { icon: '🧭', label: 'Onboarding' },
  ];

  return (
    <>
      <style>{STYLES}</style>
      <div className="pu-root">
        {/* Ambient background */}
        <div className="pu-grid" />
        <div className="pu-orb pu-orb1" />
        <div className="pu-orb pu-orb2" />
        <div className="pu-orb pu-orb3" />
        <div className="pu-scanline" />

        {/* Card */}
        <div className="pu-card">
          {/* corner brackets */}
          <div className="pu-corner pu-corner-tl" />
          <div className="pu-corner pu-corner-tr" />
          <div className="pu-corner pu-corner-bl" />
          <div className="pu-corner pu-corner-br" />

          {/* macOS-style dots */}
          <div className="pu-dots">
            <div className="pu-dot" />
            <div className="pu-dot" />
            <div className="pu-dot" />
          </div>

          {/* version */}
          <div className="pu-version">v0.9.1</div>

          {/* Logo */}
          <div className="pu-logo-wrap" style={{ paddingTop: 12 }}>
            <div className="pu-logo-hex">
              <HexLogo />
            </div>
            <div className="pu-wordmark">PRISM<span>CODE</span></div>
            <div className="pu-tagline">// codebase intelligence engine</div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="pu-label">
              <span className="pu-label-dot" />
              Repository Path or Git URL
            </div>

            <div className="pu-input-wrap">
              {/* folder icon */}
              <svg className="pu-input-icon" viewBox="0 0 20 20" fill="none"
                style={{ left: 14, color: focused ? 'var(--accent)' : undefined }}>
                <path d="M2 6a2 2 0 012-2h4l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
                  stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>

              <input
                ref={inputRef}
                type="text"
                value={path}
                onChange={e => setPath(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                placeholder="https://github.com/user/repo  or  /local/path"
                className={`pu-input${isValid ? ' valid' : ''}`}
                disabled={loading}
                autoComplete="off"
                spellCheck="false"
              />

              {/* live status badge */}
              {statusLabel.text && (
                <span className="pu-input-status" style={{ color: statusLabel.color }}>
                  {statusLabel.text}
                </span>
              )}
            </div>

            {/* Error */}
            {error && <div className="pu-error">⚠ {error}</div>}

            {/* Analyzing steps */}
            {loading && (
              <div className="pu-steps">
                {ANALYSIS_STEPS.map((s, i) => (
                  <div key={i}
                    className={`pu-step${i === step ? ' active' : i < step ? ' done' : ''}`}>
                    <span className="pu-step-icon">
                      {i < step ? '✓' : i === step ? '›' : '·'}
                    </span>
                    {s.icon} {s.label}
                    {i < ANALYSIS_STEPS.length - 1 && (
                      <span className={`pu-step-line${i < step ? ' filled' : ''}`} />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* CTA */}
            <button
              type="submit"
              disabled={!path.trim() || loading}
              className="pu-btn"
            >
              <div className="pu-btn-inner">
                {loading ? (
                  <>
                    <div className="pu-spinner" />
                    Analyzing Repository...
                  </>
                ) : (
                  <>
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                      <path d="M3 7.5L12 7.5M8.5 3.5L12.5 7.5L8.5 11.5"
                        stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Analyze Repository
                  </>
                )}
              </div>
            </button>
          </form>

          {/* Divider */}
          <div className="pu-divider">
            <div className="pu-divider-line" />
            <span className="pu-divider-text">What you unlock</span>
            <div className="pu-divider-line" />
          </div>

          {/* 8 features in 4×2 grid */}
          <div className="pu-features" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
            {FEATURES.map((f, i) => (
              <div className="pu-feat" key={i}
                style={{ animationDelay: `${0.5 + i * 0.04}s`, animation: 'fadeUp 0.4s ease both' }}>
                <span className="pu-feat-icon">{f.icon}</span>
                <span className="pu-feat-label">{f.label}</span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="pu-footer">
            Supports <span>GitHub URLs</span> · GitLab · local paths
          </div>
        </div>
      </div>
    </>
  );
}