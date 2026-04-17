"""
Python AST Parser
Parses Python files using the built-in ast module to extract structural information.
"""
import ast
import os
from typing import Optional, List
from core.parser.base_parser import (
    BaseParser, FileAnalysis, FunctionInfo, ClassInfo, ImportInfo
)


class PythonParser(BaseParser):
    """Parser for Python source files using ast module."""

    def get_supported_extensions(self) -> List[str]:
        return [".py"]

    def parse_file(self, file_path: str) -> Optional[FileAnalysis]:
        """Parse a Python file and extract all structural information."""
        if self.should_skip_file(file_path):
            return None

        source = self.read_file(file_path)
        if source is None:
            return None

        relative_path = self.get_relative_path(file_path)
        lines_of_code = len([l for l in source.splitlines() if l.strip() and not l.strip().startswith('#')])

        analysis = FileAnalysis(
            file_path=file_path,
            relative_path=relative_path,
            language="python",
            lines_of_code=lines_of_code,
            raw_source=source,
        )

        try:
            tree = ast.parse(source, filename=file_path)
        except SyntaxError as e:
            analysis.errors.append(f"SyntaxError: {e}")
            return analysis

        # Extract file-level docstring
        analysis.docstring = ast.get_docstring(tree)

        # Extract imports
        analysis.imports = self._extract_imports(tree)

        # Extract functions and classes
        analysis.functions = self._extract_functions(tree, file_path, source)
        analysis.classes = self._extract_classes(tree, file_path, source)

        return analysis

    def _extract_imports(self, tree: ast.AST) -> List[ImportInfo]:
        """Extract all import statements from AST."""
        imports = []
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for alias in node.names:
                    imports.append(ImportInfo(
                        module=alias.name,
                        names=[alias.name.split('.')[-1]],
                        alias=alias.asname,
                        is_relative=False,
                    ))
            elif isinstance(node, ast.ImportFrom):
                module = node.module or ""
                names = [alias.name for alias in node.names] if node.names else []
                imports.append(ImportInfo(
                    module=module,
                    names=names,
                    is_relative=node.level > 0,
                    level=node.level,
                ))
        return imports

    def _extract_functions(self, tree: ast.AST, file_path: str, source: str) -> List[FunctionInfo]:
        """Extract all function definitions from AST."""
        functions = []
        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                # Determine if it's a method
                is_method = False
                class_name = None
                for parent_node in ast.walk(tree):
                    if isinstance(parent_node, ast.ClassDef):
                        if node in ast.walk(parent_node) and node is not parent_node:
                            # Check if this function is a direct child of the class
                            for item in parent_node.body:
                                if item is node:
                                    is_method = True
                                    class_name = parent_node.name
                                    break

                # Extract function calls within this function
                calls = self._extract_calls(node)

                # Calculate cyclomatic complexity
                complexity = self._calculate_complexity(node)

                # Get parameters
                params = []
                for arg in node.args.args:
                    if arg.arg != 'self' and arg.arg != 'cls':
                        params.append(arg.arg)

                # Get decorators
                decorators = []
                for dec in node.decorator_list:
                    if isinstance(dec, ast.Name):
                        decorators.append(dec.id)
                    elif isinstance(dec, ast.Attribute):
                        decorators.append(f"{self._get_attribute_name(dec)}")

                functions.append(FunctionInfo(
                    name=node.name,
                    file_path=file_path,
                    line_start=node.lineno,
                    line_end=node.end_lineno or node.lineno,
                    params=params,
                    decorators=decorators,
                    calls=calls,
                    docstring=ast.get_docstring(node),
                    is_method=is_method,
                    class_name=class_name,
                    complexity=complexity,
                ))
        return functions

    def _extract_classes(self, tree: ast.AST, file_path: str, source: str) -> List[ClassInfo]:
        """Extract all class definitions from AST."""
        classes = []
        for node in ast.iter_child_nodes(tree):
            if isinstance(node, ast.ClassDef):
                bases = []
                for base in node.bases:
                    if isinstance(base, ast.Name):
                        bases.append(base.id)
                    elif isinstance(base, ast.Attribute):
                        bases.append(self._get_attribute_name(base))

                methods = []
                for item in node.body:
                    if isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef)):
                        methods.append(item.name)

                decorators = []
                for dec in node.decorator_list:
                    if isinstance(dec, ast.Name):
                        decorators.append(dec.id)

                classes.append(ClassInfo(
                    name=node.name,
                    file_path=file_path,
                    line_start=node.lineno,
                    line_end=node.end_lineno or node.lineno,
                    bases=bases,
                    methods=methods,
                    decorators=decorators,
                    docstring=ast.get_docstring(node),
                ))
        return classes

    def _extract_calls(self, node: ast.AST) -> List[str]:
        """Extract all function/method calls within a node."""
        calls = []
        for child in ast.walk(node):
            if isinstance(child, ast.Call):
                if isinstance(child.func, ast.Name):
                    calls.append(child.func.id)
                elif isinstance(child.func, ast.Attribute):
                    name = self._get_attribute_name(child.func)
                    calls.append(name)
        return list(set(calls))  # deduplicate

    def _calculate_complexity(self, node: ast.AST) -> int:
        """Calculate cyclomatic complexity of a function."""
        complexity = 1
        for child in ast.walk(node):
            if isinstance(child, (ast.If, ast.While, ast.For, ast.ExceptHandler)):
                complexity += 1
            elif isinstance(child, ast.BoolOp):
                complexity += len(child.values) - 1
            elif isinstance(child, (ast.Assert, ast.Raise)):
                complexity += 1
        return complexity

    def _get_attribute_name(self, node: ast.Attribute) -> str:
        """Get full dotted name from Attribute node."""
        parts = []
        current = node
        while isinstance(current, ast.Attribute):
            parts.append(current.attr)
            current = current.value
        if isinstance(current, ast.Name):
            parts.append(current.id)
        return ".".join(reversed(parts))
