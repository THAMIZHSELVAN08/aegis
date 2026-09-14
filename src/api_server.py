"""
api_server.py — AEGIS Flask API Backend

Endpoints:
  GET /api/health               — System health, database connectivity, and model telemetry
  GET /api/live-reading         — Single synchronous reading + ML prediction + SHAP
  GET /api/model-metrics        — Saved evaluation metrics + metadata
  GET /api/contingency-analysis — N-1 contingency results
  GET /api/history?limit=N      — Recent readings from SQLite audit trail

WebSocket events (flask-socketio):
  emit  'new_reading'           — Pushed every ~2 s from background thread or MQTT bridge
"""

import logging
import os
import random
import re
import sys
import threading
import time
import warnings
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

import joblib
import numpy as np
import pandas as pd
import pandapower as pp
import pandapower.networks as nw
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO

# Suppress noisy library warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)
warnings.filterwarnings("ignore", category=UserWarning)

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from src.config import config
from src.db import get_db_stats, get_recent_readings, init_db, log_reading
from src.inject_attacks import (
    apply_load_redistribution,
    apply_topology_replay,
    apply_voltage_manipulation,
)
from src.simulate_grid import run_n_minus_1_contingency
import shap

# ---------------------------------------------------------------------------
# Structured Logging Configuration
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL, logging.INFO),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S%z",
)
logger = logging.getLogger("aegis.api")

# ---------------------------------------------------------------------------
# App & SocketIO Setup
# ---------------------------------------------------------------------------
app = Flask(__name__)
CORS(app, origins=config.CORS_ORIGINS.split(",") if "," in config.CORS_ORIGINS else config.CORS_ORIGINS)

socketio = SocketIO(
    app,
    cors_allowed_origins=config.CORS_ORIGINS if config.CORS_ORIGINS != "*" else "*",
    async_mode="threading",
)

# Initialize SQLite database
init_db()

# ---------------------------------------------------------------------------
# Model & Grid Initialization
# ---------------------------------------------------------------------------
DATA_DIR = PROJECT_ROOT / "data"

try:
    model = joblib.load(DATA_DIR / "fdia_detector_model.pkl")
except Exception as e:
    logger.warning(f"Could not load fdia_detector_model.pkl: {e}")
    model = None

try:
    rf_model = joblib.load(DATA_DIR / "rf_model.pkl")
except Exception:
    rf_model = model

try:
    scaler = joblib.load(DATA_DIR / "scaler.pkl")
    feature_columns = joblib.load(DATA_DIR / "feature_columns.pkl")
except Exception as e:
    logger.warning(f"Could not load scaler or feature_columns: {e}")
    scaler = None
    feature_columns = []

# Initialize SHAP explainer
shap_explainer = shap.TreeExplainer(model) if model is not None else None

# Initialize PandaPower Grid Case 14
net = nw.case14()
base_loads_p = net.load["p_mw"].copy()
base_loads_q = net.load["q_mvar"].copy()

FEATURE_LABELS = {
    "vm_pu": "Voltage (pu)",
    "va_deg": "Angle (deg)",
    "p_mw": "Active Power (MW)",
    "q_mvar": "Reactive Power (MVAR)",
}

VALID_ATTACK_TYPES = {
    "random",
    "voltage_manipulation",
    "load_redistribution",
    "topology_replay",
}


# ---------------------------------------------------------------------------
# Security / Auth Helper
# ---------------------------------------------------------------------------
def _check_api_key():
    """Return a 401 response if API_KEY is configured and the request header is wrong."""
    if not config.API_KEY:
        return None
    provided = request.headers.get("X-API-Key", "")
    if provided != config.API_KEY:
        logger.warning("Unauthorized request with invalid X-API-Key header")
        return jsonify({"error": "Unauthorized — missing or invalid X-API-Key header"}), 401
    return None


# ---------------------------------------------------------------------------
# Helper Functions
# ---------------------------------------------------------------------------
def humanize_feature_name(feature_name: str) -> str:
    match = re.match(r"^(vm_pu|va_deg|p_mw|q_mvar)_bus(\d+)$", feature_name)
    if not match:
        return feature_name
    metric, bus = match.groups()
    return f"Bus {bus} {FEATURE_LABELS.get(metric, metric)}"


