import React, { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { explainCode, getNodes } from '../../services/api';
import { HiOutlineAcademicCap, HiOutlineLightBulb, HiOutlineChip } from 'react-icons/hi';

const LEVELS = [
  { id: 'beginner', label: 'Beginner', icon: HiOutlineAcademicCap, color: '#10b981', desc: 'Simple, plain English' },
  { id: 'intermediate', label: 'Intermediate', icon: HiOutlineLightBulb, color: '#f59e0b', desc: 'Technical details' },
  { id: 'expert', label: 'Expert', icon: HiOutlineChip, color: '#f43f5e', desc: 'Deep analysis' },
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
      <div className="px-4 py-4 border-b border-prism-border">
        <p className="text-[12px] text-prism-text-dim leading-relaxed">
          Get AI-powered explanations at your preferred expertise level.
        </p>
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
            className="w-full px-3 py-2 rounded-lg bg-prism-surface-2 border border-prism-border text-[12px] text-prism-text placeholder-prism-text-muted focus:outline-none focus:border-prism-amber focus:ring-2 focus:ring-prism-amber/10 transition-all"
          />
          {searchTerm && filteredNodes.length > 0 && (
            <div className="mt-1.5 max-h-[120px] overflow-y-auto rounded-lg bg-prism-surface border border-prism-border">
              {filteredNodes.slice(0, 15).map(node => (
                <button
                  key={node.id}
                  onClick={() => { setSelectedNode(node.id); setSearchTerm(node.label); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-left hover:bg-prism-surface-2 transition-colors cursor-pointer"
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{
                    background: node.type === 'file' ? '#6366f1' : node.type === 'function' ? '#22d3ee' : '#10b981'
                  }} />
                  <span className="truncate text-prism-text">{node.label}</span>
                  <span className="ml-auto text-[10px] text-prism-text-muted font-medium">{node.type}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Level selector */}
        <div className="grid grid-cols-3 gap-2">
          {LEVELS.map(l => {
            const Icon = l.icon;
            const isActive = level === l.id;
            return (
              <button
                key={l.id}
                onClick={() => setLevel(l.id)}
                className={`flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer border ${
                  isActive ? '' : 'border-prism-border/50 bg-prism-surface-2/30 text-prism-text-dim hover:bg-prism-surface-2'
                }`}
                style={isActive ? { background: `${l.color}10`, borderColor: `${l.color}30`, color: l.color } : {}}
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
          className="w-full py-2.5 rounded-lg text-[12px] font-semibold transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff' }}
        >
          <HiOutlineLightBulb className="w-3.5 h-3.5" />
          {loading ? 'Generating...' : 'Explain'}
        </button>
      </div>

      {/* Explanation */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {error && <div className="text-[12px] text-prism-rose bg-prism-rose/8 border border-prism-rose/20 rounded-lg px-3 py-2.5 mb-3">{error}</div>}

        {explainData && !explainData.error && (
          <div className="animate-fade-in space-y-3">
            {/* Title */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[13px] font-semibold text-prism-text">{explainData.name}</span>
              <span className="badge" style={{ background: '#6366f110', color: '#6366f1', border: '1px solid #6366f120' }}>{explainData.type}</span>
              <span className="badge" style={{
                background: `${LEVELS.find(l => l.id === explainData.level)?.color}10`,
                color: LEVELS.find(l => l.id === explainData.level)?.color,
                border: `1px solid ${LEVELS.find(l => l.id === explainData.level)?.color}20`,
              }}>
                {explainData.level}
              </span>
            </div>

            {/* AI Explanation */}
            {explainData.ai_explanation ? (
              <div className="rounded-lg bg-prism-amber/5 border border-prism-amber/15 p-3.5 glow-amber">
                <div className="flex items-center gap-1.5 mb-2.5 pb-2 border-b border-prism-amber/15">
                  <span className="text-sm">✨</span>
                  <span className="text-[12px] font-semibold text-prism-amber">AI Explanation</span>
                </div>
                <div className="text-[11px] text-prism-text-dim space-y-1.5 leading-relaxed">
                  {explainData.ai_explanation.split('\n').map((line, i) => {
                    if (line.startsWith('### ')) return <h4 key={i} className="text-[12px] font-semibold text-prism-text mt-2 mb-1">{line.replace('### ', '')}</h4>;
                    if (line.startsWith('## ')) return <h3 key={i} className="text-[13px] font-bold text-prism-text mt-3 mb-1">{line.replace('## ', '')}</h3>;
                    if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="font-semibold text-prism-text">{line.replace(/\*\*/g, '')}</p>;
                    if (line.startsWith('- ')) return <p key={i} className="pl-3 text-prism-text-dim">• {line.slice(2).replace(/\*\*/g, '')}</p>;
                    if (line.includes('`')) {
                      const parts = line.split('`');
                      return <p key={i} className="text-prism-text-dim">{parts.map((part, j) => j % 2 === 1 ? <code key={j} className="px-1.5 py-0.5 rounded-md bg-prism-surface-2 text-prism-cyan text-[11px] font-mono">{part}</code> : part)}</p>;
                    }
                    if (line.trim()) return <p key={i} className="text-prism-text-dim">{line.replace(/\*\*/g, '')}</p>;
                    return null;
                  })}
                </div>
              </div>
            ) : null}

            {!explainData.ai_explanation && explainData.explanation && (
              <div className="text-[11px] text-prism-text-dim space-y-1.5 leading-relaxed">
                {explainData.explanation.split('\n').map((line, i) => {
                  if (line.startsWith('## ')) return <h3 key={i} className="text-[13px] font-bold text-prism-text mt-3 mb-1">{line.replace('## ', '')}</h3>;
                  if (line.startsWith('- ')) return <p key={i} className="pl-3">• {line.slice(2)}</p>;
                  if (line.startsWith('> ')) return <div key={i} className="border-l-2 border-prism-amber/50 pl-3 text-prism-amber/70 py-0.5">{line.slice(2)}</div>;
                  if (line.trim()) return <p key={i}>{line}</p>;
                  return null;
                })}
              </div>
            )}

            {/* Code snippet */}
            {explainData.code_snippet && (
              <div>
                <p className="text-[11px] font-semibold text-prism-text-dim mb-2 uppercase tracking-wider">Source Code</p>
                <div className="code-block text-[11px] max-h-[220px] overflow-y-auto">
                  {explainData.code_snippet}
                </div>
              </div>
            )}

            {/* Metadata */}
            {explainData.metadata && (
              <div className="rounded-lg bg-prism-surface-2/40 border border-prism-border/50 px-3.5 py-2.5 text-[11px] space-y-1.5">
                {explainData.metadata.params?.length > 0 && <p><span className="text-prism-text-muted font-medium">Params:</span> <span className="text-prism-cyan font-mono">{explainData.metadata.params.join(', ')}</span></p>}
                {explainData.metadata.complexity && <p><span className="text-prism-text-muted font-medium">Complexity:</span> <span className={explainData.metadata.complexity > 5 ? 'text-prism-rose' : 'text-prism-emerald'} style={{ fontWeight: 600 }}>{explainData.metadata.complexity}</span></p>}
                {explainData.metadata.calls?.length > 0 && <p><span className="text-prism-text-muted font-medium">Calls:</span> <span className="text-prism-text-dim">{explainData.metadata.calls.join(', ')}</span></p>}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
