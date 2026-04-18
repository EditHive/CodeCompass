import React, { useState, useRef, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import { explainCode, getNodes } from '../../services/api';
import {
  HiOutlineAcademicCap,
  HiOutlineLightBulb,
  HiOutlineChip,
  HiOutlineSearch,
  HiOutlineSparkles,
  HiOutlineCode,
  HiOutlineInformationCircle,
} from 'react-icons/hi';

/* ─── constants ─────────────────────────────────────────────────────── */

const LEVELS = [
  {
    id: 'beginner',
    label: 'Beginner',
    icon: HiOutlineAcademicCap,
    color: '#10b981',
    glow: 'rgba(16,185,129,0.15)',
    border: 'rgba(16,185,129,0.28)',
    bg: 'rgba(16,185,129,0.07)',
    desc: 'Plain English',
  },
  {
    id: 'intermediate',
    label: 'Intermediate',
    icon: HiOutlineLightBulb,
    color: '#f59e0b',
    glow: 'rgba(245,158,11,0.15)',
    border: 'rgba(245,158,11,0.28)',
    bg: 'rgba(245,158,11,0.07)',
    desc: 'Technical depth',
  },
  {
    id: 'expert',
    label: 'Expert',
    icon: HiOutlineChip,
    color: '#f43f5e',
    glow: 'rgba(244,63,94,0.15)',
    border: 'rgba(244,63,94,0.28)',
    bg: 'rgba(244,63,94,0.07)',
    desc: 'Deep analysis',
  },
];

const TYPE_COLORS = {
  file: { dot: '#6366f1', bg: 'rgba(99,102,241,0.1)', text: '#818cf8' },
  function: { dot: '#22d3ee', bg: 'rgba(34,211,238,0.1)', text: '#67e8f9' },
  class: { dot: '#10b981', bg: 'rgba(16,185,129,0.1)', text: '#34d399' },
};

/* ─── styles (css-in-js object map) ─────────────────────────────────── */

const S = {
  /* layout */
  panel: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: '#111422',
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
    color: '#e2e4f0',
  },

  /* ── header removed ── */

  /* controls */
  controls: {
    padding: '13px 16px',
    borderBottom: '1px solid rgba(99,102,241,0.12)',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    flexShrink: 0,
  },

  /* search */
  searchWrap: { position: 'relative' },
  searchIcon: {
    position: 'absolute',
    left: 10,
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#555870',
    pointerEvents: 'none',
    display: 'flex',
  },
  searchInput: {
    width: '100%',
    padding: '9px 10px 9px 32px',
    background: '#1a1e35',
    border: '1px solid rgba(99,102,241,0.13)',
    borderRadius: 9,
    fontSize: 11.5,
    color: '#e2e4f0',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box',
  },

  /* dropdown */
  dropdown: {
    position: 'absolute',
    top: 'calc(100% + 4px)',
    left: 0,
    right: 0,
    zIndex: 50,
    background: '#131629',
    border: '1px solid rgba(99,102,241,0.22)',
    borderRadius: 9,
    overflow: 'hidden',
    maxHeight: 140,
    overflowY: 'auto',
  },
  dropItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '7px 11px',
    fontSize: 11.5,
    cursor: 'pointer',
    transition: 'background 0.12s',
    borderBottom: '1px solid rgba(99,102,241,0.06)',
  },
  dropDot: { width: 6, height: 6, borderRadius: '50%', flexShrink: 0 },
  dropLabel: { flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#c8cae0' },
  dropTypePill: {
    fontSize: 9,
    fontWeight: 600,
    padding: '1px 5px',
    borderRadius: 4,
    letterSpacing: '0.04em',
  },

  /* levels */
  levels: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 7 },
  levelBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 5,
    padding: '9px 6px',
    borderRadius: 9,
    border: '1px solid rgba(99,102,241,0.13)',
    background: 'rgba(255,255,255,0.015)',
    fontSize: 10,
    fontWeight: 600,
    color: '#555870',
    cursor: 'pointer',
    transition: 'all 0.18s',
    letterSpacing: '0.02em',
  },

  /* explain button */
  explainBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    padding: '10px 14px',
    borderRadius: 10,
    border: 'none',
    background: 'linear-gradient(135deg,#f59e0b 0%,#d97706 100%)',
    color: '#1a1000',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.18s',
    letterSpacing: '0.03em',
    width: '100%',
    boxShadow: '0 4px 20px rgba(245,158,11,0.2)',
  },
  explainBtnDisabled: {
    opacity: 0.35,
    cursor: 'not-allowed',
    boxShadow: 'none',
  },

  /* result area */
  resultArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '13px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },

  /* empty state */
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: '40px 16px',
    color: '#3a3d52',
    textAlign: 'center',
    flex: 1,
  },

  /* result blocks */
  resultHeader: { display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  resultName: { fontSize: 13, fontWeight: 600, color: '#e2e4f0' },
  badge: { fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 12, letterSpacing: '0.05em' },

  aiBlock: {
    borderRadius: 10,
    border: '1px solid rgba(245,158,11,0.16)',
    background: 'rgba(245,158,11,0.03)',
    overflow: 'hidden',
  },
  aiBlockHead: {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    padding: '9px 12px',
    borderBottom: '1px solid rgba(245,158,11,0.1)',
    background: 'rgba(245,158,11,0.04)',
  },
  aiLabel: { fontSize: 10.5, fontWeight: 700, color: '#f59e0b', letterSpacing: '0.06em' },
  aiBody: {
    padding: '10px 12px',
    fontSize: 11,
    color: '#8b8fa8',
    lineHeight: 1.65,
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
  },

  codeBlockWrap: { display: 'flex', flexDirection: 'column', gap: 5 },
  codeLabel: { fontSize: 9, fontWeight: 700, color: '#3a3d52', letterSpacing: '0.1em', textTransform: 'uppercase' },
  codeBlock: {
    background: '#1a1e35',
    border: '1px solid rgba(99,102,241,0.12)',
    borderRadius: 9,
    padding: '10px 12px',
    fontFamily: "'SF Mono','Fira Code',monospace",
    fontSize: 10.5,
    color: '#22d3ee',
    lineHeight: 1.6,
    maxHeight: 180,
    overflowY: 'auto',
    whiteSpace: 'pre',
  },

  metaBlock: {
    background: 'rgba(255,255,255,0.015)',
    border: '1px solid rgba(99,102,241,0.1)',
    borderRadius: 9,
    padding: '9px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 5,
  },
  metaRow: { display: 'flex', alignItems: 'baseline', gap: 6, fontSize: 11 },
  metaKey: { color: '#3a3d52', fontWeight: 600, minWidth: 72, fontSize: 10.5 },
  metaVal: { color: '#8b8fa8', fontFamily: "'SF Mono','Fira Code',monospace", fontSize: 10.5 },

  errorBox: {
    background: 'rgba(244,63,94,0.07)',
    border: '1px solid rgba(244,63,94,0.2)',
    borderRadius: 9,
    padding: '9px 12px',
    fontSize: 11,
    color: '#f43f5e',
  },
};

