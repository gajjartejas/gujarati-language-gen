#!/usr/bin/env bash
# ==============================================================================
# setup_venv.sh: Industry-Standard Python Virtual Environment Setup Script
# ==============================================================================
# Creates an isolated Python virtual environment, upgrades pip/wheel tooling,
# and installs all required dependencies for character stroke generation.
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
VENV_DIR="${REPO_ROOT}/.venv"
REQ_FILE="${SCRIPT_DIR}/char_stroke_generation/requirements.txt"

echo "=================================================================="
echo "🐍 Setting up Python Virtual Environment (Gujarati Language Gen)"
echo "=================================================================="

# 1. Check Python version
if ! command -v python3 &> /dev/null; then
    echo "❌ Error: python3 is not installed or not found on PATH."
    exit 1
fi

PY_VERSION=$(python3 -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')")
echo "✓ Found Python version: ${PY_VERSION}"

# Check for Python 3.9+
PY_MAJOR=$(python3 -c "import sys; print(sys.version_info.major)")
PY_MINOR=$(python3 -c "import sys; print(sys.version_info.minor)")
if [ "$PY_MAJOR" -lt 3 ] || ([ "$PY_MAJOR" -eq 3 ] && [ "$PY_MINOR" -lt 9 ]); then
    echo "❌ Error: Python 3.9 or higher is required (found ${PY_VERSION})."
    exit 1
fi

# 2. Create virtual environment if it does not already exist
if [ ! -d "${VENV_DIR}" ]; then
    echo "📦 Creating virtual environment at: ${VENV_DIR}..."
    python3 -m venv "${VENV_DIR}"
    echo "✓ Virtual environment created."
else
    echo "✓ Existing virtual environment found at: ${VENV_DIR}."
fi

# 3. Upgrade pip, setuptools, wheel
echo "📦 Upgrading pip, setuptools, and wheel..."
"${VENV_DIR}/bin/python" -m pip install --upgrade pip setuptools wheel --quiet

# 4. Install requirements
if [ -f "${REQ_FILE}" ]; then
    echo "📦 Installing stroke_generator dependencies from requirements.txt..."
    "${VENV_DIR}/bin/pip" install -r "${REQ_FILE}" --quiet
    echo "✓ Dependencies installed successfully."
fi

# 5. Provide activation command
echo ""
echo "=================================================================="
echo "🎉 Setup complete! To activate your virtual environment, run:"
echo ""
echo "    source .venv/bin/activate"
echo ""
echo "To run unit tests:"
echo "    PYTHONPATH=python/char_stroke_generation python -m unittest discover -s python/char_stroke_generation/tests -t python/char_stroke_generation"
echo ""
echo "To build samples:"
echo "    python python/char_stroke_generation/scripts/build_samples.py"
echo "=================================================================="
