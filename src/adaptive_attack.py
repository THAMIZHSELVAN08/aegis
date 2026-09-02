"""
adaptive_attack.py -- Zeroth-order adaptive adversarial attack against AEGIS.

Goal: evaluate how well the ensemble detector handles an attacker who knows
the detection threshold and actively crafts evasive perturbations.

Method: Coordinate-descent (zeroth-order) search with batched candidate evaluation.
  - For each sample, generate candidate perturbations for all features in parallel
    and pick the step that minimizes ensemble attack probability.
  - Bound: ||delta||_inf <= BOUND.

Usage:
    python src/adaptive_attack.py

Outputs:
    Console: recall against adaptive attacker
    data/adaptive_attack_results.json
"""

import sys
import json
import numpy as np
import pandas as pd
import joblib
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
N_SAMPLES = 100          # Number of adaptive attack samples to generate
MAX_ITER  = 30           # Max coordinate-descent iterations per sample
BOUND     = 0.10         # ||delta||_inf bound
STEP_SIZE = 0.015        # Step size per coordinate nudge
RANDOM_SEED = 42
np.random.seed(RANDOM_SEED)

# ---------------------------------------------------------------------------
# Load models and data
# ---------------------------------------------------------------------------
print("Loading models ...", flush=True)
xgb_model = joblib.load(PROJECT_ROOT / "data" / "fdia_detector_model.pkl")
rf_model   = joblib.load(PROJECT_ROOT / "data" / "rf_model.pkl")
scaler     = joblib.load(PROJECT_ROOT / "data" / "scaler.pkl")
feature_cols = joblib.load(PROJECT_ROOT / "data" / "feature_columns.pkl")

print("Loading dataset ...", flush=True)
df = pd.read_csv(PROJECT_ROOT / "data" / "full_dataset.csv")
df_normal = df[df["label"] == 0][feature_cols].reset_index(drop=True)
print(f"  Normal samples available: {len(df_normal)}", flush=True)

# Sample normal starting points
idx = np.random.choice(len(df_normal), size=N_SAMPLES, replace=False)
normal_samples = df_normal.iloc[idx].values.astype(np.float64)

# Scale to model input space
X_normal_scaled = scaler.transform(normal_samples)


def batch_ensemble_attack_prob(X_batch):
    """Return ensemble attack probabilities for a batch of feature vectors."""
    xgb_p = xgb_model.predict_proba(X_batch)[:, 1]
    rf_p  = rf_model.predict_proba(X_batch)[:, 1]
    return (xgb_p + rf_p) / 2.0


def generate_adaptive_sample(x_scaled):
    """
    Batched zeroth-order search: evaluates all possible coordinate step candidates
    simultaneously for fast vectorised execution.
    """
    n_feat = len(x_scaled)
    x_adv = x_scaled.copy()

    # Initial attack injection (voltage manipulation proxy)
    vm_indices = [i for i, c in enumerate(feature_cols) if c.startswith("vm_pu")]
    for idx_feat in vm_indices:
        x_adv[idx_feat] += np.random.choice([-1, 1]) * np.random.uniform(0.08, 0.15)

    # Clip initial attack to bound
    delta_init = x_adv - x_scaled
    delta_init = np.clip(delta_init, -BOUND, BOUND)
    x_adv = x_scaled + delta_init

    current_prob = batch_ensemble_attack_prob(x_adv.reshape(1, -1))[0]

    for _ in range(MAX_ITER):
        if current_prob < 0.5:
            break  # Evasion achieved

        # Generate candidates: +STEP_SIZE and -STEP_SIZE for all features
        candidates = []
        valid_indices = []

        for feat_idx in range(n_feat):
            for sign in [-1, 1]:
                cand = x_adv.copy()
                cand[feat_idx] += sign * STEP_SIZE
                if np.max(np.abs(cand - x_scaled)) <= BOUND:
                    candidates.append(cand)
                    valid_indices.append((feat_idx, sign))

        if not candidates:
            break

        candidates_arr = np.array(candidates)
        probs = batch_ensemble_attack_prob(candidates_arr)

        best_idx = np.argmin(probs)
        if probs[best_idx] < current_prob:
            x_adv = candidates_arr[best_idx]
            current_prob = probs[best_idx]
        else:
            break  # Local minimum reached

    evaded = current_prob < 0.5
    return x_adv, current_prob, evaded


