"""
Impact Analyzer
Simulates the impact of changes to a file or function by traversing
the dependency graph to find all affected downstream nodes.
"""
import networkx as nx
from typing import Dict, List, Any, Set
from collections import deque


class ImpactAnalyzer:
    """Analyzes the potential impact of changes to code elements."""

    def __init__(self, graph: nx.DiGraph):
        self.graph = graph

    def analyze_impact(self, node_id: str, max_depth: int = 10) -> Dict[str, Any]:
        """Analyze the impact of changing a specific node.

        Uses reverse BFS to find all nodes that depend on the changed node,
        categorized by impact severity based on distance.
        """
        if node_id not in self.graph:
            return {"error": f"Node '{node_id}' not found in graph"}

        # Find all nodes that depend on this node (reverse traversal)
        affected = self._bfs_dependents(node_id, max_depth)

        # Categorize by severity
        direct = []    # depth 1
        indirect = []  # depth 2-3
        potential = [] # depth 4+

        for dep_id, depth in affected.items():
            node_data = self.graph.nodes.get(dep_id, {})
            info = {
                "id": dep_id,
                "type": node_data.get("type", "unknown"),
                "label": node_data.get("label", dep_id),
                "depth": depth,
                "file": node_data.get("file", dep_id),
            }
            if depth == 1:
                direct.append(info)
            elif depth <= 3:
                indirect.append(info)
            else:
                potential.append(info)

        # Get the relationship chain for each affected node
        chains = self._get_impact_chains(node_id, affected)

        return {
            "source": {
                "id": node_id,
                "type": self.graph.nodes[node_id].get("type", "unknown"),
                "label": self.graph.nodes[node_id].get("label", node_id),
            },
            "summary": {
                "total_affected": len(affected),
                "direct": len(direct),
                "indirect": len(indirect),
                "potential": len(potential),
            },
            "direct": direct,
            "indirect": indirect,
            "potential": potential,
            "chains": chains,
        }

    def _bfs_dependents(self, start: str, max_depth: int) -> Dict[str, int]:
        """BFS to find all nodes that depend on start node."""
        dependents = {}
        queue = deque([(start, 0)])
        visited = {start}

        while queue:
            current, depth = queue.popleft()
            if depth >= max_depth:
                continue

            # Find all nodes that have an edge TO current (predecessors in reverse)
            # i.e., nodes that import/call/use the current node
            for predecessor in self.graph.predecessors(current):
                if predecessor not in visited:
                    visited.add(predecessor)
                    dependents[predecessor] = depth + 1
                    queue.append((predecessor, depth + 1))

            # Also check file-level: if current is a function/class,
            # find nodes that import the file containing it
            node_data = self.graph.nodes.get(current, {})
            if node_data.get("type") in ("function", "class"):
                file_path = node_data.get("file", "")
                if file_path and file_path in self.graph:
                    for predecessor in self.graph.predecessors(file_path):
                        if predecessor not in visited:
                            visited.add(predecessor)
                            dependents[predecessor] = depth + 1
                            queue.append((predecessor, depth + 1))

        return dependents

    def _get_impact_chains(self, source: str, affected: Dict[str, int]) -> List[List[str]]:
        """Get the dependency chains from source to affected nodes."""
        chains = []
        # Only show chains for direct/indirect (not too deep)
        close_affected = {k: v for k, v in affected.items() if v <= 3}

        for target in list(close_affected.keys())[:10]:  # limit chains
            try:
                # Find shortest path from target to source (reverse direction)
                paths = list(nx.all_simple_paths(
                    self.graph, target, source, cutoff=5
                ))
                if paths:
                    chains.append(paths[0])
            except (nx.NodeNotFound, nx.NetworkXNoPath):
                continue

        return chains

    def get_risk_score(self, node_id: str) -> Dict[str, Any]:
        """Calculate a risk score for changing a node."""
        if node_id not in self.graph:
            return {"error": "Node not found"}

        impact = self.analyze_impact(node_id)
        node_data = self.graph.nodes[node_id]

        # Factors: dependency count, centrality, complexity
        total_affected = impact["summary"]["total_affected"]
        direct_count = impact["summary"]["direct"]

        # Calculate risk (0-100)
        risk = min(100, (
            direct_count * 15 +
            total_affected * 5 +
            node_data.get("complexity", 1) * 3 +
            node_data.get("loc", 0) * 0.1
        ))

        level = "low" if risk < 30 else "medium" if risk < 60 else "high"

        return {
            "node_id": node_id,
            "risk_score": round(risk, 1),
            "risk_level": level,
            "factors": {
                "direct_dependents": direct_count,
                "total_affected": total_affected,
                "complexity": node_data.get("complexity", 1),
                "lines_of_code": node_data.get("loc", 0),
            },
        }