def get_global_feature_importance(top_n: int = 5) -> Dict[str, Any]:
    if model is None or not hasattr(model, "feature_importances_"):
        return {"method": "none", "features": []}
    importances = model.feature_importances_
    ranked = sorted(
        zip(feature_columns, importances),
        key=lambda item: item[1],
        reverse=True,
    )[:top_n]

    return {
        "method": "global_feature_importance",
        "label": "Global feature importance (gain-based, fallback)",
        "features": [
            {
                "feature": name,
                "label": humanize_feature_name(name),
                "importance": round(float(score), 4),
                "direction": "informational",
            }
            for name, score in ranked
        ],
    }


def get_shap_explanation(X_scaled: np.ndarray, prediction: int, top_n: int = 5) -> Dict[str, Any]:
    if shap_explainer is None:
        return get_global_feature_importance(top_n=top_n)

    start = time.perf_counter()
    try:
        shap_values = shap_explainer.shap_values(X_scaled)
        elapsed_ms = (time.perf_counter() - start) * 1000

        if isinstance(shap_values, list):
            values = shap_values[1][0] if prediction == 1 else shap_values[0][0]
        else:
            values = np.asarray(shap_values)[0]

        ranked = sorted(
            zip(feature_columns, values),
            key=lambda item: abs(item[1]),
            reverse=True,
        )[:top_n]

        features = []
        for name, value in ranked:
            shap_value = float(value)
            direction = (
                "toward_attack" if shap_value > 0
                else "toward_normal" if shap_value < 0
                else "neutral"
            )
            features.append({
                "feature": name,
                "label": humanize_feature_name(name),
                "shap_value": round(shap_value, 4),
                "direction": direction,
            })

        return {
            "method": "shap",
            "label": "Per-prediction SHAP explanation",
            "latency_ms": round(elapsed_ms, 2),
            "features": features,
        }
    except Exception as exc:
        logger.warning(f"SHAP explanation failed, using global fallback: {exc}")
        return get_global_feature_importance(top_n=top_n)


def get_live_reading(inject_attack: bool = False, attack_type: str = "voltage_manipulation") -> Tuple[Dict[str, float], str]:
    """Simulate one grid reading, optionally with an injected attack."""
    factors = 1 + np.random.uniform(-0.15, 0.15, size=len(net.load))
    net.load["p_mw"] = base_loads_p * factors
    net.load["q_mvar"] = base_loads_q * factors

    pp.runpp(net)

    raw_record = {}
    for bus_id in net.res_bus.index:
        raw_record[f"vm_pu_bus{bus_id}"] = float(net.res_bus.at[bus_id, "vm_pu"])
        raw_record[f"va_deg_bus{bus_id}"] = float(net.res_bus.at[bus_id, "va_degree"])
        raw_record[f"p_mw_bus{bus_id}"] = float(net.res_bus.at[bus_id, "p_mw"])
        raw_record[f"q_mvar_bus{bus_id}"] = float(net.res_bus.at[bus_id, "q_mvar"])

    if not inject_attack:
        return raw_record, "None (Clean Baseline)"

    if attack_type == "load_redistribution":
        modified = apply_load_redistribution(raw_record)
        attack_label = "Load Redistribution Attack"
    elif attack_type == "topology_replay":
        modified = apply_topology_replay(raw_record)
        attack_label = "Topology / Replay Attack"
    else:
        modified = apply_voltage_manipulation(raw_record)
        attack_label = "Voltage Manipulation"

    return modified, attack_label


