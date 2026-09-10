"""
2D Shape IoU matching between template groups and shaped font glyphs.
"""

from typing import Dict, List, Optional, Tuple
import numpy as np
from scipy.optimize import linear_sum_assignment


def match_reference_to_target(
    ref_masks: List[np.ndarray],
    target_masks: List[np.ndarray],
    ref_centers: Optional[List[Tuple[float, float]]] = None,
    target_centers: Optional[List[Tuple[float, float]]] = None,
) -> Dict[int, int]:
    """
    Computes optimal bipartite assignment between reference SVG groups and shaped glyphs.

    Solves the Hungarian algorithm on the negative combination of 2D IoU and relative
    spatial proximity. Resolves pre-base vowel reordering (e.g. in 'કિ') as well as
    multi-contour parts (e.g. visarga dots, double matras, kana bars).

    Args:
        ref_masks: List of (res, res) boolean footprint masks from template groups.
        target_masks: List of (res, res) boolean footprint masks from shaped glyphs.
        ref_centers: Optional list of (cx, cy) canvas coordinates for reference groups.
        target_centers: Optional list of (cx, cy) canvas coordinates for target glyphs.

    Returns:
        Dictionary mapping reference_group_index -> target_glyph_index.
    """
    N_ref = len(ref_masks)
    M_tgt = len(target_masks)

    if N_ref == 0 or M_tgt == 0:
        return {}

    if N_ref == M_tgt:
        use_spatial = (
            ref_centers is not None
            and target_centers is not None
            and len(ref_centers) == N_ref
            and len(target_centers) == M_tgt
            and N_ref > 1
        )

        if use_spatial:
            ref_c = np.array(ref_centers, dtype=float)
            tgt_c = np.array(target_centers, dtype=float)
            ref_range = np.maximum(ref_c.max(axis=0) - ref_c.min(axis=0), 1.0)
            tgt_range = np.maximum(tgt_c.max(axis=0) - tgt_c.min(axis=0), 1.0)
            ref_norm = (ref_c - ref_c.min(axis=0)) / ref_range
            tgt_norm = (tgt_c - tgt_c.min(axis=0)) / tgt_range

        cost_matrix = np.zeros((N_ref, M_tgt), dtype=float)
        for i in range(N_ref):
            for j in range(M_tgt):
                inter = np.sum(ref_masks[i] & target_masks[j])
                union = np.sum(ref_masks[i] | target_masks[j])
                iou = inter / max(union, 1)
                if use_spatial:
                    dist = np.sum((ref_norm[i] - tgt_norm[j]) ** 2)
                    cost_matrix[i, j] = -(iou - 0.5 * dist)
                else:
                    cost_matrix[i, j] = -iou

        row_ind, col_ind = linear_sum_assignment(cost_matrix)
        return {int(r): int(c) for r, c in zip(row_ind, col_ind)}

    # Fallback to clamped index if group count differs
    return {i: min(i, M_tgt - 1) for i in range(N_ref)}

