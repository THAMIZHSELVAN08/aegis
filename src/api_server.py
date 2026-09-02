"""
api_server.py — AEGIS Flask API Backend

Endpoints:
  GET /api/live-reading       — Single synchronous reading + ML prediction
  GET /api/model-metrics      — Saved evaluation metrics + metadata
  GET /api/contingency-analysis — N-1 contingency results
  GET /api/history?limit=N    — Recent readings from SQLite audit trail

WebSocket events (flask-socketio):
  emit  'new_reading'         — Pushed every ~2 s from background thread

Production hardening notes (see README.md → Known Limitations):
  - CORS is currently restricted to CORS_ORIGIN env var (default: localhost:3000)
  - Flask dev server is used; switch to gunicorn for production
  - No authentication is implemented; stub API-key check is provided below
"""

import os
import sys
import warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)
warnings.filterwarnings("ignore", category=UserWarning)

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_socketio import SocketIO
import pandapower as pp
import pandapower.networks as nw
import numpy as np
import pandas as pd
import joblib
import random
import time
import re
import os
import sys
import threading
from pathlib import Path

# Ensure project root is in sys.path when running script directly
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import shap

try:
    from src.inject_attacks import (
        apply_voltage_manipulation,
        apply_load_redistribution,
        apply_topology_replay,
    )
    from src.simulate_grid import run_n_minus_1_contingency
    from src.db import init_db, log_reading, get_recent_readings
except ModuleNotFoundError:
    from inject_attacks import (
        apply_voltage_manipulation,
        apply_load_redistribution,
        apply_topology_replay,
    )
    from simulate_grid import run_n_minus_1_contingency
    from db import init_db, log_reading, get_recent_readings


# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = Flask(__name__)

# CORS: restrict to the dashboard origin (or whatever is set in CORS_ORIGIN env var)
_cors_origin = os.environ.get("CORS_ORIGIN", "http://localhost:3000")
CORS(app, origins=[_cors_origin])

# Socket.IO — threading async mode avoids the websocket_wsgi ConnectionError
# that occurs when eventlet/gevent/simple-websocket is not installed.
socketio = SocketIO(app, cors_allowed_origins=_cors_origin, async_mode="threading")

# Initialise SQLite DB (creates table if not present)
init_db()

# ---------------------------------------------------------------------------
# Model + grid loading
# ---------------------------------------------------------------------------

model = joblib.load("data/fdia_detector_model.pkl")
try:
    rf_model = joblib.load("data/rf_model.pkl")
except Exception:
    rf_model = model

scaler = joblib.load("data/scaler.pkl")
feature_columns = joblib.load("data/feature_columns.pkl")

# Built once at startup — TreeExplainer is reused for every request.
shap_explainer = shap.TreeExplainer(model)

net = nw.case14()

base_loads_p = net.load["p_mw"].copy()
base_loads_q = net.load["q_mvar"].copy()

FEATURE_LABELS = {
    "vm_pu": "Voltage (pu)",
    "va_deg": "Angle (deg)",
    "p_mw": "Active Power (MW)",
    "q_mvar": "Reactive Power (MVAR)",
}

# ---------------------------------------------------------------------------
# Optional API-key stub (Section 1.3 — auth)
# ---------------------------------------------------------------------------
# To enable: set API_KEY env var before starting the server.
# If not set, auth check is bypassed (development mode).
_api_key = os.environ.get("API_KEY", "")


def _check_api_key():
    """Return a 401 response if API_KEY is configured and the request header is wrong."""
    if not _api_key:
        return None  # Auth disabled — development mode
    provided = request.headers.get("X-API-Key", "")
    if provided != _api_key:
        return jsonify({"error": "Unauthorized — missing or invalid X-API-Key header"}), 401
    return None


# ---------------------------------------------------------------------------
# Helper functions
# ---------------------------------------------------------------------------

def humanize_feature_name(feature_name):
    match = re.match(r"^(vm_pu|va_deg|p_mw|q_mvar)_bus(\d+)$", feature_name)
    if not match:
        return feature_name
    metric, bus = match.groups()
    return f"Bus {bus} {FEATURE_LABELS[metric]}"


