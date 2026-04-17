import React from 'react';
import {
  HiOutlineFolder,
  HiOutlineCode,
  HiOutlineCube,
  HiOutlineArrowRight,
  HiOutlineArrowLeft,
  HiX,
} from 'react-icons/hi';

// ─── Building Blueprint Panel ──────────────────────────────────────────────────
// Matches the city metaphor of GraphCanvas. Each file = a building.
// This panel is a "blueprint card" for the selected building.

export default function NodeDetail({ nodeId, nodeData, onClose }) {
  if (!nodeData) return null;

  const type = nodeData.type;
  const typeConfig = {
    file:     { color: '#6366f1', label: 'FILE',     emoji: '🏢' },
    function: { color: '#22d3ee', label: 'FUNCTION', emoji: '⚡' },
    class:    { color: '#10b981', label: 'CLASS',    emoji: '📦' },
  };
  const config = typeConfig[type] || typeConfig.file;
  const displayName = nodeData.label || nodeData.name || nodeId.split('/').pop();

  const containsEdges = nodeData.outgoing_edges?.filter(e => e.type === 'contains') || [];
  const otherOutgoingEdges = nodeData.outgoing_edges?.filter(e => e.type !== 'contains') || [];
  const incomingEdges = nodeData.incoming_edges || [];
  const totalConnections = incomingEdges.length + otherOutgoingEdges.length;

  // Mini building visual: height based on LOC
  const locHeight = type === 'file' ? Math.min(80, Math.max(24, (nodeData.loc || 50) / 5)) : 36;
  const windowRows = type === 'file' ? Math.max(1, Math.min(5, Math.ceil((nodeData.loc || 0) / 80))) : 2;

  return (
    <>
      <style>{`
        .bp-scroll::-webkit-scrollbar { width: 3px; }
        .bp-scroll::-webkit-scrollbar-track { background: transparent; }
        .bp-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 3px; }
        .bp-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.15); }
        @keyframes blueprintIn {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .bp-animate { animation: blueprintIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>

      <div
        className="w-[360px] max-h-[520px] flex flex-col overflow-hidden bp-animate relative"
        style={{
          background: '#0c0f18',
          border: `1px solid ${config.color}30`,
          borderRadius: '10px',
          boxShadow: `0 0 0 1px ${config.color}10, 0 20px 40px -12px rgba(0,0,0,0.6)`,
        }}
      >
        {/* ── Top accent bar ── */}
        <div
          className="h-[3px] shrink-0"
          style={{ background: `linear-gradient(90deg, transparent, ${config.color}, transparent)` }}
        />

        {/* ── Header row ── */}
        <div className="flex items-center gap-3 px-4 py-3 shrink-0">
          {/* Mini building icon */}
          <div className="relative flex flex-col items-center" style={{ width: 36 }}>
            {/* Roof */}
            <svg width="36" height="10" viewBox="0 0 36 10" className="mb-[-1px]">
              <polygon points="4,10 18,0 32,10" fill={config.color} opacity="0.5" />
            </svg>
            {/* Body */}
            <div
              className="w-[28px] rounded-sm flex flex-wrap items-start justify-center gap-0.5 p-1"
              style={{
                height: Math.min(30, locHeight * 0.4),
                background: '#111525',
                border: `1px solid ${config.color}50`,
              }}
            >
              {Array.from({ length: Math.min(6, windowRows * 2) }).map((_, i) => (
                <div key={i} className="w-[5px] h-[4px] rounded-[1px]" style={{ background: `${config.color}55` }} />
              ))}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className="text-[9px] font-bold tracking-[0.15em] px-1.5 py-[1px] rounded"
                style={{ background: `${config.color}20`, color: config.color, border: `1px solid ${config.color}30` }}
              >
                {config.label}
              </span>
              {totalConnections > 3 && (
                <span className="text-[9px] font-bold tracking-wider px-1.5 py-[1px] rounded bg-amber-500/15 text-amber-400 border border-amber-500/25">
                  HUB
                </span>
              )}
            </div>
            <h2 className="text-[14px] font-bold text-white truncate leading-tight" style={{ fontFamily: '"SF Mono", "Fira Code", monospace' }} title={displayName}>
              {displayName}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-6 h-6 rounded flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          >
            <HiX className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* ── Path bar ── */}
        {nodeData.file && (
          <div className="mx-4 mb-3 flex items-center gap-2 px-3 py-1.5 rounded bg-white/[0.03] border border-white/[0.04]">
            <HiOutlineFolder className="w-3 h-3 text-white/25 shrink-0" />
            <span className="text-[10px] text-white/40 font-mono truncate" title={nodeData.file}>{nodeData.file}</span>
          </div>
        )}

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 bp-scroll space-y-4">

          {/* ── Metrics row ── */}
          {type === 'file' && (
            <div className="grid grid-cols-3 gap-2">
              <Metric label="Lines of Code" value={nodeData.loc} color={config.color} />
              <Metric label="Functions" value={nodeData.num_functions} color="#22d3ee" />
              <Metric label="Classes" value={nodeData.num_classes} color="#10b981" />
            </div>
          )}
          {type === 'function' && (
            <div className="grid grid-cols-3 gap-2">
              <Metric label="Line Range" value={`${nodeData.line_start}–${nodeData.line_end}`} color={config.color} />
              <Metric label="Params" value={nodeData.params?.length || 0} color="#22d3ee" />
              <Metric label="Complexity" value={nodeData.complexity} color={nodeData.complexity > 5 ? '#ef4444' : '#10b981'} warn={nodeData.complexity > 5} />
            </div>
          )}
          {type === 'class' && (
            <div className="grid grid-cols-2 gap-2">
              <Metric label="Line Range" value={`${nodeData.line_start}–${nodeData.line_end}`} color={config.color} />
              <Metric label="Methods" value={nodeData.num_functions} color="#22d3ee" />
            </div>
          )}

          {/* ── Contains (classes & functions) ── */}
          {containsEdges.length > 0 && (
            <div>
              <SectionHeader icon={HiOutlineCode} label="Contains" count={containsEdges.length} color={config.color} />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {containsEdges.slice(0, 12).map((e, i) => {
                  const name = (e.target || e.source).split('::').pop().split('/').pop();
                  return (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono border transition-colors hover:bg-white/[0.04] cursor-default"
                      style={{ color: '#c4c9d4', background: '#111525', borderColor: `${config.color}20` }}
                    >
                      <span style={{ color: config.color, fontSize: 8 }}>●</span>
                      {name}
                    </span>
                  );
                })}
                {containsEdges.length > 12 && (
                  <span className="px-2 py-1 rounded text-[10px] font-mono text-white/25 bg-white/[0.02] border border-white/[0.04]">
                    +{containsEdges.length - 12}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ── Incoming connections ── */}
          {incomingEdges.length > 0 && (
            <div>
              <SectionHeader icon={HiOutlineArrowLeft} label="Incoming" count={incomingEdges.length} color="#818cf8" />
              <div className="mt-2 space-y-1">
                {incomingEdges.slice(0, 5).map((e, i) => (
                  <EdgeRow key={i} edge={e} direction="in" color="#818cf8" />
                ))}
                {incomingEdges.length > 5 && <MoreRow count={incomingEdges.length - 5} />}
              </div>
            </div>
          )}

          {/* ── Outgoing connections ── */}
          {otherOutgoingEdges.length > 0 && (
            <div>
              <SectionHeader icon={HiOutlineArrowRight} label="Outgoing" count={otherOutgoingEdges.length} color="#34d399" />
              <div className="mt-2 space-y-1">
                {otherOutgoingEdges.slice(0, 5).map((e, i) => (
                  <EdgeRow key={i} edge={e} direction="out" color="#34d399" />
                ))}
                {otherOutgoingEdges.length > 5 && <MoreRow count={otherOutgoingEdges.length - 5} />}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function Metric({ label, value, color, warn }) {
  return (
    <div
      className="flex flex-col rounded-md px-3 py-2"
      style={{
        background: warn ? 'rgba(239,68,68,0.06)' : '#111525',
        border: `1px solid ${warn ? 'rgba(239,68,68,0.25)' : color + '18'}`,
      }}
    >
      <span className="text-[9px] text-white/35 font-medium tracking-wider uppercase mb-0.5">{label}</span>
      <span className="font-mono font-bold text-[17px] tabular-nums leading-tight" style={{ color }}>{value ?? '—'}</span>
    </div>
  );
}

function SectionHeader({ icon: Icon, label, count, color }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <Icon className="w-3 h-3" style={{ color }} />
        <span className="text-[10px] font-bold text-white/40 uppercase tracking-wider">{label}</span>
      </div>
      <span
        className="text-[9px] font-bold px-1.5 py-0.5 rounded tabular-nums"
        style={{ color, background: `${color}12` }}
      >
        {count}
      </span>
    </div>
  );
}

function EdgeRow({ edge, direction, color }) {
  const name = (direction === 'in' ? edge.source : edge.target || '').split('::').pop().split('/').pop();
  return (
    <div className="flex items-center gap-2.5 px-2.5 py-1.5 rounded hover:bg-white/[0.03] transition-colors group cursor-default">
      <span
        className="text-[8px] font-bold uppercase tracking-wider w-[52px] text-center py-0.5 rounded shrink-0"
        style={{ color, background: `${color}10`, border: `1px solid ${color}18` }}
      >
        {edge.type}
      </span>
      <span className="text-[11px] text-white/50 font-mono truncate group-hover:text-white/70 transition-colors">{name}</span>
    </div>
  );
}

function MoreRow({ count }) {
  return (
    <div className="text-[10px] text-white/20 text-center py-1.5 border-t border-white/[0.03] mt-1">
      +{count} more
    </div>
  );
}
