"""
Bézier curve fitting and polyline resampling utilities.
"""

import numpy as np


def resample_polyline(pts: np.ndarray, num_pts: int = 64) -> np.ndarray:
    """
    Resamples a 2D polyline to have uniform arc-length chord spacing.
    
    Prevents points from clustering in high-curvature corners or drifting
    along straight segments during iterative active contour relaxation.

    Args:
        pts: (N, 2) array of 2D coordinates.
        num_pts: Target number of equally-spaced points along the curve.

    Returns:
        (num_pts, 2) array of resampled 2D coordinates.
    """
    if len(pts) < 2:
        return pts.copy()

    diffs = np.diff(pts, axis=0)
    chords = np.hypot(diffs[:, 0], diffs[:, 1])
    chord_lens = np.cumsum(np.r_[0, chords])
    total_len = chord_lens[-1]

    if total_len < 1e-6:
        return np.repeat(pts[:1], num_pts, axis=0)

    target_dists = np.linspace(0, total_len, num_pts)
    res = np.zeros((num_pts, 2), dtype=float)
    res[0] = pts[0]
    res[-1] = pts[-1]

    for i in range(1, num_pts - 1):
        d = target_dists[i]
        idx = np.searchsorted(chord_lens, d)
        prev_idx = max(0, idx - 1)
        segment_len = chord_lens[idx] - chord_lens[prev_idx]
        t = (d - chord_lens[prev_idx]) / max(segment_len, 1e-9)
        res[i] = pts[prev_idx] * (1.0 - t) + pts[idx] * t

    return res


def fit_cubic_bezier(points: np.ndarray, max_segment_len: float = 16.0, is_closed: bool = False) -> str:
    """
    Converts a polyline of 2D points into smooth Catmull-Rom cubic Bézier segments (SVG path 'd').
    
    Ensures C1 continuity and smooth curvature without zig-zagging or sharp corners.
    Supports periodic boundary conditions for closed loops (e.g. circle numerals like 0).

    Args:
        points: (N, 2) array of 2D coordinates.
        max_segment_len: Maximum distance per Bézier segment for adaptive division.
        is_closed: Whether the curve forms a closed loop requiring periodic tangents.

    Returns:
        SVG path data string (e.g. 'M x,y C c1x,c1y c2x,c2y p2x,p2y ...').
    """
    if len(points) < 2:
        return ""
    if len(points) == 2:
        return f"M {points[0][0]:.3f},{points[0][1]:.3f} L {points[1][0]:.3f},{points[1][1]:.3f}"

    diffs = np.diff(points, axis=0)
    chords = np.hypot(diffs[:, 0], diffs[:, 1])
    chord_lens = np.cumsum(np.r_[0, chords])
    total_len = chord_lens[-1]

    if total_len < 1e-4:
        return f"M {points[0][0]:.3f},{points[0][1]:.3f}"

    num_segs = max(2, int(np.ceil(total_len / max_segment_len)))
    target_dists = np.linspace(0, total_len, num_segs + 1)

    ctrl_pts = []
    for d in target_dists:
        idx = np.searchsorted(chord_lens, d)
        if idx == 0:
            ctrl_pts.append(points[0])
        elif idx >= len(points):
            ctrl_pts.append(points[-1])
        else:
            prev_idx = max(0, idx - 1)
            segment_len = chord_lens[idx] - chord_lens[prev_idx]
            t = (d - chord_lens[prev_idx]) / max(segment_len, 1e-9)
            ctrl_pts.append(points[prev_idx] * (1.0 - t) + points[idx] * t)
    ctrl_pts = np.array(ctrl_pts)

    if is_closed:
        ctrl_pts[-1] = ctrl_pts[0]

    d_str = f"M {ctrl_pts[0][0]:.3f},{ctrl_pts[0][1]:.3f}"
    n = len(ctrl_pts)
    for i in range(n - 1):
        if is_closed:
            p0 = ctrl_pts[(i - 1) % (n - 1)]
            p1 = ctrl_pts[i]
            p2 = ctrl_pts[i + 1]
            p3 = ctrl_pts[(i + 2) % (n - 1)]
        else:
            p0 = ctrl_pts[max(0, i - 1)]
            p1 = ctrl_pts[i]
            p2 = ctrl_pts[i + 1]
            p3 = ctrl_pts[min(n - 1, i + 2)]

        c1 = p1 + (p2 - p0) / 6.0
        c2 = p2 - (p3 - p1) / 6.0
        d_str += f" C {c1[0]:.3f},{c1[1]:.3f} {c2[0]:.3f},{c2[1]:.3f} {p2[0]:.3f},{p2[1]:.3f}"

    if is_closed:
        d_str += " Z"

    return d_str
