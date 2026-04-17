import React, { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { searchCode } from '../../services/api';
import { HiOutlineSearch, HiOutlineCode, HiOutlineFolder, HiOutlineCube, HiOutlineStar } from 'react-icons/hi';

const EXAMPLE_QUERIES = [
  "Where is authentication handled?",
  "Database connection setup",
  "Payment processing flow",
  "Input validation logic",
  "API endpoint definitions",
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
  const typeColors = { file: '#6366f1', function: '#22d3ee', class: '#10b981' };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-4 border-b border-prism-border">
        <p className="text-[12px] text-prism-text-dim leading-relaxed">
          Search your codebase using natural language. Ask questions about your code.
        </p>
      </div>

      {/* Search Input */}
      <div className="px-4 py-3 border-b border-prism-border">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-prism-text-muted" />
            <input
              type="text"
              placeholder="Ask anything about your code..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-prism-surface-2 border border-prism-border text-[12px] text-prism-text placeholder-prism-text-muted focus:outline-none focus:border-prism-emerald focus:ring-2 focus:ring-prism-emerald/10 transition-all"
            />
          </div>
          <button
            onClick={() => handleSearch()}
            disabled={!query.trim() || loading}
            className="px-4 py-2 rounded-lg text-[12px] font-semibold transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff' }}
          >
            {loading ? '...' : '→'}
          </button>
        </div>

        {/* Example queries */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {EXAMPLE_QUERIES.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSearch(q)}
              className="px-2.5 py-1 rounded-full text-[10px] font-medium bg-prism-surface-2 text-prism-text-dim hover:text-prism-text hover:bg-prism-surface-hover border border-prism-border/30 hover:border-prism-border transition-all cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {error && <div className="text-[12px] text-prism-rose bg-prism-rose/8 border border-prism-rose/20 rounded-lg px-3 py-2.5 mb-3">{error}</div>}

        {searchData?.ai_summary && searchData.results?.length > 0 && (
          <div className="mb-4 rounded-xl bg-prism-emerald/5 border border-prism-emerald/20 p-3.5 glow-emerald animate-fade-in">
            <h3 className="text-[12px] font-semibold text-prism-emerald flex items-center gap-1.5 mb-2">
              <span className="text-sm">✨</span> AI Summary
            </h3>
            <p className="text-[11px] text-prism-text-dim leading-relaxed">
              {searchData.ai_summary}
            </p>
          </div>
        )}

        {searchData?.results?.length > 0 && (
          <div className="space-y-2 animate-fade-in">
            <p className="text-[11px] text-prism-text-muted font-medium mb-2">
              {searchData.results.length} results for "{searchData.query}"
            </p>
            {searchData.results.map((result, i) => {
              const Icon = typeIcons[result.type] || HiOutlineCode;
              const color = typeColors[result.type] || '#6366f1';
              return (
                <button
                  key={i}
                  onClick={() => onSelectNode?.(result.id)}
                  className="w-full text-left rounded-lg bg-prism-surface-2/30 hover:bg-prism-surface-2 border border-prism-border/30 hover:border-prism-border transition-all p-3 cursor-pointer group"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: `${color}10` }}>
                      <Icon className="w-3.5 h-3.5" style={{ color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[12px] font-semibold text-prism-text group-hover:text-white transition-colors">{result.metadata?.name || result.path.split('/').pop()}</span>
                        <span className="badge" style={{ background: `${color}10`, color, border: `1px solid ${color}20` }}>
                          {result.type}
                        </span>
                        <div className="ml-auto flex items-center gap-1">
                          <HiOutlineStar className="w-3 h-3" style={{ color: '#eab308' }} />
                          <span className="text-[10px] font-semibold" style={{ color: '#eab308' }}>{(result.score * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-prism-text-muted font-mono">{result.path}</p>
                      {result.explanation && (
                        <p className="text-[11px] text-prism-text-dim mt-1 leading-relaxed">{result.explanation}</p>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {searchData?.results?.length === 0 && (
          <div className="text-center py-10 text-prism-text-muted text-[12px]">No results found. Try a different query.</div>
        )}
      </div>
    </div>
  );
}
