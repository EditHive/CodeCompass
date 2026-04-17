import React, { useState } from 'react';
import { searchCode } from '../../services/api';

const EXAMPLE_QUERIES = [
  "Where is authentication handled?",
  "Database connection setup",
  "Payment processing flow",
  "Input validation logic",
  "API endpoint definitions",
];

const typeConfig = {
  file:     { color: '#6366f1', bg: 'rgba(99,102,241,0.12)',  icon: '◫' },
  function: { color: '#22d3ee', bg: 'rgba(34,211,238,0.12)',  icon: 'ƒ'  },
  class:    { color: '#10b981', bg: 'rgba(16,185,129,0.12)',  icon: '◉' },
};

/* ─── Styles ────────────────────────────────────────────────────────────── */
const styles = {
  panel: {
    background: '#0d0e1a',
    borderRadius: 16,
    border: '1px solid rgba(99,102,241,0.18)',
    overflow: 'hidden',
    fontFamily: "'SF Mono', 'Fira Code', monospace",
    maxWidth: 560,
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  /* ── header removed ── */
  searchSection: {
    padding: '16px 20px',
    borderBottom: '1px solid rgba(99,102,241,0.18)',
  },
  searchRow: { display: 'flex', gap: 8 },
  searchWrap: { flex: 1, position: 'relative' },
  searchIcon: {
    position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
    color: '#7b7fa8', fontSize: 14, pointerEvents: 'none',
  },
  searchInput: {
    width: '100%', padding: '10px 12px 10px 36px',
    background: '#1a1d35',
    border: '1px solid rgba(99,102,241,0.18)',
    borderRadius: 10,
    fontFamily: 'inherit',
    fontSize: 12,
    color: '#e2e4f0',
    outline: 'none',
  },
  searchBtn: {
    padding: '10px 16px',
    borderRadius: 10,
    background: 'linear-gradient(135deg, #10b981, #059669)',
    border: 'none', cursor: 'pointer',
    color: '#fff', fontSize: 13, fontWeight: 700,
    fontFamily: 'inherit',
    minWidth: 44,
    transition: 'opacity 0.2s',
  },
  searchBtnDisabled: { opacity: 0.3, cursor: 'not-allowed' },
  chips: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 },
  chip: {
    padding: '4px 10px',
    borderRadius: 20,
    fontSize: 10, fontWeight: 500,
    background: '#1a1d35',
    color: '#9396b8',
    border: '1px solid rgba(99,102,241,0.18)',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'background 0.15s, color 0.15s',
  },
  results: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px 20px 20px',
  },
  aiSummary: {
    borderRadius: 12,
    background: 'rgba(16,185,129,0.06)',
    border: '1px solid rgba(16,185,129,0.22)',
    padding: '12px 14px',
    marginBottom: 14,
  },
  aiLabel: {
    fontSize: 11, fontWeight: 700, color: '#10b981',
    letterSpacing: '0.08em', textTransform: 'uppercase',
    marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6,
  },
  aiText: { fontSize: 11, color: '#9396b8', lineHeight: 1.6 },
  resultsCount: { fontSize: 10, color: '#7b7fa8', marginBottom: 8 },
  resultCard: {
    display: 'flex', alignItems: 'flex-start', gap: 10,
    padding: '11px 12px',
    borderRadius: 10,
    background: 'rgba(26,29,53,0.4)',
    border: '1px solid rgba(99,102,241,0.12)',
    cursor: 'pointer',
    marginBottom: 6,
    width: '100%',
    textAlign: 'left',
    fontFamily: 'inherit',
    transition: 'background 0.15s, border-color 0.15s',
  },
  resultIcon: {
    width: 28, height: 28, borderRadius: 8,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 14, flexShrink: 0,
  },
  resultBody: { flex: 1, minWidth: 0 },
  resultTop: { display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' },
  resultName: { fontSize: 12, fontWeight: 700, color: '#e2e4f0' },
  typeBadge: {
    fontSize: 9, fontWeight: 700,
    padding: '2px 7px', borderRadius: 20,
    textTransform: 'uppercase', letterSpacing: '0.06em',
  },
  score: { marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: '#eab308' },
  resultPath: { fontSize: 10, color: '#7b7fa8', fontFamily: "'SF Mono', monospace" },
  resultExplanation: { fontSize: 10, color: '#9396b8', marginTop: 4, lineHeight: 1.5 },
  emptyState: {
    textAlign: 'center', padding: '40px 20px',
    color: '#7b7fa8', fontSize: 11, lineHeight: 1.7,
  },
  emptyIcon: { fontSize: 28, marginBottom: 8 },
  errorBox: {
    background: 'rgba(239,68,68,0.08)',
    border: '1px solid rgba(239,68,68,0.22)',
    borderRadius: 8, padding: '10px 12px',
    fontSize: 11, color: '#f87171', marginBottom: 10,
  },
  loadingRow: {
    display: 'flex', gap: 6, alignItems: 'center',
    padding: '24px 0', justifyContent: 'center',
  },
};

