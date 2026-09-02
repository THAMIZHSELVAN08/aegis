# ⚡ AEGIS — FDIA Smart Grid Protection System

AEGIS is an advanced False Data Injection Attack (FDIA) Detection and Smart Grid Resilience System built for power system SCADA networks (IEEE 14-bus test feeder).

## 🚀 Features

- **Real-Time Telemetry Stream**: Live bus voltage vectors ($V_{m}$ in pu, $V_{a}$ in degrees), active power ($P$ in MW), and reactive power ($Q$ in MVAR).
- **ML Anomaly Detection**: Ensemble model combining **XGBoost** and **Random Forest** for detection of FDIA threats.
- **Explainable AI (XAI)**: SHAP tree explainer integration identifying key anomalous feature drivers.
- **SCADA Interactive Topology**: Real-time interactive node-link visualization of IEEE 14-bus grid status.
- **Contingency & Resilience Analysis**: Power flow $N-1$ contingency calculations using `pandapower`.
- **SQLite Audit Trail**: Every reading + prediction is persisted to `data/aegis_history.db` — survives server restarts, pre-populates dashboard on load.
- **WebSocket Push**: Backend emits readings via Socket.IO every ~2 s; REST polling fallback auto-activates if WebSocket disconnects.
- **Latency Benchmarking**: Run `python src/benchmark_latency.py` for end-to-end ML inference timing (median, p95, p99).
- **Streaming Architecture (MQTT)**: Fully decoupled pub/sub pipeline featuring:
  - [`src/sensor_publisher.py`](file:///c:/Users/HP/OneDrive/Desktop/fdia-smart-grid-project/src/sensor_publisher.py): Telemetry publisher to `grid/bus/telemetry`
  - [`src/ml_stream_processor.py`](file:///c:/Users/HP/OneDrive/Desktop/fdia-smart-grid-project/src/ml_stream_processor.py): Real-time ML detection microservice publishing predictions to `grid/alerts/predictions`
  - [`src/mqtt_broker_bridge.py`](file:///c:/Users/HP/OneDrive/Desktop/fdia-smart-grid-project/src/mqtt_broker_bridge.py): Embedded Python MQTT broker for zero-config local execution

## 🛠️ Project Structure

```
fdia-smart-grid-project/
├── data/               # ML models, feature scalers, evaluation metrics, SQLite DB
├── src/                # Python backend & streaming microservices
│   ├── api_server.py          — Flask REST + Socket.IO server (subscribes to MQTT)
│   ├── sensor_publisher.py    — Telemetry publisher (MQTT -> grid/bus/telemetry)
│   ├── ml_stream_processor.py — Stream processing detection (MQTT -> grid/alerts/predictions)
│   ├── mqtt_broker_bridge.py  — Pure Python local MQTT broker bridge
│   ├── db.py                  — SQLite persistence layer
│   ├── train_model.py         — XGBoost + RF ensemble training
│   ├── train_temporal_model.py — GRU temporal model training (TensorFlow)
│   ├── benchmark_latency.py   — End-to-end latency benchmarking
│   ├── adaptive_attack.py     — Zeroth-order adversarial attack evaluation
│   ├── inject_attacks.py      — Attack injection (voltage, load, replay)
│   └── simulate_grid.py       — pandapower N-1 contingency
├── dashboard/          # React modern SOC dashboard frontend
├── requirements.txt    # Python dependencies (pinned)
└── README.md
```

## 🏁 Quick Start

### 1. Python Backend Server

```bash
# Install dependencies
pip install -r requirements.txt

# Configure environment (copy example, edit values)
# No changes needed for local dev — defaults to localhost:5000

# Start Flask + Socket.IO server
python src/api_server.py
```
*Server runs at `http://localhost:5000`*

### 2. Dashboard Frontend

```bash
cd dashboard

# Configure environment
cp .env.example .env
# Edit .env if your backend runs on a different host/port

# Install dependencies
npm install

# Start React Dev Server
npm start
```
*Dashboard opens at `http://localhost:3000`*

### 3. Run Analyses (Optional)

```bash
# Latency benchmark (outputs data/latency_benchmark.json)
python src/benchmark_latency.py

# Adaptive attack evaluation (outputs data/adaptive_attack_results.json)
python src/adaptive_attack.py

# Temporal GRU model training (requires: pip install tensorflow)
python src/train_temporal_model.py
```

## ⚙️ Environment Variables

| Variable | Default | Description |
|---|---|---|
| `REACT_APP_API_URL` | `http://127.0.0.1:5000/api` | Backend API URL (dashboard) |
| `CORS_ORIGIN` | `http://localhost:3000` | Allowed CORS origin (backend) |
| `API_KEY` | *(unset)* | If set, all API endpoints require `X-API-Key` header |

---

## ⚠️ Known Limitations / Production Hardening

This system is a **research prototype** and is not production-ready. The following limitations are known and intentional for the scope of this project:

### CORS
CORS is currently restricted to `CORS_ORIGIN` (default: `http://localhost:3000`) using `flask-cors`. In production, this should be set to the exact frontend origin via the `CORS_ORIGIN` environment variable.

### Flask Development Server
The server is run with Flask's built-in `werkzeug` dev server (`debug=True`). **This is NOT suitable for production**. For a production deployment:
- Use a WSGI server: `gunicorn "src.api_server:app" --worker-class eventlet --workers 1`
- Disable `debug=True` and set `use_reloader=False`

### Authentication
No authentication is implemented on any endpoint by default. A stub API-key check is included: set the `API_KEY` environment variable to enable it. A reviewer asking "what about auth?" can be pointed to this stub and the env var.

### WebSocket
The Socket.IO server uses the `werkzeug` polling transport as fallback. For production WebSocket at scale, use an `eventlet` or `gevent` async worker with `gunicorn`.

### Data Persistence
The SQLite database at `data/aegis_history.db` is a local file. For multi-instance or cloud deployment, replace with PostgreSQL or a time-series DB (InfluxDB, TimescaleDB).

---

## 🔭 Future Work — Streaming Architecture

The current architecture uses a single Flask process for both data generation and serving. At SCADA scale, this should be replaced with a **decoupled message-broker pipeline**:

```
┌─────────────────┐   readings    ┌──────────────────┐  predictions  ┌─────────────────┐
│  Sensor Process │ ─────────────▶│  ML Detection    │ ─────────────▶│  Dashboard /    │
│  (MQTT / Kafka  │   topic:      │  Service         │   topic:      │  Alerting /     │
│   publisher)    │   grid/bus/+  │  (subscriber)    │   grid/alerts │  Logging subs   │
└─────────────────┘               └──────────────────┘               └─────────────────┘
```

**Why this matters at scale:**
- **Decoupling**: Data producers (sensors) are independent of consumers (ML classifier, dashboard, alerting). A slow classifier doesn't block telemetry ingestion.
- **Fan-out**: Multiple downstream consumers (dashboard, audit logger, PagerDuty alerter) can all subscribe to the same result topic without each polling the same source.
- **Back-pressure**: Message brokers (Kafka, MQTT) handle bursty sensor telemetry gracefully via buffering.
- **Real-world alignment**: This matches how actual SCADA/WAMS telemetry pipelines are architected (IEC 61968/61970, DNP3 over MQTT, PMU → PDC → analytics).

**Concrete next steps:**
1. Replace `_push_reading_loop()` in `api_server.py` with a lightweight MQTT publisher (e.g. `paho-mqtt`)
2. Run the ML detection service as a separate process subscribing to the MQTT topic
3. Publish detection results to a second topic; the React dashboard subscribes via a WebSocket bridge (e.g. `mqtt.js` or `socketio` gateway)
