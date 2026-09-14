# ==============================================================================
# AEGIS Backend Dockerfile
# Python 3.11 with Pandapower, Scikit-Learn, XGBoost, SHAP, and Flask
# ==============================================================================
FROM python:3.11-slim

# Prevent Python from buffering stdout/stderr and creating .pyc files
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    AEGIS_HOST=0.0.0.0 \
    PORT=5000

WORKDIR /app

# Install system dependencies if required for numerical packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy source code and data files
COPY src/ src/
COPY data/ data/

# Create non-root user for security best practice
RUN useradd -m -u 1000 aegisuser && \
    chown -R aegisuser:aegisuser /app
USER aegisuser

EXPOSE 5000

# Health check to verify API and models are operational
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:5000/api/health || exit 1

CMD ["python", "src/api_server.py"]
