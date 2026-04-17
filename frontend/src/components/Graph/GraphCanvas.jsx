import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';

const NODE_COLORS = {
  file: '#6366f1',
  function: '#22d3ee',
  class: '#10b981',
};

const NODE_SIZES = {
  file: 10,
  function: 5,
  class: 7,
};

const EDGE_COLORS = {
  imports: 'rgba(99, 102, 241, 0.25)',
  calls: 'rgba(34, 211, 238, 0.12)',
};

export default function GraphCanvas({ graphData, selectedNode, onNodeSelect, impactNodes, flowNodes }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const simulationRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [hiddenTypes, setHiddenTypes] = useState(new Set());

  const handleFilterClick = (type) => {
    const next = new Set(hiddenTypes);
    if (next.has(type)) next.delete(type);
    else next.add(type);
    setHiddenTypes(next);
  };

  // Measure container
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Build & run D3 simulation
  useEffect(() => {
    if (!graphData || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    let nodes = graphData.nodes.map(n => ({ ...n }));
    let edges = graphData.edges.map(e => ({ ...e }));

    // Filter hidden types
    if (hiddenTypes.size > 0) {
      nodes = nodes.filter(n => !hiddenTypes.has(n.type));
      const keepIds = new Set(nodes.map(n => n.id));
      edges = edges.filter(e => keepIds.has(e.source?.id || e.source) && keepIds.has(e.target?.id || e.target));
    }

    edges = edges.filter(e => e.type !== 'contains');

    const { width, height } = dimensions;

    // Defs for gradients and glow
    const defs = svg.append('defs');

    // Glow filter
    const glow = defs.append('filter').attr('id', 'glow');
    glow.append('feGaussianBlur').attr('stdDeviation', '3').attr('result', 'coloredBlur');
    const feMerge = glow.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const g = svg.append('g');
    const zoom = d3.zoom()
      .scaleExtent([0.1, 5])
      .on('zoom', (event) => g.attr('transform', event.transform));
    svg.call(zoom);

    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(edges).id(d => d.id).distance(120).strength(0.25))
      .force('charge', d3.forceManyBody().strength(-350))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(d => (NODE_SIZES[d.type] || 5) + 15));

    simulationRef.current = simulation;

    // Draw edges
    const link = g.append('g')
      .selectAll('line')
      .data(edges)
      .join('line')
      .attr('stroke', d => EDGE_COLORS[d.type] || 'rgba(255,255,255,0.06)')
      .attr('stroke-width', d => d.type === 'imports' ? 1.5 : 0.8)
      .attr('stroke-dasharray', d => d.type === 'calls' ? '4,6' : 'none')
      .attr('stroke-linecap', 'round');

    // Draw nodes
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .style('cursor', 'pointer')
      .call(d3.drag()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      );

    // Node outer glow ring (for highlighted/selected)
    node.append('circle')
      .attr('r', d => (NODE_SIZES[d.type] || 5) + 4)
      .attr('fill', 'none')
      .attr('stroke', d => {
        if (selectedNode === d.id) return '#6366f1';
        if (impactNodes?.some(n => n.id === d.id)) return '#f43f5e';
        if (flowNodes?.includes(d.id)) return '#10b981';
        return 'transparent';
      })
      .attr('stroke-width', 2)
      .attr('opacity', 0.4)
      .attr('filter', d => {
        if (selectedNode === d.id || impactNodes?.some(n => n.id === d.id) || flowNodes?.includes(d.id)) return 'url(#glow)';
        return 'none';
      });

    // Node main circle
    node.append('circle')
      .attr('r', d => NODE_SIZES[d.type] || 5)
      .attr('fill', d => {
        const color = NODE_COLORS[d.type] || '#6366f1';
        return color;
      })
      .attr('opacity', 0.9)
      .attr('stroke', d => {
        if (selectedNode === d.id) return '#fff';
        return 'rgba(255,255,255,0.15)';
      })
      .attr('stroke-width', d => selectedNode === d.id ? 2 : 0.5)
      .on('click', (event, d) => {
        event.stopPropagation();
        onNodeSelect?.(d.id);
      })
      .on('mouseover', function () {
        d3.select(this).transition().duration(150).attr('opacity', 1).attr('stroke', 'rgba(255,255,255,0.4)').attr('stroke-width', 1.5);
      })
      .on('mouseout', function (event, d) {
        d3.select(this).transition().duration(150).attr('opacity', 0.9).attr('stroke', selectedNode === d.id ? '#fff' : 'rgba(255,255,255,0.15)').attr('stroke-width', selectedNode === d.id ? 2 : 0.5);
      });

    // Labels
    node.append('text')
      .text(d => d.label || d.id.split('::').pop().split('/').pop())
      .attr('x', d => (NODE_SIZES[d.type] || 5) + 6)
      .attr('y', 3)
      .attr('font-size', 10)
      .attr('fill', '#71717a')
      .attr('font-family', "'Inter', sans-serif")
      .attr('font-weight', 500)
      .attr('pointer-events', 'none');

    simulation.on('tick', () => {
      try {
        link
          .attr('x1', d => d.source.x)
          .attr('y1', d => d.source.y)
          .attr('x2', d => d.target.x)
          .attr('y2', d => d.target.y);
        node.attr('transform', d => `translate(${d.x},${d.y})`);
      } catch (err) {
        console.error('D3 tick error:', err);
      }
    });

    return () => simulation.stop();
  }, [graphData, dimensions, selectedNode, impactNodes, flowNodes, hiddenTypes]);

  return (
    <div className="relative w-full h-full graph-bg overflow-hidden" ref={containerRef}>
      <svg ref={svgRef} className="w-full h-full absolute inset-0 z-0" width={dimensions.width} height={dimensions.height} />

      {/* Legend Bar */}
      <div className="absolute bottom-4 left-4 z-10 glass-panel rounded-xl px-4 py-2.5 flex items-center gap-5">
        {/* Node types */}
        <div className="flex items-center gap-4">
          {Object.entries(NODE_COLORS).map(([type, color]) => (
            <button
              key={type}
              className="flex items-center gap-2 cursor-pointer group"
              onClick={() => handleFilterClick(type)}
            >
              <div
                className={`w-2.5 h-2.5 rounded-full transition-all duration-150 ${hiddenTypes.has(type) ? 'opacity-20' : ''}`}
                style={{ backgroundColor: color }}
              />
              <span className={`text-[11px] font-medium capitalize transition-colors ${hiddenTypes.has(type) ? 'text-prism-text-muted line-through' : 'text-prism-text-dim group-hover:text-prism-text'}`}>
                {type}
              </span>
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-prism-border" />

        {/* Edge types */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-[1.5px] rounded-full" style={{ background: 'rgba(99, 102, 241, 0.6)' }} />
            <span className="text-[11px] font-medium text-prism-text-dim">imports</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-0 border-t border-dashed" style={{ borderColor: 'rgba(34, 211, 238, 0.5)' }} />
            <span className="text-[11px] font-medium text-prism-text-dim">calls</span>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {!graphData && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl flex items-center justify-center border border-prism-border/50 bg-prism-surface">
              <span className="text-2xl">🔷</span>
            </div>
            <p className="text-prism-text-dim text-sm font-medium">Load a repository to visualize its dependency graph</p>
          </div>
        </div>
      )}
    </div>
  );
}
