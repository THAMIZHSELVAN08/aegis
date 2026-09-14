# Contributing to AEGIS

Thank you for your interest in contributing to AEGIS (Smart Grid FDIA Detection & Resiliency Platform).

---

## 1. Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free environment for all contributors.

---

## 2. Getting Started

### Prerequisites
- **Python**: 3.10, 3.11, or 3.12 (recommended: Python 3.11)
- **Node.js**: 18.x or 20.x LTS + `npm`
- **Docker & Docker Compose** (optional, for containerized workflows)

### Repository Setup
```bash
# Clone the repository
git clone https://github.com/THAMIZHSELVAN08/aegis.git
cd aegis

# Backend Setup
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt
pip install -r requirements-dev.txt

# Frontend Setup
cd dashboard
npm install
cd ..
```

---

## 3. Running the Test Suite

All new features or bug fixes must include unit and integration tests.

### Backend Tests
```bash
pytest tests/ -v --cov=src --cov-report=term-missing
```

### Frontend Tests
```bash
cd dashboard
npm test -- --watchAll=false
```

### Linting & Code Style
```bash
flake8 src/ tests/ --max-line-length=120
```

---

## 4. Development Workflow

1. **Create a branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. **Make your changes**:
   - Adhere to structured logging conventions (use Python's `logging` module; avoid bare `print`).
   - Keep configuration in `src/config.py`.
   - Update tests to maintain coverage.
3. **Run local validation**:
   - Ensure `pytest` passes 100%.
   - Ensure frontend `npm test` and `npm run build` succeed.
4. **Submit a Pull Request**:
   - Reference any relevant issues.
   - Summarize the motivation, changes made, and verification results.

---

## 5. Security & Vulnerability Reporting

If you discover a potential security vulnerability, please do not open a public GitHub issue. Instead, contact the repository maintainers directly with details to enable responsible disclosure.
