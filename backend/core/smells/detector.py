"""
Code Smell & Risk Detector
Identifies structural issues in the codebase:
- Large/complex files
- God classes/functions
- High coupling
- Deep nesting
- Code duplication indicators
"""
import networkx as nx
from typing import Dict, List, Any
import config


class SmellDetector:
    """Detects code smells and calculates risk scores."""

    def __init__(self, graph: nx.DiGraph, file_analyses: dict):
        self.graph = graph
        self.file_analyses = file_analyses

    def detect_all(self) -> Dict[str, Any]:
        """Run all smell detection and return results."""
        smells = []

        smells.extend(self._detect_large_files())
        smells.extend(self._detect_complex_functions())
        smells.extend(self._detect_god_classes())
        smells.extend(self._detect_high_coupling())
        smells.extend(self._detect_circular_dependencies())
        smells.extend(self._detect_long_parameter_lists())

        # Calculate overall health score
        total_elements = max(self.graph.number_of_nodes(), 1)
        smell_weight = sum(s.get("severity_score", 1) for s in smells)
        health = max(0, 100 - (smell_weight / total_elements) * 100)

        # Categorize smells
        categories = {}
        for smell in smells:
            cat = smell.get("category", "other")
            if cat not in categories:
                categories[cat] = []
            categories[cat].append(smell)

        return {
            "health_score": round(health, 1),
            "total_smells": len(smells),
            "smells": smells,
            "categories": categories,
            "summary": self._generate_summary(smells),
        }

    def _detect_large_files(self) -> List[Dict[str, Any]]:
        """Detect files that are too large."""
        smells = []
        for node_id, data in self.graph.nodes(data=True):
            if data.get("type") != "file":
                continue
            loc = data.get("loc", 0)
            if loc > config.MAX_FILE_LINES:
                severity = "warning" if loc < config.MAX_FILE_LINES * 2 else "error"
                smells.append({
                    "type": "large_file",
                    "category": "complexity",
                    "severity": severity,
                    "severity_score": 2 if severity == "warning" else 4,
                    "node_id": node_id,
                    "file": node_id,
                    "metric": loc,
                    "threshold": config.MAX_FILE_LINES,
                    "message": f"File has {loc} lines (threshold: {config.MAX_FILE_LINES})",
                    "suggestion": "Consider splitting into smaller, focused modules",
                })
        return smells

    def _detect_complex_functions(self) -> List[Dict[str, Any]]:
        """Detect functions with high cyclomatic complexity."""
        smells = []
        for node_id, data in self.graph.nodes(data=True):
            if data.get("type") != "function":
                continue
            complexity = data.get("complexity", 1)
            if complexity > 5:
                severity = "warning" if complexity <= 10 else "error"
                smells.append({
                    "type": "complex_function",
                    "category": "complexity",
                    "severity": severity,
                    "severity_score": 2 if severity == "warning" else 5,
                    "node_id": node_id,
                    "file": data.get("file", ""),
                    "function": data.get("name", ""),
                    "metric": complexity,
                    "threshold": 5,
                    "message": f"Function '{data.get('name', '')}' has complexity {complexity}",
                    "suggestion": "Break down into smaller functions with single responsibilities",
                })
        return smells

    def _detect_god_classes(self) -> List[Dict[str, Any]]:
        """Detect classes with too many methods (god classes)."""
        smells = []
        for node_id, data in self.graph.nodes(data=True):
            if data.get("type") != "class":
                continue
            methods = data.get("methods", [])
            if len(methods) > 10:
                smells.append({
                    "type": "god_class",
                    "category": "design",
                    "severity": "warning",
                    "severity_score": 3,
                    "node_id": node_id,
                    "file": data.get("file", ""),
                    "class": data.get("name", ""),
                    "metric": len(methods),
                    "threshold": 10,
                    "message": f"Class '{data.get('name', '')}' has {len(methods)} methods",
                    "suggestion": "Consider applying Single Responsibility Principle",
                })
        return smells

    def _detect_high_coupling(self) -> List[Dict[str, Any]]:
        """Detect modules with too many dependencies."""
        smells = []
        for node_id, data in self.graph.nodes(data=True):
            if data.get("type") != "file":
                continue

            # Count import edges
            out_imports = sum(1 for _, _, d in self.graph.out_edges(node_id, data=True)
                             if d.get("type") == "imports")

            if out_imports > config.HIGH_COUPLING_THRESHOLD:
                smells.append({
                    "type": "high_coupling",
                    "category": "coupling",
                    "severity": "warning",
                    "severity_score": 3,
                    "node_id": node_id,
                    "file": node_id,
                    "metric": out_imports,
                    "threshold": config.HIGH_COUPLING_THRESHOLD,
                    "message": f"File imports {out_imports} other modules",
                    "suggestion": "Reduce dependencies; consider using dependency injection or facades",
                })
        return smells

    def _detect_circular_dependencies(self) -> List[Dict[str, Any]]:
        """Detect circular dependency chains."""
        smells = []
        # Build file-only import graph
        file_nodes = [n for n, d in self.graph.nodes(data=True) if d.get("type") == "file"]
        file_graph = nx.DiGraph()
        for u, v, d in self.graph.edges(data=True):
            if d.get("type") == "imports" and u in file_nodes and v in file_nodes:
                file_graph.add_edge(u, v)

        try:
            cycles = list(nx.simple_cycles(file_graph))
            for cycle in cycles[:10]:
                if len(cycle) > 1:
                    smells.append({
                        "type": "circular_dependency",
                        "category": "architecture",
                        "severity": "error",
                        "severity_score": 5,
                        "node_id": cycle[0],
                        "files": cycle,
                        "message": f"Circular dependency: {' → '.join(cycle)} → {cycle[0]}",
                        "suggestion": "Break the cycle by extracting shared code into a separate module",
                    })
        except Exception:
            pass

        return smells

    def _detect_long_parameter_lists(self) -> List[Dict[str, Any]]:
        """Detect functions with too many parameters."""
        smells = []
        for node_id, data in self.graph.nodes(data=True):
            if data.get("type") != "function":
                continue
            params = data.get("params", [])
            if len(params) > config.MAX_FUNCTION_PARAMS:
                smells.append({
                    "type": "long_parameter_list",
                    "category": "complexity",
                    "severity": "info",
                    "severity_score": 1,
                    "node_id": node_id,
                    "file": data.get("file", ""),
                    "function": data.get("name", ""),
                    "metric": len(params),
                    "threshold": config.MAX_FUNCTION_PARAMS,
                    "message": f"Function '{data.get('name', '')}' has {len(params)} parameters",
                    "suggestion": "Consider using a configuration object or builder pattern",
                })
        return smells

    def _generate_summary(self, smells: List[Dict]) -> Dict[str, Any]:
        """Generate a summary of all detected smells."""
        by_severity = {"error": 0, "warning": 0, "info": 0}
        by_category = {}

        for smell in smells:
            sev = smell.get("severity", "info")
            by_severity[sev] = by_severity.get(sev, 0) + 1
            cat = smell.get("category", "other")
            by_category[cat] = by_category.get(cat, 0) + 1

        return {
            "by_severity": by_severity,
            "by_category": by_category,
            "most_affected_files": self._get_most_affected_files(smells),
        }

    def _get_most_affected_files(self, smells: List[Dict]) -> List[Dict[str, Any]]:
        """Get files with the most code smells."""
        file_smells = {}
        for smell in smells:
            f = smell.get("file", smell.get("node_id", ""))
            if f:
                if f not in file_smells:
                    file_smells[f] = 0
                file_smells[f] += 1

        return [
            {"file": f, "smell_count": c}
            for f, c in sorted(file_smells.items(), key=lambda x: x[1], reverse=True)[:10]
        ]
