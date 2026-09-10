"""
2D Shape IoU matching between template groups and shaped font glyphs.
"""

from typing import Dict, List
import numpy as np
from scipy.optimize import linear_sum_assignment


def match_reference_to_target(
    ref_masks: List[np.ndarray],
    target_masks: List[np.ndarray],
) -> Dict[int, int]:
    """
    Computes optimal bipartite assignment between reference SVG groups and shaped glyphs.

    Solves the Hungarian algorithm on the negative 2D IoU (Intersection-over-Union) matrix.
    Resolves pre-base vowel reordering (e.g. In 'કિ', HarfBuzz visual order is [ivowelsign, ka],
    while reference group g0 is ka and g1 is ivowelsign).

    Args:
        ref_masks: List of (res, res) boolean footprint masks from template groups.
        target_masks: List of (res, res) boolean footprint masks from shaped glyphs.

    Returns:
        Dictionary mapping reference_group_index -> target_glyph_index.
    """
    N_ref = len(ref_masks)
    M_tgt = len(target_masks)

    if N_ref == 0 or M_tgt == 0:
        return {}

    if N_ref == M_tgt:
        iou_matrix = np.zeros((N_ref, M_tgt), dtype=float)
        for i in range(N_ref):
            for j in range(M_tgt):
                inter = np.sum(ref_masks[i] & target_masks[j])
                union = np.sum(ref_masks[i] | target_masks[j])
                iou_matrix[i, j] = inter / max(union, 1)

        row_ind, col_ind = linear_sum_assignment(-iou_matrix)
        return {int(r): int(c) for r, c in zip(row_ind, col_ind)}

    # Fallback to clamped index if group count differs
    return {i: min(i, M_tgt - 1) for i in range(N_ref)}
