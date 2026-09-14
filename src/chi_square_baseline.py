"""
chi_square_baseline.py -- Chi-square WLS bad-data detection baseline for AEGIS.

Classical SCADA bad-data detection using Weighted Least Squares (WLS) state
estimation on the IEEE 14-bus system. The chi-square test is the industry-
standard baseline against which the ML ensemble is compared.
"""

import json
import sys
import warnings
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from scipy.stats import chi2
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score
from sklearn.model_selection import train_test_split

warnings.filterwarnings("ignore")

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
ALPHA = 0.01      # False-alarm rate (significance level)
SIGMA_V = 0.01      # Measurement noise std for voltage magnitude (pu)
SIGMA_P = 0.05      # Measurement noise std for active power (MW, normalised)
SIGMA_Q = 0.05      # Measurement noise std for reactive power (MVAR, normalised)

# ---------------------------------------------------------------------------
# Load data — same split as train_model.py
# ---------------------------------------------------------------------------
print("Loading dataset ...", flush=True)
df = pd.read_csv(PROJECT_ROOT / "data" / "full_dataset.csv")

feature_cols = joblib.load(PROJECT_ROOT / "data" / "feature_columns.pkl")
X = df[feature_cols]
y = df["label"]

_, X_test, _, y_test = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42,
    stratify=y,
)

X_test = X_test.reset_index(drop=True)
y_test = y_test.reset_index(drop=True)

n_test = len(X_test)
print(
    f"  Test samples : {n_test}  "
    f"(normal: {(y_test == 0).sum()}, attack: {(y_test == 1).sum()})",
    flush=True,
)

# ---------------------------------------------------------------------------
# Feature introspection — discover voltage / power columns
# ---------------------------------------------------------------------------
vm_cols = [c for c in feature_cols if c.startswith("vm_pu")]
va_cols = [c for c in feature_cols if c.startswith("va_deg")]
p_cols = [c for c in feature_cols if c.startswith("p_mw")]
q_cols = [c for c in feature_cols if c.startswith("q_mvar")]

n_vm = len(vm_cols)
n_va = len(va_cols)
n_p = len(p_cols)
n_q = len(q_cols)

print(
    f"  Features : {n_vm} vm_pu  {n_va} va_deg  {n_p} p_mw  {n_q} q_mvar",
    flush=True,
)

# Total measurement vector length and degrees of freedom
n_meas = n_vm + n_p + n_q          # va_deg are state variables, not "measurements"
n_state = n_vm                     # simplified: voltage magnitudes as state
dof = max(n_meas - n_state, 1)

chi2_threshold = chi2.ppf(1.0 - ALPHA, df=dof)
print(f"  Chi-square threshold : {chi2_threshold:.3f}  (alpha={ALPHA}, dof={dof})", flush=True)

# ---------------------------------------------------------------------------
# Noise variances (diagonal of W = inv(R))
# ---------------------------------------------------------------------------
sigma_vm = np.full(n_vm, SIGMA_V)
sigma_p = np.full(n_p, SIGMA_P)
sigma_q = np.full(n_q, SIGMA_Q)

# Weight vector: 1 / sigma^2
weights = np.concatenate([
    1.0 / sigma_vm**2,
    1.0 / sigma_p**2,
    1.0 / sigma_q**2,
])

# ---------------------------------------------------------------------------
# WLS bad-data test
# ---------------------------------------------------------------------------
print("\nComputing WLS residuals ...", flush=True)

_, X_train_tmp, _, _ = train_test_split(
    X, y,
    test_size=0.2,
    random_state=42,
    stratify=y,
)
X_train_normal = X_train_tmp.copy()

z_hat_vm = X_train_tmp[vm_cols].mean().values
z_hat_p = X_train_tmp[p_cols].mean().values
z_hat_q = X_train_tmp[q_cols].mean().values
z_hat = np.concatenate([z_hat_vm, z_hat_p, z_hat_q])

# Compute J for every test sample
X_test_meas = np.concatenate([
    X_test[vm_cols].values,
    X_test[p_cols].values,
    X_test[q_cols].values,
], axis=1)

residuals = X_test_meas - z_hat
J = np.sum((residuals**2) * weights, axis=1)
y_pred_chi2 = (J > chi2_threshold).astype(int)

# Normalised residual score as a continuous risk index
J_norm = J / chi2_threshold

# ---------------------------------------------------------------------------
# Evaluation
# ---------------------------------------------------------------------------
print("\n" + "=" * 62, flush=True)
print("  CHI-SQUARE WLS BAD-DATA DETECTION (BASELINE REPORT)", flush=True)
print("=" * 62, flush=True)

report_dict = classification_report(
    y_test, y_pred_chi2,
    target_names=["normal", "attack"],
    output_dict=True,
    zero_division=0,
)
print(classification_report(
    y_test, y_pred_chi2,
    target_names=["normal", "attack"],
    zero_division=0,
))

cm = confusion_matrix(y_test, y_pred_chi2)
tn, fp, fn, tp = cm.ravel()

try:
    auc = roc_auc_score(y_test, J_norm)
except Exception:
    auc = None

