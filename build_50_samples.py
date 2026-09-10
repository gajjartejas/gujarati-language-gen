#!/usr/bin/env python3
"""
build_50_samples.py: Root backwards-compatibility wrapper delegating to python/stroke_generator.
"""

import sys
from pathlib import Path

_python_dir = Path(__file__).resolve().parent / "python" / "char_stroke_generation"
if str(_python_dir) not in sys.path:
    sys.path.insert(0, str(_python_dir))

from stroke_generator.cli import main

if __name__ == "__main__":
    args = ["samples"] + sys.argv[1:]
    sys.exit(main(args))
