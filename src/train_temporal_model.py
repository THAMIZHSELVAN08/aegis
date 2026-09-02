"""
train_temporal_model.py — LSTM/GRU temporal anomaly detection for AEGIS.

Builds a small Keras GRU model over sliding windows of W=10 consecutive
readings to detect attacks that are individually plausible but anomalous
over time.

Key design decisions:
  - Train/test split is TEMPORAL (first 80% / last 20% by original row order),
    not random — shuffling temporal data across the split boundary would leak
    future information into training.
  - Window label = label of the LAST row in the window (the row being classified).
  - Padding: windows at the start of the dataset are padded by repeating the
    first row.
  - Model is intentionally small (GRU(64) + Dense(1)) — this demonstrates
    the approach; it is not a production-scale model.

Usage:
    pip install tensorflow
    python src/train_temporal_model.py

Outputs:
    data/temporal_model.keras          — trained Keras model
    data/temporal_comparison.json      — accuracy/F1 vs ensemble baseline
"""

import sys
import json
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.metrics import accuracy_score, f1_score, classification_report

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

# ---------------------------------------------------------------------------
# TensorFlow import
# ---------------------------------------------------------------------------
try:
    import tensorflow as tf
    from tensorflow import keras
    print(f"TensorFlow version: {tf.__version__}")
except ImportError:
    print("ERROR: TensorFlow is not installed.")
    print("Install it with:  pip install tensorflow")
    sys.exit(1)

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
WINDOW_SIZE = 10          # Number of consecutive readings per sequence
BATCH_SIZE = 64
EPOCHS = 20
RANDOM_SEED = 42
tf.random.set_seed(RANDOM_SEED)
np.random.seed(RANDOM_SEED)

# ---------------------------------------------------------------------------
# Load dataset (in original generation order — do NOT shuffle here)
# ---------------------------------------------------------------------------
print("Loading dataset …")
df = pd.read_csv(PROJECT_ROOT / "data" / "full_dataset.csv")

# Drop non-feature columns
feature_cols = [c for c in df.columns if c not in ("sample_id", "label")]
X_all = df[feature_cols].values.astype(np.float32)
y_all = df["label"].values.astype(np.int32)

n_samples, n_features = X_all.shape
print(f"  Total samples : {n_samples}")
print(f"  Features      : {n_features}")
print(f"  Attack ratio  : {y_all.mean():.3f}")

# ---------------------------------------------------------------------------
# Build sliding-window sequences
# ---------------------------------------------------------------------------
print(f"Building sliding windows (W={WINDOW_SIZE}) …")

sequences = []
labels = []

for i in range(n_samples):
    if i < WINDOW_SIZE:
        # Pad by repeating the first row
        pad = np.repeat(X_all[[0]], WINDOW_SIZE - i, axis=0)
        window = np.vstack([pad, X_all[:i + 1]])
    else:
        window = X_all[i - WINDOW_SIZE + 1: i + 1]
    sequences.append(window)
    labels.append(y_all[i])

X_seq = np.array(sequences, dtype=np.float32)  # (n_samples, W, n_features)
y_seq = np.array(labels, dtype=np.int32)

print(f"  Sequence tensor shape: {X_seq.shape}")

# ---------------------------------------------------------------------------
# Temporal train/test split (first 80% train, last 20% test — by row order)
# ---------------------------------------------------------------------------
split_idx = int(n_samples * 0.8)
X_train, X_test = X_seq[:split_idx], X_seq[split_idx:]
y_train, y_test = y_seq[:split_idx], y_seq[split_idx:]

print(f"  Train: {len(X_train)} sequences  |  Test: {len(X_test)} sequences")

# ---------------------------------------------------------------------------
# Normalise features (fit on train only — avoid test leakage)
# ---------------------------------------------------------------------------
# Compute per-feature mean and std across time steps
flat_train = X_train.reshape(-1, n_features)
mean = flat_train.mean(axis=0)
std  = flat_train.std(axis=0) + 1e-8

X_train = (X_train - mean) / std
X_test  = (X_test  - mean) / std

