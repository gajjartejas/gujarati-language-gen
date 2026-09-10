"""
stroke_generator: Automated medial stroke extractor and animated SVG synthesizer
for Gujarati script font glyphs.
"""

from stroke_generator.core.bezier import (
    fit_cubic_bezier,
    resample_polyline,
)
from stroke_generator.core.raster import (
    rasterize_glyph_mask,
    rasterize_path_mask_iou,
)
from stroke_generator.core.ridge import (
    snap_endpoint_to_ridge,
    transverse_ridge_snap,
)
from stroke_generator.font.matching import (
    match_reference_to_target,
)
from stroke_generator.font.shaping import (
    ShapedGlyph,
    shape_text_with_harfbuzz,
)
from stroke_generator.pipeline import (
    process_single_svg,
    run_batch,
)
from stroke_generator.viewer import (
    build_viewer_html,
)

# Alias for backwards compatibility
run_batch_generation = run_batch

__version__ = "1.0.0"

__all__ = [
    "process_single_svg",
    "run_batch",
    "run_batch_generation",
    "build_viewer_html",
    "fit_cubic_bezier",
    "resample_polyline",
    "rasterize_glyph_mask",
    "rasterize_path_mask_iou",
    "snap_endpoint_to_ridge",
    "transverse_ridge_snap",
    "shape_text_with_harfbuzz",
    "ShapedGlyph",
    "match_reference_to_target",
]
