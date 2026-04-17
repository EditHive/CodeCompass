"""
Base Parser Interface
Abstract base class that all language-specific parsers must implement.
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import List, Optional
import os
import config


@dataclass
class FunctionInfo:
    """Represents a parsed function/method."""
    name: str
    file_path: str
    line_start: int
    line_end: int
    params: List[str] = field(default_factory=list)
    decorators: List[str] = field(default_factory=list)
    calls: List[str] = field(default_factory=list)
    docstring: Optional[str] = None
    is_method: bool = False
    class_name: Optional[str] = None
    complexity: int = 1  # cyclomatic complexity


@dataclass
class ClassInfo:
    """Represents a parsed class."""
    name: str
    file_path: str
    line_start: int
    line_end: int
    bases: List[str] = field(default_factory=list)
    methods: List[str] = field(default_factory=list)
    decorators: List[str] = field(default_factory=list)
    docstring: Optional[str] = None


@dataclass
class ImportInfo:
    """Represents an import statement."""
    module: str
    names: List[str] = field(default_factory=list)
    alias: Optional[str] = None
    is_relative: bool = False
    level: int = 0  # for relative imports


@dataclass
class FileAnalysis:
    """Complete analysis result for a single file."""
    file_path: str
    relative_path: str
    language: str
    lines_of_code: int
    imports: List[ImportInfo] = field(default_factory=list)
    functions: List[FunctionInfo] = field(default_factory=list)
    classes: List[ClassInfo] = field(default_factory=list)
    raw_source: str = ""
    docstring: Optional[str] = None
    errors: List[str] = field(default_factory=list)


class BaseParser(ABC):
    """Abstract base parser interface."""

    def __init__(self, root_path: str):
        self.root_path = root_path

    @abstractmethod
    def parse_file(self, file_path: str) -> Optional[FileAnalysis]:
        """Parse a single file and return analysis results."""
        pass

    @abstractmethod
    def get_supported_extensions(self) -> List[str]:
        """Return list of file extensions this parser handles."""
        pass

    def should_skip_file(self, file_path: str) -> bool:
        """Check if a file should be skipped."""
        # Check file size
        try:
            size_kb = os.path.getsize(file_path) / 1024
            if size_kb > config.MAX_FILE_SIZE_KB:
                return True
        except OSError:
            return True

        # Check if in ignored directory
        parts = file_path.split(os.sep)
        for part in parts:
            if part in config.IGNORE_DIRS:
                return True

        # Check if ignored file
        basename = os.path.basename(file_path)
        if basename in config.IGNORE_FILES:
            return True

        return False

    def get_relative_path(self, file_path: str) -> str:
        """Get path relative to root."""
        return os.path.relpath(file_path, self.root_path)

    def read_file(self, file_path: str) -> Optional[str]:
        """Read file contents safely."""
        try:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()
        except (IOError, OSError):
            return None
