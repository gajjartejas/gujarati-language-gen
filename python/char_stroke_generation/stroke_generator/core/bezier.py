"""
Bézier curve fitting and polyline resampling utilities with curvature-adaptive subdivision.
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


def fit_cubic_bezier(points: np.ndarray, max_segment_len: float = 6.0, is_closed: bool = False) -> str:
    """
    Converts a polyline of 2D points into smooth, curvature-adaptive Catmull-Rom cubic Bézier segments.

    Dynamically concentrates control knots in high-curvature loops (e.g. Gujarati loops in ક, બ, જ, ૩, ૦)
    while keeping straight segments minimal, eliminating curve flattening and overshooting.

    Args:
        points: (N, 2) array of 2D coordinates.
        max_segment_len: Baseline maximum chord distance per Bézier segment (default: 6.0 SVG units).
        is_closed: Whether the curve forms a closed loop requiring periodic boundary tangents.

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

    # 1. Compute curvature-weighted metric along the polyline
    # High turning angles receive more knots
    tangents = diffs / np.maximum(chords[:, None], 1e-8)
    dot_products = np.sum(tangents[:-1] * tangents[1:], axis=1)
    turning_angles = np.arccos(np.clip(dot_products, -1.0, 1.0))
    # Pad turning angles to match chords length
    turn_weights = np.r_[0.0, turning_angles]

    # Curvature density: arc length + turning angle scale
    beta = 4.0
    seg_weights = chords + beta * turn_weights
    cum_weights = np.cumsum(np.r_[0, seg_weights])
    total_weight = cum_weights[-1]

    # Number of knots based on total curvature-weighted length
    num_segs = max(3, int(np.ceil(total_weight / max_segment_len)))
    target_weights = np.linspace(0, total_weight, num_segs + 1)

    ctrl_pts = []
    for tw in target_weights:
        idx = np.searchsorted(cum_weights, tw)
        if idx == 0:
            ctrl_pts.append(points[0])
        elif idx >= len(cum_weights):
            ctrl_pts.append(points[-1])
        else:
            prev_idx = max(0, idx - 1)
            span = cum_weights[idx] - cum_weights[prev_idx]
            t = (tw - cum_weights[prev_idx]) / max(span, 1e-9)
            ctrl_pts.append(points[prev_idx] * (1.0 - t) + points[idx] * t)
    ctrl_pts = np.array(ctrl_pts)

    if is_closed:
        ctrl_pts[-1] = ctrl_pts[0]

    d_str = f"M {ctrl_pts[0][0]:.3f},{ctrl_pts[0][1]:.3f}"
    n = len(ctrl_pts)

    # 2. Chordal Catmull-Rom Tangents (eliminates cusps and overshoot on variable spacing)
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

        d01 = max(np.hypot(p1[0] - p0[0], p1[1] - p0[1]), 1e-4)
        d12 = max(np.hypot(p2[0] - p1[0], p2[1] - p1[1]), 1e-4)
        d23 = max(np.hypot(p3[0] - p2[0], p3[1] - p2[1]), 1e-4)

        # Chordal velocity tangents
        v1 = (p2 - p0) / (d01 + d12) * d12
        v2 = (p3 - p1) / (d12 + d23) * d12

        c1 = p1 + v1 / 3.0
        c2 = p2 - v2 / 3.0
        d_str += f" C {c1[0]:.3f},{c1[1]:.3f} {c2[0]:.3f},{c2[1]:.3f} {p2[0]:.3f},{p2[1]:.3f}"

    if is_closed:
        d_str += " Z"

    return d_str
