import React from 'react';
import { HiOutlineFolder, HiOutlineCode, HiOutlineCube, HiOutlineArrowRight, HiOutlineArrowLeft, HiX } from 'react-icons/hi';

export default function NodeDetail({ nodeId, nodeData, onClose }) {
  if (!nodeData) return null;

  const type = nodeData.type;
  const typeConfig = {
    file: { color: '#6366f1', icon: HiOutlineFolder, label: 'File' },
    function: { color: '#22d3ee', icon: HiOutlineCode, label: 'Function' },
    class: { color: '#10b981', icon: HiOutlineCube, label: 'Class' },
  };
  const config = typeConfig[type] || typeConfig.file;
  const Icon = config.icon;

  return (
    <div className="w-[340px] max-h-[420px] glass-panel rounded-xl overflow-hidden flex flex-col animate-slide-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-prism-border bg-prism-surface-2/50">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${config.color}15` }}>
            <Icon className="w-3.5 h-3.5" style={{ color: config.color }} />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold truncate text-prism-text">{nodeData.label || nodeData.name || nodeId}</p>
            <p className="text-[10px] text-prism-text-dim font-medium">{config.label}</p>
          </div>
        </div>
        <button onClick={onClose} className="w-6 h-6 rounded-md flex items-center justify-center text-prism-text-dim hover:text-prism-text hover:bg-prism-surface-2 transition-colors cursor-pointer">
          <HiX className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-xs">
        {/* Metrics */}
        {type === 'file' && (
          <div className="grid grid-cols-3 gap-2">
            <MetricCard label="LOC" value={nodeData.loc} color="#6366f1" />
            <MetricCard label="Functions" value={nodeData.num_functions} color="#22d3ee" />
            <MetricCard label="Classes" value={nodeData.num_classes} color="#10b981" />
          </div>
        )}
        {type === 'function' && (
          <div className="grid grid-cols-3 gap-2">
            <MetricCard label="Lines" value={`${nodeData.line_start}–${nodeData.line_end}`} />
            <MetricCard label="Params" value={nodeData.params?.length || 0} color="#22d3ee" />
            <MetricCard label="Complexity" value={nodeData.complexity} color={nodeData.complexity > 5 ? '#f43f5e' : '#10b981'} highlight={nodeData.complexity > 5} />
          </div>
        )}

        {/* Docstring */}
        {nodeData.docstring && (
          <div>
            <p className="text-[11px] text-prism-text-dim mb-1 font-semibold uppercase tracking-wider">Description</p>
            <p className="text-prism-text leading-relaxed text-[12px]">{nodeData.docstring}</p>
          </div>
        )}

        {/* File path */}
        {nodeData.file && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-prism-surface-2/50 border border-prism-border/50">
            <HiOutlineFolder className="w-3 h-3 text-prism-text-dim flex-shrink-0" />
            <span className="text-prism-accent text-[11px] font-mono truncate">{nodeData.file}</span>
          </div>
        )}

        {/* Edges */}
        {nodeData.incoming_edges?.length > 0 && (
          <div>
            <p className="text-[11px] text-prism-text-dim mb-1.5 font-semibold flex items-center gap-1.5">
              <HiOutlineArrowLeft className="w-3 h-3 text-prism-accent" /> Incoming
              <span className="text-prism-text-muted">({nodeData.incoming_edges.length})</span>
            </p>
            <div className="space-y-1">
              {nodeData.incoming_edges.slice(0, 6).map((e, i) => (
                <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-prism-surface-2/40 border border-prism-border/30">
                  <span className="badge" style={{ background: `${config.color}12`, color: config.color, border: `1px solid ${config.color}25` }}>{e.type}</span>
                  <span className="truncate text-prism-text text-[11px]">{e.source.split('::').pop().split('/').pop()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {nodeData.outgoing_edges?.length > 0 && (
          <div>
            <p className="text-[11px] text-prism-text-dim mb-1.5 font-semibold flex items-center gap-1.5">
              <HiOutlineArrowRight className="w-3 h-3 text-prism-emerald" /> Outgoing
              <span className="text-prism-text-muted">({nodeData.outgoing_edges.length})</span>
            </p>
            <div className="space-y-1">
              {nodeData.outgoing_edges.slice(0, 6).map((e, i) => (
                <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-prism-surface-2/40 border border-prism-border/30">
                  <span className="badge" style={{ background: '#10b98112', color: '#10b981', border: '1px solid #10b98125' }}>{e.type}</span>
                  <span className="truncate text-prism-text text-[11px]">{e.target.split('::').pop().split('/').pop()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, color = '#71717a', highlight }) {
  return (
    <div className={`rounded-lg px-2.5 py-2.5 text-center border ${highlight ? 'border-prism-rose/30 bg-prism-rose/5' : 'border-prism-border/50 bg-prism-surface-2/40'}`}>
      <p className="font-bold text-sm" style={{ color }}>{value ?? '—'}</p>
      <p className="text-[10px] text-prism-text-muted mt-0.5 font-medium">{label}</p>
    </div>
  );
}
