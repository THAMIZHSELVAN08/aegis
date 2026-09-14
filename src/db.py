"""
db.py — SQLite persistence layer for AEGIS audit trail.

Every reading + prediction is logged here so that history survives server
restarts and the dashboard can pre-populate from real data on page load.
"""

import sqlite3
import json
import logging
from pathlib import Path
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

from src.config import config

logger = logging.getLogger("aegis.db")


def get_db_path(db_path: Optional[Path] = None) -> Path:
    """Return explicit path or configured default."""
    path = db_path if db_path is not None else config.DB_PATH
    if isinstance(path, str):
        path = Path(path)
    if path != Path(":memory:") and not path.parent.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
    return path


def init_db(db_path: Optional[Path] = None):
    """Create the readings table if it doesn't already exist."""
    target_path = get_db_path(db_path)
    conn = sqlite3.connect(str(target_path))
    try:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS readings (
                id                          INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp                   TEXT    NOT NULL,
                prediction                  TEXT    NOT NULL,
                confidence                  REAL    NOT NULL,
                ground_truth_attack_injected INTEGER,
                attack_type                 TEXT,
                reading_json                TEXT    NOT NULL,
                latency_ms                  REAL
            )
        """)
        conn.commit()
        logger.debug(f"Database initialized at {target_path}")
    finally:
        conn.close()


def log_reading(
    prediction: str,
    confidence: float,
    ground_truth_injected: bool,
    attack_type: Optional[str],
    reading_dict: Dict[str, Any],
    latency_ms: Optional[float] = None,
    db_path: Optional[Path] = None,
) -> int:
    """Insert one reading + prediction record into the database and return row ID."""
    target_path = get_db_path(db_path)
    conn = sqlite3.connect(str(target_path))
    try:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO readings "
            "(timestamp, prediction, confidence, ground_truth_attack_injected, "
            "attack_type, reading_json, latency_ms) "
            "VALUES (?, ?, ?, ?, ?, ?, ?)",
            (
                datetime.now(timezone.utc).isoformat(),
                str(prediction),
                float(confidence),
                int(bool(ground_truth_injected)),
                attack_type,
                json.dumps(reading_dict),
                float(latency_ms) if latency_ms is not None else None,
            ),
        )
        conn.commit()
        row_id = cursor.lastrowid
        return row_id
    finally:
        conn.close()


def get_recent_readings(limit: int = 100, db_path: Optional[Path] = None) -> List[Dict[str, Any]]:
    """Return the most recent *limit* readings, newest first."""
    target_path = get_db_path(db_path)
    conn = sqlite3.connect(str(target_path))
    conn.row_factory = sqlite3.Row
    try:
        rows = conn.execute(
            "SELECT * FROM readings ORDER BY id DESC LIMIT ?", (limit,)
        ).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def get_db_stats(db_path: Optional[Path] = None) -> Dict[str, Any]:
    """Return aggregate statistics about stored readings."""
    target_path = get_db_path(db_path)
    conn = sqlite3.connect(str(target_path))
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*), AVG(latency_ms) FROM readings")
        count, avg_latency = cursor.fetchone()
        return {
            "total_records": count or 0,
            "avg_latency_ms": round(avg_latency, 2) if avg_latency else 0.0,
            "db_path": str(target_path),
        }
    except Exception as e:
        logger.error(f"Error querying db stats: {e}")
        return {"total_records": 0, "avg_latency_ms": 0.0, "error": str(e)}
    finally:
        conn.close()
