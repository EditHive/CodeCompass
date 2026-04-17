"""
Graph Builder
Constructs a NetworkX dependency graph from parsed file analysis data.
"""
import os
import networkx as nx
from typing import Dict, List, Optional
from core.parser.base_parser import FileAnalysis, ImportInfo


class GraphBuilder:
    """Builds a dependency graph from parsed codebase analysis."""

    def __init__(self):
        self.graph = nx.DiGraph()
        self.file_analyses: Dict[str, FileAnalysis] = {}
        self.module_map: Dict[str, str] = {}  # module name -> file path

    def build(self, analyses: List[FileAnalysis]) -> nx.DiGraph:
        """Build the complete dependency graph from file analyses."""
        self.graph = nx.DiGraph()
        self.file_analyses = {a.relative_path: a for a in analyses}

        # Build module name -> file path mapping
        self._build_module_map(analyses)

        # Add file nodes
        for analysis in analyses:
            self._add_file_node(analysis)

        # Add function and class nodes
        for analysis in analyses:
            self._add_function_nodes(analysis)
            self._add_class_nodes(analysis)

        # Add import edges (file -> file)
        for analysis in analyses:
            self._add_import_edges(analysis)

        # Add call edges (function -> function)
        for analysis in analyses:
            self._add_call_edges(analysis)

        return self.graph

    def _build_module_map(self, analyses: List[FileAnalysis]):
        """Map module names to file paths for import resolution."""
        for analysis in analyses:
            rel = analysis.relative_path
            # Convert file path to module name (e.g., services/auth_service.py -> services.auth_service)
            if rel.endswith('.py'):
                module = rel[:-3].replace(os.sep, '.').replace('/', '.')
                self.module_map[module] = rel
                # Also map the last part
                parts = module.split('.')
                if len(parts) > 1:
                    self.module_map[parts[-1]] = rel

    def _add_file_node(self, analysis: FileAnalysis):
        """Add a file node to the graph."""
        self.graph.add_node(
            analysis.relative_path,
            type="file",
            language=analysis.language,
            loc=analysis.lines_of_code,
            docstring=analysis.docstring or "",
            num_functions=len(analysis.functions),
            num_classes=len(analysis.classes),
            num_imports=len(analysis.imports),
            label=os.path.basename(analysis.relative_path),
        )

    def _add_function_nodes(self, analysis: FileAnalysis):
        """Add function nodes and connect them to their file."""
        for func in analysis.functions:
            node_id = f"{analysis.relative_path}::{func.name}"
            self.graph.add_node(
                node_id,
                type="function",
                name=func.name,
                file=analysis.relative_path,
                line_start=func.line_start,
                line_end=func.line_end,
                params=func.params,
                docstring=func.docstring or "",
                complexity=func.complexity,
                is_method=func.is_method,
                class_name=func.class_name or "",
                label=func.name,
            )
            # Edge: file contains function
            self.graph.add_edge(
                analysis.relative_path, node_id,
                type="contains",
                weight=1,
            )

    def _add_class_nodes(self, analysis: FileAnalysis):
        """Add class nodes and connect them to their file."""
        for cls in analysis.classes:
            node_id = f"{analysis.relative_path}::{cls.name}"
            self.graph.add_node(
                node_id,
                type="class",
                name=cls.name,
                file=analysis.relative_path,
                line_start=cls.line_start,
                line_end=cls.line_end,
                bases=cls.bases,
                methods=cls.methods,
                docstring=cls.docstring or "",
                label=cls.name,
            )
            # Edge: file contains class
            self.graph.add_edge(
                analysis.relative_path, node_id,
                type="contains",
                weight=1,
            )

            # Edge: class inherits from base classes
            for base in cls.bases:
                base_node = self._resolve_symbol(base, analysis)
                if base_node and base_node in self.graph:
                    self.graph.add_edge(
                        node_id, base_node,
                        type="inherits",
                        weight=3,
                    )

    def _add_import_edges(self, analysis: FileAnalysis):
        """Add import dependency edges between files."""
        for imp in analysis.imports:
            target = self._resolve_import(imp, analysis)
            if target and target != analysis.relative_path:
                if target in self.graph:
                    self.graph.add_edge(
                        analysis.relative_path, target,
                        type="imports",
                        module=imp.module,
                        names=imp.names,
                        weight=2,
                    )

    def _add_call_edges(self, analysis: FileAnalysis):
        """Add function call edges."""
        for func in analysis.functions:
            caller_id = f"{analysis.relative_path}::{func.name}"
            for call_name in func.calls:
                # Try to resolve the call to a known function
                callee_id = self._resolve_call(call_name, analysis)
                if callee_id and callee_id in self.graph and callee_id != caller_id:
                    self.graph.add_edge(
                        caller_id, callee_id,
                        type="calls",
                        weight=2,
                    )

    def _resolve_import(self, imp: ImportInfo, analysis: FileAnalysis) -> Optional[str]:
        """Resolve an import to a file path in the graph."""
        module = imp.module

        # Direct module match
        if module in self.module_map:
            return self.module_map[module]

        # Try with directory prefix from current file
        current_dir = os.path.dirname(analysis.relative_path)
        if current_dir:
            prefixed = f"{current_dir.replace(os.sep, '.')}.{module}"
            if prefixed in self.module_map:
                return self.module_map[prefixed]

        # Try matching the module parts
        parts = module.split('.')
        for i in range(len(parts)):
            partial = '.'.join(parts[i:])
            if partial in self.module_map:
                return self.module_map[partial]

        return None

    def _resolve_symbol(self, name: str, analysis: FileAnalysis) -> Optional[str]:
        """Resolve a symbol name to a node in the graph."""
        # Check if it's a class or function in the same file
        same_file = f"{analysis.relative_path}::{name}"
        if same_file in self.graph:
            return same_file

        # Check imported names
        for imp in analysis.imports:
            if name in imp.names:
                target_file = self._resolve_import(imp, analysis)
                if target_file:
                    resolved = f"{target_file}::{name}"
                    if resolved in self.graph:
                        return resolved
        return None

    def _resolve_call(self, call_name: str, analysis: FileAnalysis) -> Optional[str]:
        """Resolve a function call to a node ID."""
        # Strip any object prefix (e.g., self.method -> method)
        simple_name = call_name.split('.')[-1]

        # Check same file
        same_file = f"{analysis.relative_path}::{simple_name}"
        if same_file in self.graph:
            return same_file

        # Check imported names
        for imp in analysis.imports:
            if simple_name in imp.names or call_name.split('.')[0] in imp.names:
                target_file = self._resolve_import(imp, analysis)
                if target_file:
                    resolved = f"{target_file}::{simple_name}"
                    if resolved in self.graph:
                        return resolved
        return None

    def get_graph_data(self) -> dict:
        """Export graph as JSON-serializable node/edge data for D3.js."""
        nodes = []
        for node_id, data in self.graph.nodes(data=True):
            node_data = {"id": node_id, **data}
            # Clean up non-serializable data
            for key, val in node_data.items():
                if isinstance(val, (list, dict, str, int, float, bool)) or val is None:
                    continue
                node_data[key] = str(val)
            nodes.append(node_data)

        edges = []
        for source, target, data in self.graph.edges(data=True):
            edge_data = {"source": source, "target": target, **data}
            for key, val in edge_data.items():
                if isinstance(val, (list, dict, str, int, float, bool)) or val is None:
                    continue
                edge_data[key] = str(val)
            edges.append(edge_data)

        return {"nodes": nodes, "edges": edges}
