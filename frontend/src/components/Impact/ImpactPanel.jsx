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

  const severityColors = { direct: '#f87171', indirect: '#fb923c', potential: '#fbbf24' };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-prism-border">
        <div className="flex items-center gap-2 mb-2">
          <HiOutlineLightningBolt className="w-5 h-5 text-prism-red" />
          <h2 className="text-sm font-bold text-prism-text">Impact Simulator</h2>
        </div>
        <p className="text-xs text-prism-text-dim">Select a file or function, then simulate what happens if it changes.</p>
      </div>

      {/* Selector */}
      <div className="px-4 py-3 border-b border-prism-border space-y-2">
        <input
          type="text"
          placeholder="Search nodes..."
          value={searchTerm}
          onFocus={handleLoadNodes}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full px-3 py-1.5 rounded-lg bg-prism-surface-2 border border-prism-border text-xs text-prism-text placeholder-prism-text-dim focus:outline-none focus:border-prism-accent transition-colors"
        />

        {searchTerm && filteredNodes.length > 0 && (
          <div className="max-h-[150px] overflow-y-auto rounded-lg bg-prism-surface border border-prism-border">
            {filteredNodes.slice(0, 20).map(node => (
              <button
                key={node.id}
                onClick={() => { setSelectedNodeId(node.id); setSearchTerm(node.label); }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-prism-surface-2 transition-colors cursor-pointer ${
                  selectedNodeId === node.id ? 'bg-prism-accent/10 text-prism-accent' : 'text-prism-text'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${
                  node.type === 'file' ? 'bg-[#7c5cfc]' : node.type === 'function' ? 'bg-[#22d3ee]' : 'bg-[#34d399]'
                }`} />
                <span className="truncate">{node.label}</span>
                <span className="ml-auto text-[10px] text-prism-text-dim">{node.type}</span>
              </button>
            ))}
          </div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={!selectedNodeId || loading}
          className="w-full py-2 rounded-lg text-xs font-semibold bg-prism-red/15 text-prism-red border border-prism-red/30 hover:bg-prism-red/25 disabled:opacity-40 transition-all cursor-pointer"
        >
          {loading ? 'Analyzing...' : '⚡ Simulate Impact'}
        </button>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {error && (
          <div className="text-xs text-prism-red bg-prism-red/10 rounded-lg px-3 py-2 mb-3">{error}</div>
        )}

        {impactData && !impactData.error && (
          <div className="space-y-3 animate-fade-in">
            {/* Summary */}
            <div className="grid grid-cols-3 gap-2">
              <SummaryCard label="Direct" value={impactData.summary.direct} color="#f87171" />
              <SummaryCard label="Indirect" value={impactData.summary.indirect} color="#fb923c" />
              <SummaryCard label="Potential" value={impactData.summary.potential} color="#fbbf24" />
            </div>

            {/* Source */}
            <div className="rounded-lg bg-prism-accent/10 border border-prism-accent/30 px-3 py-2">
              <p className="text-[10px] text-prism-text-dim mb-0.5">Source Node</p>
              <p className="text-xs font-medium text-prism-accent">{impactData.source.label}</p>
              <p className="text-[10px] text-prism-text-dim capitalize">{impactData.source.type}</p>
            </div>

            {/* AI Summary */}
            {impactData.ai_summary && (
              <div className="rounded-lg bg-prism-cyan/10 border border-prism-cyan/30 px-3 py-2 glow-cyan">
                <p className="text-xs font-bold text-prism-cyan mb-1 flex items-center gap-1.5"><span className="text-sm">✨</span> AI Impact Assessment</p>
                <div className="text-[11px] text-prism-text-dim space-y-1.5">
                  {impactData.ai_summary.split('\n').map((line, i) => {
                    const l = line.replace(/\*\*/g, '');
                    if (l.trim().startsWith('-')) return <p key={i} className="pl-2.5 relative"><span className="absolute left-0 text-prism-cyan pb-1">•</span> {l.substring(1).trim()}</p>;
                    if (l.trim().match(/^\d+\./)) return <p key={i} className="font-semibold text-prism-text mt-2">{l.trim()}</p>;
                    if (l.trim()) return <p key={i}>{l}</p>;
                    return null;
                 })}
                </div>
              </div>
            )}

            {/* Affected nodes */}
            {['direct', 'indirect', 'potential'].map(level => {
              const items = impactData[level];
              if (!items?.length) return null;
              return (
                <div key={level}>
                  <p className="text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: severityColors[level] }}>
                    <HiOutlineExclamationCircle className="w-3.5 h-3.5" />
                    {level.charAt(0).toUpperCase() + level.slice(1)} Impact ({items.length})
                  </p>
                  <div className="space-y-1">
                    {items.map((item, i) => (
                      <button
                        key={i}
                        onClick={() => onSelectNode?.(item.id)}
                        className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-prism-surface-2/50 hover:bg-prism-surface-2 transition text-left cursor-pointer"
                      >
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: severityColors[level] }} />
                        <span className="text-xs text-prism-text truncate flex-1">{item.label}</span>
                        <span className="text-[10px] text-prism-text-dim">{item.type}</span>
                        <HiOutlineChevronRight className="w-3 h-3 text-prism-text-dim" />
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

function SummaryCard({ label, value, color }) {
  return (
    <div className="rounded-lg px-2 py-2 text-center" style={{ background: `${color}10`, border: `1px solid ${color}30` }}>
      <p className="font-bold text-lg" style={{ color }}>{value}</p>
      <p className="text-[10px] text-prism-text-dim">{label}</p>
    </div>
  );
}