# ---------------------------------------------------------------------------
# Build the model
# ---------------------------------------------------------------------------
model = keras.Sequential([
    keras.layers.Input(shape=(WINDOW_SIZE, n_features)),
    keras.layers.GRU(64, return_sequences=False),
    keras.layers.Dropout(0.2),
    keras.layers.Dense(32, activation="relu"),
    keras.layers.Dense(1, activation="sigmoid"),
], name="aegis_temporal_gru")

model.compile(
    optimizer=keras.optimizers.Adam(learning_rate=1e-3),
    loss="binary_crossentropy",
    metrics=["accuracy"],
)
model.summary()

# ---------------------------------------------------------------------------
# Class weights (handle imbalance without oversampling)
# ---------------------------------------------------------------------------
n_neg = (y_train == 0).sum()
n_pos = (y_train == 1).sum()
class_weight = {0: 1.0, 1: n_neg / max(n_pos, 1)}
print(f"\nClass weights → normal: 1.0, attack: {class_weight[1]:.2f}")

# ---------------------------------------------------------------------------
# Train
# ---------------------------------------------------------------------------
early_stop = keras.callbacks.EarlyStopping(
    monitor="val_loss", patience=4, restore_best_weights=True
)

print("\nTraining …")
history = model.fit(
    X_train, y_train,
    validation_split=0.1,
    epochs=EPOCHS,
    batch_size=BATCH_SIZE,
    class_weight=class_weight,
    callbacks=[early_stop],
    verbose=1,
)

# ---------------------------------------------------------------------------
# Evaluate
# ---------------------------------------------------------------------------
print("\nEvaluating …")
y_prob = model.predict(X_test, batch_size=BATCH_SIZE).flatten()
y_pred = (y_prob >= 0.5).astype(int)

acc    = accuracy_score(y_test, y_pred)
f1     = f1_score(y_test, y_pred, zero_division=0)
recall = float(np.sum((y_pred == 1) & (y_test == 1)) / max(np.sum(y_test == 1), 1))
prec   = float(np.sum((y_pred == 1) & (y_test == 1)) / max(np.sum(y_pred == 1), 1))

print("\n" + "=" * 60)
print("TEMPORAL GRU MODEL RESULTS")
print("=" * 60)
print(classification_report(y_test, y_pred, target_names=["Normal", "Attack"]))

# Compare with ensemble baseline from model_metrics.json
ensemble_metrics = {}
try:
    with open(PROJECT_ROOT / "data" / "model_metrics.json") as f:
        ensemble_metrics = json.load(f)
except Exception:
    pass

comparison = {
    "temporal_gru": {
        "window_size": WINDOW_SIZE,
        "accuracy": round(acc, 4),
        "f1_attack": round(f1, 4),
        "precision_attack": round(prec, 4),
        "recall_attack": round(recall, 4),
        "notes": (
            "Temporal split: first 80% of dataset rows for train, "
            "last 20% for test. No random shuffling across boundary."
        ),
    },
    "ml_ensemble_baseline": ensemble_metrics,
}

out_path = PROJECT_ROOT / "data" / "temporal_comparison.json"
with open(out_path, "w") as f:
    json.dump(comparison, f, indent=2)
print(f"\nComparison saved to: {out_path}")

# ---------------------------------------------------------------------------
# Save model
# ---------------------------------------------------------------------------
model_path = PROJECT_ROOT / "data" / "temporal_model.keras"
model.save(model_path)
print(f"Model saved to: {model_path}")

print("\n" + "=" * 60)
print("INTERPRETATION GUIDE")
print("=" * 60)
print(f"  GRU Accuracy        : {acc:.4f}")
print(f"  GRU F1 (attack)     : {f1:.4f}")
print(f"  GRU Recall (attack) : {recall:.4f}")
print()
print("  Compare these numbers to the ensemble baseline in:")
print("  data/temporal_comparison.json")
print()
print("  If GRU recall is noticeably higher than ensemble recall:")
print("    → The dataset contains attacks with temporal structure the")
print("      per-reading ensemble misses.")
print()
print("  If performance is similar:")
print("    → The current synthetic attack model lacks strong temporal")
print("      signatures; the ensemble's per-reading approach is sufficient.")
print("      (This is an honest and reportable finding.)")
