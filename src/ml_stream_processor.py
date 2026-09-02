# -*- coding: utf-8 -*-
"""
ml_stream_processor.py -- ML Detection Stream Processor Service

Subscribes to MQTT topic 'grid/bus/telemetry', executes real-time XGBoost + RF
ensemble inference, generates SHAP explanations, persists to SQLite audit log,
and publishes predictions to 'grid/alerts/predictions'.

Decouples detection logic from sensor ingestion and web presentation.
"""

import sys
import json
import time
import os
import io
import re
import joblib
import numpy as np
import pandas as pd
from pathlib import Path

import warnings
warnings.filterwarnings("ignore", category=DeprecationWarning)
warnings.filterwarnings("ignore", category=UserWarning)

# Force UTF-8 stdout
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

import shap
import paho.mqtt.client as mqtt

try:
    from src.db import init_db, log_reading
except ModuleNotFoundError:
    from db import init_db, log_reading

# Load models and scaling artifacts
print("[ML Stream Processor] Loading trained models and feature scalers...", flush=True)
model = joblib.load(PROJECT_ROOT / "data" / "fdia_detector_model.pkl")
try:
    rf_model = joblib.load(PROJECT_ROOT / "data" / "rf_model.pkl")
except Exception:
    rf_model = model

scaler = joblib.load(PROJECT_ROOT / "data" / "scaler.pkl")
feature_columns = joblib.load(PROJECT_ROOT / "data" / "feature_columns.pkl")
shap_explainer = shap.TreeExplainer(model)

init_db()

MQTT_BROKER     = os.environ.get("MQTT_BROKER", "localhost")
MQTT_PORT       = int(os.environ.get("MQTT_PORT", 1883))
SUB_TOPIC       = "grid/bus/telemetry"
PUB_TOPIC       = "grid/alerts/predictions"

FEATURE_LABELS = {
    "vm_pu": "Voltage (pu)",
    "va_deg": "Angle (deg)",
    "p_mw": "Active Power (MW)",
    "q_mvar": "Reactive Power (MVAR)",
}


def humanize_feature_name(feature_name):
    match = re.match(r"^(vm_pu|va_deg|p_mw|q_mvar)_bus(\d+)$", feature_name)
    if not match:
        return feature_name
    metric, bus = match.groups()
    return f"Bus {bus} {FEATURE_LABELS[metric]}"


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
        return {"method": "fallback", "features": [], "error": str(exc)}


def process_telemetry(payload):
    """Run ensemble inference on raw telemetry and return formatted result."""
    reading = payload.get("reading", {})
    inject = payload.get("inject", False)
    attack_label = payload.get("attack_type", "None")
    attack_key = payload.get("attack_key", "none")

    X = pd.DataFrame([reading])[feature_columns]

    t0 = time.perf_counter()
    X_scaled = scaler.transform(X)

    xgb_proba = model.predict_proba(X_scaled)[0]
    rf_proba = rf_model.predict_proba(X_scaled)[0]
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

    # Persist to SQLite audit database
    try:
        log_reading(
            prediction=prediction_label,
            confidence=confidence,
            ground_truth_injected=inject,
            attack_type=attack_label,
            reading_dict=reading,
            latency_ms=round(latency_ms, 3),
        )
    except Exception as err:
        print(f"[ML Stream Processor] DB log error: {err}", flush=True)

    return {
        "reading": reading,
        "prediction": prediction_label,
        "confidence": confidence,
        "confidence_breakdown": confidence_breakdown,
        "ground_truth_attack_injected": inject,
        "ground_truth_attack_type": attack_label,
        "injected_attack_key": attack_key,
        "explanation": explanation,
        "latency_ms": round(latency_ms, 3),
    }


def on_message(client, userdata, msg):
    try:
        payload = json.loads(msg.payload.decode("utf-8"))
        result = process_telemetry(payload)
        
        client.publish(PUB_TOPIC, json.dumps(result))
        print(
            f"[ML Stream Processor] Processed sample | Pred: {result['prediction']} "
            f"({result['confidence']*100:.1f}%) | Latency: {result['latency_ms']} ms -> {PUB_TOPIC}",
            flush=True,
        )
    except Exception as exc:
        print(f"[ML Stream Processor] Error processing message: {exc}", flush=True)


def main():
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2, client_id="ml_stream_processor")
    client.on_message = on_message

    print(f"[ML Stream Processor] Connecting to MQTT broker at {MQTT_BROKER}:{MQTT_PORT}...", flush=True)
    try:
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        client.subscribe(SUB_TOPIC)
        print(f"[ML Stream Processor] Subscribed to '{SUB_TOPIC}'. Streaming predictions to '{PUB_TOPIC}'.", flush=True)
        client.loop_forever()
    except Exception as err:
        print(f"[ML Stream Processor] Broker connect failed: {err}", flush=True)


if __name__ == "__main__":
    main()