def compute_one_reading(inject: Optional[bool] = None, attack_type: str = "random") -> Dict[str, Any]:
    """Core simulation + detection logic."""
    if inject is None:
        inject = random.random() < 0.3

    if inject and (not attack_type or attack_type == "random"):
        attack_type = random.choice(
            ["voltage_manipulation", "load_redistribution", "topology_replay"]
        )

    reading, injected_attack_name = get_live_reading(
        inject_attack=inject,
        attack_type=attack_type,
    )

    X = pd.DataFrame([reading])[feature_columns]

    t0 = time.perf_counter()
    X_scaled = scaler.transform(X) if scaler is not None else X.values

    if model is not None and hasattr(model, "predict_proba"):
        xgb_proba = model.predict_proba(X_scaled)[0]
    else:
        xgb_proba = np.array([0.9, 0.1])

    if rf_model is not None and hasattr(rf_model, "predict_proba"):
        rf_proba = rf_model.predict_proba(X_scaled)[0]
    else:
        rf_proba = xgb_proba

    ensemble_proba = (xgb_proba + rf_proba) / 2.0
    latency_ms = (time.perf_counter() - t0) * 1000

    xgb_pred = int(np.argmax(xgb_proba))
    rf_pred = int(np.argmax(rf_proba))
    ensemble_pred = int(np.argmax(ensemble_proba))

    prediction_label = "ATTACK DETECTED" if ensemble_pred == 1 else "NORMAL"
    confidence = round(float(ensemble_proba[ensemble_pred]), 3)

    confidence_breakdown = {
        "ensemble": {
            "prediction": prediction_label,
            "confidence": confidence,
            "attack_probability": round(float(ensemble_proba[1]), 3),
        },
        "xgboost": {
            "prediction": "ATTACK DETECTED" if xgb_pred == 1 else "NORMAL",
            "confidence": round(float(xgb_proba[xgb_pred]), 3),
            "attack_probability": round(float(xgb_proba[1]), 3),
        },
        "random_forest": {
            "prediction": "ATTACK DETECTED" if rf_pred == 1 else "NORMAL",
            "confidence": round(float(rf_proba[rf_pred]), 3),
            "attack_probability": round(float(rf_proba[1]), 3),
        },
    }

    explanation = get_shap_explanation(X_scaled, ensemble_pred, top_n=5)

    try:
        log_reading(
            prediction=prediction_label,
            confidence=confidence,
            ground_truth_injected=inject,
            attack_type=injected_attack_name,
            reading_dict=reading,
            latency_ms=round(latency_ms, 3),
        )
    except Exception as db_err:
        logger.error(f"Failed to log reading to database: {db_err}")

    return {
        "reading": reading,
        "prediction": prediction_label,
        "confidence": confidence,
        "confidence_breakdown": confidence_breakdown,
        "ground_truth_attack_injected": inject,
        "ground_truth_attack_type": injected_attack_name,
        "injected_attack_key": attack_type if inject else "none",
        "explanation": explanation,
        "latency_ms": round(latency_ms, 3),
    }


# ---------------------------------------------------------------------------
# Background WebSocket Pusher
# ---------------------------------------------------------------------------
def _push_reading_loop():
    """Background pusher with MQTT subscription and local fallback."""
    connected_to_mqtt = False
    try:
        import paho.mqtt.client as mqtt

        def on_prediction_msg(client, userdata, msg):
            try:
                import json
                payload = json.loads(msg.payload.decode("utf-8"))
                socketio.emit("new_reading", payload)
            except Exception as err:
                logger.error(f"MQTT message decode error: {err}")

        client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id="web_dashboard_gateway")
        client.on_message = on_prediction_msg
        client.connect(config.MQTT_BROKER_HOST, config.MQTT_BROKER_PORT, 60)
        client.subscribe("grid/alerts/predictions")
        client.loop_start()
        connected_to_mqtt = True
        logger.info(f"Connected to MQTT broker at {config.MQTT_BROKER_HOST}:{config.MQTT_BROKER_PORT}")
    except Exception as exc:
        logger.info(f"MQTT broker not reachable ({exc}). Running local push loop fallback.")

    if not connected_to_mqtt:
        while True:
            try:
                payload = compute_one_reading()
                socketio.emit("new_reading", payload)
            except Exception as exc:
                logger.error(f"Push loop error: {exc}")
            time.sleep(2)


