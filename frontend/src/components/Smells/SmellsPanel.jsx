import React, { useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { getSmells } from '../../services/api';
import { HiOutlineShieldCheck, HiOutlineExclamationCircle } from 'react-icons/hi';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_INFO = {
  complexity:   { label: 'Complexity',   color: '#f43f5e', icon: '◈' },
  coupling:     { label: 'Coupling',     color: '#f97316', icon: '⬡' },
  design:       { label: 'Design',       color: '#eab308', icon: '◇' },
  architecture: { label: 'Architecture', color: '#ec4899', icon: '△' },
};

const SEVERITY_STYLES = {
  error:   { color: '#f43f5e', label: 'Critical', rank: 0 },
  warning: { color: '#f59e0b', label: 'Warning',  rank: 1 },
  info:    { color: '#22d3ee', label: 'Info',     rank: 2 },
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const STYLES = `

  .sp-root {
    font-family: 'Inter', sans-serif;
    background: #080b14;
    color: #e2e8f0;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    position: relative;
  }

  /* subtle starfield */
  .sp-root::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      radial-gradient(1px 1px at 10% 15%, rgba(255,255,255,0.25) 0%, transparent 100%),
      radial-gradient(1px 1px at 40% 60%, rgba(255,255,255,0.15) 0%, transparent 100%),
      radial-gradient(1px 1px at 70% 20%, rgba(255,255,255,0.2)  0%, transparent 100%),
      radial-gradient(1px 1px at 85% 75%, rgba(255,255,255,0.18) 0%, transparent 100%),
      radial-gradient(80px 80px at 90% 10%, rgba(244,63,94,0.04) 0%, transparent 100%);
    pointer-events: none;
    z-index: 0;
  }

  .sp-inner {
    position: relative;
    z-index: 1;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  /* ── header removed ── */

  /* ── Scroll body ── */
  .sp-body {
    flex: 1;
    overflow-y: auto;
    padding: 14px 14px 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.08) transparent;
  }
  .sp-body::-webkit-scrollbar { width: 4px; }
  .sp-body::-webkit-scrollbar-track { background: transparent; }
  .sp-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }

  /* ── Health card ── */
  .sp-health {
    border-radius: 12px;
    padding: 16px;
    border: 1px solid;
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .sp-health-ring {
    position: relative;
    width: 56px;
    height: 56px;
    flex-shrink: 0;
  }

  .sp-health-ring svg {
    transform: rotate(-90deg);
  }

  .sp-health-ring-label {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  .sp-health-text {}

  .sp-health-score-label {
    font-size: 11px;
    font-weight: 600;
    color: rgba(148,163,184,0.8);
    margin-bottom: 3px;
  }

  .sp-health-tagline {
    font-size: 10px;
    color: rgba(148,163,184,0.45);
  }

  /* ── Severity grid ── */
  .sp-sev-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .sp-sev-card {
    border-radius: 10px;
    padding: 10px 8px;
    text-align: center;
    border: 1px solid;
  }

  .sp-sev-num {
    font-size: 20px;
    font-weight: 700;
    line-height: 1;
    margin-bottom: 4px;
    letter-spacing: -0.02em;
  }

  .sp-sev-label {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: rgba(148,163,184,0.5);
  }

  /* ── Section ── */
  .sp-section-head {
    display: flex;
    align-items: center;
    gap: 7px;
    margin-bottom: 8px;
  }

  .sp-section-icon {
    font-size: 11px;
    width: 20px;
    height: 20px;
    border-radius: 5px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid;
    flex-shrink: 0;
    font-style: normal;
  }

  .sp-section-label {
    font-size: 11px;
    font-weight: 600;
    color: rgba(226,232,240,0.85);
    letter-spacing: 0.02em;
  }

  .sp-section-count {
    font-size: 10px;
    color: rgba(148,163,184,0.4);
    font-weight: 400;
    margin-left: 2px;
  }

  .sp-section-line {
    flex: 1;
    height: 1px;
    background: rgba(255,255,255,0.05);
  }

  /* ── Smell card ── */
  .sp-smell {
    border-radius: 9px;
    padding: 10px 11px;
    border: 1px solid;
    margin-bottom: 6px;
    transition: border-color 0.15s;
  }
  .sp-smell:last-child { margin-bottom: 0; }

  .sp-smell-top {
    display: flex;
    align-items: flex-start;
    gap: 9px;
    margin-bottom: 6px;
  }

  .sp-smell-icon {
    width: 15px;
    height: 15px;
    flex-shrink: 0;
    margin-top: 1px;
  }

  .sp-smell-msg {
    font-size: 11px;
    font-weight: 500;
    color: rgba(226,232,240,0.9);
    line-height: 1.5;
    flex: 1;
  }

  .sp-sev-badge {
    font-size: 9px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    padding: 2px 6px;
    border-radius: 4px;
    border: 1px solid;
    flex-shrink: 0;
    align-self: flex-start;
  }

  .sp-smell-file {
    font-size: 10px;
    color: rgba(148,163,184,0.45);
    font-family: 'Courier New', monospace;
    margin-bottom: 5px;
    padding-left: 24px;
  }

  .sp-smell-suggestion {
    font-size: 10px;
    color: rgba(148,163,184,0.55);
    line-height: 1.5;
    padding-left: 24px;
    padding-top: 6px;
    border-top: 1px solid rgba(255,255,255,0.04);
    display: flex;
    gap: 5px;
    align-items: flex-start;
  }

  .sp-hint-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: rgba(34,211,238,0.12);
    border: 1px solid rgba(34,211,238,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    margin-top: 1px;
    font-size: 7px;
    color: #22d3ee;
  }

  /* ── Affected files ── */
  .sp-file-row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 10px;
    border-radius: 8px;
    background: rgba(255,255,255,0.025);
    border: 1px solid rgba(255,255,255,0.05);
    margin-bottom: 5px;
    transition: background 0.12s;
  }
  .sp-file-row:last-child { margin-bottom: 0; }
  .sp-file-row:hover { background: rgba(255,255,255,0.04); }

  .sp-file-rank {
    font-size: 9px;
    font-weight: 700;
    color: rgba(148,163,184,0.3);
    width: 14px;
    text-align: center;
    flex-shrink: 0;
  }

  .sp-file-name {
    font-size: 11px;
    font-family: 'Courier New', monospace;
    color: rgba(226,232,240,0.75);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .sp-file-bar-wrap {
    width: 48px;
    height: 3px;
    background: rgba(255,255,255,0.06);
    border-radius: 2px;
    overflow: hidden;
    flex-shrink: 0;
  }

  .sp-file-bar {
    height: 100%;
    border-radius: 2px;
    background: #f43f5e;
  }

  .sp-file-count {
    font-size: 10px;
    font-weight: 600;
    color: #f87171;
    flex-shrink: 0;
    min-width: 28px;
    text-align: right;
  }

  /* ── Loading / Error ── */
  .sp-center {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 10px;
  }

  .sp-spinner {
    width: 28px;
    height: 28px;
    border: 2px solid rgba(255,255,255,0.06);
    border-top-color: #f59e0b;
    border-radius: 50%;
    animation: sp-spin 0.8s linear infinite;
  }

  @keyframes sp-spin { to { transform: rotate(360deg); } }

  .sp-loading-text {
    font-size: 11px;
    color: rgba(148,163,184,0.45);
    letter-spacing: 0.04em;
  }

  .sp-error-text {
    font-size: 11px;
    color: #f87171;
    text-align: center;
    padding: 0 16px;
  }

  @keyframes sp-fadein {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .sp-fadein { animation: sp-fadein 0.22s ease both; }
`;

// ─── Health ring ──────────────────────────────────────────────────────────────

function HealthRing({ score, color }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className="sp-health-ring">
      <svg width="56" height="56" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
        <circle
          cx="28" cy="28" r={r}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          style={{ transition: 'stroke-dasharray 0.6s ease', filter: `drop-shadow(0 0 4px ${color}80)` }}
        />
      </svg>
      <div className="sp-health-ring-label" style={{ color }}>{score}</div>
    </div>
  );
}

// ─── SmellsPanel ──────────────────────────────────────────────────────────────

export default function SmellsPanel() {
  const { data, loading, error, execute } = useApi(getSmells);
  useEffect(() => { execute(); }, []);

  if (loading) return (
    <div className="sp-root">
      <style>{STYLES}</style>
      <div className="sp-inner">
        <div className="sp-center">
          <div className="sp-spinner" />
          <p className="sp-loading-text">Detecting code smells…</p>
        </div>
      </div>
    </div>
  );

  if (error) return (
    <div className="sp-root">
      <style>{STYLES}</style>
      <div className="sp-inner">
        <div className="sp-center">
          <p className="sp-error-text">{error}</p>
        </div>
      </div>
    </div>
  );

  if (!data) return null;

  const healthColor =
    data.health_score >= 80 ? '#10b981' :
    data.health_score >= 50 ? '#f59e0b' : '#f43f5e';

  const healthLabel =
    data.health_score >= 80 ? 'Healthy codebase' :
    data.health_score >= 50 ? 'Needs attention'  : 'Critical issues found';

  // max smell count for bar scaling
  const affectedFiles = data.summary?.most_affected_files || [];
  const maxSmells = affectedFiles.length ? Math.max(...affectedFiles.map(f => f.smell_count)) : 1;

  return (
    <div className="sp-root">
      <style>{STYLES}</style>
      <div className="sp-inner">



        <div className="sp-body">

          {/* Title Intro */}
          <div className="sp-fadein" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 4px', marginBottom: 6 }}>
            <div style={{
              width: 32, height: 32,
              background: 'linear-gradient(135deg, #f43f5e 0%, #f59e0b 100%)',
              borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(244,63,94,0.25)',
              fontSize: 16, color: '#fff',
            }}>
              <HiOutlineShieldCheck />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#f0f1f7', letterSpacing: '-0.01em', fontFamily: 'Inter, sans-serif' }}>
                Code Risk Detect
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Anti-patterns &amp; health issues</div>
            </div>
          </div>

          {/* Health score */}
          <div
            className="sp-health sp-fadein"
            style={{
              background:   `${healthColor}08`,
              borderColor:  `${healthColor}20`,
            }}
          >
            <HealthRing score={data.health_score} color={healthColor} />
            <div className="sp-health-text">
              <div className="sp-health-score-label" style={{ color: healthColor }}>
                {healthLabel}
              </div>
              <div className="sp-health-tagline">
                {data.total_smells} issue{data.total_smells !== 1 ? 's' : ''} detected across codebase
              </div>
            </div>
          </div>

          {/* Severity summary */}
          {data.summary?.by_severity && (
            <div className="sp-sev-grid sp-fadein" style={{ animationDelay: '60ms' }}>
              {Object.entries(data.summary.by_severity)
                .sort(([a], [b]) => (SEVERITY_STYLES[a]?.rank ?? 9) - (SEVERITY_STYLES[b]?.rank ?? 9))
                .map(([sev, count]) => {
                  const s = SEVERITY_STYLES[sev] || SEVERITY_STYLES.info;
                  return (
                    <div
                      key={sev}
                      className="sp-sev-card"
                      style={{ background: `${s.color}07`, borderColor: `${s.color}1a` }}
                    >
                      <div className="sp-sev-num" style={{ color: s.color }}>{count}</div>
                      <div className="sp-sev-label">{s.label}</div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* Categories */}
          {Object.entries(data.categories || {}).map(([category, smells], catIdx) => {
            const cat = CATEGORY_INFO[category] || { label: category, color: '#71717a', icon: '◉' };
            return (
              <section
                key={category}
                className="sp-fadein"
                style={{ animationDelay: `${(catIdx + 2) * 70}ms` }}
              >
                {/* Section heading */}
                <div className="sp-section-head">
                  <span
                    className="sp-section-icon"
                    style={{ color: cat.color, background: `${cat.color}10`, borderColor: `${cat.color}22` }}
                  >
                    {cat.icon}
                  </span>
                  <span className="sp-section-label">{cat.label}</span>
                  <span className="sp-section-count">({smells.length})</span>
                  <div className="sp-section-line" />
                </div>

                {/* Smell cards */}
                {smells.map((smell, i) => {
                  const sev = SEVERITY_STYLES[smell.severity] || SEVERITY_STYLES.info;
                  return (
                    <div
                      key={i}
                      className="sp-smell"
                      style={{ background: `${sev.color}05`, borderColor: `${sev.color}14` }}
                    >
                      <div className="sp-smell-top">
                        <HiOutlineExclamationCircle
                          className="sp-smell-icon"
                          style={{ color: sev.color }}
                        />
                        <span className="sp-smell-msg">{smell.message}</span>
                        <span
                          className="sp-sev-badge"
                          style={{
                            color:       sev.color,
                            background:  `${sev.color}10`,
                            borderColor: `${sev.color}22`,
                          }}
                        >
                          {smell.severity}
                        </span>
                      </div>

                      {(smell.file || smell.files?.length > 0) && (
                        <div className="sp-smell-file">
                          {smell.file || smell.files?.join(' → ')}
                        </div>
                      )}

                      {smell.suggestion && (
                        <div className="sp-smell-suggestion">
                          <span className="sp-hint-dot">i</span>
                          <span>{smell.suggestion}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </section>
            );
          })}

          {/* Most affected files */}
          {affectedFiles.length > 0 && (
            <section className="sp-fadein" style={{ animationDelay: '300ms' }}>
              <div className="sp-section-head">
                <span
                  className="sp-section-icon"
                  style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.2)' }}
                >
                  ▦
                </span>
                <span className="sp-section-label">Most Affected</span>
                <div className="sp-section-line" />
              </div>

              {affectedFiles.map((f, i) => (
                <div key={i} className="sp-file-row">
                  <span className="sp-file-rank">{i + 1}</span>
                  <span className="sp-file-name">{f.file.split('/').pop()}</span>
                  <div className="sp-file-bar-wrap">
                    <div
                      className="sp-file-bar"
                      style={{ width: `${(f.smell_count / maxSmells) * 100}%` }}
                    />
                  </div>
                  <span className="sp-file-count">{f.smell_count}</span>
                </div>
              ))}
            </section>
          )}

        </div>
      </div>
    </div>
  );
}
