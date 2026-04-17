"""
Graph Analyzer
Performs structural analysis on the dependency graph:
- Circular dependency detection
- Coupling metrics
- Centrality analysis
- Module clustering
"""
import networkx as nx
from typing import Dict, List, Any
from collections import defaultdict


class GraphAnalyzer:
    """Analyzes the dependency graph for structural insights."""

    def __init__(self, graph: nx.DiGraph):
        self.graph = graph

    def get_circular_dependencies(self) -> List[List[str]]:
        """Detect circular dependencies in the graph."""
        # Only look at file-level import cycles
        file_graph = self._get_file_subgraph("imports")
        try:
            cycles = list(nx.simple_cycles(file_graph))
            return [c for c in cycles if len(c) > 1][:20]  # limit results
        except Exception:
            return []

    def get_coupling_metrics(self) -> Dict[str, Dict[str, Any]]:
        """Calculate coupling metrics for each file node."""
        metrics = {}
        file_nodes = [n for n, d in self.graph.nodes(data=True) if d.get("type") == "file"]

        for node in file_nodes:
            in_deg = self.graph.in_degree(node)
            out_deg = self.graph.out_degree(node)

            # Count only import edges
            import_in = sum(1 for _, _, d in self.graph.in_edges(node, data=True)
                           if d.get("type") == "imports")
            import_out = sum(1 for _, _, d in self.graph.out_edges(node, data=True)
                            if d.get("type") == "imports")

            metrics[node] = {
                "afferent_coupling": import_in,   # incoming dependencies
                "efferent_coupling": import_out,   # outgoing dependencies
                "instability": import_out / max(import_in + import_out, 1),
                "total_connections": in_deg + out_deg,
            }

        return metrics

    def get_centrality_scores(self) -> Dict[str, float]:
        """Calculate betweenness centrality for all nodes."""
        try:
            return nx.betweenness_centrality(self.graph)
        except Exception:
            return {}

    def get_pagerank(self) -> Dict[str, float]:
        """Calculate PageRank to find most important nodes."""
        try:
            return nx.pagerank(self.graph)
        except Exception:
            return {}

    def get_module_clusters(self) -> List[List[str]]:
        """Detect module clusters using community detection on undirected version."""
        try:
            undirected = self.graph.to_undirected()
            components = list(nx.connected_components(undirected))
            return [list(c) for c in components if len(c) > 1]
        except Exception:
            return []

    def get_hub_nodes(self, top_n: int = 10) -> List[Dict[str, Any]]:
        """Find hub nodes (most connected) in the graph."""
        file_nodes = [(n, d) for n, d in self.graph.nodes(data=True)
                      if d.get("type") == "file"]

        hubs = []
        for node, data in file_nodes:
            connections = self.graph.degree(node)
            hubs.append({
                "id": node,
                "label": data.get("label", node),
                "connections": connections,
                "type": data.get("type"),
            })

        hubs.sort(key=lambda x: x["connections"], reverse=True)
        return hubs[:top_n]

    def get_graph_stats(self) -> Dict[str, Any]:
        """Get overall graph statistics."""
        file_nodes = [n for n, d in self.graph.nodes(data=True) if d.get("type") == "file"]
        func_nodes = [n for n, d in self.graph.nodes(data=True) if d.get("type") == "function"]
        class_nodes = [n for n, d in self.graph.nodes(data=True) if d.get("type") == "class"]

        import_edges = [(u, v) for u, v, d in self.graph.edges(data=True) if d.get("type") == "imports"]
        call_edges = [(u, v) for u, v, d in self.graph.edges(data=True) if d.get("type") == "calls"]

        # Calculate total LOC
        total_loc = sum(
            self.graph.nodes[n].get("loc", 0)
            for n in file_nodes
        )

        return {
            "total_files": len(file_nodes),
            "total_functions": len(func_nodes),
            "total_classes": len(class_nodes),
            "total_edges": self.graph.number_of_edges(),
            "import_relationships": len(import_edges),
            "call_relationships": len(call_edges),
            "total_loc": total_loc,
            "circular_dependencies": len(self.get_circular_dependencies()),
            "graph_density": nx.density(self.graph) if self.graph.number_of_nodes() > 1 else 0,
        }

    def _get_file_subgraph(self, edge_type: str = None) -> nx.DiGraph:
        """Extract a subgraph of only file nodes with specified edge type."""
        file_nodes = [n for n, d in self.graph.nodes(data=True) if d.get("type") == "file"]
        subgraph = nx.DiGraph()
        subgraph.add_nodes_from(file_nodes)

        for u, v, d in self.graph.edges(data=True):
            if u in file_nodes and v in file_nodes:
                if edge_type is None or d.get("type") == edge_type:
                    subgraph.add_edge(u, v, **d)

        return subgraph
