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
  direct:   { color: '#f43f5e', border: 'rgba(244,63,94,0.25)',  bg: 'rgba(244,63,94,0.06)',  label: 'Direct',   icon: '⬤' },
  indirect: { color: '#f97316', border: 'rgba(249,115,22,0.25)', bg: 'rgba(249,115,22,0.06)', label: 'Indirect', icon: '⬤' },
  potential:{ color: '#eab308', border: 'rgba(234,179,8,0.25)',  bg: 'rgba(234,179,8,0.06)',  label: 'Potential',icon: '⬤' },
};

const TYPE_COLORS = {
  file:     { dot: '#6366f1', bg: 'rgba(99,102,241,0.1)',  text: '#818cf8' },
  function: { dot: '#22d3ee', bg: 'rgba(34,211,238,0.1)',  text: '#67e8f9' },
  class:    { dot: '#10b981', bg: 'rgba(16,185,129,0.1)',  text: '#34d399' },
};

/* ─── style map ─────────────────────────────────────────────────────── */

const S = {
  panel: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: '#111422',
    fontFamily: "'SF Pro Display',-apple-system,BlinkMacSystemFont,'Inter',sans-serif",
    color: '#e2e4f0',
  },

  /* header */
  header: {
    padding: '16px 18px 14px',
    borderBottom: '1px solid rgba(99,102,241,0.12)',
    background: 'linear-gradient(180deg,rgba(244,63,94,0.04) 0%,transparent 100%)',
    flexShrink: 0,
  },
  headerTop: { display: 'flex', alignItems: 'center', gap: 9, marginBottom: 7 },
  logoMark: {
    width: 26, height: 26,
    background: 'linear-gradient(135deg,#f43f5e,#e11d48)',
    borderRadius: 7,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0,
  },
  headerTitle: { fontSize: 13, fontWeight: 600, color: '#e2e4f0', letterSpacing: '0.02em', flex: 1 },
  headerBadge: {
    fontSize: 8.5, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
    background: 'rgba(244,63,94,0.1)', color: '#fb7185',
    border: '1px solid rgba(244,63,94,0.22)', letterSpacing: '0.06em',
  },
  headerDesc: { fontSize: 11, color: '#555870', lineHeight: 1.5 },

  /* controls */
  controls: {
    padding: '13px 16px',
    borderBottom: '1px solid rgba(99,102,241,0.12)',
    display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0,
  },

  /* search */
  searchWrap: { position: 'relative' },
  searchIcon: {
    position: 'absolute', left: 10, top: '50%',
    transform: 'translateY(-50%)', color: '#555870',
    pointerEvents: 'none', display: 'flex',
  },
  searchInput: {
    width: '100%', padding: '9px 10px 9px 32px',
    background: '#1a1e35',
    border: '1px solid rgba(99,102,241,0.13)',
    borderRadius: 9, fontSize: 11.5, color: '#e2e4f0',
    outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box',
  },
  dropdown: {
    position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50,
    background: '#131629', border: '1px solid rgba(99,102,241,0.22)',
    borderRadius: 9, overflow: 'hidden', maxHeight: 150, overflowY: 'auto',
  },
  dropItem: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '7px 11px', fontSize: 11.5, cursor: 'pointer',
    transition: 'background 0.12s',
    borderBottom: '1px solid rgba(99,102,241,0.06)',
  },
  dropDot: { width: 6, height: 6, borderRadius: '50%', flexShrink: 0 },
  dropLabel: { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#c8cae0' },
  dropTypePill: { fontSize: 9, fontWeight: 600, padding: '1px 5px', borderRadius: 4, letterSpacing: '0.04em' },

  /* analyze button */
  analyzeBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    padding: '10px 14px', borderRadius: 10, border: 'none',
    background: 'linear-gradient(135deg,#f43f5e 0%,#e11d48 100%)',
    color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
    transition: 'all 0.18s', letterSpacing: '0.03em', width: '100%',
    boxShadow: '0 4px 20px rgba(244,63,94,0.22)',
  },
  analyzeBtnDisabled: { opacity: 0.35, cursor: 'not-allowed', boxShadow: 'none' },

  /* result area */
  resultArea: {
    flex: 1, overflowY: 'auto', padding: '13px 16px',
    display: 'flex', flexDirection: 'column', gap: 10,
  },

  /* summary cards */
  summaryGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 7 },
  summaryCard: {
    borderRadius: 10, padding: '10px 8px', textAlign: 'center',
    border: '1px solid', display: 'flex', flexDirection: 'column', gap: 3,
  },
  summaryNum: { fontSize: 20, fontWeight: 700, lineHeight: 1 },
  summaryLabel: { fontSize: 9.5, fontWeight: 600, color: '#555870', letterSpacing: '0.05em' },

  /* source node card */
  sourceCard: {
    borderRadius: 10, border: '1px solid rgba(99,102,241,0.2)',
    background: 'rgba(99,102,241,0.05)', padding: '10px 12px',
    display: 'flex', flexDirection: 'column', gap: 2,
  },
  sourceLabel: { fontSize: 9.5, fontWeight: 600, color: '#555870', letterSpacing: '0.06em', textTransform: 'uppercase' },
  sourceName: { fontSize: 13, fontWeight: 600, color: '#818cf8' },
  sourceType: { fontSize: 10, color: '#555870' },

  /* AI assessment */
  aiBlock: {
    borderRadius: 10, border: '1px solid rgba(139,92,246,0.18)',
    background: 'rgba(139,92,246,0.04)', overflow: 'hidden',
  },
  aiHead: {
    display: 'flex', alignItems: 'center', gap: 7, padding: '9px 12px',
    borderBottom: '1px solid rgba(139,92,246,0.1)',
    background: 'rgba(139,92,246,0.05)',
  },
  aiLabel: { fontSize: 10.5, fontWeight: 700, color: '#a78bfa', letterSpacing: '0.06em' },
  aiBody: {
    padding: '10px 12px', fontSize: 11, color: '#8b8fa8',
    lineHeight: 1.65, display: 'flex', flexDirection: 'column', gap: 5,
  },

  /* section header */
  sectionHead: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, marginBottom: 6, letterSpacing: '0.02em' },

  /* impact item */
  impactItem: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
    border: '1px solid rgba(99,102,241,0.08)',
    background: 'rgba(255,255,255,0.015)',
    transition: 'all 0.15s', marginBottom: 4,
  },
  impactLabel: { fontSize: 11.5, color: '#c8cae0', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  impactType: { fontSize: 9.5, fontWeight: 600, color: '#555870' },

  /* empty */
  emptyState: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: 10, padding: '40px 16px',
    color: '#2a2d42', textAlign: 'center', flex: 1,
  },

  /* error */
  errorBox: {
    background: 'rgba(244,63,94,0.07)', border: '1px solid rgba(244,63,94,0.2)',
    borderRadius: 9, padding: '9px 12px', fontSize: 11, color: '#f43f5e',
  },
};

