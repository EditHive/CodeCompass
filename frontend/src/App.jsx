import React, { useState, useEffect, useCallback } from 'react';
import TopNav from './components/Layout/TopNav';
import GraphCanvas from './components/Graph/GraphCanvas';
import NodeDetail from './components/Graph/NodeDetail';
import ImpactPanel from './components/Impact/ImpactPanel';
import FlowViewer from './components/Flow/FlowViewer';
import SearchPanel from './components/Search/SearchPanel';
import ExplainPanel from './components/Explain/ExplainPanel';
import OnboardingGuide from './components/Onboarding/OnboardingGuide';
import GitInsights from './components/Git/GitInsights';
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
  const { loading: analyzeLoading, execute: runAnalyze } = useApi(analyzeCodebase);
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
      case 'git':
        return <GitInsights />;
      case 'smells':
        return <SmellsPanel />;
      default:
        return null;
    }
  };

  const sidePanel = renderSidePanel();
  const showSidePanel = activeView !== 'graph' && sidePanel;

  return (
    <div className="w-screen h-screen flex flex-col overflow-hidden bg-[#000] font-sans">
      <TopNav 
        activeTab={activeView} 
        onTabChange={setActiveView} 
        isAnalyzed={isAnalyzed}
        stats={statsData}
        repoPath={repoPath}
        onUploadClick={() => setShowUpload(true)}
      />

      {/* Main Studio Area */}
      <main className="flex-1 relative z-0">
        
        {/* Full-bleed Graph Viewer */}
        <div className="absolute inset-0">
          <GraphCanvas
            graphData={graphData}
            selectedNode={selectedNode}
            onNodeSelect={handleNodeSelect}
            impactNodes={impactNodes}
            flowNodes={flowNodes}
          />
        </div>

        {/* Floating Tool Window (Replaces Sidebar contents) */}
        {showSidePanel && (
          <div className="absolute top-4 right-4 bottom-4 w-[380px] bg-[#0a0a0a] border border-[#222] rounded-[6px] shadow-2xl flex flex-col overflow-hidden z-20">
            <div className="h-8 border-b border-[#222] bg-[#111] flex items-center px-3 shrink-0">
               <span className="text-[10px] font-mono text-[#888] uppercase tracking-wider">{activeView.replace('graph', '')} TOOL</span>
               <button onClick={() => setActiveView('graph')} className="ml-auto text-[#888] hover:text-white px-1">✕</button>
            </div>
            <div className="flex-1 overflow-auto bg-[#000]">
              {sidePanel}
            </div>
          </div>
        )}

        {/* Node Details Floating Modal */}
        {selectedNodeData && (
          <div className="absolute bottom-4 right-4 z-40 shadow-2xl rounded-[6px] overflow-hidden border border-[#222]">
            <NodeDetail
              nodeId={selectedNode}
              nodeData={selectedNodeData}
              onClose={() => setSelectedNode(null)}
            />
          </div>
        )}

      </main>

      {/* Upload Modal */}
      {showUpload && (
        <RepoUpload onAnalyze={handleAnalyze} loading={analyzeLoading} />
      )}
    </div>
  );
}
