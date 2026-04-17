"""PRISM-CODE Configuration"""
import os

# Server
HOST = os.getenv("PRISM_HOST", "0.0.0.0")
PORT = int(os.getenv("PRISM_PORT", "8000"))

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SAMPLE_REPO_PATH = os.path.join(BASE_DIR, "sample_repo")

# Analysis
SUPPORTED_EXTENSIONS = {
    ".py": "python",
    ".js": "javascript",
    ".jsx": "javascript",
    ".ts": "typescript",
    ".tsx": "typescript",
}

MAX_FILE_SIZE_KB = 500  # Skip files larger than this
IGNORE_DIRS = {
    "__pycache__", "node_modules", ".git", ".venv", "venv",
    "env", ".env", "dist", "build", ".next", ".idea", ".vscode",
    "egg-info", ".eggs", ".tox", ".mypy_cache", ".pytest_cache",
}
IGNORE_FILES = {"__init__.py"}

# Embeddings
EMBEDDING_MODEL = "all-MiniLM-L6-v2"

# Code Smell Thresholds
MAX_FILE_LINES = 300
MAX_FUNCTION_LINES = 50
MAX_FUNCTION_PARAMS = 5
MAX_NESTING_DEPTH = 4
HIGH_COUPLING_THRESHOLD = 8
