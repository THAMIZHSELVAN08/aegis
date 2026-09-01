import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    classification_report,
    roc_auc_score
)

import xgboost as xgb

# Load dataset
df = pd.read_csv("data/full_dataset.csv")

# Features and labels
X = df.drop(columns=["sample_id", "label"])
y = df["label"]

# Train/Test split
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

# Scale the data
scaler = StandardScaler()

X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

# -------------------------
# Random Forest
# -------------------------

print("=" * 60)
print("Training Random Forest...")
print("=" * 60)

rf = RandomForestClassifier(
    n_estimators=100,
    random_state=42
)

rf.fit(X_train_scaled, y_train)

rf_preds = rf.predict(X_test_scaled)

print("\nRandom Forest Results\n")

print(classification_report(
    y_test,
    rf_preds
))

print(
    "ROC-AUC:",
    roc_auc_score(
        y_test,
        rf.predict_proba(X_test_scaled)[:, 1]
    )
)

# -------------------------
# XGBoost
# -------------------------

print("\n" + "=" * 60)
print("Training XGBoost...")
print("=" * 60)

xgb_model = xgb.XGBClassifier(
    n_estimators=100,
    max_depth=5,
    learning_rate=0.1,
    eval_metric="logloss",
    random_state=42
)

xgb_model.fit(
    X_train_scaled,
    y_train
)

xgb_preds = xgb_model.predict(
    X_test_scaled
)

print("\nXGBoost Results\n")

print(classification_report(
    y_test,
    xgb_preds
))

print(
    "ROC-AUC:",
    roc_auc_score(
        y_test,
        xgb_model.predict_proba(
            X_test_scaled
        )[:, 1]
    )
)

import json
from datetime import datetime

# Save models
joblib.dump(
    xgb_model,
    "data/fdia_detector_model.pkl"
)

joblib.dump(
    rf,
    "data/rf_model.pkl"
)

joblib.dump(
    scaler,
    "data/scaler.pkl"
)

joblib.dump(
    list(X.columns),
    "data/feature_columns.pkl"
)

metadata = {
    "version": "1.2.0-ensemble",
    "trained_at": datetime.now().isoformat(),
    "total_samples": len(df),
    "train_samples": len(X_train),
    "test_samples": len(X_test),
    "num_features": len(X.columns),
    "features": list(X.columns),
    "models": ["XGBoost Classifier", "Random Forest Classifier", "Soft Voting Ensemble"],
    "xgb_params": {
        "n_estimators": 100,
        "max_depth": 5,
        "learning_rate": 0.1,
        "eval_metric": "logloss"
    },
    "rf_params": {
        "n_estimators": 100,
        "random_state": 42
    }
}

with open("data/model_metadata.json", "w") as f:
    json.dump(metadata, f, indent=2)

print("\n")
print("=" * 60)
print("Models & Metadata Saved Successfully!")
print("=" * 60)