# ---------------------------------------------------------------------------
# REST Endpoints
# ---------------------------------------------------------------------------
@app.route("/api/health", methods=["GET"])
def health_check():
    """Health check endpoint exposing system status, DB stats, and model availability."""
    db_stats = get_db_stats()
    models_ready = model is not None and rf_model is not None and scaler is not None

    status_code = 200 if models_ready else 503
    return jsonify({
        "status": "healthy" if models_ready else "degraded",
        "version": "1.0.0",
        "models": {
            "xgboost_loaded": model is not None,
            "random_forest_loaded": rf_model is not None,
            "scaler_loaded": scaler is not None,
            "shap_explainer_ready": shap_explainer is not None,
            "feature_count": len(feature_columns),
        },
        "grid": {
            "topology": "IEEE 14-bus",
            "buses": len(net.bus),
            "lines": len(net.line),
            "generators": len(net.gen) + len(net.ext_grid),
        },
        "database": db_stats,
    }), status_code


@app.route("/api/live-reading", methods=["GET"])
def live_reading():
    auth_err = _check_api_key()
    if auth_err:
        return auth_err

    inject_param = request.args.get("inject")
    attack_type = request.args.get("attack_type", "random")

    # Input Validation
    if attack_type not in VALID_ATTACK_TYPES:
        return jsonify({
            "error": f"Invalid attack_type '{attack_type}'. Must be one of: {sorted(list(VALID_ATTACK_TYPES))}"
        }), 400

    if inject_param is not None:
        if inject_param.lower() in ["true", "1", "yes"]:
            inject = True
        elif inject_param.lower() in ["false", "0", "no"]:
            inject = False
        else:
            return jsonify({
                "error": f"Invalid inject parameter '{inject_param}'. Must be boolean (true/false/1/0)."
            }), 400
    else:
        inject = None

    try:
        result = compute_one_reading(inject=inject, attack_type=attack_type)
        return jsonify(result)
    except Exception as e:
        logger.error(f"Error computing live reading: {e}")
        return jsonify({"error": f"Failed to compute reading: {str(e)}"}), 500


@app.route("/api/history", methods=["GET"])
def history():
    auth_err = _check_api_key()
    if auth_err:
        return auth_err

    limit_param = request.args.get("limit", "100")
    try:
        limit = int(limit_param)
        if limit <= 0:
            raise ValueError()
        limit = min(limit, 500)
    except ValueError:
        return jsonify({"error": f"Invalid limit parameter '{limit_param}'. Must be a positive integer."}), 400

    return jsonify(get_recent_readings(limit))


@app.route("/api/model-metrics", methods=["GET"])
def model_metrics():
    import json
    metrics = {}
    metadata = {}
    try:
        metrics_file = DATA_DIR / "model_metrics.json"
        if metrics_file.exists():
            with open(metrics_file, "r") as f:
                metrics = json.load(f)
    except Exception as err:
        logger.error(f"Failed to load metrics: {err}")
        metrics = {"error": f"Failed to load metrics: {err}"}

    try:
        metadata_file = DATA_DIR / "model_metadata.json"
        if metadata_file.exists():
            with open(metadata_file, "r") as f:
                metadata = json.load(f)
    except Exception as err:
        logger.error(f"Failed to load metadata: {err}")
        metadata = {"error": f"Failed to load metadata: {err}"}

    return jsonify({"metrics": metrics, "metadata": metadata})


@app.route("/api/contingency-analysis", methods=["GET"])
def contingency_analysis():
    try:
        results = run_n_minus_1_contingency(net)
        return jsonify(results)
    except Exception as e:
        logger.error(f"Contingency analysis error: {e}")
        return jsonify({"error": f"Contingency analysis failed: {str(e)}"}), 500


# ---------------------------------------------------------------------------
# Server Entry Point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    logger.info(f"Starting AEGIS API Server on {config.HOST}:{config.PORT}")
    push_thread = threading.Thread(target=_push_reading_loop, daemon=True)
    push_thread.start()

    socketio.run(
        app,
        host=config.HOST,
        port=config.PORT,
        debug=config.DEBUG,
        use_reloader=False,
        allow_unsafe_werkzeug=True,
    )
