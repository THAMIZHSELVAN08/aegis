"""
tests/test_db.py — Tests for SQLite persistence layer and audit trail.
"""

import json
import pytest
from src.db import init_db, log_reading, get_recent_readings, get_db_stats


@pytest.fixture
def temp_db(tmp_path):
    """Provide a temporary SQLite database file for isolation."""
    db_file = tmp_path / "test_aegis.db"
    init_db(db_path=db_file)
    return db_file


def test_db_initialization_and_empty_query(temp_db):
    """Verify clean database initialization and empty list on fresh table."""
    readings = get_recent_readings(limit=10, db_path=temp_db)
    assert readings == []

    stats = get_db_stats(db_path=temp_db)
    assert stats["total_records"] == 0
    assert stats["avg_latency_ms"] == 0.0


def test_log_reading_and_round_trip(temp_db):
    """Verify log_reading persists records and get_recent_readings retrieves them correctly."""
    mock_reading = {"vm_pu_bus0": 1.06, "p_mw_bus0": 232.4}

    row_id_1 = log_reading(
        prediction="NORMAL",
        confidence=0.985,
        ground_truth_injected=False,
        attack_type="None (Clean Baseline)",
        reading_dict=mock_reading,
        latency_ms=1.45,
        db_path=temp_db,
    )
    assert row_id_1 == 1

    row_id_2 = log_reading(
        prediction="ATTACK DETECTED",
        confidence=0.872,
        ground_truth_injected=True,
        attack_type="Voltage Manipulation",
        reading_dict=mock_reading,
        latency_ms=2.10,
        db_path=temp_db,
    )
    assert row_id_2 == 2

    # Query back
    records = get_recent_readings(limit=10, db_path=temp_db)
    assert len(records) == 2

    # Newest record first
    assert records[0]["id"] == 2
    assert records[0]["prediction"] == "ATTACK DETECTED"
    assert records[0]["confidence"] == pytest.approx(0.872)
    assert records[0]["ground_truth_attack_injected"] == 1
    assert records[0]["attack_type"] == "Voltage Manipulation"
    assert json.loads(records[0]["reading_json"]) == mock_reading

    # Oldest record second
    assert records[1]["id"] == 1
    assert records[1]["prediction"] == "NORMAL"
    assert records[1]["ground_truth_attack_injected"] == 0

    # Stats
    stats = get_db_stats(db_path=temp_db)
    assert stats["total_records"] == 2
    assert stats["avg_latency_ms"] > 0
