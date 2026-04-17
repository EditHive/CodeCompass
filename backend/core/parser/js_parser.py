"""
JavaScript/TypeScript Parser
Parses JS/TS files using regex-based analysis (lightweight alternative to tree-sitter).
Falls back gracefully when tree-sitter is not available.
"""
import re
import os
from typing import Optional, List
from core.parser.base_parser import (
    BaseParser, FileAnalysis, FunctionInfo, ClassInfo, ImportInfo
)


class JavaScriptParser(BaseParser):
    """Parser for JavaScript and TypeScript files."""

    def get_supported_extensions(self) -> List[str]:
        return [".js", ".jsx", ".ts", ".tsx"]

    def parse_file(self, file_path: str) -> Optional[FileAnalysis]:
        """Parse a JS/TS file and extract structural information."""
        if self.should_skip_file(file_path):
            return None

        source = self.read_file(file_path)
        if source is None:
            return None

        ext = os.path.splitext(file_path)[1]
        language = "typescript" if ext in (".ts", ".tsx") else "javascript"
        relative_path = self.get_relative_path(file_path)

        # Count non-empty, non-comment lines
        lines = source.splitlines()
        loc = len([l for l in lines if l.strip() and not l.strip().startswith('//')])

        analysis = FileAnalysis(
            file_path=file_path,
            relative_path=relative_path,
            language=language,
            lines_of_code=loc,
            raw_source=source,
        )

        analysis.imports = self._extract_imports(source)
        analysis.functions = self._extract_functions(source, file_path)
        analysis.classes = self._extract_classes(source, file_path)

        return analysis

    def _extract_imports(self, source: str) -> List[ImportInfo]:
        """Extract import/require statements."""
        imports = []

        # ES6 imports: import { X } from 'module'
        es6_pattern = r'import\s+(?:\{([^}]+)\}|(\w+)(?:\s*,\s*\{([^}]+)\})?)\s+from\s+[\'"]([^\'"]+)[\'"]'
        for match in re.finditer(es6_pattern, source):
            named = match.group(1) or match.group(3) or ""
            default = match.group(2) or ""
            module = match.group(4)

            names = []
            if named:
                names = [n.strip().split(' as ')[0].strip() for n in named.split(',')]
            if default:
                names.insert(0, default)

            imports.append(ImportInfo(
                module=module,
                names=names,
                is_relative=module.startswith('.'),
            ))

        # Side-effect imports: import 'module'
        side_effect = r"import\s+['\"]([^'\"]+)['\"]"
        for match in re.finditer(side_effect, source):
            imports.append(ImportInfo(
                module=match.group(1),
                names=[],
                is_relative=match.group(1).startswith('.'),
            ))

        # CommonJS: const X = require('module')
        cjs_pattern = r'(?:const|let|var)\s+(?:\{([^}]+)\}|(\w+))\s*=\s*require\([\'"]([^\'"]+)[\'"]\)'
        for match in re.finditer(cjs_pattern, source):
            named = match.group(1) or ""
            default = match.group(2) or ""
            module = match.group(3)

            names = []
            if named:
                names = [n.strip() for n in named.split(',')]
            if default:
                names = [default]

            imports.append(ImportInfo(
                module=module,
                names=names,
                is_relative=module.startswith('.'),
            ))

        return imports

    def _extract_functions(self, source: str, file_path: str) -> List[FunctionInfo]:
        """Extract function declarations and expressions."""
        functions = []
        lines = source.splitlines()

        # Regular functions: function name(params)
        func_pattern = r'(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)'
        for match in re.finditer(func_pattern, source):
            line_num = source[:match.start()].count('\n') + 1
            params = [p.strip().split(':')[0].strip().split('=')[0].strip()
                      for p in match.group(2).split(',') if p.strip()]

            # Find end of function (simple brace counting)
            end_line = self._find_block_end(lines, line_num - 1)

            # Extract calls within the function body
            body = '\n'.join(lines[line_num - 1:end_line])
            calls = self._extract_calls(body)

            functions.append(FunctionInfo(
                name=match.group(1),
                file_path=file_path,
                line_start=line_num,
                line_end=end_line,
                params=params,
                calls=calls,
            ))

        # Arrow functions: const name = (params) => {
        arrow_pattern = r'(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\(([^)]*)\)\s*=>'
        for match in re.finditer(arrow_pattern, source):
            line_num = source[:match.start()].count('\n') + 1
            params = [p.strip().split(':')[0].strip().split('=')[0].strip()
                      for p in match.group(2).split(',') if p.strip()]

            end_line = self._find_block_end(lines, line_num - 1)
            body = '\n'.join(lines[line_num - 1:end_line])
            calls = self._extract_calls(body)

            functions.append(FunctionInfo(
                name=match.group(1),
                file_path=file_path,
                line_start=line_num,
                line_end=end_line,
                params=params,
                calls=calls,
            ))

        return functions

    def _extract_classes(self, source: str, file_path: str) -> List[ClassInfo]:
        """Extract class declarations."""
        classes = []
        lines = source.splitlines()

        class_pattern = r'(?:export\s+)?class\s+(\w+)(?:\s+extends\s+(\w+))?\s*\{'
        for match in re.finditer(class_pattern, source):
            line_num = source[:match.start()].count('\n') + 1
            end_line = self._find_block_end(lines, line_num - 1)

            bases = [match.group(2)] if match.group(2) else []

            # Extract methods
            body = '\n'.join(lines[line_num - 1:end_line])
            method_pattern = r'(?:async\s+)?(\w+)\s*\([^)]*\)\s*\{'
            methods = [m.group(1) for m in re.finditer(method_pattern, body)
                       if m.group(1) not in ('if', 'for', 'while', 'switch', 'catch')]

            classes.append(ClassInfo(
                name=match.group(1),
                file_path=file_path,
                line_start=line_num,
                line_end=end_line,
                bases=bases,
                methods=methods,
            ))

        return classes

    def _extract_calls(self, source: str) -> List[str]:
        """Extract function calls from source code."""
        call_pattern = r'(?<!\w)(\w+)\s*\('
        calls = set()
        for match in re.finditer(call_pattern, source):
            name = match.group(1)
            # Filter out keywords
            if name not in ('if', 'for', 'while', 'switch', 'catch', 'function',
                            'return', 'throw', 'new', 'typeof', 'class', 'const',
                            'let', 'var', 'import', 'export', 'from', 'async', 'await'):
                calls.add(name)
        return list(calls)

    def _find_block_end(self, lines: List[str], start: int) -> int:
        """Find the end of a brace-delimited block."""
        depth = 0
        started = False
        for i in range(start, min(start + 200, len(lines))):
            for char in lines[i]:
                if char == '{':
                    depth += 1
                    started = True
                elif char == '}':
                    depth -= 1
                    if started and depth == 0:
                        return i + 1
        return min(start + 10, len(lines))
