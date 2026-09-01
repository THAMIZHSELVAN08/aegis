# ⚡ AEGIS — FDIA Smart Grid Protection System

AEGIS is an advanced False Data Injection Attack (FDIA) Detection and Smart Grid Resilience System built for power system SCADA networks (IEEE 14-bus test feeder).

## 🚀 Features

- **Real-Time Telemetry Stream**: Live bus voltage vectors ($V_{m}$ in pu, $V_{a}$ in degrees), active power ($P$ in MW), and reactive power ($Q$ in MVAR).
- **ML Anomaly Detection**: Ensemble model combining **XGBoost** and **Random Forest** for detection of FDIA threats.
- **Explainable AI (XAI)**: SHAP tree explainer integration identifying key anomalous feature drivers.
- **SCADA Interactive Topology**: Real-time interactive node-link visualization of IEEE 14-bus grid status.
- **Contingency & Resilience Analysis**: Power flow $N-1$ contingency calculations using `pandapower`.

## 🛠️ Project Structure

```
fdia-smart-grid-project/
├── data/               # ML models, feature scalers, and evaluation metrics
├── src/                # Python backend (Flask API, grid simulation, attack injection)
├── dashboard/          # React modern SOC dashboard frontend
├── requirements.txt    # Python dependencies
└── README.md
```

## 🏁 Quick Start

### 1. Python Backend Server
```bash
# Install dependencies
pip install -r requirements.txt

# Start Flask API server
python src/api_server.py
```
*Server runs at `http://localhost:5000`*

### 2. Dashboard Frontend
```bash
cd dashboard

# Install dependencies
npm install

# Start React Dev Server
npm start
```
*Dashboard opens at `http://localhost:3000`*
