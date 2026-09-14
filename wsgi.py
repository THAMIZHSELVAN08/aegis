"""
wsgi.py — Root WSGI Entrypoint for AEGIS Flask Application.
"""

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent
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

if __name__ == "__main__":
    app.run()
