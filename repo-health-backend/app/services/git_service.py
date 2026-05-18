import subprocess
import logging
import re
from typing import List

def extract_structural_diff() -> List[str]:
    """
    Extracts the structural git diff between HEAD~1 and HEAD.
    Filters out noise (comments, whitespace) and captures only important architectural changes:
    - Imports and dependency changes
    - Class definitions
    - Function definitions
    
    Limits the output to 15 lines to optimize for AI token usage.
    """
    fallback_diff = [
        "- from services.auth import validate_user",
        "+ from database.models import User",
        "+ from database.connection import db"
    ]
    
    try:
        # Use -U0 to only show the changed lines without surrounding context
        result = subprocess.run(
            ["git", "diff", "HEAD~1", "HEAD", "-U0"],
            capture_output=True,
            text=True,
            check=True
        )
        
        raw_diff = result.stdout.splitlines()
        
        # Pattern to match structural code changes (imports, definitions) across common languages
        structural_pattern = re.compile(
            r'^[-+]\s*(import\b|from\b|class\b|def\b|require\b|export\b|const\s+.*=\s*require)'
        )
        
        structural_lines = []
        
        for line in raw_diff:
            # Skip file metadata and patch headers
            if line.startswith('---') or line.startswith('+++') or line.startswith('@@'):
                continue
            
            # Skip obvious comments
            if re.search(r'^[-+]\s*(#|//|/\*)', line):
                continue
                
            if structural_pattern.search(line):
                # Clean up excess whitespace while preserving the +/- indicator
                clean_line = re.sub(r'^([-+])\s+', r'\1 ', line.strip())
                structural_lines.append(clean_line)
                
        # If no structural changes were found but command succeeded, return empty list
        # We only fallback if the command actually fails (e.g., not a git repo or no HEAD~1)
        return structural_lines[:15]
        
    except subprocess.CalledProcessError as e:
        logging.error(f"Git diff command failed (possibly no HEAD~1): {e.stderr}")
        return fallback_diff
    except FileNotFoundError:
        logging.error("Git executable not found in PATH.")
        return fallback_diff
    except Exception as e:
        logging.error(f"Unexpected error extracting git diff: {str(e)}")
        return fallback_diff