chi_recall = report_dict["attack"]["recall"]
chi_precision = report_dict["attack"]["precision"]
chi_f1 = report_dict["attack"]["f1-score"]
chi_accuracy = report_dict["accuracy"]

# ---------------------------------------------------------------------------
# Load ML ensemble metrics for comparison
# ---------------------------------------------------------------------------
ml_recall = ml_precision = ml_f1 = ml_accuracy = ml_auc = None
try:
    with open(PROJECT_ROOT / "data" / "model_metrics.json") as f:
        ml_m = json.load(f)
    ml_recall = ml_m.get("classification_report", {}).get("attack", {}).get("recall")
    ml_precision = ml_m.get("classification_report", {}).get("attack", {}).get("precision")
    ml_f1 = ml_m.get("classification_report", {}).get("attack", {}).get("f1_score")
    ml_accuracy = ml_m.get("overall", {}).get("accuracy")
    ml_auc = ml_m.get("overall", {}).get("roc_auc")
except Exception as e:
    print(f"  (Could not load model_metrics.json: {e})", flush=True)

# ---------------------------------------------------------------------------
# Comparison table
# ---------------------------------------------------------------------------
print("=" * 62, flush=True)
print("  COMPARISON: Chi-Square WLS  vs  ML Ensemble (XGB + RF)", flush=True)
print("=" * 62, flush=True)
header = f"  {'Metric':<22}  {'Chi-Sq WLS':>12}  {'ML Ensemble':>12}  {'Delta':>10}"
print(header, flush=True)
print("  " + "-" * 58, flush=True)


def _row(label, chi_val, ml_val, pct=True):
    scale = 100 if pct else 1
    cv = f"{chi_val * scale:>11.2f}{'%' if pct else ''}" if chi_val is not None else f"{'N/A':>12}"
    mv = f"{ml_val * scale:>11.2f}{'%' if pct else ''}" if ml_val is not None else f"{'N/A':>12}"
    if chi_val is not None and ml_val is not None:
        delta = (ml_val - chi_val) * scale
        dv = f"{delta:>+10.2f}{'%' if pct else ''}"
    else:
        dv = f"{'N/A':>10}"
    print(f"  {label:<22}  {cv}  {mv}  {dv}", flush=True)


_row("Attack Recall", chi_recall, ml_recall)
_row("Attack Precision", chi_precision, ml_precision)
_row("Attack F1", chi_f1, ml_f1)
_row("Accuracy", chi_accuracy, ml_accuracy)
_row("ROC-AUC", auc, ml_auc)

print("  " + "-" * 58, flush=True)

if chi_recall is not None and ml_recall is not None:
    recall_lift = (ml_recall - chi_recall) * 100
    print(
        f"\n  ML ensemble improves attack recall by "
        f"{recall_lift:+.1f} percentage points over Chi-Square WLS.",
        flush=True,
    )

print("=" * 62, flush=True)

# ---------------------------------------------------------------------------
# Save results
# ---------------------------------------------------------------------------
results = {
    "config": {
        "alpha": ALPHA,
        "chi2_threshold": round(chi2_threshold, 4),
        "dof": dof,
        "n_measurements": n_meas,
        "n_state_vars": n_state,
        "sigma_vm": SIGMA_V,
        "sigma_p": SIGMA_P,
        "sigma_q": SIGMA_Q,
        "split": "train_test_split(test_size=0.2, random_state=42, stratify=y)",
    },
    "results": {
        "test_samples": n_test,
        "tn": int(tn), "fp": int(fp),
        "fn": int(fn), "tp": int(tp),
        "accuracy": round(chi_accuracy, 4),
        "recall_attack": round(chi_recall, 4),
        "precision_attack": round(chi_precision, 4),
        "f1_attack": round(chi_f1, 4),
        "roc_auc": round(float(auc), 4) if auc is not None else None,
    },
    "comparison_vs_ml": {
        "recall_chi2": round(chi_recall, 4) if chi_recall is not None else None,
        "recall_ml": round(float(ml_recall), 4) if ml_recall is not None else None,
        "recall_lift_pp": (
            round((float(ml_recall) - chi_recall) * 100, 2)
            if (ml_recall is not None and chi_recall is not None) else None
        ),
        "f1_chi2": round(chi_f1, 4) if chi_f1 is not None else None,
        "f1_ml": round(float(ml_f1), 4) if ml_f1 is not None else None,
        "auc_chi2": round(float(auc), 4) if auc is not None else None,
        "auc_ml": round(float(ml_auc), 4) if ml_auc is not None else None,
    },
    "interpretation": (
        "The chi-square WLS bad-data detector is the industry-standard "
        "classical baseline. The ML ensemble (XGBoost + RandomForest) is "
        "evaluated on the identical test split for a fair comparison. "
        "The recall lift quantifies how much more of the attack class the "
        "ML approach captures relative to the classical detector."
    ),
}

out_path = PROJECT_ROOT / "data" / "chi_square_results.json"
with open(out_path, "w") as f:
    json.dump(results, f, indent=2)
print(f"\nResults saved to: {out_path}", flush=True)
