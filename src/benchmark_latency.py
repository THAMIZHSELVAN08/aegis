"""
benchmark_latency.py — End-to-end ML classification latency benchmarking.

Calls the core prediction pipeline (scaler transform + ensemble inference)
1000 times in a tight loop — no network overhead — and reports the latency
distribution: median, p95, p99, and max.

Usage:
    python src/benchmark_latency.py

Outputs:
    Console: formatted latency report
    data/latency_benchmark.json
"""

import sys
import json
import time
import numpy as np
import pandas as pd
import joblib
from pathlib import Path

# Allow running from project root or src/ directory
PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

import pandapower as pp
import pandapower.networks as nw

# ---------------------------------------------------------------------------
# Load artefacts
# ---------------------------------------------------------------------------
print("Loading models and artefacts …")
model = joblib.load(PROJECT_ROOT / "data" / "fdia_detector_model.pkl")
rf_model = joblib.load(PROJECT_ROOT / "data" / "rf_model.pkl")
scaler = joblib.load(PROJECT_ROOT / "data" / "scaler.pkl")
feature_columns = joblib.load(PROJECT_ROOT / "data" / "feature_columns.pkl")

net = nw.case14()
base_loads_p = net.load["p_mw"].copy()
base_loads_q = net.load["q_mvar"].copy()


# ---------------------------------------------------------------------------
# Helper: one grid reading (representative, minimal overhead)
# ---------------------------------------------------------------------------
def _one_reading():
    factors = 1 + np.random.uniform(-0.15, 0.15, size=len(net.load))
    net.load["p_mw"] = base_loads_p * factors
    net.load["q_mvar"] = base_loads_q * factors
    pp.runpp(net)

    record = {}
    for bus_id in net.res_bus.index:
        record[f"vm_pu_bus{bus_id}"] = net.res_bus.at[bus_id, "vm_pu"]
        record[f"va_deg_bus{bus_id}"] = net.res_bus.at[bus_id, "va_degree"]
        record[f"p_mw_bus{bus_id}"] = net.res_bus.at[bus_id, "p_mw"]
        record[f"q_mvar_bus{bus_id}"] = net.res_bus.at[bus_id, "q_mvar"]
    return record


# ---------------------------------------------------------------------------
# Benchmark: ML inference only (not grid simulation)
# ---------------------------------------------------------------------------
N_WARMUP = 20
N_RUNS = 1000

print(f"Warming up ({N_WARMUP} runs) …")
for _ in range(N_WARMUP):
    reading = _one_reading()
    X = pd.DataFrame([reading])[feature_columns]
    X_scaled = scaler.transform(X)
    model.predict_proba(X_scaled)
    rf_model.predict_proba(X_scaled)

print(f"Benchmarking ML inference ({N_RUNS} runs) …")
inference_latencies = []
for _ in range(N_RUNS):
    reading = _one_reading()
    X = pd.DataFrame([reading])[feature_columns]

    t0 = time.perf_counter()
    X_scaled = scaler.transform(X)
    xgb_proba = model.predict_proba(X_scaled)[0]
    rf_proba = rf_model.predict_proba(X_scaled)[0]
    _ = (xgb_proba + rf_proba) / 2.0
    elapsed_ms = (time.perf_counter() - t0) * 1000
    inference_latencies.append(elapsed_ms)

# Also benchmark SHAP separately
try:
    import shap as _shap
    shap_explainer = _shap.TreeExplainer(model)

    print(f"Benchmarking SHAP explanation ({N_RUNS} runs) …")
    shap_latencies = []
    for _ in range(N_RUNS):
        reading = _one_reading()
        X = pd.DataFrame([reading])[feature_columns]
        X_scaled = scaler.transform(X)

        t0 = time.perf_counter()
        shap_explainer.shap_values(X_scaled)
        elapsed_ms = (time.perf_counter() - t0) * 1000
        shap_latencies.append(elapsed_ms)
    has_shap = True
except Exception as e:
    print(f"  SHAP benchmark skipped: {e}")
    shap_latencies = []
    has_shap = False

# ---------------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------------
arr = np.array(inference_latencies)
results = {
    "n_runs": N_RUNS,
    "ml_inference_only_ms": {
        "median": round(float(np.median(arr)), 3),
        "p95":    round(float(np.percentile(arr, 95)), 3),
        "p99":    round(float(np.percentile(arr, 99)), 3),
        "max":    round(float(np.max(arr)), 3),
        "mean":   round(float(np.mean(arr)), 3),
    },
}

if has_shap:
    sarr = np.array(shap_latencies)
    results["shap_explanation_ms"] = {
        "median": round(float(np.median(sarr)), 3),
        "p95":    round(float(np.percentile(sarr, 95)), 3),
        "p99":    round(float(np.percentile(sarr, 99)), 3),
        "max":    round(float(np.max(sarr)), 3),
        "mean":   round(float(np.mean(sarr)), 3),
    }

out_path = PROJECT_ROOT / "data" / "latency_benchmark.json"
with open(out_path, "w") as f:
    json.dump(results, f, indent=2)

print("\n" + "=" * 60)
print("LATENCY BENCHMARK RESULTS")
print("=" * 60)
inf = results["ml_inference_only_ms"]
print("  ML Inference (scaling + XGBoost + RF + ensemble):")
print(f"    Median : {inf['median']:>8.3f} ms")
print(f"    p95    : {inf['p95']:>8.3f} ms")
print(f"    p99    : {inf['p99']:>8.3f} ms")
print(f"    Max    : {inf['max']:>8.3f} ms")

if has_shap:
    sh = results["shap_explanation_ms"]
    print("\n  SHAP Explanation (per-prediction TreeExplainer):")
    print(f"    Median : {sh['median']:>8.3f} ms")
    print(f"    p95    : {sh['p95']:>8.3f} ms")
    print(f"    p99    : {sh['p99']:>8.3f} ms")
    print(f"    Max    : {sh['max']:>8.3f} ms")

print("=" * 60)
print(f"\nResults saved to: {out_path}")
