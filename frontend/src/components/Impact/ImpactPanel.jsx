import React, { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { analyzeImpact, getNodes } from '../../services/api';
import { HiOutlineLightningBolt, HiOutlineExclamationCircle, HiOutlineChevronRight } from 'react-icons/hi';

export default function ImpactPanel({ onHighlightNodes, onSelectNode }) {
  const [selectedNodeId, setSelectedNodeId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { data: nodesData, execute: loadNodes } = useApi(getNodes);
  const { data: impactData, loading, error, execute: runImpact } = useApi(analyzeImpact);

  const handleLoadNodes = () => {
    if (!nodesData) loadNodes();
  };

  const handleAnalyze = async () => {
    if (!selectedNodeId) return;
    const result = await runImpact(selectedNodeId);
    if (result && !result.error) {
      const allImpacted = [
        { id: selectedNodeId, depth: 0 },
        ...result.direct.map(n => ({ ...n, depth: 1 })),
        ...result.indirect.map(n => ({ ...n })),
        ...result.potential.map(n => ({ ...n })),
      ];
      onHighlightNodes?.(allImpacted);
    }
  };

  const filteredNodes = nodesData?.nodes?.filter(n =>
    n.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.id.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const severityConfig = {
    direct: { color: '#f43f5e', bg: '#f43f5e', label: 'Direct' },
    indirect: { color: '#f97316', bg: '#f97316', label: 'Indirect' },
    potential: { color: '#eab308', bg: '#eab308', label: 'Potential' },
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-4 border-b border-prism-border">
        <p className="text-[12px] text-prism-text-dim leading-relaxed">
          Select a node and simulate the impact of changing it across your codebase.
        </p>
      </div>

      {/* Node Selector */}
      <div className="px-4 py-3 border-b border-prism-border space-y-2.5">
        <input
          type="text"
          placeholder="Search files, functions, classes..."
          value={searchTerm}
          onFocus={handleLoadNodes}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-prism-surface-2 border border-prism-border text-[12px] text-prism-text placeholder-prism-text-muted focus:outline-none focus:border-prism-accent focus:ring-2 focus:ring-prism-accent/10 transition-all"
        />

        {searchTerm && filteredNodes.length > 0 && (
          <div className="max-h-[140px] overflow-y-auto rounded-lg bg-prism-surface border border-prism-border">
            {filteredNodes.slice(0, 20).map(node => (
              <button
                key={node.id}
                onClick={() => { setSelectedNodeId(node.id); setSearchTerm(node.label); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-[12px] text-left hover:bg-prism-surface-2 transition-colors cursor-pointer ${
                  selectedNodeId === node.id ? 'bg-prism-accent/8 text-prism-accent' : 'text-prism-text'
                }`}
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{
                  background: node.type === 'file' ? '#6366f1' : node.type === 'function' ? '#22d3ee' : '#10b981'
                }} />
                <span className="truncate">{node.label}</span>
                <span className="ml-auto text-[10px] text-prism-text-muted font-medium">{node.type}</span>
              </button>
            ))}
          </div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={!selectedNodeId || loading}
          className="w-full py-2.5 rounded-lg text-[12px] font-semibold transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #f43f5e, #e11d48)', color: '#fff' }}
        >
          <HiOutlineLightningBolt className="w-3.5 h-3.5" />
          {loading ? 'Analyzing...' : 'Simulate Impact'}
        </button>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {error && (
          <div className="text-[12px] text-prism-rose bg-prism-rose/8 border border-prism-rose/20 rounded-lg px-3 py-2.5 mb-3">{error}</div>
        )}

        {impactData && !impactData.error && (
          <div className="space-y-3 animate-fade-in">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(severityConfig).map(([key, cfg]) => (
                <div key={key} className="rounded-lg px-2 py-2.5 text-center border" style={{ background: `${cfg.color}08`, borderColor: `${cfg.color}20` }}>
                  <p className="font-bold text-base" style={{ color: cfg.color }}>{impactData.summary[key]}</p>
                  <p className="text-[10px] text-prism-text-muted font-medium mt-0.5">{cfg.label}</p>
                </div>
              ))}
            </div>

            {/* Source Node */}
            <div className="rounded-lg border border-prism-accent/20 bg-prism-accent/5 px-3 py-2.5">
              <p className="text-[10px] text-prism-text-muted font-medium mb-0.5">Source Node</p>
              <p className="text-[12px] font-semibold text-prism-accent">{impactData.source.label}</p>
              <p className="text-[10px] text-prism-text-muted capitalize">{impactData.source.type}</p>
            </div>

            {/* AI Summary */}
            {impactData.ai_summary && (
              <div className="rounded-lg border border-prism-violet/20 bg-prism-violet/5 px-3 py-3 glow-accent">
                <p className="text-[12px] font-semibold text-prism-violet mb-2 flex items-center gap-1.5">
                  <span className="text-sm">✨</span> AI Assessment
                </p>
                <div className="text-[11px] text-prism-text-dim space-y-1 leading-relaxed">
                  {impactData.ai_summary.split('\n').map((line, i) => {
                    const l = line.replace(/\*\*/g, '');
                    if (l.trim().startsWith('-')) return <p key={i} className="pl-3 relative"><span className="absolute left-0 text-prism-violet">•</span> {l.substring(1).trim()}</p>;
                    if (l.trim().match(/^\d+\./)) return <p key={i} className="font-semibold text-prism-text mt-1.5">{l.trim()}</p>;
                    if (l.trim()) return <p key={i}>{l}</p>;
                    return null;
                  })}
                </div>
              </div>
            )}

            {/* Affected Nodes */}
            {['direct', 'indirect', 'potential'].map(level => {
              const items = impactData[level];
              if (!items?.length) return null;
              const cfg = severityConfig[level];
              return (
                <div key={level}>
                  <p className="text-[11px] font-semibold mb-2 flex items-center gap-1.5" style={{ color: cfg.color }}>
                    <HiOutlineExclamationCircle className="w-3.5 h-3.5" />
                    {cfg.label} Impact ({items.length})
                  </p>
                  <div className="space-y-1">
                    {items.map((item, i) => (
                      <button
                        key={i}
                        onClick={() => onSelectNode?.(item.id)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-prism-surface-2/40 hover:bg-prism-surface-2 border border-prism-border/30 hover:border-prism-border transition-all text-left cursor-pointer group"
                      >
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: cfg.color }} />
                        <span className="text-[12px] text-prism-text truncate flex-1">{item.label}</span>
                        <span className="text-[10px] text-prism-text-muted font-medium">{item.type}</span>
                        <HiOutlineChevronRight className="w-3 h-3 text-prism-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
