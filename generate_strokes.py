#!/usr/bin/env python3
"""
generate_strokes.py: Root backwards-compatibility wrapper delegating to python/stroke_generator.
"""

import sys
from pathlib import Path

# Add python/char_stroke_generation to path for stroke_generator imports
_python_dir = Path(__file__).resolve().parent / "python" / "char_stroke_generation"
if str(_python_dir) not in sys.path:
    sys.path.insert(0, str(_python_dir))

from stroke_generator import (
    process_single_svg,
    run_batch,
    run_batch_generation,
    build_viewer_html,
    fit_cubic_bezier,
    resample_polyline,
    rasterize_glyph_mask,
    rasterize_path_mask_iou,
    snap_endpoint_to_ridge,
    transverse_ridge_snap,
    shape_text_with_harfbuzz,
    ShapedGlyph,
    match_reference_to_target,
)
from stroke_generator.cli import main

if __name__ == "__main__":
    sys.exit(main())