/* ─── Sub-components ────────────────────────────────────────────────────── */
function LoadingDots() {
  return (
    <div style={styles.loadingRow}>
      {[0, 1, 2].map(i => (
        <div
          key={i}
          style={{
            width: 6, height: 6, borderRadius: '50%',
            background: '#10b981',
            animation: 'prism-pulse 1s ease-in-out infinite',
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes prism-pulse {
          0%,100% { opacity: 0.3; transform: scale(0.8); }
          50%      { opacity: 1;   transform: scale(1);   }
        }
      `}</style>
    </div>
  );
}

function ResultCard({ result, onSelect }) {
  const cfg = typeConfig[result.type] || typeConfig.function;
  const [hovered, setHovered] = useState(false);
  return (
    <button
      style={{
        ...styles.resultCard,
        background: hovered ? '#1a1d35' : 'rgba(26,29,53,0.4)',
        borderColor: hovered ? 'rgba(99,102,241,0.35)' : 'rgba(99,102,241,0.12)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect?.(result.id)}
    >
      <div style={{ ...styles.resultIcon, background: cfg.bg, color: cfg.color }}>
        {cfg.icon}
      </div>
      <div style={styles.resultBody}>
        <div style={styles.resultTop}>
          <span style={styles.resultName}>
            {result.metadata?.name || result.path.split('/').pop()}
          </span>
          <span style={{ ...styles.typeBadge, background: cfg.bg, color: cfg.color }}>
            {result.type}
          </span>
          <span style={styles.score}>★ {(result.score * 100).toFixed(0)}%</span>
        </div>
        <div style={styles.resultPath}>
          {result.path}{result.metadata?.line ? ` : line ${result.metadata.line}` : ''}
        </div>
        {result.explanation && (
          <div style={styles.resultExplanation}>{result.explanation}</div>
        )}
      </div>
    </button>
  );
}

/* ─── Main component ────────────────────────────────────────────────────── */
export default function SearchPanel({ onSelectNode }) {
  const [query, setQuery]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [searchData, setSearchData] = useState(null);

  const handleSearch = async (q) => {
    const searchQuery = (q || query).trim();
    if (!searchQuery) return;
    setQuery(searchQuery);
    setLoading(true);
    setError(null);
    setSearchData(null);

    try {
      const res = await searchCode(searchQuery);
      setSearchData(res.data);
    } catch (err) {
      setError(err?.message || 'Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.panel}>


      {/* Search input */}
      <div style={styles.searchSection}>
        <div style={styles.searchRow}>
          <div style={styles.searchWrap}>
            <span style={styles.searchIcon}>⌕</span>
            <input
              style={styles.searchInput}
              type="text"
              placeholder="Ask anything about your code..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
            />
          </div>
          <button
            style={{
              ...styles.searchBtn,
              ...((!query.trim() || loading) ? styles.searchBtnDisabled : {}),
            }}
            onClick={() => handleSearch()}
            disabled={!query.trim() || loading}
          >
            {loading ? '…' : '→'}
          </button>
        </div>

        {/* Example chips */}
        <div style={styles.chips}>
          {EXAMPLE_QUERIES.map((q, i) => (
            <ChipButton key={i} label={q} onClick={() => handleSearch(q)} />
          ))}
        </div>
      </div>

      {/* Results */}
      <div style={styles.results}>
        {error && <div style={styles.errorBox}>{error}</div>}

        {loading && <LoadingDots />}

        {!loading && searchData?.ai_summary && searchData.results?.length > 0 && (
          <div style={styles.aiSummary}>
            <div style={styles.aiLabel}>✦ &nbsp;AI Summary</div>
            <p style={styles.aiText}>{searchData.ai_summary}</p>
          </div>
        )}

        {!loading && searchData?.results?.length > 0 && (
          <div>
            <p style={styles.resultsCount}>
              {searchData.results.length} results for "{searchData.query}"
            </p>
            {searchData.results.map((result, i) => (
              <ResultCard key={i} result={result} onSelect={onSelectNode} />
            ))}
          </div>
        )}

        {!loading && searchData?.results?.length === 0 && (
          <div style={styles.emptyState}>No results found. Try a different query.</div>
        )}

        {!loading && !searchData && !error && (
          <div style={styles.emptyState}>
            <div style={{
              width: 48, height: 48,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              borderRadius: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 16px rgba(139,92,246,0.3)',
              fontSize: 22, color: '#fff', margin: '0 auto 16px',
            }}>
              ⌕
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#f0f1f7', letterSpacing: '-0.01em', fontFamily: 'Inter, sans-serif', marginBottom: 8 }}>
              Code Search Engine
            </div>
            <div>
              Search your codebase using natural language.<br />
              Ask questions about what your code does.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Chip button (isolated hover state) ────────────────────────────────── */
function ChipButton({ label, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      style={{
        ...styles.chip,
        background: hovered ? '#202440' : '#1a1d35',
        color: hovered ? '#e2e4f0' : '#9396b8',
        borderColor: hovered ? 'rgba(99,102,241,0.35)' : 'rgba(99,102,241,0.18)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      {label}
    </button>
  );
}