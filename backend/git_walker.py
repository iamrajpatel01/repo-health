import subprocess
from pathlib import Path
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)


@dataclass
class ChangedFile:
    path: str
    additions: int
    deletions: int


class GitWalker:
    """Extracts raw commit data and file churn directly from the local Git binary."""

    def __init__(self, repo_path: Path):
        self.repo_path = repo_path

    def get_all_commits_data(self) -> list[tuple[str, str, str]]:
        """Returns list of (commit_hash, timestamp, author_name) ordered oldest to newest."""
        try:
            result = subprocess.run(
                ["git", "log", "--pretty=format:%H|%cI|%an", "--reverse"],
                cwd=self.repo_path,
                capture_output=True,
                text=True,
                check=True,
            )
            commits = []
            for line in result.stdout.strip().split("\n"):
                if line:
                    parts = line.split("|")
                    if len(parts) == 3:
                        commits.append((parts[0], parts[1], parts[2]))
            return commits
        except subprocess.CalledProcessError as e:
            logger.error(f"Git log failed: {e}")
            return []

    def get_changed_files(self, commit_hash: str) -> list[ChangedFile]:
        """Uses numstat to get exactly how many lines an author added/removed per file."""
        try:
            result = subprocess.run(
                ["git", "show", "--numstat", "--format=", commit_hash],
                cwd=self.repo_path,
                capture_output=True,
                text=True,
                check=True,
            )
            files = []
            for line in result.stdout.strip().split("\n"):
                if line:
                    parts = line.split("\t")
                    if len(parts) == 3:
                        adds = int(parts[0]) if parts[0] != "-" else 0
                        dels = int(parts[1]) if parts[1] != "-" else 0
                        files.append(
                            ChangedFile(path=parts[2], additions=adds, deletions=dels)
                        )
            return files
        except Exception:
            return []
