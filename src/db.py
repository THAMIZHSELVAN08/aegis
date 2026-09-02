"""
db.py — SQLite persistence layer for AEGIS audit trail.

Every reading + prediction is logged here so that history survives server
restarts and the dashboard can pre-populate from real data on page load.
"""

import sqlite3
import json
from pathlib import Path
from datetime import datetime, timezone

DB_PATH = Path(__file__).parent.parent / "data" / "aegis_history.db"


def init_db():
    """Create the readings table if it doesn't already exist."""
    conn = sqlite3.connect(DB_PATH)
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
    conn.close()


def log_reading(
    prediction,
    confidence,
    ground_truth_injected,
    attack_type,
    reading_dict,
    latency_ms=None,
):
    """Insert one reading + prediction record into the database."""
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        "INSERT INTO readings "
        "(timestamp, prediction, confidence, ground_truth_attack_injected, "
        "attack_type, reading_json, latency_ms) "
        "VALUES (?, ?, ?, ?, ?, ?, ?)",
        (
            datetime.now(timezone.utc).isoformat(),
            prediction,
            float(confidence),
            int(bool(ground_truth_injected)),
            attack_type,
            json.dumps(reading_dict),
            float(latency_ms) if latency_ms is not None else None,
        ),
    )
    conn.commit()
    conn.close()


def get_recent_readings(limit: int = 100):
    """Return the most recent *limit* readings, newest first."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        "SELECT * FROM readings ORDER BY id DESC LIMIT ?", (limit,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]
