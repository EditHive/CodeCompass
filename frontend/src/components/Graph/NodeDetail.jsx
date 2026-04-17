import React, { useState, useEffect } from 'react';
import { HiOutlineFolder, HiOutlineCode, HiOutlineCube, HiOutlineArrowRight, HiOutlineArrowLeft } from 'react-icons/hi';

export default function NodeDetail({ nodeId, nodeData, onClose }) {
  if (!nodeData) return null;

  const type = nodeData.type;
  const typeColors = { file: '#7c5cfc', function: '#22d3ee', class: '#34d399' };
  const color = typeColors[type] || '#7c5cfc';

  return (
    <div className="absolute top-3 right-3 w-[320px] max-h-[calc(100%-24px)] glass-strong rounded-xl z-20 animate-slide-in overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-prism-border">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0" style={{ background: `${color}20` }}>
            {type === 'file' ? <HiOutlineFolder className="w-3.5 h-3.5" style={{ color }} /> :
             type === 'function' ? <HiOutlineCode className="w-3.5 h-3.5" style={{ color }} /> :
             <HiOutlineCube className="w-3.5 h-3.5" style={{ color }} />}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold truncate" style={{ color }}>{nodeData.label || nodeData.name || nodeId}</p>
            <p className="text-[10px] text-prism-text-dim capitalize">{type}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-prism-text-dim hover:text-prism-text text-lg cursor-pointer">×</button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 text-xs">
        {/* Metrics */}
        {type === 'file' && (
          <div className="grid grid-cols-3 gap-2">
            <MetricCard label="LOC" value={nodeData.loc} />
            <MetricCard label="Functions" value={nodeData.num_functions} />
            <MetricCard label="Classes" value={nodeData.num_classes} />
          </div>
        )}
        {type === 'function' && (
          <div className="grid grid-cols-3 gap-2">
            <MetricCard label="Lines" value={`${nodeData.line_start}-${nodeData.line_end}`} />
            <MetricCard label="Params" value={nodeData.params?.length || 0} />
            <MetricCard label="Complexity" value={nodeData.complexity} highlight={nodeData.complexity > 5} />
          </div>
        )}

        {/* Docstring */}
        {nodeData.docstring && (
          <div>
            <p className="text-prism-text-dim mb-1 font-medium">Description</p>
            <p className="text-prism-text leading-relaxed">{nodeData.docstring}</p>
          </div>
        )}

        {/* File path */}
        {nodeData.file && (
          <div>
            <p className="text-prism-text-dim mb-1 font-medium">File</p>
            <p className="text-prism-accent font-mono text-[11px]">{nodeData.file}</p>
          </div>
        )}

        {/* Edges */}
        {nodeData.incoming_edges?.length > 0 && (
          <div>
            <p className="text-prism-text-dim mb-1.5 font-medium flex items-center gap-1">
              <HiOutlineArrowLeft className="w-3 h-3" /> Incoming ({nodeData.incoming_edges.length})
            </p>
            <div className="space-y-1">
              {nodeData.incoming_edges.slice(0, 8).map((e, i) => (
                <div key={i} className="flex items-center gap-2 px-2 py-1 rounded bg-prism-surface-2/50">
                  <span className="badge badge-info text-[9px]">{e.type}</span>
                  <span className="truncate text-prism-text">{e.source.split('::').pop().split('/').pop()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {nodeData.outgoing_edges?.length > 0 && (
          <div>
            <p className="text-prism-text-dim mb-1.5 font-medium flex items-center gap-1">
              <HiOutlineArrowRight className="w-3 h-3" /> Outgoing ({nodeData.outgoing_edges.length})
            </p>
            <div className="space-y-1">
              {nodeData.outgoing_edges.slice(0, 8).map((e, i) => (
                <div key={i} className="flex items-center gap-2 px-2 py-1 rounded bg-prism-surface-2/50">
                  <span className="badge badge-info text-[9px]">{e.type}</span>
                  <span className="truncate text-prism-text">{e.target.split('::').pop().split('/').pop()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value, highlight }) {
  return (
    <div className={`rounded-lg px-2.5 py-2 text-center ${highlight ? 'bg-prism-red/10 border border-prism-red/30' : 'bg-prism-surface-2'}`}>
      <p className={`font-bold text-sm ${highlight ? 'text-prism-red' : 'text-prism-text'}`}>{value ?? '-'}</p>
      <p className="text-[10px] text-prism-text-dim mt-0.5">{label}</p>
    </div>
  );
}
