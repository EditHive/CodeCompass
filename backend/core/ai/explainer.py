"""
Multi-Level Code Explainer
Generates explanations at beginner, intermediate, and expert levels.
Grounds all explanations in actual AST data - no hallucination.
"""
from typing import Dict, Any, Optional
import networkx as nx


class CodeExplainer:
    """Generates multi-level code explanations grounded in AST analysis."""

    def __init__(self, graph: nx.DiGraph, file_analyses: dict):
        self.graph = graph
        self.file_analyses = file_analyses

    def explain(self, node_id: str, level: str = "intermediate") -> Dict[str, Any]:
        """Explain a file, function, or class at the specified level.

        Levels: beginner, intermediate, expert
        """
        if node_id not in self.graph:
            # Try to find by name
            node_id = self._find_node(node_id)
            if not node_id:
                return {"error": "Node not found"}

        node_data = self.graph.nodes[node_id]
        node_type = node_data.get("type", "unknown")

        if node_type == "file":
            return self._explain_file(node_id, node_data, level)
        elif node_type == "function":
            return self._explain_function(node_id, node_data, level)
        elif node_type == "class":
            return self._explain_class(node_id, node_data, level)

        return {"error": f"Cannot explain node type: {node_type}"}

    def _explain_file(self, node_id: str, data: dict, level: str) -> Dict[str, Any]:
        """Explain a file module."""
        analysis = self.file_analyses.get(node_id)

        # Get dependencies
        imports_to = [t for _, t, d in self.graph.out_edges(node_id, data=True)
                      if d.get("type") == "imports"]
        imported_by = [s for s, _, d in self.graph.in_edges(node_id, data=True)
                       if d.get("type") == "imports"]

        # Get contained elements
        functions = [t for _, t, d in self.graph.out_edges(node_id, data=True)
                     if d.get("type") == "contains" and
                     self.graph.nodes.get(t, {}).get("type") == "function"]
        classes = [t for _, t, d in self.graph.out_edges(node_id, data=True)
                   if d.get("type") == "contains" and
                   self.graph.nodes.get(t, {}).get("type") == "class"]

        result = {
            "node_id": node_id,
            "type": "file",
            "level": level,
            "name": data.get("label", node_id),
            "language": data.get("language", "unknown"),
        }

        if level == "beginner":
            result["explanation"] = self._beginner_file_explanation(
                node_id, data, functions, classes, imports_to, imported_by, analysis
            )
        elif level == "intermediate":
            result["explanation"] = self._intermediate_file_explanation(
                node_id, data, functions, classes, imports_to, imported_by, analysis
            )
        else:  # expert
            result["explanation"] = self._expert_file_explanation(
                node_id, data, functions, classes, imports_to, imported_by, analysis
            )

        result["metadata"] = {
            "loc": data.get("loc", 0),
            "num_functions": len(functions),
            "num_classes": len(classes),
            "imports_count": len(imports_to),
            "imported_by_count": len(imported_by),
            "dependencies": imports_to,
            "dependents": imported_by,
        }

        return result

    def _explain_function(self, node_id: str, data: dict, level: str) -> Dict[str, Any]:
        """Explain a function."""
        file_path = data.get("file", "")
        analysis = self.file_analyses.get(file_path)

        # Get calls this function makes
        calls_out = [t for _, t, d in self.graph.out_edges(node_id, data=True)
                     if d.get("type") == "calls"]
        called_by = [s for s, _, d in self.graph.in_edges(node_id, data=True)
                     if d.get("type") == "calls"]

        # Get code snippet
        snippet = self._get_code_snippet(data, analysis)

        result = {
            "node_id": node_id,
            "type": "function",
            "level": level,
            "name": data.get("name", node_id),
            "file": file_path,
        }

        func_name = data.get("name", "this function")
        docstring = data.get("docstring", "")
        params = data.get("params", [])
        complexity = data.get("complexity", 1)
        class_name = data.get("class_name", "")

        if level == "beginner":
            explanation = f"## What is `{func_name}`?\n\n"
            if class_name:
                explanation += f"This is a method belonging to the `{class_name}` class. "
            if docstring:
                explanation += f"**Purpose:** {docstring}\n\n"
            else:
                explanation += f"This function is defined in `{file_path}`.\n\n"

            if params:
                explanation += f"**It takes these inputs:** {', '.join(params)}\n\n"
            else:
                explanation += "**It takes no inputs.**\n\n"

            if calls_out:
                call_names = [self.graph.nodes[c].get("name", c) for c in calls_out[:5]]
                explanation += f"**What it does:** It uses these other functions: {', '.join(call_names)}\n\n"

            explanation += "**Think of it as:** A helper that performs a specific task in the application."

        elif level == "intermediate":
            explanation = f"## `{func_name}`\n\n"
            explanation += f"**File:** `{file_path}`\n"
            if class_name:
                explanation += f"**Class:** `{class_name}`\n"
            explanation += f"**Parameters:** `({', '.join(params) if params else 'none'})`\n"
            explanation += f"**Complexity:** {complexity}\n\n"

            if docstring:
                explanation += f"**Description:** {docstring}\n\n"

            if calls_out:
                explanation += "**Calls:**\n"
                for c in calls_out:
                    cdata = self.graph.nodes.get(c, {})
                    explanation += f"- `{cdata.get('name', c)}` in `{cdata.get('file', '?')}`\n"
                explanation += "\n"

            if called_by:
                explanation += "**Called by:**\n"
                for c in called_by:
                    cdata = self.graph.nodes.get(c, {})
                    explanation += f"- `{cdata.get('name', c)}` in `{cdata.get('file', '?')}`\n"

        else:  # expert
            explanation = f"## `{func_name}` — Expert Analysis\n\n"
            explanation += f"**Location:** `{file_path}`, lines {data.get('line_start', '?')}-{data.get('line_end', '?')}\n"
            if class_name:
                explanation += f"**Member of:** `{class_name}`\n"
            explanation += f"**Cyclomatic Complexity:** {complexity}"
            explanation += " ⚠️ Consider refactoring" if complexity > 5 else ""
            explanation += "\n\n"

            if docstring:
                explanation += f"> {docstring}\n\n"

            # Dependency analysis
            explanation += f"**Dependency Profile:**\n"
            explanation += f"- Outgoing calls: {len(calls_out)}\n"
            explanation += f"- Incoming callers: {len(called_by)}\n"
            explanation += f"- Coupling score: {'HIGH' if len(calls_out) + len(called_by) > 8 else 'MODERATE' if len(calls_out) + len(called_by) > 4 else 'LOW'}\n\n"

            if calls_out:
                explanation += "**Call chain:**\n"
                for c in calls_out:
                    cdata = self.graph.nodes.get(c, {})
                    explanation += f"- → `{cdata.get('name', c)}` (`{cdata.get('file', '?')}`) [complexity: {cdata.get('complexity', '?')}]\n"
                explanation += "\n"

            # Risk assessment
            total_deps = len(calls_out) + len(called_by)
            risk = "HIGH" if total_deps > 10 or complexity > 8 else "MEDIUM" if total_deps > 5 else "LOW"
            explanation += f"**Change Risk:** {risk}\n"
            explanation += f"**Architectural Role:** {'Core infrastructure' if len(called_by) > 5 else 'Service layer' if len(called_by) > 2 else 'Leaf function'}"

        result["explanation"] = explanation
        result["code_snippet"] = snippet
        result["metadata"] = {
            "params": params,
            "complexity": complexity,
            "calls": [self.graph.nodes[c].get("name", c) for c in calls_out],
            "called_by": [self.graph.nodes[c].get("name", c) for c in called_by],
            "class_name": class_name,
            "line_start": data.get("line_start", 0),
            "line_end": data.get("line_end", 0),
        }

        return result

    def _explain_class(self, node_id: str, data: dict, level: str) -> Dict[str, Any]:
        """Explain a class."""
        file_path = data.get("file", "")
        class_name = data.get("name", node_id)
        methods = data.get("methods", [])
        bases = data.get("bases", [])
        docstring = data.get("docstring", "")

        result = {
            "node_id": node_id,
            "type": "class",
            "level": level,
            "name": class_name,
            "file": file_path,
        }

        if level == "beginner":
            explanation = f"## What is `{class_name}`?\n\n"
            explanation += f"A class is like a blueprint. `{class_name}` is a blueprint defined in `{file_path}`.\n\n"
            if docstring:
                explanation += f"**What it does:** {docstring}\n\n"
            if bases:
                explanation += f"**It's based on:** {', '.join(bases)} (inherits their abilities)\n\n"
            if methods:
                explanation += f"**It can do these things:** {', '.join(methods[:8])}\n"
        elif level == "intermediate":
            explanation = f"## Class `{class_name}`\n\n"
            explanation += f"**File:** `{file_path}`\n"
            if bases:
                explanation += f"**Inherits:** {', '.join(bases)}\n"
            explanation += f"**Methods ({len(methods)}):** {', '.join(methods)}\n\n"
            if docstring:
                explanation += f"**Description:** {docstring}\n"
        else:
            explanation = f"## `{class_name}` — Expert Analysis\n\n"
            explanation += f"**Location:** `{file_path}`, lines {data.get('line_start', '?')}-{data.get('line_end', '?')}\n"
            if bases:
                explanation += f"**Inheritance chain:** {' → '.join(bases)}\n"
            explanation += f"**Method count:** {len(methods)}\n"
            explanation += f"**Cohesion:** {'LOW ⚠️ (too many methods)' if len(methods) > 10 else 'ACCEPTABLE'}\n\n"
            if docstring:
                explanation += f"> {docstring}\n\n"
            explanation += f"**Methods:** `{'`, `'.join(methods)}`"

        result["explanation"] = explanation
        result["metadata"] = {
            "methods": methods,
            "bases": bases,
            "docstring": docstring,
        }
        return result

    def _beginner_file_explanation(self, node_id, data, functions, classes, imports_to, imported_by, analysis):
        name = data.get("label", node_id)
        docstring = data.get("docstring", "") or ""
        explanation = f"## What is `{name}`?\n\n"
        if docstring:
            explanation += f"{docstring}\n\n"
        explanation += f"This is a code file with **{len(functions)} functions** and **{len(classes)} classes**.\n\n"
        if imports_to:
            explanation += f"**It uses code from:** {', '.join(i.split('/')[-1] for i in imports_to[:5])}\n\n"
        if imported_by:
            explanation += f"**Other files that use it:** {', '.join(i.split('/')[-1] for i in imported_by[:5])}\n"
        return explanation

    def _intermediate_file_explanation(self, node_id, data, functions, classes, imports_to, imported_by, analysis):
        name = data.get("label", node_id)
        explanation = f"## Module `{name}`\n\n"
        explanation += f"**Lines of code:** {data.get('loc', 0)}\n"
        explanation += f"**Functions:** {len(functions)} | **Classes:** {len(classes)}\n\n"
        if data.get("docstring"):
            explanation += f"> {data['docstring']}\n\n"
        if imports_to:
            explanation += "**Dependencies:**\n"
            for dep in imports_to:
                explanation += f"- `{dep}`\n"
            explanation += "\n"
        if imported_by:
            explanation += "**Used by:**\n"
            for dep in imported_by:
                explanation += f"- `{dep}`\n"
        return explanation

    def _expert_file_explanation(self, node_id, data, functions, classes, imports_to, imported_by, analysis):
        name = data.get("label", node_id)
        loc = data.get("loc", 0)
        explanation = f"## `{name}` — Expert Analysis\n\n"
        explanation += f"**LOC:** {loc} | **Functions:** {len(functions)} | **Classes:** {len(classes)}\n"
        explanation += f"**Afferent coupling (Ca):** {len(imported_by)} | **Efferent coupling (Ce):** {len(imports_to)}\n"
        instability = len(imports_to) / max(len(imports_to) + len(imported_by), 1)
        explanation += f"**Instability (I):** {instability:.2f}\n\n"
        if loc > 300:
            explanation += "> ⚠️ **Large file** — consider splitting into smaller modules\n\n"
        if len(imports_to) > 8:
            explanation += "> ⚠️ **High coupling** — depends on too many modules\n\n"
        return explanation

    def _find_node(self, query: str) -> Optional[str]:
        """Find a node by name."""
        query_lower = query.lower()
        for node_id, data in self.graph.nodes(data=True):
            if data.get("name", "").lower() == query_lower:
                return node_id
            if node_id.lower() == query_lower:
                return node_id
            label = data.get("label", "").lower()
            if label == query_lower:
                return node_id
        # Partial match
        for node_id, data in self.graph.nodes(data=True):
            if query_lower in node_id.lower() or query_lower in data.get("name", "").lower():
                return node_id
        return None

    def _get_code_snippet(self, data: dict, analysis, max_lines: int = 15) -> str:
        if not analysis or not analysis.raw_source:
            return ""
        lines = analysis.raw_source.splitlines()
        start = max(0, data.get("line_start", 1) - 1)
        end = min(len(lines), start + max_lines)
        return "\n".join(lines[start:end])
