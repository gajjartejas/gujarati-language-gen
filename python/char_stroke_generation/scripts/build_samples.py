#!/usr/bin/env python3
"""
build_samples.py: Batch synthesize stroke-animated SVGs for showcase characters.
Usage:
    python python/char_stroke_generation/scripts/build_samples.py
"""

import sys
from pathlib import Path

package_root = Path(__file__).resolve().parent.parent
if str(package_root) not in sys.path:
    sys.path.insert(0, str(package_root))

from stroke_generator.cli import main

if __name__ == "__main__":
    args = ["samples"] + sys.argv[1:]
    sys.exit(main(args))