# ---------------------------------------------------------------------------
# Run generation
# ---------------------------------------------------------------------------
print(f"\nGenerating {N_SAMPLES} adaptive attack samples (batched candidate search)...", flush=True)
print(f"  Bound: ||delta||_inf <= {BOUND}  |  Max iterations: {MAX_ITER}", flush=True)

evasion_count = 0
final_probs = []

for i, x_clean in enumerate(X_normal_scaled):
    x_adv, final_prob, evaded = generate_adaptive_sample(x_clean)
    final_probs.append(final_prob)
    if evaded:
        evasion_count += 1

    if (i + 1) % 25 == 0:
        print(f"  [{i+1}/{N_SAMPLES}] evasions so far: {evasion_count}", flush=True)

# ---------------------------------------------------------------------------
# Compute detection metrics
# ---------------------------------------------------------------------------
detected_count = N_SAMPLES - evasion_count
recall_adaptive = detected_count / N_SAMPLES

standard_recall = None
try:
    with open(PROJECT_ROOT / "data" / "model_metrics.json") as f:
        metrics = json.load(f)
    standard_recall = (
        metrics.get("ensemble", {}).get("recall_attack")
        or metrics.get("recall_attack")
        or metrics.get("classification_report", {}).get("1", {}).get("recall")
    )
except Exception:
    pass

print("\n" + "=" * 60, flush=True)
print("ADAPTIVE ATTACK RESULTS", flush=True)
print("=" * 60, flush=True)
print(f"  Samples generated        : {N_SAMPLES}", flush=True)
print(f"  Max iterations per sample: {MAX_ITER}", flush=True)
print(f"  Perturbation bound       : ||delta||_inf <= {BOUND}", flush=True)
print(flush=True)
print(f"  Ensemble detects         : {detected_count}/{N_SAMPLES} adaptive attacks", flush=True)
print(f"  Recall vs adaptive       : {recall_adaptive:.4f}  ({recall_adaptive*100:.1f}%)", flush=True)
if standard_recall is not None:
    drop = float(standard_recall) - recall_adaptive
    print(f"  Recall vs standard (ref) : {float(standard_recall):.4f}  ({float(standard_recall)*100:.1f}%)", flush=True)
    print(f"  Detection drop           : {drop*100:.1f} percentage points", flush=True)
print(f"\n  Mean final attack prob   : {np.mean(final_probs):.4f}", flush=True)
print(f"  % samples with prob < 0.5 (evaded): {evasion_count/N_SAMPLES*100:.1f}%", flush=True)
print("=" * 60, flush=True)

results = {
    "config": {
        "n_samples": N_SAMPLES,
        "max_iterations": MAX_ITER,
        "perturbation_bound_inf": BOUND,
        "step_size": STEP_SIZE,
        "method": "zeroth_order_coordinate_descent_batched",
        "reference": "Chen et al., ZOO: Zeroth Order Optimization, 2017",
    },
    "results": {
        "detected_count": detected_count,
        "evasion_count": evasion_count,
        "recall_adaptive_attacker": round(recall_adaptive, 4),
        "recall_standard_attacker": round(float(standard_recall), 4) if standard_recall else None,
        "detection_drop_pp": round((float(standard_recall) - recall_adaptive) * 100, 2) if standard_recall else None,
        "mean_final_attack_prob": round(float(np.mean(final_probs)), 4),
        "evasion_rate_pct": round(evasion_count / N_SAMPLES * 100, 2),
    },
    "interpretation": (
        "Recall against an adaptive (white-box) attacker who knows the "
        "detection threshold and applies coordinate-descent perturbation "
        "bounded by ||delta||_inf <= BOUND. A drop in recall indicates "
        "robustness headroom; future work should explore adversarial training "
        "or gradient-free certified defences."
    ),
}

out_path = PROJECT_ROOT / "data" / "adaptive_attack_results.json"
with open(out_path, "w") as f:
    json.dump(results, f, indent=2)
print(f"\nResults saved to: {out_path}", flush=True)
