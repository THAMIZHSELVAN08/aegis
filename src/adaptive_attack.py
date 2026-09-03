"""
adaptive_attack.py -- Zeroth-order adaptive adversarial attack against AEGIS.

Goal: Evaluate how well the ensemble detector handles an attacker who knows
the detection threshold and actively crafts evasive perturbations.

Correct formulation (standard evasion attack):
  - Start from REAL already-malicious samples (label == 1 from full_dataset.csv)
  - Search for the minimal ADDITIONAL perturbation that flips the prediction
    from "attack" to "normal" (prob < 0.5)
  - Bound: total perturbation from original clean sample ||delta||_inf <= BOUND
    (we infer the clean baseline as x_attacked - mean_attack_shift, or more
    practically: we treat the attacked sample itself as x0 and ask "can we push
    it across the decision boundary without moving it more than BOUND further?")

Bug in prior version:
  - Started from NORMAL samples and injected a synthetic attack of 0.08-0.15
    that already consumed the entire BOUND=0.10 budget before search began,
    leaving zero room for the coordinate-descent optimiser to find evasion.
  - JSON key for standard recall was wrong:
    used 'classification_report.1.recall' but actual key is
    'classification_report.attack.recall'.

Method: Batched coordinate-descent (zeroth-order) search.
  - For each attacked sample, generate candidate perturbations for all
    features in parallel and select the step that most reduces attack
    probability, subject to the perturbation budget.
  - Decision boundary: attack probability (ensemble) < THRESHOLD.

Usage:
    python src/adaptive_attack.py

Outputs:
    Console: evasion rate and detection recall against adaptive attacker
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
N_SAMPLES  = 100    # Number of attack samples to attempt evasion on
MAX_ITER   = 50     # Max coordinate-descent iterations per sample
BOUND      = 0.10   # ||delta||_inf budget for post-attack perturbation
STEP_SIZE  = 0.015  # Step size per coordinate nudge
THRESHOLD  = 0.50   # Ensemble probability threshold for "attack" prediction
RANDOM_SEED = 42
np.random.seed(RANDOM_SEED)

# ---------------------------------------------------------------------------
# Load models and data
# ---------------------------------------------------------------------------
print("Loading models ...", flush=True)
xgb_model    = joblib.load(PROJECT_ROOT / "data" / "fdia_detector_model.pkl")
rf_model     = joblib.load(PROJECT_ROOT / "data" / "rf_model.pkl")
scaler       = joblib.load(PROJECT_ROOT / "data" / "scaler.pkl")
feature_cols = joblib.load(PROJECT_ROOT / "data" / "feature_columns.pkl")

print("Loading dataset ...", flush=True)
df = pd.read_csv(PROJECT_ROOT / "data" / "full_dataset.csv")

# ── Correct formulation: start from REAL attack samples ──────────────────────
# The evasion task is: "given a sample the model already flags as an attack,
# can the adversary nudge it across the decision boundary within budget BOUND?"
df_attack = df[df["label"] == 1][feature_cols].reset_index(drop=True)
print(f"  Attack samples available : {len(df_attack)}", flush=True)

if len(df_attack) < N_SAMPLES:
    raise ValueError(
        f"Only {len(df_attack)} attack samples in dataset; "
        f"reduce N_SAMPLES to <= {len(df_attack)}."
    )

idx = np.random.choice(len(df_attack), size=N_SAMPLES, replace=False)
attack_samples = df_attack.iloc[idx].values.astype(np.float64)

# Scale to model input space (the same scaler fitted on training data)
X_attack_scaled = scaler.transform(attack_samples)

# Quick sanity-check: verify the model actually detects these as attacks
_sanity_probs = (
    xgb_model.predict_proba(X_attack_scaled)[:, 1]
    + rf_model.predict_proba(X_attack_scaled)[:, 1]
) / 2.0
_initially_detected = int((_sanity_probs >= THRESHOLD).sum())
print(
    f"  Initially detected by ensemble: {_initially_detected}/{N_SAMPLES} "
    f"({_initially_detected / N_SAMPLES * 100:.1f}%)",
    flush=True,
)
if _initially_detected < N_SAMPLES * 0.8:
    print(
        "  WARNING: fewer than 80% of selected attack samples are detected "
        "before adversarial search. Results may understate robustness.",
        flush=True,
    )


# ---------------------------------------------------------------------------
# Ensemble probability helper
# ---------------------------------------------------------------------------

def ensemble_attack_prob(X_batch: np.ndarray) -> np.ndarray:
    """Return ensemble attack probabilities for a 2-D batch of scaled features."""
    xgb_p = xgb_model.predict_proba(X_batch)[:, 1]
    rf_p  = rf_model.predict_proba(X_batch)[:, 1]
    return (xgb_p + rf_p) / 2.0


# ---------------------------------------------------------------------------
# Per-sample adversarial search
# ---------------------------------------------------------------------------

def evasion_search(x0_scaled: np.ndarray) -> tuple:
    """
    Batched zeroth-order coordinate-descent evasion search.

    x0_scaled : the already-malicious sample in scaled space (starting point).
    The adversary may move at most BOUND in L-inf from x0_scaled.

    Returns (x_adv, final_prob, evaded).
    """
    n_feat = len(x0_scaled)
    x_adv  = x0_scaled.copy()                   # start at the attacked sample

    current_prob = ensemble_attack_prob(x_adv.reshape(1, -1))[0]

    for _ in range(MAX_ITER):
        if current_prob < THRESHOLD:
            break                                # evasion achieved

        # Generate all candidate steps: ±STEP_SIZE for every feature
        candidates   = []
        valid_indices = []

        for feat_idx in range(n_feat):
            for sign in [-1, 1]:
                cand = x_adv.copy()
                cand[feat_idx] += sign * STEP_SIZE
                # Constraint: total displacement from x0 must stay within BOUND
                if np.max(np.abs(cand - x0_scaled)) <= BOUND:
                    candidates.append(cand)
                    valid_indices.append((feat_idx, sign))

        if not candidates:
            break                                # budget exhausted

        candidates_arr = np.array(candidates)
        probs = ensemble_attack_prob(candidates_arr)

        best_idx = int(np.argmin(probs))
        if probs[best_idx] < current_prob:
            x_adv        = candidates_arr[best_idx]
            current_prob = probs[best_idx]
        else:
            break                                # local minimum — no improvement

    evaded = current_prob < THRESHOLD
    return x_adv, float(current_prob), evaded


# ---------------------------------------------------------------------------
# Run the attack
# ---------------------------------------------------------------------------
print(
    f"\nRunning evasion search on {N_SAMPLES} real attack samples ...",
    flush=True,
)
print(
    f"  Budget : ||delta||_inf <= {BOUND}  "
    f"|  Max iterations: {MAX_ITER}  "
    f"|  Step size: {STEP_SIZE}",
    flush=True,
)

evasion_count = 0
final_probs   = []

for i, x0 in enumerate(X_attack_scaled):
    x_adv, final_prob, evaded = evasion_search(x0)
    final_probs.append(final_prob)
    if evaded:
        evasion_count += 1

    if (i + 1) % 25 == 0:
        print(
            f"  [{i+1:3d}/{N_SAMPLES}]  evasions so far: {evasion_count}  "
            f"| last prob: {final_prob:.4f}",
            flush=True,
        )

# ---------------------------------------------------------------------------
# Metrics
# ---------------------------------------------------------------------------
detected_count   = N_SAMPLES - evasion_count
recall_adaptive  = detected_count / N_SAMPLES
evasion_rate_pct = evasion_count  / N_SAMPLES * 100

# ── Standard recall from model_metrics.json (correct key path) ───────────────
standard_recall = None
try:
    with open(PROJECT_ROOT / "data" / "model_metrics.json") as f:
        metrics = json.load(f)

    # Correct key: classification_report -> attack -> recall
    standard_recall = (
        metrics.get("classification_report", {})
               .get("attack", {})
               .get("recall")
    )
    # Fallback to alternate key names used in earlier versions
    if standard_recall is None:
        standard_recall = (
            metrics.get("ensemble", {}).get("recall_attack")
            or metrics.get("recall_attack")
        )
except Exception as e:
    print(f"  Warning: could not read model_metrics.json ({e})", flush=True)

detection_drop_pp = None
if standard_recall is not None:
    detection_drop_pp = (float(standard_recall) - recall_adaptive) * 100

# ---------------------------------------------------------------------------
# Report
# ---------------------------------------------------------------------------
print("\n" + "=" * 62, flush=True)
print("  AEGIS — ADAPTIVE ADVERSARIAL ATTACK RESULTS", flush=True)
print("=" * 62, flush=True)
print(f"  Samples evaluated        : {N_SAMPLES}", flush=True)
print(f"  Perturbation budget      : ||delta||_inf <= {BOUND}", flush=True)
print(f"  Max iterations / sample  : {MAX_ITER}", flush=True)
print(f"  Step size                : {STEP_SIZE}", flush=True)
print(flush=True)
print(f"  Detected (not evaded)    : {detected_count}/{N_SAMPLES}", flush=True)
print(f"  Recall vs adaptive       : {recall_adaptive:.4f}  ({recall_adaptive*100:.1f}%)", flush=True)
print(f"  Evasion rate             : {evasion_rate_pct:.1f}%", flush=True)
if standard_recall is not None:
    print(f"  Recall vs standard       : {float(standard_recall):.4f}  ({float(standard_recall)*100:.1f}%)", flush=True)
    if detection_drop_pp is not None:
        sign = "-" if detection_drop_pp > 0 else "+"
        print(f"  Detection drop           : {sign}{abs(detection_drop_pp):.1f} pp", flush=True)
print(f"\n  Mean final attack prob   : {float(np.mean(final_probs)):.4f}", flush=True)
print(f"  Min  final attack prob   : {float(np.min(final_probs)):.4f}", flush=True)
print("=" * 62, flush=True)

# ---------------------------------------------------------------------------
# Save results
# ---------------------------------------------------------------------------
results = {
    "config": {
        "n_samples": N_SAMPLES,
        "max_iterations": MAX_ITER,
        "perturbation_bound_inf": BOUND,
        "step_size": STEP_SIZE,
        "threshold": THRESHOLD,
        "method": "zeroth_order_coordinate_descent_batched",
        "formulation": (
            "Evasion attack: start from real attack samples (label==1), "
            "search for minimal additional perturbation within L-inf budget "
            "that reduces ensemble attack probability below threshold."
        ),
        "reference": "Chen et al., ZOO: Zeroth Order Optimization, 2017",
    },
    "results": {
        "n_initially_detected": _initially_detected,
        "detected_count": detected_count,
        "evasion_count": evasion_count,
        "recall_adaptive_attacker": round(recall_adaptive, 4),
        "recall_standard_attacker": round(float(standard_recall), 4) if standard_recall is not None else None,
        "detection_drop_pp": round(detection_drop_pp, 2) if detection_drop_pp is not None else None,
        "mean_final_attack_prob": round(float(np.mean(final_probs)), 4),
        "min_final_attack_prob": round(float(np.min(final_probs)), 4),
        "evasion_rate_pct": round(evasion_rate_pct, 2),
    },
    "interpretation": (
        "Recall against a white-box adaptive attacker who starts from real "
        "attack samples and applies coordinate-descent perturbation bounded "
        "by ||delta||_inf <= BOUND. A non-zero evasion rate indicates the "
        "genuine robustness headroom of the ensemble; future work should "
        "explore adversarial training or certified defences."
    ),
}

out_path = PROJECT_ROOT / "data" / "adaptive_attack_results.json"
with open(out_path, "w") as f:
    json.dump(results, f, indent=2)
print(f"\nResults saved to: {out_path}", flush=True)
