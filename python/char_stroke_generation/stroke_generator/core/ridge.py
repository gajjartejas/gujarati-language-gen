"""
Medial axis distance transform and transverse normal ridge snapping.
"""

from typing import Tuple
import numpy as np
import scipy.ndimage as ndi
from svgpathtools import Path

from .bezier import fit_cubic_bezier, resample_polyline


def snap_endpoint_to_ridge(pt: np.ndarray, dist_map: np.ndarray, max_search_radius_px: int = 20) -> np.ndarray:
    """
    Snaps a stroke terminal endpoint to the local medial ridge inside the stroke cap.
    
    Balances maximal distance against a spatial distance penalty to avoid jumping
    to unrelated adjacent strokes or intersections.

    Args:
        pt: (2,) raster coordinate [x, y].
        dist_map: Euclidean Distance Transform 2D array.
        max_search_radius_px: Maximum radius to search for the cap center.

    Returns:
        (2,) snapped coordinate [x, y].
    """
    ix, iy = int(round(pt[0])), int(round(pt[1]))
    y_min, y_max = max(0, iy - max_search_radius_px), min(dist_map.shape[0], iy + max_search_radius_px + 1)
    x_min, x_max = max(0, ix - max_search_radius_px), min(dist_map.shape[1], ix + max_search_radius_px + 1)
    patch = dist_map[y_min:y_max, x_min:x_max]

    if patch.size == 0:
        return pt

    yy, xx = np.ogrid[y_min:y_max, x_min:x_max]
    spatial_dist = np.hypot(xx - ix, yy - iy)
    score = patch - 0.45 * spatial_dist
    best = np.unravel_index(np.argmax(score), patch.shape)

    if patch[best] > 0.5:
        return np.array([x_min + best[1], y_min + best[0]], dtype=float)
    return pt


def transverse_ridge_snap(
    ref_stroke: Path,
    ref_bbox: Tuple[float, float, float, float],
    target_bbox: Tuple[float, float, float, float],
    dist_map: np.ndarray,
    scale_res: float = 8.0,
    pad: float = 6.0,
    num_pts: int = 64,
    num_iters: int = 25,
) -> str:
    """
    Deforms and snaps an input reference centerline stroke onto the medial ridge
    of the target glyph distance transform along orthogonal transverse normals.

    Eliminates mean-curvature shrinkage of loops (which occurs in standard Laplacian snakes)
    and supports periodic boundary conditions for closed circular loops.

    Args:
        ref_stroke: svgpathtools.Path of the reference stroke.
        ref_bbox: Bounding box of reference group outline (min_x, max_x, min_y, max_y).
        target_bbox: Bounding box of target glyph outline in local coords (0, tw, 0, th).
        dist_map: High-resolution Euclidean Distance Transform of the target glyph.
        scale_res: Pixels per SVG unit.
        pad: Padding offset in SVG units.
        num_pts: Number of spline evaluation points.
        num_iters: Iteration count for normal-seeking convergence.

    Returns:
        Catmull-Rom cubic Bézier SVG path data string.
    """
    rx0, rx1, ry0, ry1 = ref_bbox
    tx0, tx1, ty0, ty1 = target_bbox
    rw = max(rx1 - rx0, 1e-4)
    rh = max(ry1 - ry0, 1e-4)
    tw = max(tx1 - tx0, 1e-4)
    th = max(ty1 - ty0, 1e-4)

    ts = np.linspace(0, 1, num_pts)
    raw = np.array([[ref_stroke.point(t).real, ref_stroke.point(t).imag] for t in ts])

    # Check if this stroke forms a closed loop
    is_closed = np.hypot(raw[0, 0] - raw[-1, 0], raw[0, 1] - raw[-1, 1]) < 2.0

    # Normalized coordinate mapping from reference to target local frame
    u = (raw[:, 0] - rx0) / rw
    v = (raw[:, 1] - ry0) / rh
    init_pts = np.column_stack([tx0 + u * tw, ty0 + v * th])

    # Map to raster space
    r_pts = (init_pts + pad) * scale_res

    # Snap endpoints to the local stroke cap ridge if open
    search_r = int(round(2.5 * scale_res))
    if not is_closed:
        r_pts[0] = snap_endpoint_to_ridge(r_pts[0], dist_map, max_search_radius_px=search_r)
        r_pts[-1] = snap_endpoint_to_ridge(r_pts[-1], dist_map, max_search_radius_px=search_r)
    else:
        r_pts[-1] = r_pts[0]

    pts = r_pts.copy()
    max_offset_px = 2.5 * scale_res
    offsets = np.linspace(-max_offset_px, max_offset_px, 41)
    N = len(pts)

    for _ in range(num_iters):
        # 1. Compute unit tangents and normal vectors
        tangents = np.zeros_like(pts)
        if is_closed:
            tangents[1:-1] = pts[2:] - pts[:-2]
            tangents[0] = pts[1] - pts[-2]
            tangents[-1] = tangents[0]
        else:
            tangents[1:-1] = pts[2:] - pts[:-2]
            tangents[0] = pts[1] - pts[0]
            tangents[-1] = pts[-1] - pts[-2]

        norms = np.hypot(tangents[:, 0], tangents[:, 1])[:, None]
        tangents = tangents / np.maximum(norms, 1e-8)
        normals = np.column_stack([-tangents[:, 1], tangents[:, 0]])

        # 2. Seek medial ridge peak along each orthogonal normal
        new_pts = pts.copy()
        start_idx = 0 if is_closed else 1
        end_idx = N if is_closed else N - 1

        for i in range(start_idx, end_idx):
            sample_x = pts[i, 0] + offsets * normals[i, 0]
            sample_y = pts[i, 1] + offsets * normals[i, 1]
            vals = ndi.map_coordinates(dist_map, [sample_y, sample_x], order=1, mode='constant', cval=0.0)
            cost = vals - 0.25 * np.abs(offsets)
            best_idx = np.argmax(cost)
            if vals[best_idx] > 0.5:
                shift = offsets[best_idx] * 0.45
                new_pts[i] = pts[i] + shift * normals[i]

        if is_closed:
            new_pts[-1] = new_pts[0]

        # 3. Gentle smoothing along curve length
        smoothed = new_pts.copy()
        for i in range(1, N - 1):
            smoothed[i] = 0.2 * new_pts[i - 1] + 0.6 * new_pts[i] + 0.2 * new_pts[i + 1]
        if is_closed:
            smoothed[0] = 0.2 * new_pts[-2] + 0.6 * new_pts[0] + 0.2 * new_pts[1]
            smoothed[-1] = smoothed[0]

        pts = smoothed
        pts = resample_polyline(pts, N)
        if is_closed:
            pts[-1] = pts[0]

    svg_pts = (pts / scale_res) - pad
    return fit_cubic_bezier(svg_pts, is_closed=is_closed)
