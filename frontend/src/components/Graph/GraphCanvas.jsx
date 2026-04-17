import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as d3 from 'd3';

const NODE_COLORS = {
  file: '#ffffff',
  function: '#888888',
  class: '#444444',
};

const EDGE_COLORS = {
  imports: 'rgba(255,255,255,0.2)',
  calls: 'rgba(255,255,255,0.05)',
};

export default function GraphCanvas({ graphData, selectedNode, onNodeSelect, impactNodes, flowNodes, highlightFilter }) {
  const svgRef = useRef(null);
  const containerRef = useRef(null);
  const simulationRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [showLabels, setShowLabels] = useState(true);
  const [filterType, setFilterType] = useState('all');
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

    // Filter nodes
    let nodes = graphData.nodes.map(n => ({ ...n }));
    let edges = graphData.edges.map(e => ({ ...e }));

    if (filterType !== 'all') {
      const keepIds = new Set(nodes.filter(n => n.type === filterType).map(n => n.id));
      if (filterType !== 'file') {
        nodes.forEach(n => { if (n.type === 'file') keepIds.add(n.id); });
      }
      nodes = nodes.filter(n => keepIds.has(n.id));
      edges = edges.filter(e => keepIds.has(e.source?.id || e.source) && keepIds.has(e.target?.id || e.target));
    }

    edges = edges.filter(e => e.type !== 'contains');

    const { width, height } = dimensions;

    const g = svg.append('g');
    const zoom = d3.zoom()
      .scaleExtent([0.1, 5])
      .on('zoom', (event) => g.attr('transform', event.transform));
    svg.call(zoom);

    const defs = svg.append('defs');
    
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(edges).id(d => d.id).distance(100).strength(0.3))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(30));

    simulationRef.current = simulation;

    const link = g.append('g')
      .selectAll('line')
      .data(edges)
      .join('line')
      .attr('stroke', d => EDGE_COLORS[d.type] || '#2a2b3d')
      .attr('stroke-width', d => d.type === 'imports' ? 1.5 : 1)
      .attr('stroke', d => EDGE_COLORS[d.type] || '#222')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', d => d.type === 'calls' ? '4,4' : 'none');

    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
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

    node.append('circle')
      .attr('r', d => d.type === 'file' ? 6 : d.type === 'class' ? 4 : 3)
      .attr('fill', '#000')
      .attr('stroke', d => {
        if (selectedNode === d.id) return '#3b82f6';
        if (impactNodes?.some(n => n.id === d.id)) return '#ef4444';
        if (flowNodes?.includes(d.id)) return '#10b981';
        return NODE_COLORS[d.type] || '#fff';
      })
      .attr('stroke-width', d => selectedNode === d.id ? 2 : impactNodes?.some(n => n.id === d.id) ? 1.5 : 1)
      .on('click', (event, d) => {
        event.stopPropagation();
        onNodeSelect?.(d.id);
      });

    if (showLabels) {
      node.append('text')
        .text(d => d.label || d.id.split('::').pop().split('/').pop())
        .attr('x', 10)
        .attr('y', 3)
        .attr('font-size', 9)
        .attr('fill', '#666')
        .attr('font-family', 'monospace')
        .attr('pointer-events', 'none');
    }

    simulation.on('tick', () => {
      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    return () => simulation.stop();
  }, [graphData, dimensions, selectedNode, impactNodes, flowNodes, filterType, showLabels, hiddenTypes]);

  return (
    <div className="relative w-full h-full bg-[#000] overflow-hidden" ref={containerRef}>
      <svg ref={svgRef} className="w-full h-full absolute inset-0 z-0 bg-[#000]" />

      {/* Floating Controls */}
      <div className="absolute bottom-4 left-4 z-10 bg-[#0a0a0a] border border-[#222] rounded-[4px] px-3 py-2 flex items-center gap-4 shadow-xl">
        {/* Node Legend */}
        <div className="flex items-center gap-4 border-r border-[#222] pr-4">
          {Object.entries(NODE_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1.5 cursor-pointer group" onClick={() => handleFilterClick(type)}>
              <div 
                className={`w-2 h-2 rounded-full border transition-all ${hiddenTypes.has(type) ? 'opacity-30 border-[#444]' : 'border-white'}`}
                style={{ backgroundColor: hiddenTypes.has(type) ? 'transparent' : '#000', borderColor: color }}
              />
              <span className={`text-[10px] uppercase font-mono tracking-wider ${hiddenTypes.has(type) ? 'text-[#555]' : 'text-[#888] group-hover:text-[#ccc]'} transition-colors`}>
                {type}
              </span>
            </div>
          ))}
        </div>

        {/* Edge Legend */}
        <div className="flex items-center gap-4">
          {Object.entries({ imports: 'solid', calls: 'dashed' }).map(([type, dash]) => (
            <div key={type} className="flex items-center gap-2 group">
              <div className="w-4 h-[1px]" style={{
                background: type === 'imports' ? '#555' : 'transparent',
                borderBottom: type === 'calls' ? '1px dashed #444' : 'none'
              }} />
              <span className="text-[10px] uppercase font-mono tracking-wider text-[#555] group-hover:text-[#888] transition-colors">
                {type}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* No data */}
      {!graphData && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center border border-[#222]">
              <span className="text-3xl">🔷</span>
            </div>
            <p className="text-prism-text-dim text-sm">Load a repository to visualize the dependency graph</p>
          </div>
        </div>
      )}

      <svg ref={svgRef} width={dimensions.width} height={dimensions.height} className="w-full h-full" />
    </div>
  );
}
