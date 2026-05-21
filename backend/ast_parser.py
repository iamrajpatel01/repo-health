import logging
from typing import Any
from pathlib import Path

# Hybrid approach for maximum demo reliability:
# Python → zero-dependency built-in ast module (perfect accuracy)
# JS/TS  → fast regex heuristics (no C-compiler/Tree-Sitter binary required)
import ast
import re

logger = logging.getLogger(__name__)


class CodeParser:
    """
    Deterministic structural parser.
    Extracts imports and calculates cyclomatic complexity (nesting depth, branches)
    to feed the Graph Engine. $0 computation cost.
    """

    def __init__(self):
        pass

    def parse_file(self, file_path: str, content: str) -> dict[str, Any]:
        ext = Path(file_path).suffix.lower()
        if ext == ".py":
            return self._parse_python(content)
        elif ext in (".js", ".jsx", ".ts", ".tsx"):
            return self._parse_js_ts(content)
        return {"functions": [], "imports": []}

    def _parse_python(self, content: str) -> dict[str, Any]:
        try:
            tree = ast.parse(content)
        except SyntaxError:
            return {"functions": [], "imports": []}

        imports = []
        functions = []

        for node in ast.walk(tree):
            # Extract dependencies for the graph edges
            if isinstance(node, ast.Import):
                for alias in node.names:
                    imports.append(alias.name.split(".")[0])
            elif isinstance(node, ast.ImportFrom):
                if node.module:
                    imports.append(node.module.split(".")[0])

            # Calculate cyclomatic complexity (if, for, while, try, with)
            elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
                complexity = 1
                for child in ast.walk(node):
                    if isinstance(
                        child,
                        (ast.If, ast.For, ast.While, ast.Try, ast.ExceptHandler, ast.With),
                    ):
                        complexity += 1

                functions.append(
                    {
                        "name": node.name,
                        "kind": "class" if isinstance(node, ast.ClassDef) else "function",
                        "complexity": complexity,
                    }
                )

        return {"imports": list(set(imports)), "functions": functions}

    def _parse_js_ts(self, content: str) -> dict[str, Any]:
        """Fast structural heuristic for JS/TS — runs anywhere, no native binaries."""
        imports = []
        functions = []

        # Match standard ES6 imports: import { x } from 'module'
        import_pattern = re.compile(r'import\s+.*?(?:from\s+)?[\'"]([^\'"]+)[\'"]')
        for match in import_pattern.finditer(content):
            module = match.group(1)
            if not module.startswith("."):  # Only track external/architectural boundaries
                imports.append(module.split("/")[0])

        # Heuristic complexity counting
        lines = content.split("\n")
        current_func = None

        for line in lines:
            if re.search(r"(function\s+\w+|const\s+\w+\s*=\s*\([^)]*\)\s*=>)", line):
                if current_func:
                    functions.append(current_func)
                current_func = {"name": "anonymous", "kind": "function", "complexity": 1}

            if current_func and re.search(r"\b(if|for|while|catch|switch)\b", line):
                current_func["complexity"] += 1

        if current_func:
            functions.append(current_func)

        return {"imports": list(set(imports)), "functions": functions}
