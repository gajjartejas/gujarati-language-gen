# Gujarati Language Gen: Python Workspace

This directory houses the Python tooling and packages for the Gujarati Language Generation repository, primarily centered around **Automated Character Stroke Generation** for animated educational applications (like the **Kano** React Native app).

---

## 📁 Python Workspace Layout

```
python/
├── setup_venv.sh                    # Automated venv creation & dependency installer
├── README.md                        # Workspace guide & virtual environment instructions
└── char_stroke_generation/          # Dedicated Character Stroke Generation Package
    ├── pyproject.toml               # PEP 621 packaging metadata
    ├── requirements.txt             # Direct pip dependencies
    ├── README.md                    # Technical documentation, formulas & CLI guide
    ├── stroke_generator/            # Core library package
    │   ├── __init__.py              # Public API exports
    │   ├── cli.py                   # Unified CLI tool (`stroke-gen`)
    │   ├── pipeline.py              # Single glyph & parallel batch processing
    │   ├── viewer.py                # Standalone interactive HTML compiler
    │   ├── core/                    # bezier.py, raster.py, ridge.py
    │   └── font/                    # shaping.py, matching.py
    ├── scripts/                     # Convenience runner scripts
    │   ├── generate.py              # Single SVG generator
    │   ├── build_samples.py         # 56-sample showcase generator
    │   └── build_viewer.py          # Interactive viewer builder
    └── tests/                       # Automated unit test suite
        ├── test_bezier.py           # Spline smoothness & periodic boundary tests
        ├── test_matching.py         # HarfBuzz shaping & Hungarian matching tests
        └── test_raster.py           # Even-Odd XOR hole preservation tests
```

---

## 🐍 Python Virtual Environment (`venv`) — Industry Standard Practice

In accordance with Python packaging best practices (PEP 405, PEP 518), virtual environment directories (`.venv/`, `venv/`) contain platform-specific binaries and compiled C/C++ extensions (`numpy`, `scipy`, `uharfbuzz`) that **must never be checked into version control**. Instead, the virtual environment is created locally and isolated via `.gitignore`.

### 1. Automated Setup (Recommended)
Run the included setup script from anywhere in the repository:
```bash
./python/setup_venv.sh
```
This automatically:
1. Verifies Python 3.9+ is available.
2. Creates an isolated `.venv/` at the repository root if absent.
3. Upgrades core package management tools (`pip`, `setuptools`, `wheel`).
4. Installs all required packages from `requirements.txt`.

### 2. Manual Setup
If you prefer setting up manually:
```bash
# Create the virtual environment at repo root
python3 -m venv .venv

# Activate the virtual environment
source .venv/bin/activate       # macOS / Linux
# .venv\Scripts\activate        # Windows

# Upgrade pip & install dependencies
pip install --upgrade pip
pip install -r python/char_stroke_generation/requirements.txt

# (Optional) Install package in editable mode for the 'stroke-gen' CLI
pip install -e python/char_stroke_generation/
```

---

## 🧪 Running Automated Tests

Run the full unit test suite using Python's built-in `unittest` runner:

```bash
# With active venv:
PYTHONPATH=python/char_stroke_generation python -m unittest discover -s python/char_stroke_generation/tests -t python/char_stroke_generation

# Or directly using the venv binary:
PYTHONPATH=python/char_stroke_generation .venv/bin/python -m unittest discover -s python/char_stroke_generation/tests -t python/char_stroke_generation
```

---

## 🚀 Quick Execution Examples

### 1. Generate Single Character Stroke SVG
```bash
python python/char_stroke_generation/scripts/generate.py \
  --ref interpolate-svg/svgs/barakhadi/1_k/0_k.svg \
  --char "ક" \
  --output output/ka.svg
```

### 2. Synthesize 56 Showcase Samples
```bash
python python/char_stroke_generation/scripts/build_samples.py
```

### 3. Compile & Preview Interactive HTML Viewer
```bash
python python/char_stroke_generation/scripts/build_viewer.py --serve 8765
```

---

For in-depth mathematical formulations, pipeline architecture diagrams, and Kano app integration details, see the dedicated [`python/char_stroke_generation/README.md`](char_stroke_generation/README.md).
