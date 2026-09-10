#!/usr/bin/env python3
"""
build_viewer.py: Compile the standalone single-file HTML viewer.
Usage:
    python python/char_stroke_generation/scripts/build_viewer.py
    python python/char_stroke_generation/scripts/build_viewer.py --serve 8765
"""

import sys
from pathlib import Path

package_root = Path(__file__).resolve().parent.parent
if str(package_root) not in sys.path:
    sys.path.insert(0, str(package_root))

from stroke_generator.cli import main

if __name__ == "__main__":
    args = ["viewer"] + sys.argv[1:]
    sys.exit(main(args))
