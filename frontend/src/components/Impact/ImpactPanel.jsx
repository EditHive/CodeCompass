import React, { useState, useRef, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { analyzeImpact, getNodes } from '../../services/api';
import {
  HiOutlineLightningBolt,
  HiOutlineExclamationCircle,
  HiOutlineChevronRight,
  HiOutlineSearch,
  HiOutlineSparkles,
  HiOutlineLocationMarker,
} from 'react-icons/hi';

/* ─── constants ─────────────────────────────────────────────────────── */

const SEVERITY = {
  direct:   { color: '#f43f5e', glow: 'rgba(244,63,94,0.35)', bg: 'rgba(244,63,94,0.08)', label: 'Direct',   gradient: 'linear-gradient(135deg, #f43f5e, #e11d48)' },
  indirect: { color: '#f97316', glow: 'rgba(249,115,22,0.35)', bg: 'rgba(249,115,22,0.08)', label: 'Indirect', gradient: 'linear-gradient(135deg, #f97316, #ea580c)' },
  potential:{ color: '#eab308', glow: 'rgba(234,179,8,0.35)',  bg: 'rgba(234,179,8,0.08)',  label: 'Potential', gradient: 'linear-gradient(135deg, #eab308, #ca8a04)' },
};

const TYPE_COLORS = {
  file:     { dot: '#94a3b8', bg: 'rgba(148, 163, 184,0.12)',  text: '#cbd5e1' },
  function: { dot: '#22d3ee', bg: 'rgba(34,211,238,0.12)',  text: '#67e8f9' },
  class:    { dot: '#10b981', bg: 'rgba(16,185,129,0.12)',  text: '#34d399' },
};

/* ─── CSS-in-JS styles (we inject a <style> block for animations / pseudo-elements) ─── */

const panelCSS = `
  

  @keyframes ip-fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes ip-spin {
    to { transform: rotate(360deg); }
  }
  @keyframes ip-pulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }
  @keyframes ip-shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  @keyframes ip-glow {
    0%, 100% { box-shadow: 0 0 12px rgba(244,63,94,0.15); }
    50% { box-shadow: 0 0 24px rgba(244,63,94,0.3); }
  }
  @keyframes ip-countUp {
    from { opacity: 0; transform: scale(0.5); }
    to   { opacity: 1; transform: scale(1); }
  }

  .ip-panel { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; }
  .ip-panel * { box-sizing: border-box; }

  .ip-search-input:focus {
    border-color: rgba(244,63,94,0.4) !important;
    box-shadow: 0 0 0 3px rgba(244,63,94,0.08), 0 1px 3px rgba(0,0,0,0.2) !important;
  }
  .ip-search-input::placeholder {
    color: #484b6a;
  }

  .ip-btn-hover:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 6px 28px rgba(244,63,94,0.35) !important;
  }
  .ip-btn-hover:active:not(:disabled) {
    transform: translateY(0);
  }

  .ip-item:hover {
    background: rgba(255,255,255,0.04) !important;
    border-color: rgba(148, 163, 184,0.2) !important;
    transform: translateX(2px);
  }

  .ip-drop-item:hover {
    background: rgba(244,63,94,0.06) !important;
  }

  .ip-scroll::-webkit-scrollbar { width: 4px; }
  .ip-scroll::-webkit-scrollbar-track { background: transparent; }
  .ip-scroll::-webkit-scrollbar-thumb { background: rgba(148, 163, 184,0.15); border-radius: 4px; }
  .ip-scroll::-webkit-scrollbar-thumb:hover { background: rgba(148, 163, 184,0.3); }
`;

/* ─── markdown renderer ──────────────────────────────────────────────── */

function AiMarkdown({ text }) {
  return (
    <>
      {text.split('\n').map((line, i) => {
        const l = line.replace(/\*\*/g, '');
        if (!l.trim()) return null;
        if (l.trim().startsWith('-'))
          return (
            <div key={i} style={{ display: 'flex', gap: 8, paddingLeft: 2, marginBottom: 4 }}>
              <span style={{ color: '#64748b', flexShrink: 0, fontSize: 10, lineHeight: '18px' }}>●</span>
              <span style={{ lineHeight: 1.6 }}>{l.substring(l.indexOf('-') + 1).trim()}</span>
            </div>
          );
        if (/^\d+\./.test(l.trim()))
          return <p key={i} style={{ fontWeight: 600, color: '#c8cae0', marginTop: 6, marginBottom: 2, fontSize: 11.5 }}>{l.trim()}</p>;
        return <p key={i} style={{ marginBottom: 4, lineHeight: 1.65 }}>{l.trim()}</p>;
      })}
    </>
  );
}

/* ─── component ──────────────────────────────────────────────────────── */

export default function ImpactPanel({ onHighlightNodes, onSelectNode }) {
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [hoveredImpact, setHoveredImpact] = useState(null);
  const [expandedSection, setExpandedSection] = useState({ direct: true, indirect: true, potential: true });

  const { data: nodesData, execute: loadNodes } = useApi(getNodes);
  const { data: impactData, loading, error, execute: runImpact } = useApi(analyzeImpact);

  const searchRef = useRef(null);
  const dropRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (
        dropRef.current && !dropRef.current.contains(e.target) &&
        searchRef.current && !searchRef.current.contains(e.target)
      ) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleAnalyze = async () => {
    if (!selectedNode) return;
    const result = await runImpact(selectedNode.id);
    if (result && !result.error) {
      onHighlightNodes?.([
        { id: selectedNode.id, depth: 0 },
        ...result.direct.map(n => ({ ...n, depth: 1 })),
        ...result.indirect.map(n => ({ ...n })),
        ...result.potential.map(n => ({ ...n })),
      ]);
    }
  };

  const filteredNodes = nodesData?.nodes?.filter(n =>
    n.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.id.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const isDisabled = !selectedNode || loading;
  const totalImpacted = impactData ? (impactData.summary?.direct ?? 0) + (impactData.summary?.indirect ?? 0) + (impactData.summary?.potential ?? 0) : 0;

  return (
    <div className="ip-panel" style={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      color: '#e2e4f0',
      position: 'relative',
    }}>
      <style>{panelCSS}</style>

      {/* ── Search & Controls ── */}
      <div style={{
        padding: '14px 20px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column', gap: 10,
        flexShrink: 0,
      }}>
        {/* Search Input */}
        <div style={{ position: 'relative' }}>
          <span style={{
            position: 'absolute', left: 12, top: '50%',
            transform: 'translateY(-50%)', color: '#484b6a',
            pointerEvents: 'none', display: 'flex',
          }}>
            <HiOutlineSearch size={14} />
          </span>
          <input
            ref={searchRef}
            className="ip-search-input"
            style={{
              width: '100%', padding: '10px 12px 10px 34px',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10, fontSize: 12, color: '#e2e4f0',
              outline: 'none', transition: 'all 0.2s ease',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
            }}
            type="text"
            placeholder="Search files, functions, classes…"
            value={searchTerm}
            autoComplete="off"
            onFocus={() => { if (!nodesData) loadNodes(); if (searchTerm) setShowDropdown(true); }}
            onChange={e => { setSearchTerm(e.target.value); setShowDropdown(!!e.target.value); }}
          />
          {showDropdown && filteredNodes.length > 0 && (
            <div ref={dropRef} className="ip-scroll" style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 50,
              background: 'rgba(15,15,20,0.98)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 12, overflow: 'hidden', maxHeight: 180, overflowY: 'auto',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
              animation: 'ip-fadeUp 0.15s ease',
            }}>
              {filteredNodes.slice(0, 15).map(node => {
                const tc = TYPE_COLORS[node.type] || TYPE_COLORS.file;
                const isSelected = selectedNode?.id === node.id;
                return (
                  <div
                    key={node.id}
                    className="ip-drop-item"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 14px', fontSize: 12, cursor: 'pointer',
                      transition: 'background 0.12s',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      background: isSelected ? 'rgba(244,63,94,0.08)' : 'transparent',
                    }}
                    onMouseEnter={() => setHoveredItem(node.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    onClick={() => {
                      setSelectedNode(node);
                      setSearchTerm(node.label);
                      setShowDropdown(false);
                    }}
                  >
                    <span style={{
                      width: 7, height: 7, borderRadius: '50%',
                      background: tc.dot, flexShrink: 0,
                      boxShadow: `0 0 6px ${tc.dot}40`,
                    }} />
                    <span style={{
                      flex: 1, overflow: 'hidden', textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap', color: '#c8cae0',
                    }}>{node.label}</span>
                    <span style={{
                      fontSize: 9.5, fontWeight: 600, padding: '2px 7px',
                      borderRadius: 6, letterSpacing: '0.04em',
                      background: tc.bg, color: tc.text,
                    }}>{node.type}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected node pill */}
        {selectedNode && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', borderRadius: 10,
            background: 'rgba(148, 163, 184,0.06)',
            border: '1px solid rgba(148, 163, 184,0.15)',
            animation: 'ip-fadeUp 0.2s ease',
          }}>
            <span style={{
              width: 8, height: 8, borderRadius: '50%',
              background: TYPE_COLORS[selectedNode.type]?.dot || '#94a3b8',
              boxShadow: `0 0 8px ${TYPE_COLORS[selectedNode.type]?.dot || '#94a3b8'}50`,
            }} />
            <span style={{ fontSize: 12, color: '#c8cae0', flex: 1, fontWeight: 500 }}>
              {selectedNode.label}
            </span>
            <button
              onClick={() => { setSelectedNode(null); setSearchTerm(''); }}
              style={{
                background: 'none', border: 'none', color: '#555870',
                cursor: 'pointer', padding: '2px 4px', fontSize: 14,
                lineHeight: 1, borderRadius: 4,
                transition: 'color 0.15s',
              }}
              onMouseEnter={e => e.target.style.color = '#e2e4f0'}
              onMouseLeave={e => e.target.style.color = '#555870'}
            >×</button>
          </div>
        )}

        {/* Analyze button */}
        <button
          className="ip-btn-hover"
          onClick={handleAnalyze}
          disabled={isDisabled}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '11px 16px', borderRadius: 12, border: 'none',
            background: isDisabled
              ? 'rgba(255,255,255,0.04)'
              : 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
            color: isDisabled ? '#484b6a' : '#fff',
            fontSize: 12.5, fontWeight: 700, cursor: isDisabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease', letterSpacing: '0.02em', width: '100%',
            boxShadow: isDisabled ? 'none' : '0 4px 20px rgba(244,63,94,0.25)',
            fontFamily: 'inherit',
          }}
        >
          {loading ? (
            <><SpinnerIcon color="#fff" /> Analyzing…</>
          ) : (
            <><HiOutlineLightningBolt size={15} /> {selectedNode ? 'Simulate Impact' : 'Select a node first'}</>
          )}
        </button>
      </div>

      {/* ── Results ── */}
      <div className="ip-scroll" style={{
        flex: 1, overflowY: 'auto', padding: '16px 20px',
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        {error && (
          <div style={{
            background: 'rgba(244,63,94,0.08)', border: '1px solid rgba(244,63,94,0.2)',
            borderRadius: 12, padding: '12px 14px', fontSize: 12, color: '#f43f5e',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <HiOutlineExclamationCircle size={16} />
            {error}
          </div>
        )}

        {impactData && !impactData.error && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'ip-fadeUp 0.35s ease' }}>

            {/* Risk Score Banner */}
            <div style={{
              borderRadius: 14, padding: '16px',
              background: 'linear-gradient(135deg, rgba(244,63,94,0.06) 0%, rgba(249,115,22,0.04) 100%)',
              border: '1px solid rgba(244,63,94,0.12)',
              position: 'relative', overflow: 'hidden',
            }}>
              {/* Shimmer effect */}
              <div style={{
                position: 'absolute', inset: 0, opacity: 0.5,
                background: 'linear-gradient(90deg, transparent 0%, rgba(244,63,94,0.05) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
                animation: 'ip-shimmer 3s ease infinite',
              }} />

              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 14 }}>
                {/* Total count */}
                <div style={{
                  width: 52, height: 52,
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, rgba(244,63,94,0.15), rgba(244,63,94,0.05))',
                  border: '1px solid rgba(244,63,94,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <span style={{
                    fontSize: 22, fontWeight: 800, color: '#f43f5e',
                    animation: 'ip-countUp 0.4s ease',
                  }}>{totalImpacted}</span>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#e2e4f0', marginBottom: 6 }}>
                    Nodes Impacted
                  </div>
                  {/* Mini bar chart */}
                  <div style={{ display: 'flex', gap: 3, height: 6, borderRadius: 4, overflow: 'hidden' }}>
                    {totalImpacted > 0 && Object.entries(SEVERITY).map(([key, cfg]) => {
                      const count = impactData.summary?.[key] ?? 0;
                      const pct = (count / totalImpacted) * 100;
                      if (!pct) return null;
                      return (
                        <div key={key} style={{
                          width: `${pct}%`, height: '100%',
                          background: cfg.gradient,
                          borderRadius: 3,
                          transition: 'width 0.4s ease',
                        }} />
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Summary metric cards */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {Object.entries(SEVERITY).map(([key, cfg], idx) => (
                <div key={key} style={{
                  borderRadius: 12, padding: '14px 10px', textAlign: 'center',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex', flexDirection: 'column', gap: 6,
                  transition: 'all 0.2s ease',
                  animation: `ip-fadeUp 0.3s ease ${idx * 0.08}s both`,
                  cursor: 'default',
                  position: 'relative', overflow: 'hidden',
                }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = `${cfg.color}30`;
                    e.currentTarget.style.background = cfg.bg;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                  }}
                >
                  <span style={{
                    fontSize: 24, fontWeight: 800, color: cfg.color,
                    lineHeight: 1,
                    animation: 'ip-countUp 0.4s ease',
                  }}>
                    {impactData.summary?.[key] ?? 0}
                  </span>
                  <span style={{
                    fontSize: 9.5, fontWeight: 600, color: '#555870',
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                  }}>{cfg.label}</span>
                  {/* Bottom accent line */}
                  <div style={{
                    position: 'absolute', bottom: 0, left: '20%', right: '20%',
                    height: 2, borderRadius: 2,
                    background: cfg.gradient, opacity: 0.5,
                  }} />
                </div>
              ))}
            </div>

            {/* Source node card */}
            <div style={{
              borderRadius: 12,
              border: '1px solid rgba(148, 163, 184,0.12)',
              background: 'rgba(148, 163, 184,0.04)',
              padding: '12px 14px',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 10,
                background: 'rgba(148, 163, 184,0.1)',
                border: '1px solid rgba(148, 163, 184,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <HiOutlineLocationMarker size={15} color="#cbd5e1" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 9.5, fontWeight: 600, color: '#555870',
                  letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2,
                }}>Source Node</div>
                <div style={{
                  fontSize: 13, fontWeight: 600, color: '#cbd5e1',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{impactData.source?.label}</div>
              </div>
              <span style={{
                fontSize: 9, fontWeight: 600, padding: '3px 8px',
                borderRadius: 6,
                background: TYPE_COLORS[impactData.source?.type]?.bg || 'rgba(148, 163, 184,0.1)',
                color: TYPE_COLORS[impactData.source?.type]?.text || '#cbd5e1',
              }}>{impactData.source?.type}</span>
            </div>

            {/* AI Assessment */}
            {impactData.ai_summary && (
              <div style={{
                borderRadius: 14, overflow: 'hidden',
                border: '1px solid rgba(71, 85, 105,0.12)',
                background: 'rgba(71, 85, 105,0.03)',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 14px',
                  background: 'linear-gradient(135deg, rgba(71, 85, 105,0.08) 0%, rgba(71, 85, 105,0.02) 100%)',
                  borderBottom: '1px solid rgba(71, 85, 105,0.08)',
                }}>
                  <HiOutlineSparkles size={13} color="#64748b" />
                  <span style={{
                    fontSize: 10.5, fontWeight: 700, color: '#64748b',
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                  }}>AI Assessment</span>
                  <div style={{
                    marginLeft: 'auto',
                    width: 6, height: 6, borderRadius: '50%',
                    background: '#64748b',
                    animation: 'ip-pulse 2s ease infinite',
                  }} />
                </div>
                <div style={{
                  padding: '12px 14px', fontSize: 11.5, color: '#8b8fa8',
                  lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: 4,
                }}>
                  <AiMarkdown text={impactData.ai_summary} />
                </div>
              </div>
            )}

            {/* Impact lists */}
            {['direct', 'indirect', 'potential'].map(level => {
              const items = impactData[level];
              if (!items?.length) return null;
              const cfg = SEVERITY[level];
              const isExpanded = expandedSection[level];
              return (
                <div key={level} style={{ animation: 'ip-fadeUp 0.3s ease' }}>
                  {/* Section header */}
                  <div
                    onClick={() => setExpandedSection(prev => ({ ...prev, [level]: !prev[level] }))}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 0', cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    <div style={{
                      width: 4, height: 16, borderRadius: 2,
                      background: cfg.gradient, flexShrink: 0,
                    }} />
                    <span style={{
                      fontSize: 11.5, fontWeight: 700, color: cfg.color,
                      letterSpacing: '0.02em', flex: 1,
                    }}>
                      {cfg.label} Impact
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      padding: '2px 8px', borderRadius: 8,
                      background: cfg.bg,
                      color: cfg.color,
                      minWidth: 22, textAlign: 'center',
                    }}>
                      {items.length}
                    </span>
                    <HiOutlineChevronRight
                      size={12}
                      color="#555870"
                      style={{
                        transition: 'transform 0.2s ease',
                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                      }}
                    />
                  </div>
                  {/* Items */}
                  {isExpanded && (
                    <div style={{
                      display: 'flex', flexDirection: 'column', gap: 4,
                      paddingLeft: 4,
                      animation: 'ip-fadeUp 0.2s ease',
                    }}>
                      {items.map((item, i) => (
                        <div
                          key={i}
                          className="ip-item"
                          style={{
                            display: 'flex', alignItems: 'center', gap: 10,
                            padding: '9px 12px', borderRadius: 10, cursor: 'pointer',
                            border: '1px solid rgba(255,255,255,0.04)',
                            background: 'rgba(255,255,255,0.015)',
                            transition: 'all 0.18s ease',
                          }}
                          onClick={() => onSelectNode?.(item.id)}
                        >
                          <span style={{
                            width: 7, height: 7, borderRadius: '50%',
                            background: cfg.color, flexShrink: 0,
                            boxShadow: `0 0 6px ${cfg.glow}`,
                          }} />
                          <span style={{
                            fontSize: 12, color: '#c8cae0', flex: 1,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            fontWeight: 500,
                          }}>{item.label}</span>
                          <span style={{
                            fontSize: 9.5, fontWeight: 600, color: '#555870',
                          }}>{item.type}</span>
                          <HiOutlineChevronRight
                            size={11}
                            color={cfg.color}
                            style={{ opacity: 0.4, transition: 'opacity 0.15s' }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!impactData && !error && !loading && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 16, padding: '30px 20px',
            textAlign: 'center', flex: 1,
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)',
              width: 150, height: 150,
              background: 'radial-gradient(circle, rgba(244,63,94,0.1) 0%, transparent 70%)',
              borderRadius: '50%', pointerEvents: 'none',
            }} />
          
            <div style={{
              width: 48, height: 48,
              background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
              borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(244,63,94,0.3)',
              fontSize: 22,
              marginBottom: 4,
            }}>
              ⚡
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#f0f1f7', letterSpacing: '-0.01em' }}>
                Impact Simulator
              </div>
              <div style={{ fontSize: 12, color: '#555870', letterSpacing: '0.01em', display: 'flex', alignItems: 'center', gap: 6 }}>
                Blast radius analysis
                <span style={{
                  fontSize: 8.5, fontWeight: 700, padding: '2px 6px', borderRadius: 20,
                  background: 'linear-gradient(135deg, rgba(244,63,94,0.15), rgba(244,63,94,0.05))',
                  color: '#fb7185',
                  border: '1px solid rgba(244,63,94,0.2)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}>Risk</span>
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 12, color: '#3a3d52', lineHeight: 1.6, maxWidth: 220, margin: '0 auto' }}>
                Search for a node above and click <span style={{ color: '#555870', fontWeight: 600 }}>Simulate Impact</span> to see the blast radius.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── spinner ────────────────────────────────────────────────────────── */

function SpinnerIcon({ color = '#fff' }) {
  return (
    <svg
      width="14" height="14" viewBox="0 0 13 13" fill="none"
      style={{ animation: 'ip-spin 0.7s linear infinite', flexShrink: 0 }}
    >
      <circle cx="6.5" cy="6.5" r="5.5" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
      <path d="M6.5 1A5.5 5.5 0 0 1 12 6.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
