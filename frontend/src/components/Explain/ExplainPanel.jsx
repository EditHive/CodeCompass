import React, { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { explainCode, getNodes } from '../../services/api';
import { HiOutlineCode, HiOutlineAcademicCap, HiOutlineLightBulb, HiOutlineChip } from 'react-icons/hi';

const LEVELS = [
  { id: 'beginner', label: 'Beginner', icon: HiOutlineAcademicCap, color: '#34d399', desc: 'Simple, plain English' },
  { id: 'intermediate', label: 'Intermediate', icon: HiOutlineLightBulb, color: '#fbbf24', desc: 'Technical details' },
  { id: 'expert', label: 'Expert', icon: HiOutlineChip, color: '#f87171', desc: 'Deep analysis' },
];

export default function ExplainPanel() {
  const [selectedNode, setSelectedNode] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [level, setLevel] = useState('intermediate');
  const { data: nodesData, execute: loadNodes } = useApi(getNodes);
  const { data: explainData, loading, error, execute: runExplain } = useApi(explainCode);

  const handleExplain = async () => {
    if (!selectedNode) return;
    await runExplain(selectedNode, level);
  };

  const filteredNodes = nodesData?.nodes?.filter(n =>
    n.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.id.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-prism-border">
        <div className="flex items-center gap-2 mb-2">
          <HiOutlineCode className="w-5 h-5 text-prism-amber" />
          <h2 className="text-sm font-bold text-prism-text">Multi-Level Explainer</h2>
        </div>
        <p className="text-xs text-prism-text-dim">Get explanations at your level of expertise.</p>
      </div>

      {/* Controls */}
      <div className="px-4 py-3 border-b border-prism-border space-y-3">
        {/* Node search */}
        <div>
          <input
            type="text"
            placeholder="Search for a file, function, or class..."
            value={searchTerm}
            onFocus={() => { if (!nodesData) loadNodes(); }}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg bg-prism-surface-2 border border-prism-border text-xs text-prism-text placeholder-prism-text-dim focus:outline-none focus:border-prism-amber transition-colors"
          />
          {searchTerm && filteredNodes.length > 0 && (
            <div className="mt-1 max-h-[120px] overflow-y-auto rounded-lg bg-prism-surface border border-prism-border">
              {filteredNodes.slice(0, 15).map(node => (
                <button
                  key={node.id}
                  onClick={() => { setSelectedNode(node.id); setSearchTerm(node.label); }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left hover:bg-prism-surface-2 transition-colors cursor-pointer"
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
        </div>

        {/* Level selector */}
        <div className="flex gap-2">
          {LEVELS.map(l => {
            const Icon = l.icon;
            const isActive = level === l.id;
            return (
              <button
                key={l.id}
                onClick={() => setLevel(l.id)}
                className={`flex-1 flex flex-col items-center gap-1 px-2 py-2 rounded-lg text-[10px] font-medium transition-all cursor-pointer border ${
                  isActive ? '' : 'border-transparent bg-prism-surface-2/50 text-prism-text-dim hover:bg-prism-surface-2'
                }`}
                style={isActive ? { background: `${l.color}10`, borderColor: `${l.color}40`, color: l.color } : {}}
              >
                <Icon className="w-4 h-4" />
                {l.label}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleExplain}
          disabled={!selectedNode || loading}
          className="w-full py-2 rounded-lg text-xs font-semibold bg-prism-amber/15 text-prism-amber border border-prism-amber/30 hover:bg-prism-amber/25 disabled:opacity-40 transition-all cursor-pointer"
        >
          {loading ? 'Generating...' : '💡 Explain'}
        </button>
      </div>

      {/* Explanation */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {error && <div className="text-xs text-prism-red bg-prism-red/10 rounded-lg px-3 py-2 mb-3">{error}</div>}

        {explainData && !explainData.error && (
          <div className="animate-fade-in space-y-3">
            {/* Title */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-prism-text">{explainData.name}</span>
              <span className="badge badge-info text-[9px]">{explainData.type}</span>
              <span className="badge text-[9px]" style={{
                background: `${LEVELS.find(l => l.id === explainData.level)?.color}15`,
                color: LEVELS.find(l => l.id === explainData.level)?.color,
                border: `1px solid ${LEVELS.find(l => l.id === explainData.level)?.color}30`,
              }}>
                {explainData.level}
              </span>
            </div>

            {/* Explanation content */}
            {explainData.ai_explanation ? (
              <div className="prose-sm text-xs text-prism-text leading-relaxed space-y-2 mb-4 bg-prism-accent/10 border border-prism-accent/30 p-3 rounded-xl glow-accent">
                <div className="flex items-center gap-1.5 mb-2 border-b border-prism-accent/30 pb-1.5">
                  <span className="text-sm">✨</span>
                  <span className="font-bold text-prism-accent">AI Explanation</span>
                </div>
                {explainData.ai_explanation.split('\n').map((line, i) => {
                  if (line.startsWith('### ')) return <h4 key={i} className="text-xs font-bold text-prism-text mt-2 mb-1">{line.replace('### ', '')}</h4>;
                  if (line.startsWith('## ')) return <h3 key={i} className="text-sm font-bold text-prism-text mt-3 mb-1">{line.replace('## ', '')}</h3>;
                  if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-semibold text-prism-text">{line.replace(/\*\*/g, '')}</p>;
                  if (line.startsWith('- ')) return <p key={i} className="pl-3 text-prism-text-dim">• {line.slice(2).replace(/\*\*/g, '')}</p>;
                  if (line.includes('`')) {
                    const parts = line.split('`');
                    return <p key={i} className="text-prism-text-dim">{parts.map((part, j) => j % 2 === 1 ? <code key={j} className="px-1 py-0.5 rounded bg-prism-surface-2 text-prism-cyan text-[11px] font-mono">{part}</code> : part)}</p>;
                  }
                  if (line.trim()) return <p key={i} className="text-prism-text-dim">{line.replace(/\*\*/g, '')}</p>;
                  return null;
                })}
              </div>
            ) : null}

            {!explainData.ai_explanation && (
              <div className="prose-sm text-xs text-prism-text leading-relaxed space-y-2">
                {explainData.explanation.split('\n').map((line, i) => {
                  if (line.startsWith('## ')) return <h3 key={i} className="text-sm font-bold text-prism-text mt-3 mb-1">{line.replace('## ', '')}</h3>;
                  if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-semibold text-prism-text">{line.replace(/\*\*/g, '')}</p>;
                  if (line.startsWith('- ')) return <p key={i} className="pl-3 text-prism-text-dim">• {line.slice(2)}</p>;
                  if (line.startsWith('> ')) return <div key={i} className="border-l-2 border-prism-amber pl-3 text-prism-amber/80 py-0.5">{line.slice(2)}</div>;
                  if (line.includes('`')) {
                    const parts = line.split('`');
                    return <p key={i}>{parts.map((part, j) => j % 2 === 1 ? <code key={j} className="px-1 py-0.5 rounded bg-prism-surface-2 text-prism-cyan text-[11px] font-mono">{part}</code> : part)}</p>;
                  }
                  if (line.trim()) return <p key={i} className="text-prism-text-dim">{line}</p>;
                  return null;
                })}
              </div>
            )}

            {/* Code snippet */}
            {explainData.code_snippet && (
              <div>
                <p className="text-xs font-medium text-prism-text-dim mb-1.5">Source Code</p>
                <div className="code-block text-[11px] max-h-[250px] overflow-y-auto">
                  {explainData.code_snippet}
                </div>
              </div>
            )}

            {/* Metadata */}
            {explainData.metadata && (
              <div className="rounded-lg bg-prism-surface-2/50 px-3 py-2 text-[10px] space-y-1">
                {explainData.metadata.params?.length > 0 && <p><span className="text-prism-text-dim">Params:</span> <span className="text-prism-cyan">{explainData.metadata.params.join(', ')}</span></p>}
                {explainData.metadata.complexity && <p><span className="text-prism-text-dim">Complexity:</span> <span className={explainData.metadata.complexity > 5 ? 'text-prism-red' : 'text-prism-green'}>{explainData.metadata.complexity}</span></p>}
                {explainData.metadata.calls?.length > 0 && <p><span className="text-prism-text-dim">Calls:</span> <span className="text-prism-text">{explainData.metadata.calls.join(', ')}</span></p>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