/* ─── markdown renderer ──────────────────────────────────────────────── */

function AiMarkdown({ text }) {
  return (
    <>
      {text.split('\n').map((line, i) => {
        const l = line.replace(/\*\*/g, '');
        if (!l.trim()) return null;
        if (l.trim().startsWith('-'))
          return (
            <div key={i} style={{ display: 'flex', gap: 6, paddingLeft: 4 }}>
              <span style={{ color: '#a78bfa', flexShrink: 0 }}>•</span>
              <span>{l.substring(l.indexOf('-') + 1).trim()}</span>
            </div>
          );
        if (/^\d+\./.test(l.trim()))
          return <p key={i} style={{ fontWeight: 600, color: '#c8cae0', marginTop: 4 }}>{l.trim()}</p>;
        return <p key={i}>{l.trim()}</p>;
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

  return (
    <div style={S.panel}>
      {/* ── Header ── */}
      <div style={S.header}>
        <div style={S.headerTop}>
          <div style={S.logoMark}>⚡</div>
          <span style={S.headerTitle}>Impact Simulator</span>
          <span style={S.headerBadge}>RISK ANALYSIS</span>
        </div>
        <p style={S.headerDesc}>
          Simulate the blast radius of changing any node across your codebase.
        </p>
      </div>

      {/* ── Controls ── */}
      <div style={S.controls}>
        {/* Search */}
        <div style={S.searchWrap}>
          <span style={S.searchIcon}><HiOutlineSearch size={14} /></span>
          <input
            ref={searchRef}
            style={{
              ...S.searchInput,
              ...(showDropdown
                ? { borderColor: 'rgba(244,63,94,0.35)', boxShadow: '0 0 0 3px rgba(244,63,94,0.07)' }
                : {}),
            }}
            type="text"
            placeholder="Search files, functions, classes…"
            value={searchTerm}
            autoComplete="off"
            onFocus={() => { if (!nodesData) loadNodes(); if (searchTerm) setShowDropdown(true); }}
            onChange={e => { setSearchTerm(e.target.value); setShowDropdown(!!e.target.value); }}
          />
          {showDropdown && filteredNodes.length > 0 && (
            <div ref={dropRef} style={S.dropdown}>
              {filteredNodes.slice(0, 15).map(node => {
                const tc = TYPE_COLORS[node.type] || TYPE_COLORS.file;
                const isSelected = selectedNode?.id === node.id;
                return (
                  <div
                    key={node.id}
                    style={{
                      ...S.dropItem,
                      background: isSelected
                        ? 'rgba(244,63,94,0.07)'
                        : hoveredItem === node.id ? '#1a1e35' : 'transparent',
                    }}
                    onMouseEnter={() => setHoveredItem(node.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    onClick={() => {
                      setSelectedNode(node);
                      setSearchTerm(node.label);
                      setShowDropdown(false);
                    }}
                  >
                    <span style={{ ...S.dropDot, background: tc.dot }} />
                    <span style={S.dropLabel}>{node.label}</span>
                    <span style={{ ...S.dropTypePill, background: tc.bg, color: tc.text }}>{node.type}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Analyze button */}
        <button
          onClick={handleAnalyze}
          disabled={isDisabled}
          style={{ ...S.analyzeBtn, ...(isDisabled ? S.analyzeBtnDisabled : {}) }}
        >
          {loading ? (
            <><SpinnerIcon color="#fff" /> Analyzing…</>
          ) : (
            <><HiOutlineLightningBolt size={14} /> {selectedNode ? `Simulate "${selectedNode.label}"` : 'Select a node first'}</>
          )}
        </button>
      </div>

      {/* ── Results ── */}
      <div style={S.resultArea}>
        {error && <div style={S.errorBox}>{error}</div>}

        {impactData && !impactData.error && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, animation: 'impact-fade 0.3s ease' }}>

            {/* Summary cards */}
            <div style={S.summaryGrid}>
              {Object.entries(SEVERITY).map(([key, cfg]) => (
                <div key={key} style={{ ...S.summaryCard, background: cfg.bg, borderColor: cfg.border }}>
                  <span style={{ ...S.summaryNum, color: cfg.color }}>{impactData.summary?.[key] ?? 0}</span>
                  <span style={S.summaryLabel}>{cfg.label}</span>
                </div>
              ))}
            </div>

            {/* Source node */}
            <div style={S.sourceCard}>
              <span style={S.sourceLabel}>
                <HiOutlineLocationMarker style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} size={10} />
                Source Node
              </span>
              <span style={S.sourceName}>{impactData.source?.label}</span>
              <span style={S.sourceType}>{impactData.source?.type}</span>
            </div>

            {/* AI Assessment */}
            {impactData.ai_summary && (
              <div style={S.aiBlock}>
                <div style={S.aiHead}>
                  <HiOutlineSparkles size={12} color="#a78bfa" />
                  <span style={S.aiLabel}>AI ASSESSMENT</span>
                </div>
                <div style={S.aiBody}>
                  <AiMarkdown text={impactData.ai_summary} />
                </div>
              </div>
            )}

            {/* Impact lists */}
            {['direct', 'indirect', 'potential'].map(level => {
              const items = impactData[level];
              if (!items?.length) return null;
              const cfg = SEVERITY[level];
              return (
                <div key={level}>
                  <div style={{ ...S.sectionHead, color: cfg.color }}>
                    <HiOutlineExclamationCircle size={13} />
                    {cfg.label} Impact
                    <span style={{
                      marginLeft: 2, fontSize: 9.5, fontWeight: 600,
                      padding: '1px 6px', borderRadius: 10,
                      background: cfg.bg, border: `1px solid ${cfg.border}`,
                      color: cfg.color,
                    }}>
                      {items.length}
                    </span>
                  </div>
                  <div>
                    {items.map((item, i) => (
                      <div
                        key={i}
                        style={{
                          ...S.impactItem,
                          background: hoveredImpact === `${level}-${i}` ? '#1a1e35' : 'rgba(255,255,255,0.015)',
                          borderColor: hoveredImpact === `${level}-${i}` ? cfg.border : 'rgba(99,102,241,0.08)',
                        }}
                        onMouseEnter={() => setHoveredImpact(`${level}-${i}`)}
                        onMouseLeave={() => setHoveredImpact(null)}
                        onClick={() => onSelectNode?.(item.id)}
                      >
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
                        <span style={S.impactLabel}>{item.label}</span>
                        <span style={S.impactType}>{item.type}</span>
                        <HiOutlineChevronRight
                          size={11}
                          color={cfg.color}
                          style={{ opacity: hoveredImpact === `${level}-${i}` ? 1 : 0, transition: 'opacity 0.15s' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {!impactData && !error && !loading && (
          <div style={S.emptyState}>
            <HiOutlineLightningBolt size={36} color="#2a2d42" />
            <p style={{ fontSize: 11, color: '#3a3d52', lineHeight: 1.55, maxWidth: 200 }}>
              Search for a node above and click Simulate Impact to see the blast radius.
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes impact-fade {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes impact-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

/* ─── spinner ────────────────────────────────────────────────────────── */

function SpinnerIcon({ color = '#1a1000' }) {
  return (
    <svg
      width="13" height="13" viewBox="0 0 13 13" fill="none"
      style={{ animation: 'impact-spin 0.7s linear infinite', flexShrink: 0 }}
    >
      <circle cx="6.5" cy="6.5" r="5.5" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
      <path d="M6.5 1A5.5 5.5 0 0 1 12 6.5" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
