import React, { useState } from 'react';
import {
  HiOutlineFolder,
  HiOutlineCode,
  HiOutlineCube,
  HiOutlineArrowRight,
  HiOutlineArrowLeft,
  HiX,
  HiOutlineDocumentText,
} from 'react-icons/hi';

/* ─── constants ─────────────────────────────────────────────────────── */

const TYPE_CONFIG = {
  file:     { color: '#94a3b8', bg: 'rgba(148, 163, 184,0.1)',  border: 'rgba(148, 163, 184,0.22)',  icon: HiOutlineFolder, label: 'File' },
  function: { color: '#22d3ee', bg: 'rgba(34,211,238,0.1)',  border: 'rgba(34,211,238,0.22)',  icon: HiOutlineCode,   label: 'Function' },
  class:    { color: '#10b981', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.22)',  icon: HiOutlineCube,   label: 'Class' },
};

/* ─── styles ─────────────────────────────────────────────────────────── */

const S = {
  wrap: {
    width: 380,
    maxHeight: 520,
    background: '#111422',
    border: '1px solid rgba(148, 163, 184,0.15)',
    borderRadius: 14,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(148, 163, 184,0.06)',
    fontFamily: "'SF Pro Display',-apple-system,BlinkMacSystemFont,'Inter',sans-serif",
    animation: 'nd-slide 0.22s cubic-bezier(0.16,1,0.3,1)',
  },

  /* header */
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 14px',
    borderBottom: '1px solid rgba(148, 163, 184,0.12)',
    background: 'linear-gradient(180deg,rgba(148, 163, 184,0.05) 0%,transparent 100%)',
    flexShrink: 0,
    gap: 10,
  },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 },
  iconBox: {
    width: 30, height: 30, borderRadius: 8, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  nodeName: {
    fontSize: 13, fontWeight: 600, color: '#e2e4f0',
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
  nodeType: { fontSize: 10, color: '#555870', fontWeight: 500, marginTop: 1 },
  closeBtn: {
    width: 24, height: 24, borderRadius: 6, border: 'none',
    background: 'transparent', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    color: '#555870', transition: 'all 0.15s', flexShrink: 0,
  },

  /* body */
  body: {
    flex: 1, overflowY: 'auto', padding: '14px 16px',
    display: 'flex', flexDirection: 'column', gap: 12,
    scrollbarWidth: 'thin', scrollbarColor: 'rgba(148, 163, 184,0.15) transparent',
  },

  /* metric grid */
  metricGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 7 },
  metricCard: {
    borderRadius: 9, padding: '9px 8px', textAlign: 'center',
    border: '1px solid', display: 'flex', flexDirection: 'column', gap: 3,
  },
  metricVal: { fontSize: 15, fontWeight: 700, lineHeight: 1 },
  metricLabel: { fontSize: 9.5, fontWeight: 600, color: '#555870', letterSpacing: '0.04em' },

  /* docstring */
  section: { display: 'flex', flexDirection: 'column', gap: 6 },
  sectionLabel: {
    fontSize: 9.5, fontWeight: 700, color: '#3a3d52',
    letterSpacing: '0.08em', textTransform: 'uppercase',
    display: 'flex', alignItems: 'center', gap: 5,
  },
  docText: { fontSize: 11.5, color: '#8b8fa8', lineHeight: 1.65 },

  /* file path */
  filePath: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '8px 11px', borderRadius: 8,
    background: '#1a1e35', border: '1px solid rgba(148, 163, 184,0.12)',
  },
  filePathText: {
    fontSize: 10.5, color: '#cbd5e1',
    fontFamily: "'SF Mono','Fira Code',monospace",
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },

  /* edge section header */
  edgeSectionHead: {
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: 11, fontWeight: 700, color: '#555870',
  },
  edgeCount: {
    fontSize: 9.5, fontWeight: 600, padding: '1px 6px',
    borderRadius: 10, background: 'rgba(148, 163, 184,0.08)',
    color: '#94a3b8', border: '1px solid rgba(148, 163, 184,0.15)',
    marginLeft: 2,
  },

  /* edge item */
  edgeItem: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '7px 10px', borderRadius: 8,
    background: 'rgba(255,255,255,0.015)',
    border: '1px solid rgba(148, 163, 184,0.08)',
    transition: 'all 0.14s', cursor: 'default',
  },
  edgeBadge: {
    fontSize: 9, fontWeight: 700, padding: '2px 6px',
    borderRadius: 5, letterSpacing: '0.04em', flexShrink: 0,
  },
  edgeLabel: {
    fontSize: 11, color: '#c8cae0', flex: 1,
    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
  },
};

