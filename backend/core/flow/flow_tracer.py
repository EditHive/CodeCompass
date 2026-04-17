"""
Execution Flow Tracer
Traces the execution path when a function is called, following
call chains across files and showing step-by-step execution flow.
"""
import networkx as nx
from typing import Dict, List, Any, Optional


class FlowTracer:
    """Traces execution flow through the codebase graph."""

    def __init__(self, graph: nx.DiGraph, file_analyses: dict):
        self.graph = graph
        self.file_analyses = file_analyses  # relative_path -> FileAnalysis

    def trace_function(self, function_query: str, max_depth: int = 15) -> Dict[str, Any]:
        """Trace what happens when a function is called.

        Returns a step-by-step execution path across files.
        """
        # Find the function node
        func_node = self._find_function_node(function_query)
        if not func_node:
            return {"error": f"Function '{function_query}' not found", "steps": []}

        # Trace the call chain
        steps = []
        visited = set()
        self._trace_recursive(func_node, steps, visited, 0, max_depth)

        # Build summary
        files_involved = list(set(s["file"] for s in steps if s.get("file")))

        return {
            "entry_point": {
                "id": func_node,
                "name": self.graph.nodes[func_node].get("name", func_node),
                "file": self.graph.nodes[func_node].get("file", ""),
            },
            "total_steps": len(steps),
            "files_involved": files_involved,
            "steps": steps,
        }

    def _trace_recursive(self, node_id: str, steps: list, visited: set,
                         depth: int, max_depth: int):
        """Recursively trace execution flow from a function node."""
        if depth >= max_depth or node_id in visited:
            return

        visited.add(node_id)
        node_data = self.graph.nodes.get(node_id, {})

        if node_data.get("type") != "function":
            return

        # Get code snippet for this function
        snippet = self._get_code_snippet(node_data)

        # Determine the kind of operation
        operation = self._classify_operation(node_data)

        steps.append({
            "step": len(steps) + 1,
            "depth": depth,
            "function": node_data.get("name", node_id),
            "file": node_data.get("file", ""),
            "line_start": node_data.get("line_start", 0),
            "line_end": node_data.get("line_end", 0),
            "description": self._describe_step(node_data),
            "operation": operation,
            "code_snippet": snippet,
            "node_id": node_id,
        })

        # Follow call edges
        for _, target, edge_data in self.graph.out_edges(node_id, data=True):
            if edge_data.get("type") == "calls":
                self._trace_recursive(target, steps, visited, depth + 1, max_depth)

    def _find_function_node(self, query: str) -> Optional[str]:
        """Find a function node matching the query."""
        query_lower = query.lower().strip()

        # Exact match by node ID
        if query in self.graph:
            return query

        # Match by function name
        for node_id, data in self.graph.nodes(data=True):
            if data.get("type") == "function":
                name = data.get("name", "").lower()
                if name == query_lower:
                    return node_id

        # Partial match
        for node_id, data in self.graph.nodes(data=True):
            if data.get("type") == "function":
                name = data.get("name", "").lower()
                if query_lower in name or name in query_lower:
                    return node_id

        return None

    def _get_code_snippet(self, node_data: dict) -> str:
        """Get the source code snippet for a function."""
        file_path = node_data.get("file", "")
        line_start = node_data.get("line_start", 0)
        line_end = node_data.get("line_end", 0)

        if not file_path or not line_start:
            return ""

        analysis = self.file_analyses.get(file_path)
        if not analysis or not analysis.raw_source:
            return ""

        lines = analysis.raw_source.splitlines()
        start = max(0, line_start - 1)
        
        if line_end and line_end >= line_start:
            end = min(len(lines), line_end)
        else:
            end = min(len(lines), start + 15)  # fallback if no end line

        return "\n".join(lines[start:end])

    def _describe_step(self, node_data: dict) -> str:
        """Generate a human-readable description of a step."""
        name = node_data.get("name", "unknown")
        docstring = node_data.get("docstring", "")
        file_path = node_data.get("file", "")

        if docstring:
            # Use first line of docstring
            first_line = docstring.strip().split('\n')[0]
            return first_line

        # Generate description from context
        class_name = node_data.get("class_name", "")
        if class_name:
            return f"Calls {class_name}.{name}() in {file_path}"
        return f"Calls {name}() in {file_path}"

    def _classify_operation(self, node_data: dict) -> str:
        """Classify the type of operation a function performs."""
        name = node_data.get("name", "").lower()
        docstring = (node_data.get("docstring", "") or "").lower()
        combined = f"{name} {docstring}"

        if any(kw in combined for kw in ["connect", "database", "db", "query", "sql"]):
            return "database"
        elif any(kw in combined for kw in ["auth", "login", "token", "password", "session"]):
            return "authentication"
        elif any(kw in combined for kw in ["request", "api", "http", "endpoint", "route"]):
            return "api_call"
        elif any(kw in combined for kw in ["validate", "check", "verify"]):
            return "validation"
        elif any(kw in combined for kw in ["log", "print", "debug"]):
            return "logging"
        elif any(kw in combined for kw in ["init", "setup", "configure", "bootstrap"]):
            return "initialization"
        elif any(kw in combined for kw in ["payment", "charge", "refund", "transaction"]):
            return "payment"
        elif any(kw in combined for kw in ["send", "email", "notify", "alert"]):
            return "notification"
        else:
            return "computation"
