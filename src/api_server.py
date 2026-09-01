from flask import Flask, jsonify, request
from flask_cors import CORS
import pandapower as pp
import pandapower.networks as nw
import numpy as np
import pandas as pd
import joblib
import random
import time
import re
import sys
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
except ModuleNotFoundError:
    from inject_attacks import (
        apply_voltage_manipulation,
        apply_load_redistribution,
        apply_topology_replay,
    )
    from simulate_grid import run_n_minus_1_contingency


app = Flask(__name__)
CORS(app)

model = joblib.load("data/fdia_detector_model.pkl")
try:
    rf_model = joblib.load("data/rf_model.pkl")
except Exception:
    rf_model = model

scaler = joblib.load("data/scaler.pkl")
feature_columns = joblib.load("data/feature_columns.pkl")

# Built once at startup — TreeExplainer is reused for every live-reading request.
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
            # Binary classifiers may return one array per class.
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
            if shap_value > 0:
                direction = "toward_attack"
            elif shap_value < 0:
                direction = "toward_normal"
            else:
                direction = "neutral"

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


@app.route("/api/live-reading", methods=["GET"])
def live_reading():

    inject_param = request.args.get("inject")
    attack_type = request.args.get("attack_type", "voltage_manipulation")

    if inject_param is not None:
        inject = inject_param.lower() in ["true", "1", "yes"]
    else:
        inject = random.random() < 0.3

    if inject and (not attack_type or attack_type == "random"):
        attack_type = random.choice(["voltage_manipulation", "load_redistribution", "topology_replay"])

    reading, injected_attack_name = get_live_reading(
        inject_attack=inject,
        attack_type=attack_type
    )

    X = pd.DataFrame([reading])[feature_columns]
    X_scaled = scaler.transform(X)

    # Sub-model probabilities
    xgb_proba = model.predict_proba(X_scaled)[0]
    rf_proba = rf_model.predict_proba(X_scaled)[0]
    ensemble_proba = (xgb_proba + rf_proba) / 2.0

    xgb_pred = int(np.argmax(xgb_proba))
    rf_pred = int(np.argmax(rf_proba))
    ensemble_pred = int(np.argmax(ensemble_proba))

    confidence_breakdown = {
        "ensemble": {
            "prediction": "ATTACK DETECTED" if ensemble_pred == 1 else "NORMAL",
            "confidence": round(float(ensemble_proba[ensemble_pred]), 3),
            "attack_probability": round(float(ensemble_proba[1]), 3)
        },
        "xgboost": {
            "prediction": "ATTACK DETECTED" if xgb_pred == 1 else "NORMAL",
            "confidence": round(float(xgb_proba[xgb_pred]), 3),
            "attack_probability": round(float(xgb_proba[1]), 3)
        },
        "random_forest": {
            "prediction": "ATTACK DETECTED" if rf_pred == 1 else "NORMAL",
            "confidence": round(float(rf_proba[rf_pred]), 3),
            "attack_probability": round(float(rf_proba[1]), 3)
        }
    }

    explanation = get_shap_explanation(
        X_scaled,
        ensemble_pred,
        top_n=5,
    )

    return jsonify({
        "reading": reading,
        "prediction":
            "ATTACK DETECTED"
            if ensemble_pred == 1
            else "NORMAL",
        "confidence": round(float(ensemble_proba[ensemble_pred]), 3),
        "confidence_breakdown": confidence_breakdown,
        "ground_truth_attack_injected": inject,
        "ground_truth_attack_type": injected_attack_name,
        "injected_attack_key": attack_type if inject else "none",
        "explanation": explanation,
    })


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

    return jsonify({
        "metrics": metrics,
        "metadata": metadata
    })


@app.route("/api/contingency-analysis", methods=["GET"])
def contingency_analysis():
    results = run_n_minus_1_contingency(net)
    return jsonify(results)


if __name__ == "__main__":
    app.run(
        debug=True,
        port=5000
    )
