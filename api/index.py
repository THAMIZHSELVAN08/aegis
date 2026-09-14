"""
api/index.py — Standard Vercel Python Serverless Function entrypoint for AEGIS.
"""

import sys
from pathlib import Path

# Ensure root directory is on the Python path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from src.api_server import app

# Vercel WSGI / Serverless handler
handler = app
