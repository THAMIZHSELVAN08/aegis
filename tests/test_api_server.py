"""
tests/test_api_server.py — Integration tests for Flask API server endpoints.
"""

import pytest
from src.api_server import app


@pytest.fixture
def client():
    """Create a Flask test client for API testing."""
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


def test_health_endpoint(client):
    """Verify /api/health returns 200 with complete system telemetry."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.get_json()

    assert data["status"] in ["healthy", "degraded"]
    assert "version" in data
    assert "models" in data
    assert "grid" in data
    assert data["grid"]["topology"] == "IEEE 14-bus"
    assert "database" in data


def test_live_reading_clean(client):
    """Verify /api/live-reading with clean injection parameter."""
    response = client.get("/api/live-reading?inject=false")
    assert response.status_code == 200
    data = response.get_json()

    assert "reading" in data
    assert "prediction" in data
    assert "confidence" in data
    assert "confidence_breakdown" in data
    assert "explanation" in data
    assert "latency_ms" in data
    assert data["ground_truth_attack_injected"] is False


def test_live_reading_forced_attack(client):
    """Verify /api/live-reading with forced attack injection."""
    response = client.get("/api/live-reading?inject=true&attack_type=voltage_manipulation")
    assert response.status_code == 200
    data = response.get_json()

    assert data["ground_truth_attack_injected"] is True
    assert data["injected_attack_key"] == "voltage_manipulation"


def test_live_reading_invalid_parameters(client):
    """Verify /api/live-reading returns 400 Bad Request on invalid inputs."""
    # Invalid attack_type
    res1 = client.get("/api/live-reading?attack_type=invalid_payload")
    assert res1.status_code == 400
    assert "error" in res1.get_json()

    # Invalid inject boolean
    res2 = client.get("/api/live-reading?inject=not_a_boolean")
    assert res2.status_code == 400
    assert "error" in res2.get_json()


def test_history_endpoint(client):
    """Verify /api/history returns a list and enforces limit validation."""
    response = client.get("/api/history?limit=5")
    assert response.status_code == 200
    data = response.get_json()
    assert isinstance(data, list)

    # Invalid limit
    res_bad = client.get("/api/history?limit=invalid_number")
    assert res_bad.status_code == 400

    res_negative = client.get("/api/history?limit=-10")
    assert res_negative.status_code == 400


def test_model_metrics_endpoint(client):
    """Verify /api/model-metrics returns metrics and metadata structure."""
    response = client.get("/api/model-metrics")
    assert response.status_code == 200
    data = response.get_json()
    assert "metrics" in data
    assert "metadata" in data


def test_contingency_analysis_endpoint(client):
    """Verify /api/contingency-analysis returns grid N-1 contingency evaluation."""
    response = client.get("/api/contingency-analysis")
    assert response.status_code == 200
    data = response.get_json()
    assert "overall_status" in data
    assert "contingencies" in data
    assert len(data["contingencies"]) == 15
