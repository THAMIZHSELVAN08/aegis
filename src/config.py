"""
config.py — Centralized Configuration Management for AEGIS.

Loads configuration parameters from environment variables with strong typing
and production-ready defaults.
"""

import os
from dataclasses import dataclass
from pathlib import Path

# Base Paths
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"
MODELS_DIR = PROJECT_ROOT / "models"


@dataclass(frozen=True)
class AppConfig:
    # Server configuration
    HOST: str = os.getenv("AEGIS_HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", os.getenv("AEGIS_PORT", "5000")))
    DEBUG: bool = os.getenv("AEGIS_DEBUG", "False").lower() in ("true", "1", "yes")

    # Security
    CORS_ORIGINS: str = os.getenv("CORS_ORIGIN", "*")
    API_KEY: str = os.getenv("API_KEY", "")  # Optional API key protection

    # Database
    DB_PATH: Path = Path(os.getenv("AEGIS_DB_PATH", str(DATA_DIR / "aegis_history.db")))

    # Logging
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO").upper()

    # MQTT Streaming Bridge configuration
    MQTT_BROKER_HOST: str = os.getenv("MQTT_BROKER_HOST", "localhost")
    MQTT_BROKER_PORT: int = int(os.getenv("MQTT_BROKER_PORT", "1883"))
    MQTT_TOPIC_TELEMETRY: str = os.getenv("MQTT_TOPIC_TELEMETRY", "aegis/grid/telemetry")
    MQTT_TOPIC_ALERTS: str = os.getenv("MQTT_TOPIC_ALERTS", "aegis/grid/alerts")

    # ML & Simulation Settings
    NUM_BUSES: int = 14
    ENSEMBLE_THRESHOLD: float = float(os.getenv("ENSEMBLE_THRESHOLD", "0.5"))


config = AppConfig()
