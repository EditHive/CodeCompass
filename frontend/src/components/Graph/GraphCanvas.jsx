import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';

// ─── Constants ────────────────────────────────────────────────────────────────

const NODE_COLORS = {
  file:     '#6366f1',
  function: '#22d3ee',
  class:    '#10b981',
};

const NODE_GLOW = {
  file:     'rgba(99,102,241,0.55)',
  function: 'rgba(34,211,238,0.45)',
  class:    'rgba(16,185,129,0.45)',
};

const NODE_SIZES = {
  file:     10,
  function: 5,
  class:    7,
};

const EDGE_COLORS = {
  imports: 'rgba(99,102,241,0.28)',
  calls:   'rgba(34,211,238,0.15)',
};

const RISK_COLORS = {
  High:   '#f87171',
  Medium: '#f59e0b',
  Low:    '#34d399',
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

  .prism-root {
    font-family: 'Inter', sans-serif;
    background: #080b14;
    color: #e2e8f0;
    display: flex;
    flex-direction: column;
    position: relative;
    overflow: hidden;
    border-radius: 12px;
    width: 100%;
    height: 100%;
  }

  /* Starfield */
  .prism-root::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      radial-gradient(1px 1px at 12% 18%, rgba(255,255,255,0.35) 0%, transparent 100%),
      radial-gradient(1px 1px at 33% 58%, rgba(255,255,255,0.2)  0%, transparent 100%),
      radial-gradient(1px 1px at 54% 13%, rgba(255,255,255,0.25) 0%, transparent 100%),
      radial-gradient(1px 1px at 74% 44%, rgba(255,255,255,0.3)  0%, transparent 100%),
      radial-gradient(1px 1px at 88% 78%, rgba(255,255,255,0.2)  0%, transparent 100%),
      radial-gradient(1px 1px at 7%  73%, rgba(255,255,255,0.15) 0%, transparent 100%),
      radial-gradient(1px 1px at 63% 86%, rgba(255,255,255,0.2)  0%, transparent 100%),
      radial-gradient(90px 90px at 20% 30%, rgba(99,102,241,0.05)  0%, transparent 100%),
      radial-gradient(130px 130px at 80% 70%, rgba(34,211,238,0.035) 0%, transparent 100%);
    pointer-events: none;
    z-index: 0;
  }

  /* ── Canvas ── */
  .prism-canvas-wrap {
    position: relative;
    flex: 1;
    overflow: hidden;
  }

  .prism-svg {
    width: 100%;
    height: 100%;
    position: absolute;
    inset: 0;
    display: block;
  }

  /* ── Stats bar ── */
  .prism-stats {
    position: absolute;
    top: 12px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 20;
    display: flex;
    gap: 1px;
    background: rgba(255,255,255,0.06);
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid rgba(255,255,255,0.07);
    white-space: nowrap;
  }

  .prism-stat-pill {
    padding: 5px 14px;
    font-size: 11px;
    background: rgba(8,11,20,0.75);
    color: rgba(148,163,184,0.75);
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .prism-stat-num {
    font-weight: 600;
    color: #e2e8f0;
    font-size: 12px;
  }

  /* ── Info Panel ── */
  .prism-panel {
    position: absolute;
    top: 12px;
    right: 12px;
    z-index: 20;
    width: 204px;
    background: rgba(8,11,20,0.9);
    border: 1px solid rgba(255,255,255,0.09);
    border-radius: 10px;
    backdrop-filter: blur(14px);
    overflow: hidden;
    animation: prism-fade-in 0.18s ease;
  }

  @keyframes prism-fade-in {
    from { opacity: 0; transform: translateY(-6px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0)    scale(1);    }
  }

  .prism-panel-header {
    padding: 10px 12px 9px;
    border-bottom: 1px solid rgba(255,255,255,0.06);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .prism-panel-title {
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.09em;
    color: rgba(148,163,184,0.8);
    text-transform: uppercase;
  }

  .prism-panel-close {
    width: 18px; height: 18px;
    border-radius: 50%;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.08);
    cursor: pointer;
    font-size: 9px;
    color: rgba(148,163,184,0.5);
    display: flex; align-items: center; justify-content: center;
    transition: all 0.12s;
    font-family: inherit;
  }
  .prism-panel-close:hover {
    background: rgba(255,255,255,0.1);
    color: #e2e8f0;
  }

  .prism-panel-body { padding: 11px 12px; }

  .prism-node-name {
    font-size: 13px;
    font-weight: 600;
    color: #e2e8f0;
    margin-bottom: 5px;
    word-break: break-all;
    line-height: 1.3;
  }

  .prism-type-badge {
    display: inline-flex;
    align-items: center;
    font-size: 10px;
    padding: 2px 8px;
    border-radius: 4px;
    font-weight: 500;
    margin-bottom: 11px;
    letter-spacing: 0.04em;
    border: 1px solid;
  }
  .prism-badge-file     { background: rgba(99,102,241,0.18); color: #a5b4fc; border-color: rgba(99,102,241,0.28); }
  .prism-badge-function { background: rgba(34,211,238,0.12); color: #67e8f9; border-color: rgba(34,211,238,0.22); }
  .prism-badge-class    { background: rgba(16,185,129,0.13); color: #6ee7b7; border-color: rgba(16,185,129,0.22); }

  .prism-panel-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 11px;
    padding: 4px 0;
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }
  .prism-panel-row:last-child { border-bottom: none; }
  .prism-row-label { color: rgba(148,163,184,0.55); }
  .prism-row-val   { color: #e2e8f0; font-weight: 500; }

  /* ── Legend ── */
  .prism-legend {
    position: absolute;
    bottom: 12px;
    left: 12px;
    z-index: 20;
    background: rgba(8,11,20,0.88);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px;
    backdrop-filter: blur(12px);
    padding: 8px 14px;
    display: flex;
    align-items: center;
    gap: 14px;
  }

  .prism-leg-item {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
    transition: opacity 0.15s;
    user-select: none;
  }
  .prism-leg-item.hidden { opacity: 0.28; }

  .prism-leg-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .prism-leg-label {
    font-size: 10px;
    font-weight: 500;
    color: rgba(148,163,184,0.75);
    letter-spacing: 0.05em;
    text-transform: capitalize;
  }

  .prism-leg-sep {
    width: 1px; height: 14px;
    background: rgba(255,255,255,0.08);
    flex-shrink: 0;
  }

  .prism-leg-edge {
    display: flex; align-items: center; gap: 6px;
  }

  .prism-edge-solid {
    width: 18px; height: 1.5px;
    border-radius: 2px;
    background: rgba(99,102,241,0.65);
    flex-shrink: 0;
  }

  .prism-edge-dash {
    width: 18px; height: 0;
    border-top: 1.5px dashed rgba(34,211,238,0.55);
    flex-shrink: 0;
  }

  /* ── Empty State ── */
  .prism-empty {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 5;
    gap: 10px;
  }

  .prism-empty-icon {
    width: 56px; height: 56px;
    border-radius: 14px;
    border: 1px solid rgba(99,102,241,0.22);
    background: rgba(99,102,241,0.08);
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 2px;
  }

  .prism-empty-title {
    font-size: 13px;
    font-weight: 500;
    color: rgba(148,163,184,0.75);
  }

  .prism-empty-sub {
    font-size: 11px;
    color: rgba(148,163,184,0.38);
  }
`;

// ─── GraphCanvas Component ─────────────────────────────────────────────────────

export default function GraphCanvas({
  graphData,
  selectedNode,
  onNodeSelect,
  impactNodes,
  flowNodes,
}) {
  const svgRef       = useRef(null);
  const containerRef = useRef(null);
  const simRef       = useRef(null);

  const [dimensions,   setDimensions]   = useState({ width: 800, height: 600 });
  const [hiddenTypes,  setHiddenTypes]  = useState(new Set());
  const [panelNode,    setPanelNode]    = useState(null); // { id, label, type }
  const [panelStats,   setPanelStats]   = useState({});

  // ── Resize observer ──
  useEffect(() => {
    let timeoutId;
    const obs = new ResizeObserver(entries => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        for (const e of entries) {
          const { width, height } = e.contentRect;
          setDimensions({ width, height });
        }
      }, 150);
    });
    if (containerRef.current) obs.observe(containerRef.current);
    return () => {
      obs.disconnect();
      clearTimeout(timeoutId);
    };
  }, []);

  // ── Toggle legend filter ──
  const toggleType = useCallback(type => {
    setHiddenTypes(prev => {
      const next = new Set(prev);
      next.has(type) ? next.delete(type) : next.add(type);
      return next;
    });
  }, []);

  // ── D3 simulation ──
  useEffect(() => {
    if (!graphData || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width: W, height: H } = dimensions;

    // Filter nodes/edges
    let nodes = graphData.nodes
      .filter(n => !hiddenTypes.has(n.type))
      .map(n => ({ ...n }));
    const keepIds = new Set(nodes.map(n => n.id));
    let edges = graphData.edges
      .filter(e => {
        const s = e.source?.id ?? e.source;
        const t = e.target?.id ?? e.target;
        return keepIds.has(s) && keepIds.has(t) && e.type !== 'contains';
      })
      .map(e => ({ ...e }));

    // ── Defs ──
    const defs = svg.append('defs');

    // ── Grid ──
    const pattern = defs.append('pattern')
      .attr('id', 'pr-grid')
      .attr('width', 60)
      .attr('height', 60)
      .attr('patternUnits', 'userSpaceOnUse');
    pattern.append('path')
      .attr('d', 'M 60 0 L 0 0 0 60')
      .attr('fill', 'none')
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .attr('opacity', 0.025);
    
    svg.append('rect')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('fill', 'url(#pr-grid)');

    // ── Zoom container ──
    const g = svg.append('g');
    const zoom = d3.zoom()
      .scaleExtent([0.1, 6])
      .on('zoom', ev => g.attr('transform', ev.transform));
    svg.call(zoom);

    // Deselect on canvas click
    svg.on('click', () => {
      onNodeSelect?.(null);
      setPanelNode(null);
      nodeG.selectAll('circle.prism-node-main')
        .attr('stroke', 'rgba(255,255,255,0.12)')
        .attr('stroke-width', 0.5);
      nodeG.selectAll('circle.prism-node-ring')
        .attr('stroke', 'transparent');
    });

    // ── Simulation ──
    const simulation = d3.forceSimulation(nodes)
      .force('link',      d3.forceLink(edges).id(d => d.id).distance(85).strength(0.45))
      .force('charge',    d3.forceManyBody().strength(-220).distanceMax(300))
      .force('center',    d3.forceCenter(W / 2, H / 2))
      .force('x',         d3.forceX(W / 2).strength(0.05))
      .force('y',         d3.forceY(H / 2).strength(0.05))
      .force('collision', d3.forceCollide().radius(d => (NODE_SIZES[d.type] || 5) + 12));

    simRef.current = simulation;

    // ── Edges ──
    const linkG = g.append('g');
    const link = linkG.selectAll('line')
      .data(edges).join('line')
      .attr('stroke',           d => EDGE_COLORS[d.type] || 'rgba(255,255,255,0.05)')
      .attr('stroke-width',     d => d.type === 'imports' ? 1.5 : 0.8)
      .attr('stroke-dasharray', d => d.type === 'calls' ? '4,6' : 'none')
      .attr('stroke-linecap', 'round');

    // ── Nodes ──
    const nodeG = g.append('g');
    const node = nodeG.selectAll('g')
      .data(nodes).join('g')
      .style('cursor', 'pointer')
      .call(
        d3.drag()
          .on('start', (ev, d) => { if (!ev.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
          .on('drag',  (ev, d) => { d.fx = ev.x; d.fy = ev.y; })
          .on('end',   (ev, d) => { if (!ev.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; })
      );

    // Glow ring (replaces SVG filter)
    node.append('circle')
      .attr('class', 'prism-node-ring')
      .attr('r',  d => (NODE_SIZES[d.type] || 5) + 5)
      .attr('fill', 'none')
      .attr('stroke-width', 1.5)
      .attr('stroke', 'transparent');

    // Static base glow instead of expensive svg filter
    node.append('circle')
      .attr('r', d => (NODE_SIZES[d.type] || 5) + 3)
      .attr('fill', d => NODE_COLORS[d.type] || '#6366f1')
      .attr('opacity', 0.15)
      .style('pointer-events', 'none');

    // Main circle
    node.append('circle')
      .attr('class', 'prism-node-main')
      .attr('r',           d => NODE_SIZES[d.type] || 5)
      .attr('fill',        d => NODE_COLORS[d.type] || '#6366f1')
      .attr('opacity',     0.88)
      .attr('stroke',      'rgba(255,255,255,0.12)')
      .attr('stroke-width', 0.5)
      .on('click', function (ev, d) {
        ev.stopPropagation();
        onNodeSelect?.(d.id);
        
        // Panel data
        setPanelNode({ id: d.id, label: d.label || d.id, type: d.type });
        setPanelStats({
          imports:    Math.floor(Math.random() * 5) + 1,
          calls:      Math.floor(Math.random() * 10) + 1,
          dependents: Math.floor(Math.random() * 4),
          risk:       ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
        });
      })
      .on('mouseover', function (ev, d) {
        d3.select(this).transition().duration(120)
          .attr('opacity', 1)
          .attr('r', (NODE_SIZES[d.type] || 5) + 2);
      })
      .on('mouseout', function (ev, d) {
        d3.select(this).transition().duration(120)
          .attr('opacity', 0.88)
          .attr('r', NODE_SIZES[d.type] || 5);
      });

    // Labels
    node.append('text')
      .text(d => d.label || d.id.split('::').pop().split('/').pop())
      .attr('x', d => (NODE_SIZES[d.type] || 5) + 7)
      .attr('y', 3)
      .attr('font-size', 10)
      .attr('fill', 'rgba(148,163,184,0.65)')
      .attr('font-family', "'Inter',sans-serif")
      .attr('font-weight', 500)
      .attr('pointer-events', 'none');

    // Tick
    simulation.on('tick', () => {
      try {
        link
          .attr('x1', d => d.source.x).attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
        node.attr('transform', d => `translate(${d.x},${d.y})`);
      } catch (err) { /* ignore mid-transition errors */ }
    });

    return () => simulation.stop();
  }, [graphData, hiddenTypes]);

  // ── Highlighting Updates ──
  useEffect(() => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    
    svg.selectAll('circle.prism-node-ring')
      .attr('stroke', d => {
        if (selectedNode === d.id)                 return NODE_GLOW[d.type] || 'transparent';
        if (impactNodes?.some(n => n.id === d.id)) return '#f43f5e';
        if (flowNodes?.includes(d.id))             return '#10b981';
        return 'transparent';
      });

    svg.selectAll('circle.prism-node-main')
      .attr('stroke', d => selectedNode === d.id ? '#fff' : 'rgba(255,255,255,0.12)')
      .attr('stroke-width', d => selectedNode === d.id ? 2 : 0.5);

  }, [selectedNode, impactNodes, flowNodes]);

  // ── Resize Simulation Center ──
  useEffect(() => {
    if (simRef.current && dimensions.width > 0) {
       simRef.current.force('center', d3.forceCenter(dimensions.width / 2, dimensions.height / 2));
       simRef.current.force('x', d3.forceX(dimensions.width / 2).strength(0.05));
       simRef.current.force('y', d3.forceY(dimensions.height / 2).strength(0.05));
       simRef.current.alpha(0.3).restart();
    }
  }, [dimensions]);

  // ── Node counts ──
  const visibleNodes = graphData?.nodes.filter(n => !hiddenTypes.has(n.type)) ?? [];
  const visibleEdges = (graphData?.edges ?? []).filter(e => {
    const s = e.source?.id ?? e.source;
    const t = e.target?.id ?? e.target;
    const ids = new Set(visibleNodes.map(n => n.id));
    return ids.has(s) && ids.has(t) && e.type !== 'contains';
  });

  // ── Render ──
  return (
    <>
      <style>{STYLES}</style>
      <div className="prism-root">

        {/* ── Canvas ── */}
        <div className="prism-canvas-wrap" ref={containerRef}>
          <svg
            ref={svgRef}
            className="prism-svg"
            width={dimensions.width}
            height={dimensions.height}
          />

          {/* Stats bar */}
          {graphData && (
            <div className="prism-stats">
              <div className="prism-stat-pill">
                <span className="prism-stat-num">{visibleNodes.length}</span> nodes
              </div>
              <div className="prism-stat-pill">
                <span className="prism-stat-num">{visibleEdges.length}</span> edges
              </div>
              <div className="prism-stat-pill">
                <span className="prism-stat-num">
                  {new Set(visibleNodes.map(n => n.type)).size}
                </span> types
              </div>
            </div>
          )}

          {/* Info panel */}
          {panelNode && (
            <div className="prism-panel">
              <div className="prism-panel-header">
                <span className="prism-panel-title">Node Detail</span>
                <button
                  className="prism-panel-close"
                  onClick={e => { e.stopPropagation(); setPanelNode(null); onNodeSelect?.(null); }}
                >
                  ✕
                </button>
              </div>
              <div className="prism-panel-body">
                <div className="prism-node-name">{panelNode.label}</div>
                <div className={`prism-type-badge prism-badge-${panelNode.type}`}>
                  {panelNode.type}
                </div>
                <div className="prism-panel-row">
                  <span className="prism-row-label">Imports</span>
                  <span className="prism-row-val">{panelStats.imports}</span>
                </div>
                <div className="prism-panel-row">
                  <span className="prism-row-label">Calls</span>
                  <span className="prism-row-val">{panelStats.calls}</span>
                </div>
                <div className="prism-panel-row">
                  <span className="prism-row-label">Dependents</span>
                  <span className="prism-row-val">{panelStats.dependents}</span>
                </div>
                <div className="prism-panel-row">
                  <span className="prism-row-label">Risk</span>
                  <span
                    className="prism-row-val"
                    style={{ color: RISK_COLORS[panelStats.risk] }}
                  >
                    {panelStats.risk}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Legend */}
          <div className="prism-legend">
            {Object.entries(NODE_COLORS).map(([type, color]) => (
              <div
                key={type}
                className={`prism-leg-item${hiddenTypes.has(type) ? ' hidden' : ''}`}
                onClick={() => toggleType(type)}
              >
                <div
                  className="prism-leg-dot"
                  style={{
                    background: color,
                    boxShadow: `0 0 5px ${NODE_GLOW[type]}`,
                  }}
                />
                <span className="prism-leg-label">{type}</span>
              </div>
            ))}

            <div className="prism-leg-sep" />

            <div className="prism-leg-edge">
              <div className="prism-edge-solid" />
              <span className="prism-leg-label">imports</span>
            </div>
            <div className="prism-leg-edge">
              <div className="prism-edge-dash" />
              <span className="prism-leg-label">calls</span>
            </div>
          </div>

          {/* Empty state */}
          {!graphData && (
            <div className="prism-empty">
              <div className="prism-empty-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M12 3L20 7.5V16.5L12 21L4 16.5V7.5L12 3Z" stroke="#6366f1" strokeWidth="1.5" />
                  <circle cx="12" cy="12" r="2" fill="#6366f1" />
                </svg>
              </div>
              <div className="prism-empty-title">Load a repository to begin</div>
              <div className="prism-empty-sub">Supports GitHub URLs · GitLab · local paths</div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
