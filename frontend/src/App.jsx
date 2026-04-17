import React, { useState, useEffect, useCallback } from 'react';
import TopNav from './components/Layout/TopNav';
import GraphCanvas from './components/Graph/GraphCanvas';
import NodeDetail from './components/Graph/NodeDetail';
import ImpactPanel from './components/Impact/ImpactPanel';
import FlowViewer from './components/Flow/FlowViewer';
import SearchPanel from './components/Search/SearchPanel';
import ExplainPanel from './components/Explain/ExplainPanel';
import OnboardingGuide from './components/Onboarding/OnboardingGuide';

import SmellsPanel from './components/Smells/SmellsPanel';
import RepoUpload from './components/Upload/RepoUpload';
import { useApi } from './hooks/useApi';
import { getGraph, getGraphStats, getNodeDetails, analyzeCodebase, healthCheck } from './services/api';

export default function App() {
  const [activeView, setActiveView] = useState('graph');
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedNodeData, setSelectedNodeData] = useState(null);
  const [impactNodes, setImpactNodes] = useState(null);
  const [flowNodes, setFlowNodes] = useState(null);
  const [showUpload, setShowUpload] = useState(false);
  const [repoPath, setRepoPath] = useState(null);

  const { data: graphData, execute: loadGraph } = useApi(getGraph);
  const { data: statsData, execute: loadStats } = useApi(getGraphStats);
  const { loading: analyzeLoading, error: analyzeError, execute: runAnalyze } = useApi(analyzeCodebase);
  const { data: healthData, execute: checkHealth } = useApi(healthCheck);

  // Check if backend is ready and has pre-analyzed data
  useEffect(() => {
    const init = async () => {
      try {
        const health = await checkHealth();
        if (health?.analyzed) {
          setRepoPath('sample_repo');
          await loadGraph();
          await loadStats();
        } else {
          setShowUpload(true);
        }
      } catch {
        // Backend not ready yet, retry
        setTimeout(init, 2000);
      }
    };
    init();
  }, []);

  // Load node details when selected
  useEffect(() => {
    if (selectedNode) {
      getNodeDetails(selectedNode)
        .then(res => setSelectedNodeData(res.data))
        .catch(() => setSelectedNodeData(null));
    } else {
      setSelectedNodeData(null);
    }
  }, [selectedNode]);

  const handleAnalyze = async (path) => {
    try {
      await runAnalyze(path);
      setRepoPath(path);
      setShowUpload(false);
      await loadGraph();
      await loadStats();
    } catch (err) {
      console.error('Analysis failed:', err);
    }
  };

  const handleNodeSelect = useCallback((nodeId) => {
    setSelectedNode(nodeId);
  }, []);

  const handleImpactHighlight = useCallback((nodes) => {
    setImpactNodes(nodes);
    setFlowNodes(null);
  }, []);

  const handleFlowHighlight = useCallback((nodeIds) => {
    setFlowNodes(nodeIds);
    setImpactNodes(null);
  }, []);

  const isAnalyzed = !!graphData;

  // Tool panel names for header
  const TOOL_LABELS = {
    impact: 'Impact Analysis',
    flow: 'Flow Tracer',
    search: 'Code Search',
    explain: 'Explainer',

    smells: 'Code Smells',
    onboarding: 'Onboarding',
  };

  // Determine which side panel to show
  const renderSidePanel = () => {
    switch (activeView) {
      case 'impact':
        return <ImpactPanel onHighlightNodes={handleImpactHighlight} onSelectNode={handleNodeSelect} />;
      case 'flow':
        return <FlowViewer onHighlightFlow={handleFlowHighlight} />;
      case 'search':
        return <SearchPanel onSelectNode={handleNodeSelect} />;
      case 'explain':
        return <ExplainPanel />;
      case 'onboarding':
        return <OnboardingGuide onSelectNode={handleNodeSelect} />;

      case 'smells':
        return <SmellsPanel />;
      default:
        return null;
    }
  };

  const sidePanel = renderSidePanel();
  const showSidePanel = activeView !== 'graph' && sidePanel;

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden bg-prism-bg font-sans">
      <TopNav
        activeTab={activeView}
        onTabChange={setActiveView}
        isAnalyzed={isAnalyzed}
        stats={statsData}
        repoPath={repoPath}
        onUploadClick={() => setShowUpload(true)}
      />

      {/* Main Studio */}
      <main className="flex-1 relative z-0 overflow-hidden">

        {/* Graph Canvas (always full bleed) */}
        <div className="absolute inset-0">
          <GraphCanvas
            graphData={graphData}
            selectedNode={selectedNode}
            onNodeSelect={handleNodeSelect}
            impactNodes={impactNodes}
            flowNodes={flowNodes}
          />
        </div>

        {/* Floating Tool Panel */}
        {showSidePanel && (
          <div className="absolute top-2 right-2 bottom-2 w-[370px] rounded-2xl flex flex-col overflow-hidden z-20 animate-slide-in border border-prism-border/60" style={{ background: 'rgba(9, 9, 11, 0.95)', backdropFilter: 'blur(24px)', boxShadow: '0 8px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.03)' }}>
            {/* Panel header */}
            <div className="h-11 border-b border-prism-border/60 flex items-center px-4 shrink-0" style={{ background: 'rgba(15, 15, 18, 0.6)' }}>
              <span className="text-[12px] font-semibold text-prism-text tracking-wide">
                {TOOL_LABELS[activeView] || activeView}
              </span>
              <button
                onClick={() => setActiveView('graph')}
                className="ml-auto w-7 h-7 rounded-lg flex items-center justify-center text-prism-text-muted hover:text-prism-text hover:bg-white/5 transition-all cursor-pointer text-[14px]"
              >
                ✕
              </button>
            </div>
            {/* Panel content */}
            <div className="flex-1 overflow-auto">
              {sidePanel}
            </div>
          </div>
        )}

        {/* Node Details Floating Modal — shifts left when side panel is open */}
        {selectedNodeData && (
          <div className={`absolute bottom-3 z-40 ${showSidePanel ? 'right-[396px]' : 'right-3'}`}
            style={{ transition: 'right 0.2s ease' }}>
            <NodeDetail
              nodeId={selectedNode}
              nodeData={selectedNodeData}
              onClose={() => setSelectedNode(null)}
            />
          </div>
        )}

      </main>

      {/* Upload Overlay — fixed to cover entire screen */}
      {showUpload && (
        <div className="fixed inset-0 z-50">
          <RepoUpload onAnalyze={handleAnalyze} loading={analyzeLoading} error={analyzeError} />
        </div>
      )}
    </div>
  );
}