/* ─── markdown renderer ──────────────────────────────────────────────── */

function AiMarkdown({ text }) {
  const lines = text.split('\n');
  return (
    <>
      {lines.map((line, i) => {
        if (!line.trim()) return null;
        if (line.startsWith('### ')) {
          return (
            <p key={i} style={{ fontSize: 11.5, fontWeight: 600, color: '#c8cae0', marginTop: 4 }}>
              {line.slice(4).replace(/\*\*/g, '')}
            </p>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <p key={i} style={{ fontSize: 12, fontWeight: 700, color: '#e2e4f0', marginTop: 6 }}>
              {line.slice(3).replace(/\*\*/g, '')}
            </p>
          );
        }
        if (line.startsWith('- ')) {
          return (
            <div key={i} style={{ display: 'flex', gap: 6, paddingLeft: 4 }}>
              <span style={{ color: '#f59e0b', flexShrink: 0 }}>•</span>
              <span>{renderInline(line.slice(2).replace(/\*\*/g, ''))}</span>
            </div>
          );
        }
        return <p key={i}>{renderInline(line.replace(/\*\*/g, ''))}</p>;
      })}
    </>
  );
}

function renderInline(text) {
  const parts = text.split('`');
  return parts.map((part, j) =>
    j % 2 === 1 ? (
      <code
        key={j}
        style={{
          padding: '1px 5px',
          borderRadius: 5,
          background: '#1f2440',
          color: '#22d3ee',
          fontFamily: "'SF Mono','Fira Code',monospace",
          fontSize: 10.5,
        }}
      >
        {part}
      </code>
    ) : (
      part
    )
  );
}

