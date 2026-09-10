#!/usr/bin/env python3
"""
generate.py: Convenience script to generate stroke SVG for a given character.
Usage:
    python python/char_stroke_generation/scripts/generate.py --ref ... --char "ક"
"""

import sys
from pathlib import Path

# Add python/char_stroke_generation to sys.path
package_root = Path(__file__).resolve().parent.parent
if str(package_root) not in sys.path:
    sys.path.insert(0, str(package_root))

from stroke_generator.cli import main

if __name__ == "__main__":
    args = ["generate"] + sys.argv[1:]
    sys.exit(main(args))