def get_global_feature_importance(top_n=5):
    importances = model.feature_importances_
    ranked = sorted(
        zip(feature_columns, importances),
        key=lambda item: item[1],
        reverse=True,
    )[:top_n]

    return {
        "method": "global_feature_importance",
        "label": "Global feature importance (gain-based, not per-prediction)",
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


def get_shap_explanation(X_scaled, prediction, top_n=5):
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
        print(f"SHAP explanation failed, using global fallback: {exc}")
        return get_global_feature_importance(top_n=top_n)


def get_live_reading(inject_attack=False, attack_type="voltage_manipulation"):
    """Simulate one grid reading, optionally with an injected attack."""
    factors = 1 + np.random.uniform(-0.15, 0.15, size=len(net.load))
    net.load["p_mw"] = base_loads_p * factors
    net.load["q_mvar"] = base_loads_q * factors

    pp.runpp(net)

    raw_record = {}
    for bus_id in net.res_bus.index:
        raw_record[f"vm_pu_bus{bus_id}"] = net.res_bus.at[bus_id, "vm_pu"]
        raw_record[f"va_deg_bus{bus_id}"] = net.res_bus.at[bus_id, "va_degree"]
        raw_record[f"p_mw_bus{bus_id}"] = net.res_bus.at[bus_id, "p_mw"]
        raw_record[f"q_mvar_bus{bus_id}"] = net.res_bus.at[bus_id, "q_mvar"]

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


def compute_one_reading(inject=None, attack_type="random"):
    """
    Core logic shared by the REST endpoint and the WebSocket push loop.

    Returns a dict ready to be JSON-serialised and/or emitted.
    Also logs the result to SQLite (excluding SHAP — measure that separately).
    """
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

    # --- Timed: scaling + ensemble inference (excluding SHAP) ---
    t0 = time.perf_counter()
    X_scaled = scaler.transform(X)

    xgb_proba = model.predict_proba(X_scaled)[0]
    rf_proba = rf_model.predict_proba(X_scaled)[0]
    ensemble_proba = (xgb_proba + rf_proba) / 2.0
    latency_ms = (time.perf_counter() - t0) * 1000
    # -----------------------------------------------------------

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

    # Persist to SQLite audit trail
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
        print(f"[db] log_reading failed: {db_err}")

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
# WebSocket background push loop
# ---------------------------------------------------------------------------

def _push_reading_loop():
    """Daemon thread: connects to MQTT prediction stream or falls back to internal push loop."""
    import paho.mqtt.client as mqtt

    def on_prediction_msg(client, userdata, msg):
        try:
            import json
            payload = json.loads(msg.payload.decode("utf-8"))
            socketio.emit("new_reading", payload)
        except Exception as err:
            print(f"[ws] MQTT message parse error: {err}")

    mqtt_broker = os.environ.get("MQTT_BROKER", "localhost")
    mqtt_port = int(os.environ.get("MQTT_PORT", 1883))

    connected_to_mqtt = False
    try:
        client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id="web_dashboard_gateway")
        client.on_message = on_prediction_msg
        client.connect(mqtt_broker, mqtt_port, 60)
        client.subscribe("grid/alerts/predictions")
        client.loop_start()
        connected_to_mqtt = True
        print(f"[ws] Connected to MQTT prediction stream on 'grid/alerts/predictions'", flush=True)
    except Exception as exc:
        print(f"[ws] MQTT broker connection not active ({exc}). Running local push loop fallback.", flush=True)

    if not connected_to_mqtt:
        while True:
            try:
                payload = compute_one_reading()
                socketio.emit("new_reading", payload)
            except Exception as exc:
                print(f"[ws] push_reading_loop error: {exc}")
            time.sleep(2)


# ---------------------------------------------------------------------------
# REST Endpoints
# ---------------------------------------------------------------------------

@app.route("/api/live-reading", methods=["GET"])
def live_reading():
    auth_err = _check_api_key()
    if auth_err:
        return auth_err

    inject_param = request.args.get("inject")
    attack_type = request.args.get("attack_type", "random")

    if inject_param is not None:
        inject = inject_param.lower() in ["true", "1", "yes"]
    else:
        inject = None  # compute_one_reading will decide randomly

    result = compute_one_reading(inject=inject, attack_type=attack_type)
    return jsonify(result)


@app.route("/api/history", methods=["GET"])
def history():
    auth_err = _check_api_key()
    if auth_err:
        return auth_err

    limit = min(int(request.args.get("limit", 100)), 500)  # cap at 500
    return jsonify(get_recent_readings(limit))


@app.route("/api/model-metrics", methods=["GET"])
def model_metrics():
    import json
    metrics = {}
    metadata = {}
    try:
        with open("data/model_metrics.json", "r") as f:
            metrics = json.load(f)
    except Exception as err:
        metrics = {"error": f"Failed to load metrics: {err}"}

    try:
        with open("data/model_metadata.json", "r") as f:
            metadata = json.load(f)
    except Exception as err:
        metadata = {"error": f"Failed to load metadata: {err}"}

    return jsonify({"metrics": metrics, "metadata": metadata})


@app.route("/api/contingency-analysis", methods=["GET"])
def contingency_analysis():
    results = run_n_minus_1_contingency(net)
    return jsonify(results)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    # Start the WebSocket push loop as a background daemon thread
    push_thread = threading.Thread(target=_push_reading_loop, daemon=True)
    push_thread.start()

    socketio.run(
        app,
        port=5000,
        debug=True,
        use_reloader=False,  # Disable reloader to prevent duplicate daemon threads
        allow_unsafe_werkzeug=True,
    )
