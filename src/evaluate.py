import pandas as pd
import numpy as np
import joblib
import json

from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    confusion_matrix,
    ConfusionMatrixDisplay,
    classification_report,
    roc_curve,
    auc
)

import matplotlib.pyplot as plt

df = pd.read_csv("data/full_dataset.csv")

X = df.drop(columns=["sample_id", "label"])
y = df["label"]

xgb_model = joblib.load("data/fdia_detector_model.pkl")
rf_model = joblib.load("data/rf_model.pkl")
scaler = joblib.load("data/scaler.pkl")

_, X_test, _, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

X_test_scaled = scaler.transform(X_test)

# Model predictions
xgb_probs = xgb_model.predict_proba(X_test_scaled)[:, 1]
rf_probs = rf_model.predict_proba(X_test_scaled)[:, 1]

# Soft voting ensemble
ensemble_probs = (xgb_probs + rf_probs) / 2.0
ensemble_preds = (ensemble_probs >= 0.5).astype(int)

# Confusion Matrix for Ensemble
cm = confusion_matrix(y_test, ensemble_preds)
tn, fp, fn, tp = [int(val) for val in cm.ravel()]

# Plot and save CM image
disp = ConfusionMatrixDisplay(
    confusion_matrix=cm,
    display_labels=["Normal", "Attack"]
)
disp.plot(cmap="Blues")
plt.title("Ensemble Confusion Matrix")
plt.savefig("data/confusion_matrix.png", dpi=300)
plt.close()

# ROC Curve calculation
fpr, tpr, thresholds = roc_curve(y_test, ensemble_probs)
roc_auc = float(auc(fpr, tpr))

plt.figure(figsize=(6, 5))
plt.plot(fpr, tpr, label=f"Ensemble AUC = {roc_auc:.4f}")
plt.plot([0, 1], [0, 1], "--", color="gray")
plt.xlabel("False Positive Rate")
plt.ylabel("True Positive Rate")
plt.title("Ensemble ROC Curve")
plt.legend()
plt.savefig("data/roc_curve.png", dpi=300)
plt.close()

# Subsample ROC points for clean frontend rendering
step = max(1, len(fpr) // 30)
roc_points = [
    {"fpr": round(float(fpr[i]), 4), "tpr": round(float(tpr[i]), 4)}
    for i in range(0, len(fpr), step)
]
if roc_points[-1]["fpr"] != 1.0 or roc_points[-1]["tpr"] != 1.0:
    roc_points.append({"fpr": 1.0, "tpr": 1.0})

# Metrics calculation
report = classification_report(y_test, ensemble_preds, output_dict=True)

metrics_payload = {
    "overall": {
        "accuracy": round(float(report["accuracy"]), 4),
        "roc_auc": round(roc_auc, 4),
        "total_test_samples": int(len(y_test)),
    },
    "confusion_matrix": {
        "tn": tn,
        "fp": fp,
        "fn": fn,
        "tp": tp,
        "matrix": [[tn, fp], [fn, tp]],
        "labels": ["Normal", "Attack"]
    },
    "classification_report": {
        "normal": {
            "precision": round(float(report["0"]["precision"]), 4),
            "recall": round(float(report["0"]["recall"]), 4),
            "f1_score": round(float(report["0"]["f1-score"]), 4),
            "support": int(report["0"]["support"])
        },
        "attack": {
            "precision": round(float(report["1"]["precision"]), 4),
            "recall": round(float(report["1"]["recall"]), 4),
            "f1_score": round(float(report["1"]["f1-score"]), 4),
            "support": int(report["1"]["support"])
        },
        "macro_avg": {
            "precision": round(float(report["macro avg"]["precision"]), 4),
            "recall": round(float(report["macro avg"]["recall"]), 4),
            "f1_score": round(float(report["macro avg"]["f1-score"]), 4)
        }
    },
    "submodels": {
        "xgb_auc": round(float(auc(*roc_curve(y_test, xgb_probs)[:2])), 4),
        "rf_auc": round(float(auc(*roc_curve(y_test, rf_probs)[:2])), 4),
        "ensemble_auc": round(roc_auc, 4)
    },
    "roc_curve": roc_points
}

with open("data/model_metrics.json", "w") as f:
    json.dump(metrics_payload, f, indent=2)

print("Evaluation complete! Metrics saved to data/model_metrics.json and graphs saved to data/")