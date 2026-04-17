import React, { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { searchCode } from '../../services/api';
import { HiOutlineSearch, HiOutlineCode, HiOutlineFolder, HiOutlineCube, HiOutlineStar } from 'react-icons/hi';

const EXAMPLE_QUERIES = [
  "Where is authentication handled?",
  "Where is database connection initialized?",
  "How does payment processing work?",
  "Where is input validation done?",
  "What are the API endpoints?",
];

export default function SearchPanel({ onSelectNode }) {
  const [query, setQuery] = useState('');
  const { data: searchData, loading, error, execute: runSearch } = useApi(searchCode);

  const handleSearch = async (q) => {
    const searchQuery = q || query;
    if (!searchQuery.trim()) return;
    setQuery(searchQuery);
    await runSearch(searchQuery.trim());
  };

  const typeIcons = { file: HiOutlineFolder, function: HiOutlineCode, class: HiOutlineCube };
  const typeColors = { file: '#7c5cfc', function: '#22d3ee', class: '#34d399' };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-prism-border">
        <div className="flex items-center gap-2 mb-2">
          <HiOutlineSearch className="w-5 h-5 text-prism-green" />
          <h2 className="text-sm font-bold text-prism-text">Intelligent Code Search</h2>
        </div>
        <p className="text-xs text-prism-text-dim">Search by intent, not just keywords.</p>
      </div>

      {/* Search Input */}
      <div className="px-4 py-3 border-b border-prism-border">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. Where is authentication handled?"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="flex-1 px-3 py-2 rounded-lg bg-prism-surface-2 border border-prism-border text-xs text-prism-text placeholder-prism-text-dim focus:outline-none focus:border-prism-green transition-colors"
          />
          <button
            onClick={() => handleSearch()}
            disabled={!query.trim() || loading}
            className="px-3 py-2 rounded-lg text-xs font-semibold bg-prism-green/15 text-prism-green border border-prism-green/30 hover:bg-prism-green/25 disabled:opacity-40 transition-all cursor-pointer"
          >
            {loading ? '...' : '🔍'}
          </button>
        </div>

        {/* Example queries */}
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {EXAMPLE_QUERIES.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSearch(q)}
              className="px-2 py-0.5 rounded-full text-[10px] bg-prism-surface-2 text-prism-text-dim hover:text-prism-text hover:bg-prism-border transition cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {error && <div className="text-xs text-prism-red bg-prism-red/10 rounded-lg px-3 py-2 mb-3">{error}</div>}

        {searchData?.ai_summary && searchData.results?.length > 0 && (
          <div className="mb-4 rounded-xl bg-prism-green/10 border border-prism-green/30 p-3 glow-accent animate-fade-in">
            <h3 className="text-xs font-bold text-prism-green flex items-center gap-1.5 mb-1.5">
               <span className="text-sm">✨</span> AI Search Summary
            </h3>
            <p className="text-xs text-prism-text leading-relaxed">
              {searchData.ai_summary}
            </p>
          </div>
        )}

        {searchData?.results?.length > 0 && (
          <div className="space-y-2 animate-fade-in">
            <p className="text-xs text-prism-text-dim mb-2">{searchData.results.length} results for "{searchData.query}"</p>
            {searchData.results.map((result, i) => {
              const Icon = typeIcons[result.type] || HiOutlineCode;
              const color = typeColors[result.type] || '#7c5cfc';
              return (
                <button
                  key={i}
                  onClick={() => onSelectNode?.(result.id)}
                  className="w-full text-left rounded-xl bg-prism-surface-2/50 hover:bg-prism-surface-2 transition-all p-3 cursor-pointer border border-transparent hover:border-prism-border"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${color}15` }}>
                      <Icon className="w-3.5 h-3.5" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs font-semibold text-prism-text">{result.metadata?.name || result.path.split('/').pop()}</span>
                        <span className="badge text-[9px]" style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
                          {result.type}
                        </span>
                        <div className="ml-auto flex items-center gap-0.5">
                          <HiOutlineStar className="w-3 h-3 text-prism-amber" />
                          <span className="text-[10px] text-prism-amber font-medium">{(result.score * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-prism-text-dim font-mono">{result.path}</p>
                      {result.explanation && (
                        <p className="text-[11px] text-prism-text-dim/80 mt-1 leading-relaxed">{result.explanation}</p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {searchData?.results?.length === 0 && (
          <div className="text-center py-8 text-prism-text-dim text-xs">No results found. Try a different query.</div>
        )}
      </div>
    </div>
  );
}
