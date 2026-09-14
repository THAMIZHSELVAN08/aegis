"""
api/index.py — Standard Vercel Python Serverless Function entrypoint for AEGIS.
"""

import sys
from pathlib import Path

# Ensure root directory and src directory are on the Python path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = PROJECT_ROOT / "src"

for path in (PROJECT_ROOT, SRC_DIR):
    if str(path) not in sys.path:
        sys.path.insert(0, str(path))

try:
    from src.api_server import app as _app  # type: ignore
except (ImportError, ModuleNotFoundError):
    from api_server import app as _app  # type: ignore

app = _app
handler = _app
