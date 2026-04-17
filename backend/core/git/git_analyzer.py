"""
Git Analyzer
Analyzes git commit history to detect:
- Frequently changing files (churn)
- Files that change together (co-change coupling)
- Unstable modules
- Hotspots
"""
import os
import subprocess
from typing import Dict, List, Any, Optional
from collections import defaultdict, Counter
from datetime import datetime


class GitAnalyzer:
    """Analyzes git repository history for insights."""

    def __init__(self, repo_path: str):
        self.repo_path = repo_path
        self._is_git_repo = self._check_git()

    def _check_git(self) -> bool:
        """Check if the path is a git repository."""
        try:
            result = subprocess.run(
                ["git", "rev-parse", "--is-inside-work-tree"],
                cwd=self.repo_path,
                capture_output=True, text=True, timeout=5
            )
            return result.returncode == 0
        except (subprocess.SubprocessError, FileNotFoundError):
            return False

    def analyze(self) -> Dict[str, Any]:
        """Run full git analysis."""
        if not self._is_git_repo:
            return self._mock_analysis()

        return {
            "is_git_repo": True,
            "churn": self.get_file_churn(),
            "co_changes": self.get_co_changes(),
            "recent_activity": self.get_recent_activity(),
            "contributors": self.get_contributors(),
            "hotspots": self.get_hotspots(),
        }

    def get_file_churn(self, max_commits: int = 200) -> List[Dict[str, Any]]:
        """Get files ranked by change frequency."""
        try:
            result = subprocess.run(
                ["git", "log", f"--max-count={max_commits}", "--name-only", "--pretty=format:"],
                cwd=self.repo_path,
                capture_output=True, text=True, timeout=30
            )
            if result.returncode != 0:
                return []

            file_counts = Counter()
            for line in result.stdout.splitlines():
                line = line.strip()
                if line and not line.startswith('commit'):
                    file_counts[line] += 1

            return [
                {"file": f, "changes": c, "category": self._categorize_churn(c)}
                for f, c in file_counts.most_common(30)
            ]
        except (subprocess.SubprocessError, FileNotFoundError):
            return []

    def get_co_changes(self, max_commits: int = 100) -> List[Dict[str, Any]]:
        """Find files that frequently change together."""
        try:
            result = subprocess.run(
                ["git", "log", f"--max-count={max_commits}", "--name-only", "--pretty=format:---"],
                cwd=self.repo_path,
                capture_output=True, text=True, timeout=30
            )
            if result.returncode != 0:
                return []

            commits = []
            current = []
            for line in result.stdout.splitlines():
                if line.strip() == "---":
                    if current:
                        commits.append(current)
                    current = []
                elif line.strip():
                    current.append(line.strip())
            if current:
                commits.append(current)

            # Count co-occurrences
            pair_counts = Counter()
            for files in commits:
                if len(files) > 1 and len(files) < 20:  # skip huge commits
                    for i, f1 in enumerate(files):
                        for f2 in files[i + 1:]:
                            pair = tuple(sorted([f1, f2]))
                            pair_counts[pair] += 1

            return [
                {"file1": p[0], "file2": p[1], "count": c}
                for p, c in pair_counts.most_common(20)
                if c >= 2
            ]
        except (subprocess.SubprocessError, FileNotFoundError):
            return []

    def get_recent_activity(self, days: int = 30) -> List[Dict[str, Any]]:
        """Get recent commit activity."""
        try:
            result = subprocess.run(
                ["git", "log", f"--since={days} days ago", "--pretty=format:%H|%s|%an|%ai"],
                cwd=self.repo_path,
                capture_output=True, text=True, timeout=15
            )
            if result.returncode != 0:
                return []

            commits = []
            for line in result.stdout.splitlines():
                parts = line.split("|", 3)
                if len(parts) == 4:
                    commits.append({
                        "hash": parts[0][:8],
                        "message": parts[1],
                        "author": parts[2],
                        "date": parts[3],
                    })
            return commits[:50]
        except (subprocess.SubprocessError, FileNotFoundError):
            return []

    def get_contributors(self) -> List[Dict[str, Any]]:
        """Get contributor statistics."""
        try:
            result = subprocess.run(
                ["git", "shortlog", "-sn", "--all"],
                cwd=self.repo_path,
                capture_output=True, text=True, timeout=15
            )
            if result.returncode != 0:
                return []

            contributors = []
            for line in result.stdout.splitlines():
                parts = line.strip().split('\t', 1)
                if len(parts) == 2:
                    contributors.append({
                        "name": parts[1].strip(),
                        "commits": int(parts[0].strip()),
                    })
            return contributors
        except (subprocess.SubprocessError, FileNotFoundError):
            return []

    def get_hotspots(self) -> List[Dict[str, Any]]:
        """Identify hotspot files (high churn + high complexity)."""
        churn = self.get_file_churn()
        hotspots = []
        for item in churn:
            if item["changes"] >= 5:
                hotspots.append({
                    "file": item["file"],
                    "churn": item["changes"],
                    "risk": "high" if item["changes"] > 15 else "medium",
                    "recommendation": "Consider stabilizing this module" if item["changes"] > 15 else "Monitor for changes",
                })
        return hotspots

    def _categorize_churn(self, count: int) -> str:
        if count >= 20:
            return "very_high"
        elif count >= 10:
            return "high"
        elif count >= 5:
            return "medium"
        return "low"

    def _mock_analysis(self) -> Dict[str, Any]:
        """Return mock analysis when git is not available."""
        return {
            "is_git_repo": False,
            "churn": [
                {"file": "services/payment_service.py", "changes": 24, "category": "very_high"},
                {"file": "services/auth_service.py", "changes": 18, "category": "high"},
                {"file": "api/routes.py", "changes": 15, "category": "high"},
                {"file": "models/user.py", "changes": 12, "category": "high"},
                {"file": "utils/helpers.py", "changes": 9, "category": "medium"},
                {"file": "database/connection.py", "changes": 7, "category": "medium"},
                {"file": "models/product.py", "changes": 5, "category": "medium"},
                {"file": "utils/validators.py", "changes": 3, "category": "low"},
                {"file": "app.py", "changes": 2, "category": "low"},
            ],
            "co_changes": [
                {"file1": "services/auth_service.py", "file2": "models/user.py", "count": 12},
                {"file1": "services/payment_service.py", "file2": "services/auth_service.py", "count": 8},
                {"file1": "api/routes.py", "file2": "services/payment_service.py", "count": 7},
                {"file1": "utils/helpers.py", "file2": "utils/validators.py", "count": 5},
                {"file1": "models/user.py", "file2": "utils/validators.py", "count": 4},
            ],
            "recent_activity": [
                {"hash": "a1b2c3d4", "message": "Fix payment validation bug", "author": "Dev", "date": "2024-01-15"},
                {"hash": "e5f6g7h8", "message": "Add user permission checks", "author": "Dev", "date": "2024-01-14"},
                {"hash": "i9j0k1l2", "message": "Refactor auth service", "author": "Dev", "date": "2024-01-13"},
                {"hash": "m3n4o5p6", "message": "Update database connection pool", "author": "Dev", "date": "2024-01-12"},
            ],
            "contributors": [
                {"name": "Developer", "commits": 47},
            ],
            "hotspots": [
                {"file": "services/payment_service.py", "churn": 24, "risk": "high", "recommendation": "Consider stabilizing this module"},
                {"file": "services/auth_service.py", "churn": 18, "risk": "high", "recommendation": "Consider stabilizing this module"},
                {"file": "api/routes.py", "churn": 15, "risk": "medium", "recommendation": "Monitor for changes"},
            ],
        }
