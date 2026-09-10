"""
Core geometric and computational vision algorithms for stroke generation.
"""

from .bezier import fit_cubic_bezier, resample_polyline
from .raster import rasterize_glyph_mask, rasterize_path_mask_iou
from .ridge import ray_march_cap_centroid, snap_endpoint_to_ridge, transverse_ridge_snap

__all__ = [
    "fit_cubic_bezier",
    "resample_polyline",
    "rasterize_glyph_mask",
    "rasterize_path_mask_iou",
    "ray_march_cap_centroid",
    "snap_endpoint_to_ridge",
    "transverse_ridge_snap",
]