/* ─── main component ─────────────────────────────────────────────────── */

export default function ExplainPanel() {
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [level, setLevel] = useState('intermediate');
  const [showDropdown, setShowDropdown] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const [hoveredLevel, setHoveredLevel] = useState(null);

  const { data: nodesData, execute: loadNodes } = useApi(getNodes);
  const { data: explainData, loading, error, execute: runExplain } = useApi(explainCode);

  const searchRef = useRef(null);
  const dropdownRef = useRef(null);

  /* close dropdown on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        !searchRef.current.contains(e.target)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleExplain = async () => {
    if (!selectedNode) return;
    await runExplain(selectedNode.id, level);
  };

  const filteredNodes =
    nodesData?.nodes?.filter(
      (n) =>
        n.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        n.id.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const activeLevelMeta = LEVELS.find((l) => l.id === level);
  const explainLevelMeta = explainData
    ? LEVELS.find((l) => l.id === explainData.level)
    : null;

  return (
    <div style={S.panel}>


      {/* ── Controls ── */}
      <div style={S.controls}>
        {/* Search */}
        <div style={S.searchWrap}>
          <span style={S.searchIcon}>
            <HiOutlineSearch size={14} />
          </span>
          <input
            ref={searchRef}
            style={{
              ...S.searchInput,
              ...(showDropdown
                ? { borderColor: 'rgba(245,158,11,0.35)', boxShadow: '0 0 0 3px rgba(245,158,11,0.07)' }
                : {}),
            }}
            type="text"
            placeholder="Search file, function, or class…"
            value={searchTerm}
            autoComplete="off"
            onFocus={() => {
              if (!nodesData) loadNodes();
              if (searchTerm) setShowDropdown(true);
            }}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowDropdown(!!e.target.value);
            }}
          />

          {showDropdown && filteredNodes.length > 0 && (
            <div ref={dropdownRef} style={S.dropdown}>
              {filteredNodes.slice(0, 12).map((node) => {
                const tc = TYPE_COLORS[node.type] || TYPE_COLORS.file;
                return (
                  <div
                    key={node.id}
                    style={{
                      ...S.dropItem,
                      background: hoveredItem === node.id ? '#1a1e35' : 'transparent',
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
                    <span
                      style={{
                        ...S.dropTypePill,
                        background: tc.bg,
                        color: tc.text,
                      }}
                    >
                      {node.type}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Level selector */}
        <div style={S.levels}>
          {LEVELS.map((l) => {
            const Icon = l.icon;
            const isActive = level === l.id;
            const isHovered = hoveredLevel === l.id;
            return (
              <button
                key={l.id}
                style={{
                  ...S.levelBtn,
                  ...(isActive
                    ? { background: l.bg, borderColor: l.border, color: l.color }
                    : isHovered
                    ? { background: '#1a1e35', borderColor: 'rgba(99,102,241,0.22)', color: '#8b8fa8' }
                    : {}),
                }}
                onMouseEnter={() => setHoveredLevel(l.id)}
                onMouseLeave={() => setHoveredLevel(null)}
                onClick={() => setLevel(l.id)}
              >
                <Icon size={15} />
                {l.label}
              </button>
            );
          })}
        </div>

        {/* Explain button */}
        <button
          onClick={handleExplain}
          disabled={!selectedNode || loading}
          style={{
            ...S.explainBtn,
            ...(!selectedNode || loading ? S.explainBtnDisabled : {}),
          }}
        >
          {loading ? (
            <>
              <SpinnerIcon />
              Generating…
            </>
          ) : (
            <>
              <HiOutlineSparkles size={14} />
              {selectedNode ? `Explain ${selectedNode.label}` : 'Select a node first'}
            </>
          )}
        </button>
      </div>

      {/* ── Result Area ── */}
      <div style={S.resultArea}>
        {/* Error */}
        {error && <div style={S.errorBox}>{error}</div>}

        {/* Explanation */}
        {explainData && !explainData.error && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, animation: 'prism-fade-in 0.3s ease' }}>
            {/* Title row */}
            <div style={S.resultHeader}>
              <span style={S.resultName}>{explainData.name}</span>
              <span
                style={{
                  ...S.badge,
                  background: 'rgba(99,102,241,0.1)',
                  color: '#818cf8',
                  border: '1px solid rgba(99,102,241,0.18)',
                }}
              >
                {explainData.type}
              </span>
              {explainLevelMeta && (
                <span
                  style={{
                    ...S.badge,
                    background: explainLevelMeta.bg,
                    color: explainLevelMeta.color,
                    border: `1px solid ${explainLevelMeta.border}`,
                  }}
                >
                  {explainLevelMeta.label.toUpperCase()}
                </span>
              )}
            </div>

            {/* AI explanation */}
            {explainData.ai_explanation && (
              <div style={S.aiBlock}>
                <div style={S.aiBlockHead}>
                  <HiOutlineSparkles size={12} color="#f59e0b" />
                  <span style={S.aiLabel}>AI EXPLANATION</span>
                </div>
                <div style={S.aiBody}>
                  <AiMarkdown text={explainData.ai_explanation} />
                </div>
              </div>
            )}

            {/* Fallback explanation */}
            {!explainData.ai_explanation && explainData.explanation && (
              <div style={{ fontSize: 11, color: '#8b8fa8', lineHeight: 1.65, display: 'flex', flexDirection: 'column', gap: 5 }}>
                <AiMarkdown text={explainData.explanation} />
              </div>
            )}

            {/* Code snippet */}
            {explainData.code_snippet && (
              <div style={S.codeBlockWrap}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <HiOutlineCode size={11} color="#3a3d52" />
                  <span style={S.codeLabel}>Source Code</span>
                </div>
                <div style={S.codeBlock}>{explainData.code_snippet}</div>
              </div>
            )}

            {/* Metadata */}
            {explainData.metadata && (
              <div style={S.metaBlock}>
                {explainData.metadata.params?.length > 0 && (
                  <div style={S.metaRow}>
                    <span style={S.metaKey}>Params</span>
                    <span style={{ ...S.metaVal, color: '#22d3ee' }}>
                      {explainData.metadata.params.join(', ')}
                    </span>
                  </div>
                )}
                {explainData.metadata.complexity != null && (
                  <div style={S.metaRow}>
                    <span style={S.metaKey}>Complexity</span>
                    <span
                      style={{
                        ...S.metaVal,
                        color: explainData.metadata.complexity > 5 ? '#f43f5e' : '#10b981',
                        fontWeight: 600,
                      }}
                    >
                      {explainData.metadata.complexity}
                      <span style={{ color: '#3a3d52', fontWeight: 400 }}> / 10</span>
                    </span>
                  </div>
                )}
                {explainData.metadata.calls?.length > 0 && (
                  <div style={S.metaRow}>
                    <span style={S.metaKey}>Calls</span>
                    <span style={S.metaVal}>
                      {explainData.metadata.calls.join(', ')}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!explainData && !error && !loading && (
          <div style={S.emptyState}>
            <div style={{
              width: 48, height: 48,
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(245,158,11,0.3)',
              fontSize: 22, color: '#fff', margin: '0 auto 12px',
            }}>
              <HiOutlineSparkles size={24} color="#fff" />
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#f0f1f7', letterSpacing: '-0.01em', fontFamily: 'Inter, sans-serif', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              Code Explainer
              <span style={{ fontSize: 8.5, fontWeight: 700, padding: '2px 6px', borderRadius: 20, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>AI</span>
            </div>
            <p style={{ fontSize: 11, color: '#3a3d52', lineHeight: 1.55, maxWidth: 220 }}>
              Search for a file or function above, then click Simulate to get an AI-powered explanation.
            </p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes prism-fade-in {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes prism-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

/* ─── spinner ────────────────────────────────────────────────────────── */

function SpinnerIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 13 13"
      fill="none"
      style={{ animation: 'prism-spin 0.7s linear infinite', flexShrink: 0 }}
    >
      <circle cx="6.5" cy="6.5" r="5.5" stroke="rgba(26,16,0,0.35)" strokeWidth="2" />
      <path
        d="M6.5 1A5.5 5.5 0 0 1 12 6.5"
        stroke="#1a1000"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
