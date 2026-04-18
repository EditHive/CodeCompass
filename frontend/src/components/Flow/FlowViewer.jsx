import React, { useState, useRef, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { traceFlow } from '../../services/api';

// ─── Design token injection (matches RepoUpload system) ───────────────────
const STYLES = `

  .fv-root {
    height: 100%; display: flex; flex-direction: column;
    background: #070810; font-family: 'Syne', sans-serif;
    color: #e8eaf6; position: relative; overflow: hidden;
  }

  /* subtle animated grid bg */
  .fv-root::before {
    content: '';
    position: absolute; inset: 0; pointer-events: none; z-index: 0;
    background-image:
      linear-gradient(rgba(148, 163, 184,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(148, 163, 184,0.03) 1px, transparent 1px);
    background-size: 40px 40px;
    mask-image: radial-gradient(ellipse 100% 100% at 50% 0%, black 50%, transparent 100%);
  }

  .fv-content { position: relative; z-index: 1; display: flex; flex-direction: column; height: 100%; }

  /* ── header removed ── */

  /* ── input row ── */
  .fv-input-row {
    padding: 14px 20px;
    border-bottom: 1px solid rgba(148, 163, 184,0.1);
    background: rgba(13,15,26,0.5); flex-shrink: 0;
  }
  .fv-input-inner { display: flex; gap: 8px; align-items: center; }
  .fv-input-wrap { flex: 1; position: relative; }
  .fv-input-prefix {
    position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
    font-size: 10px; font-family: 'JetBrains Mono', monospace;
    color: #4a4d6e; pointer-events: none; letter-spacing: 0;
  }
  .fv-input {
    width: 100%; padding: 10px 12px 10px 52px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(148, 163, 184,0.15); border-radius: 10px;
    color: #e8eaf6; font-size: 12px; font-family: 'JetBrains Mono', monospace;
    outline: none; transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
    caret-color: #22d3ee;
  }
  .fv-input::placeholder { color: #4a4d6e; }
  .fv-input:focus {
    border-color: rgba(34,211,238,0.35);
    background: rgba(34,211,238,0.03);
    box-shadow: 0 0 0 3px rgba(34,211,238,0.06);
  }
  .fv-input.has-value { border-color: rgba(34,211,238,0.25); }

  .fv-btn {
    padding: 10px 16px; border: none; border-radius: 10px;
    background: linear-gradient(135deg, #22d3ee, #06b6d4);
    color: #070810; font-family: 'Syne', sans-serif;
    font-size: 12px; font-weight: 700; letter-spacing: 0.05em;
    cursor: pointer; display: flex; align-items: center; gap-6px;
    gap: 6px; flex-shrink: 0;
    transition: transform 0.15s, box-shadow 0.2s, opacity 0.2s;
    box-shadow: 0 4px 16px rgba(34,211,238,0.25); position: relative; overflow: hidden;
  }
  .fv-btn::after {
    content: ''; position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    animation: fvShimmer 2.5s ease-in-out infinite;
  }
  @keyframes fvShimmer { 0%{left:-100%} 50%,100%{left:160%} }
  .fv-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(34,211,238,0.4); }
  .fv-btn:active:not(:disabled) { transform: scale(0.97); }
  .fv-btn:disabled { opacity: 0.3; cursor: not-allowed; }

  .fv-spinner {
    width: 13px; height: 13px; border-radius: 50%;
    border: 2px solid rgba(7,8,16,0.3); border-top-color: #070810;
    animation: fvSpin 0.7s linear infinite;
  }
  @keyframes fvSpin { to { transform: rotate(360deg); } }

  /* ── scroll body ── */
  .fv-body {
    flex: 1; overflow-y: auto; padding: 16px 20px;
    scrollbar-width: thin; scrollbar-color: rgba(148, 163, 184,0.2) transparent;
  }
  .fv-body::-webkit-scrollbar { width: 4px; }
  .fv-body::-webkit-scrollbar-thumb { background: rgba(148, 163, 184,0.2); border-radius: 2px; }

  /* ── error ── */
  .fv-error {
    padding: 10px 14px; margin-bottom: 14px;
    background: rgba(244,63,94,0.06); border: 1px solid rgba(244,63,94,0.2);
    border-radius: 10px; font-size: 11px; font-family: 'JetBrains Mono', monospace;
    color: #f43f5e; animation: fvFadeUp 0.3s ease;
  }

  /* ── empty state ── */
  .fv-empty {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    height: 200px; gap: 12px; animation: fvFadeUp 0.4s ease;
  }
  .fv-empty-icon {
    width: 48px; height: 48px; border-radius: 14px;
    border: 1px solid rgba(148, 163, 184,0.2);
    background: rgba(148, 163, 184,0.05);
    display: flex; align-items: center; justify-content: center; font-size: 20px;
  }
  .fv-empty-text { font-size: 11px; color: #4a4d6e; font-family: 'JetBrains Mono', monospace; text-align: center; line-height: 1.6; }

  /* ── summary card ── */
  .fv-summary {
    margin-bottom: 20px; padding: 14px 16px;
    background: rgba(34,211,238,0.04); border: 1px solid rgba(34,211,238,0.15);
    border-radius: 12px; animation: fvFadeUp 0.4s ease;
    position: relative; overflow: hidden;
  }
  .fv-summary::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(34,211,238,0.5), transparent);
  }
  .fv-summary-title {
    font-size: 13px; font-weight: 700; color: #22d3ee; margin-bottom: 10px;
    display: flex; align-items: center; gap: 8px;
  }
  .fv-summary-title span { font-family: 'JetBrains Mono', monospace; }
  .fv-summary-meta { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
  .fv-summary-stat {
    font-size: 10px; font-family: 'JetBrains Mono', monospace;
    padding: 3px 8px; border-radius: 6px;
    background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
    color: #7c7fa8;
  }
  .fv-file-chip {
    font-size: 10px; font-family: 'JetBrains Mono', monospace;
    padding: 3px 9px; border-radius: 6px; cursor: default;
    background: rgba(148, 163, 184,0.08); border: 1px solid rgba(148, 163, 184,0.2);
    color: #cbd5e1; transition: background 0.2s;
  }
  .fv-file-chip:hover { background: rgba(148, 163, 184,0.15); }

  /* ── timeline ── */
  .fv-timeline { display: flex; flex-direction: column; gap: 0; }

  /* ── step card ── */
  .fv-step {
    display: flex; gap: 0; animation: fvFadeUp 0.4s ease both;
  }

  /* left rail */
  .fv-step-rail {
    display: flex; flex-direction: column; align-items: center;
    width: 36px; flex-shrink: 0; padding-top: 2px;
  }
  .fv-step-node {
    width: 28px; height: 28px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-family: 'JetBrains Mono', monospace;
    font-weight: 600; flex-shrink: 0; position: relative; z-index: 1;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .fv-step:hover .fv-step-node { transform: scale(1.08); }

  .fv-step-connector {
    width: 1px; flex: 1; min-height: 16px; margin: 3px 0;
    position: relative;
  }
  .fv-step-connector::after {
    content: ''; position: absolute;
    top: 0; bottom: 0; left: 0; width: 1px;
    background: linear-gradient(180deg, var(--conn-color, rgba(148, 163, 184,0.25)), transparent);
  }

  /* arrow tick on connector */
  .fv-step-arrow {
    width: 8px; height: 8px; display: flex; align-items: center; justify-content: center;
    color: #4a4d6e; font-size: 9px; margin: 1px auto;
  }

  /* right content */
  .fv-step-body {
    flex: 1; padding: 10px 12px 12px; margin-bottom: 6px;
    border-radius: 12px; border: 1px solid transparent;
    cursor: pointer; transition: background 0.2s, border-color 0.2s;
    background: rgba(255,255,255,0.02);
    min-width: 0;
  }
  .fv-step-body:hover { background: rgba(255,255,255,0.04); }
  .fv-step-body.expanded { border-color: rgba(148, 163, 184,0.18) !important; }

  .fv-step-top { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 4px; }
  .fv-step-emoji { font-size: 14px; line-height: 1; }
  .fv-step-fn {
    font-size: 12px; font-weight: 600; font-family: 'JetBrains Mono', monospace;
    color: #e8eaf6; letter-spacing: 0.01em;
  }
  .fv-step-fn span { opacity: 0.5; }
  .fv-op-badge {
    font-size: 9px; font-family: 'JetBrains Mono', monospace;
    padding: 2px 7px; border-radius: 5px; font-weight: 500; letter-spacing: 0.06em;
    flex-shrink: 0;
  }
  .fv-step-expand-icon {
    margin-left: auto; font-size: 10px; color: #4a4d6e;
    transition: transform 0.2s; flex-shrink: 0;
  }
  .fv-step-expand-icon.open { transform: rotate(180deg); }

  .fv-step-desc {
    font-size: 11px; color: #7c7fa8; font-family: 'JetBrains Mono', monospace;
    line-height: 1.55; margin-bottom: 6px;
  }
  .fv-step-file {
    font-size: 10px; color: #4a4d6e; font-family: 'JetBrains Mono', monospace;
    display: flex; align-items: center; gap: 5px;
  }
  .fv-step-file-dot {
    width: 3px; height: 3px; border-radius: 50%; background: currentColor; opacity: 0.5;
  }

  /* code snippet */
  .fv-code-wrap {
    margin-top: 10px; border-radius: 8px; overflow: hidden;
    border: 1px solid rgba(148, 163, 184,0.12);
    animation: fvFadeUp 0.25s ease;
  }
  .fv-code-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 6px 12px; background: rgba(148, 163, 184,0.06);
    border-bottom: 1px solid rgba(148, 163, 184,0.1);
  }
  .fv-code-lang { font-size: 9px; font-family: 'JetBrains Mono', monospace; color: #94a3b8; letter-spacing: 0.1em; font-weight: 600; }
  .fv-code-copy {
    font-size: 9px; font-family: 'JetBrains Mono', monospace; color: #4a4d6e;
    background: none; border: none; cursor: pointer; padding: 0; letter-spacing: 0.06em;
    transition: color 0.2s;
  }
  .fv-code-copy:hover { color: #cbd5e1; }
  .fv-code {
    padding: 12px 14px; max-height: 160px; overflow-y: auto;
    background: rgba(7,8,16,0.8); font-size: 11px; line-height: 1.7;
    font-family: 'JetBrains Mono', monospace; color: #a5b4fc;
    white-space: pre; scrollbar-width: thin;
    scrollbar-color: rgba(148, 163, 184,0.2) transparent;
  }
  .fv-code::-webkit-scrollbar { height: 3px; }
  .fv-code::-webkit-scrollbar-thumb { background: rgba(148, 163, 184,0.2); border-radius: 2px; }

  /* no-result */
  .fv-no-result {
    text-align: center; padding: 40px 20px;
    font-size: 11px; color: #4a4d6e; font-family: 'JetBrains Mono', monospace;
  }

  @keyframes fvFadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* quick suggestions */
  .fv-suggestions { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }
  .fv-suggestion {
    font-size: 10px; font-family: 'JetBrains Mono', monospace;
    padding: 4px 10px; border-radius: 6px;
    background: rgba(255,255,255,0.03); border: 1px solid rgba(148, 163, 184,0.15);
    color: #7c7fa8; cursor: pointer; transition: all 0.15s; letter-spacing: 0.03em;
  }
  .fv-suggestion:hover { background: rgba(148, 163, 184,0.08); border-color: rgba(148, 163, 184,0.3); color: #cbd5e1; }
`;

// ─── Operation metadata ────────────────────────────────────────────────────
const OPS = {
  authentication: { color: '#ec4899', glow: 'rgba(236,72,153,0.25)', icon: '🔐', label: 'auth' },
  database:       { color: '#10b981', glow: 'rgba(16,185,129,0.25)', icon: '💾', label: 'db' },
  api_call:       { color: '#94a3b8', glow: 'rgba(148, 163, 184,0.25)', icon: '🌐', label: 'api' },
  validation:     { color: '#22d3ee', glow: 'rgba(34,211,238,0.25)', icon: '✅', label: 'validate' },
  logging:        { color: '#71717a', glow: 'rgba(113,113,122,0.2)', icon: '📝', label: 'log' },
  initialization: { color: '#475569', glow: 'rgba(71, 85, 105,0.25)', icon: '🚀', label: 'init' },
  payment:        { color: '#eab308', glow: 'rgba(234,179,8,0.25)',  icon: '💳', label: 'payment' },
  notification:   { color: '#f97316', glow: 'rgba(249,115,22,0.25)', icon: '📧', label: 'notify' },
  computation:    { color: '#64748b', glow: 'rgba(100, 116, 139,0.25)', icon: '⚙️', label: 'compute' },
};
const DEFAULT_OP = { color: '#7c7fa8', glow: 'rgba(124,127,168,0.2)', icon: '⚙️', label: 'exec' };

const SUGGESTIONS = ['process_payment', 'login', 'register', 'send_email', 'validate_token'];

// ─── StepCard ─────────────────────────────────────────────────────────────
function StepCard({ step, index, total, isExpanded, onToggle }) {
  const op = OPS[step.operation] || DEFAULT_OP;
  const isLast = index === total - 1;
  const [copied, setCopied] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(step.code_snippet || '').then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="fv-step" style={{ animationDelay: `${index * 0.06}s` }}>
      {/* Left rail */}
      <div className="fv-step-rail">
        <div
          className="fv-step-node"
          style={{
            background: `${op.color}12`,
            color: op.color,
            border: `1px solid ${op.color}30`,
            boxShadow: isExpanded ? `0 0 12px ${op.glow}` : 'none',
          }}
        >
          {step.step}
        </div>
        {!isLast && (
          <div
            className="fv-step-connector"
            style={{ '--conn-color': `${op.color}30` }}
          >
            <div className="fv-step-arrow">▾</div>
          </div>
        )}
      </div>

      {/* Body */}
      <div
        className={`fv-step-body${isExpanded ? ' expanded' : ''}`}
        onClick={onToggle}
        style={{ borderColor: isExpanded ? `${op.color}25` : 'transparent' }}
      >
        {/* Top row */}
        <div className="fv-step-top">
          <span className="fv-step-emoji">{op.icon}</span>
          <span className="fv-step-fn">
            {step.function}<span>()</span>
          </span>
          <span
            className="fv-op-badge"
            style={{
              background: `${op.color}10`,
              color: op.color,
              border: `1px solid ${op.color}20`,
            }}
          >
            {op.label}
          </span>
          <span className={`fv-step-expand-icon${isExpanded ? ' open' : ''}`}>▾</span>
        </div>

        {/* Description */}
        <p className="fv-step-desc">{step.description}</p>

        {/* File */}
        <div className="fv-step-file" style={{ color: op.color }}>
          <span style={{ opacity: 0.5 }}>◈</span>
          <span style={{ color: '#4a4d6e' }}>
            {step.file}
            <span style={{ color: '#94a3b8', opacity: 0.7 }}>:{step.line_start}</span>
          </span>
        </div>

        {/* Code snippet */}
        {isExpanded && step.code_snippet && (
          <div className="fv-code-wrap">
            <div className="fv-code-header">
              <span className="fv-code-lang">SOURCE</span>
              <button className="fv-code-copy" onClick={handleCopy}>
                {copied ? '✓ copied' : 'copy'}
              </button>
            </div>
            <pre className="fv-code">{step.code_snippet}</pre>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────
export default function FlowViewer({ onHighlightFlow }) {
  const [funcName, setFuncName] = useState('');
  const { data: flowData, loading, error, execute: runTrace } = useApi(traceFlow);
  const [expandedStep, setExpandedStep] = useState(null);
  const inputRef = useRef(null);

  const handleTrace = async () => {
    if (!funcName.trim()) return;
    setExpandedStep(null);
    const result = await runTrace(funcName.trim());
    if (result?.steps) {
      onHighlightFlow?.(result.steps.map(s => s.node_id));
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleTrace();
    if (e.key === 'Escape') { setFuncName(''); inputRef.current?.blur(); }
  };

  const pickSuggestion = (s) => {
    setFuncName(s);
    setTimeout(handleTrace, 50);
  };

  const hasData  = flowData && flowData.steps?.length > 0;
  const isEmpty  = flowData && flowData.steps?.length === 0;
  const showIdle = !flowData && !loading && !error;

  return (
    <>
      <style>{STYLES}</style>
      <div className="fv-root">
        <div className="fv-content">



          {/* ── Input ── */}
          <div className="fv-input-row">
            <div className="fv-input-inner">
              <div className="fv-input-wrap">
                <span className="fv-input-prefix">fn›</span>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="process_payment, login, validate_token..."
                  value={funcName}
                  onChange={e => setFuncName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={`fv-input${funcName ? ' has-value' : ''}`}
                  autoComplete="off"
                  spellCheck="false"
                />
              </div>
              <button
                onClick={handleTrace}
                disabled={!funcName.trim() || loading}
                className="fv-btn"
              >
                {loading ? (
                  <><div className="fv-spinner" /> Tracing</>
                ) : (
                  <>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6h7M6.5 2.5L10 6l-3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Trace
                  </>
                )}
              </button>
            </div>

            {/* Quick suggestions */}
            {showIdle && (
              <div className="fv-suggestions">
                {SUGGESTIONS.map(s => (
                  <button key={s} className="fv-suggestion" onClick={() => pickSuggestion(s)}>
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Body ── */}
          <div className="fv-body">

            {/* Error */}
            {error && <div className="fv-error">⚠ {error}</div>}

            {/* Idle / welcome */}
            {showIdle && (
              <div className="fv-empty" style={{ paddingTop: 40 }}>
                <div style={{
                  width: 48, height: 48,
                  background: 'linear-gradient(135deg, #94a3b8 0%, #4ade80 100%)',
                  borderRadius: 14,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 16px rgba(74,222,128,0.2)',
                  fontSize: 22,
                  marginBottom: 10,
                }}>
                  🔄
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#f0f1f7', letterSpacing: '-0.01em', fontFamily: 'Inter, sans-serif' }}>
                  Execution Flow Tracker
                </div>
                <div className="fv-empty-text" style={{ marginTop: 8 }}>
                  Enter a function name above to trace<br />its full execution path across files
                </div>
              </div>
            )}

            {/* Loading skeleton */}
            {loading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, animation: 'fvFadeUp 0.3s ease' }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{
                    height: 68, borderRadius: 12,
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(148, 163, 184,0.08)',
                    animation: `fvPulse 1.4s ease-in-out ${i * 0.1}s infinite`,
                  }} />
                ))}
                <style>{`@keyframes fvPulse { 0%,100%{opacity:.4} 50%{opacity:.7} }`}</style>
              </div>
            )}

            {/* Results */}
            {hasData && (
              <div style={{ animation: 'fvFadeUp 0.4s ease' }}>

                {/* Summary */}
                <div className="fv-summary">
                  <div className="fv-summary-title">
                    <span style={{ fontSize: 16 }}>🔄</span>
                    <span>{flowData.entry_point.name}()</span>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ opacity: 0.4 }}>
                      <path d="M3 7h8M8 4l3 3-3 3" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    <span style={{ color: '#7c7fa8', fontWeight: 400, fontSize: 11 }}>
                      {flowData.total_steps} execution steps
                    </span>
                  </div>
                  <div className="fv-summary-meta">
                    <span className="fv-summary-stat">
                      {flowData.files_involved.length} files
                    </span>
                    {flowData.files_involved.map((f, i) => (
                      <span key={i} className="fv-file-chip">
                        {f.split('/').pop()}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Timeline */}
                <div className="fv-timeline">
                  {flowData.steps.map((step, i) => (
                    <StepCard
                      key={i}
                      step={step}
                      index={i}
                      total={flowData.steps.length}
                      isExpanded={expandedStep === i}
                      onToggle={() => setExpandedStep(expandedStep === i ? null : i)}
                    />
                  ))}
                </div>

                {/* Footer */}
                <div style={{
                  marginTop: 20, padding: '10px 14px',
                  borderRadius: 8, background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(148, 163, 184,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: '#4a4d6e' }}>
                    Click any step to view source
                  </span>
                  <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: '#4a4d6e' }}>
                    {flowData.total_steps} steps · {flowData.files_involved.length} files
                  </span>
                </div>
              </div>
            )}

            {/* No results */}
            {isEmpty && (
              <div className="fv-no-result">
                No execution steps found for <span style={{ color: '#22d3ee' }}>"{funcName}"</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}