/* ─── sub-components ─────────────────────────────────────────────────── */

function MetricCard({ label, value, color = '#555870', bg, border, highlight }) {
  return (
    <div style={{
      ...S.metricCard,
      background: highlight ? 'rgba(244,63,94,0.06)' : (bg || 'rgba(255,255,255,0.02)'),
      borderColor: highlight ? 'rgba(244,63,94,0.22)' : (border || 'rgba(148, 163, 184,0.1)'),
    }}>
      <span style={{ ...S.metricVal, color }}>{value ?? '—'}</span>
      <span style={S.metricLabel}>{label}</span>
    </div>
  );
}

function EdgeItem({ edge, color, bg, isHovered, onEnter, onLeave }) {
  const label = (edge.source || edge.target || '')
    .split('::').pop().split('/').pop();
  return (
    <div
      style={{
        ...S.edgeItem,
        background: isHovered ? '#1a1e35' : 'rgba(255,255,255,0.015)',
        borderColor: isHovered ? `rgba(${color === '#22d3ee' ? '34,211,238' : '16,185,129'},0.2)` : 'rgba(148, 163, 184,0.08)',
      }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <span style={{
        ...S.edgeBadge,
        background: `${bg}15`,
        color,
        border: `1px solid ${bg}30`,
      }}>
        {edge.type}
      </span>
      <span style={S.edgeLabel}>{label}</span>
    </div>
  );
}

/* ─── main component ─────────────────────────────────────────────────── */

export default function NodeDetail({ nodeId, nodeData, onClose }) {
  const [hoveredEdge, setHoveredEdge] = useState(null);
  const [hoveredClose, setHoveredClose] = useState(false);

  if (!nodeData) return null;

  const cfg = TYPE_CONFIG[nodeData.type] || TYPE_CONFIG.file;
  const Icon = cfg.icon;

  return (
    <div style={S.wrap}>
      {/* ── Header ── */}
      <div style={S.header}>
        <div style={S.headerLeft}>
          <div style={{ ...S.iconBox, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
            <Icon size={14} color={cfg.color} />
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={S.nodeName}>{nodeData.label || nodeData.name || nodeId}</p>
            <p style={{ ...S.nodeType, color: cfg.color }}>{cfg.label}</p>
          </div>

          <button
            onClick={onClose}
            className="w-6 h-6 rounded flex items-center justify-center text-white/30 hover:text-white hover:bg-white/10 transition-colors shrink-0"
          >
            <HiX className="w-3.5 h-3.5" />
          </button>
        </div>
        <button
          style={{
            ...S.closeBtn,
            background: hoveredClose ? 'rgba(244,63,94,0.08)' : 'transparent',
            color: hoveredClose ? '#f43f5e' : '#555870',
          }}
          onMouseEnter={() => setHoveredClose(true)}
          onMouseLeave={() => setHoveredClose(false)}
          onClick={onClose}
        >
          <HiX size={13} />
        </button>
      </div>

      {/* ── Body ── */}
      <div style={S.body}>

        {/* Metrics — File */}
        {nodeData.type === 'file' && (
          <div style={S.metricGrid}>
            <MetricCard label="LOC" value={nodeData.loc} color="#94a3b8" bg="rgba(148, 163, 184,0.06)" border="rgba(148, 163, 184,0.15)" />
            <MetricCard label="Functions" value={nodeData.num_functions} color="#22d3ee" bg="rgba(34,211,238,0.06)" border="rgba(34,211,238,0.15)" />
            <MetricCard label="Classes" value={nodeData.num_classes} color="#10b981" bg="rgba(16,185,129,0.06)" border="rgba(16,185,129,0.15)" />
          </div>
        )}

        {/* Metrics — Function */}
        {nodeData.type === 'function' && (
          <div style={S.metricGrid}>
            <MetricCard
              label="Lines"
              value={nodeData.line_start != null ? `${nodeData.line_start}–${nodeData.line_end}` : '—'}
              color="#cbd5e1"
              bg="rgba(148, 163, 184,0.06)"
              border="rgba(148, 163, 184,0.15)"
            />
            <MetricCard label="Params" value={nodeData.params?.length ?? 0} color="#22d3ee" bg="rgba(34,211,238,0.06)" border="rgba(34,211,238,0.15)" />
            <MetricCard
              label="Complexity"
              value={nodeData.complexity}
              color={nodeData.complexity > 5 ? '#f43f5e' : '#10b981'}
              highlight={nodeData.complexity > 5}
            />
          </div>
        )}

        {/* Docstring */}
        {nodeData.docstring && (
          <div style={S.section}>
            <span style={S.sectionLabel}>
              <HiOutlineDocumentText size={11} />
              Description
            </span>
            <p style={S.docText}>{nodeData.docstring}</p>
          </div>
        )}

        {/* File path */}
        {nodeData.file && (
          <div style={S.filePath}>
            <HiOutlineFolder size={11} color="#555870" style={{ flexShrink: 0 }} />
            <span style={S.filePathText}>{nodeData.file}</span>
          </div>
        )}

        {/* Params list */}
        {nodeData.params?.length > 0 && (
          <div style={S.section}>
            <span style={S.sectionLabel}>
              <HiOutlineCode size={11} />
              Parameters
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {nodeData.params.map((p, i) => (
                <span key={i} style={{
                  fontSize: 10.5, padding: '2px 8px', borderRadius: 5,
                  background: 'rgba(34,211,238,0.08)', color: '#22d3ee',
                  border: '1px solid rgba(34,211,238,0.15)',
                  fontFamily: "'SF Mono','Fira Code',monospace",
                }}>
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Incoming edges */}
        {nodeData.incoming_edges?.length > 0 && (
          <div style={S.section}>
            <div style={S.edgeSectionHead}>
              <HiOutlineArrowLeft size={12} color="#cbd5e1" />
              <span>Incoming</span>
              <span style={S.edgeCount}>{nodeData.incoming_edges.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {nodeData.incoming_edges.slice(0, 6).map((e, i) => (
                <EdgeItem
                  key={i} edge={{ ...e, source: e.source }}
                  color="#cbd5e1" bg="#94a3b8"
                  isHovered={hoveredEdge === `in-${i}`}
                  onEnter={() => setHoveredEdge(`in-${i}`)}
                  onLeave={() => setHoveredEdge(null)}
                />
              ))}
              {nodeData.incoming_edges.length > 6 && (
                <p style={{ fontSize: 10, color: '#3a3d52', textAlign: 'center', paddingTop: 2 }}>
                  +{nodeData.incoming_edges.length - 6} more
                </p>
              )}
            </div>
          </div>
        )}

        {/* Outgoing edges */}
        {nodeData.outgoing_edges?.length > 0 && (
          <div style={S.section}>
            <div style={S.edgeSectionHead}>
              <HiOutlineArrowRight size={12} color="#10b981" />
              <span>Outgoing</span>
              <span style={{ ...S.edgeCount, background: 'rgba(16,185,129,0.08)', color: '#10b981', borderColor: 'rgba(16,185,129,0.15)' }}>
                {nodeData.outgoing_edges.length}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {nodeData.outgoing_edges.slice(0, 6).map((e, i) => (
                <EdgeItem
                  key={i} edge={{ ...e, target: e.target }}
                  color="#10b981" bg="#10b981"
                  isHovered={hoveredEdge === `out-${i}`}
                  onEnter={() => setHoveredEdge(`out-${i}`)}
                  onLeave={() => setHoveredEdge(null)}
                />
              ))}
              {nodeData.outgoing_edges.length > 6 && (
                <p style={{ fontSize: 10, color: '#3a3d52', textAlign: 'center', paddingTop: 2 }}>
                  +{nodeData.outgoing_edges.length - 6} more
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes nd-slide {
          from { opacity: 0; transform: scale(0.97) translateY(6px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
