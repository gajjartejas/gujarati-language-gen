"""
Unit tests for HarfBuzz Indic font shaping and Hungarian bipartite stroke matching.
"""

import os
import unittest
from pathlib import Path
import numpy as np

from stroke_generator.font.shaping import shape_text_with_harfbuzz, ShapedGlyph
from stroke_generator.font.matching import match_reference_to_target

def _find_font_path() -> str:
    p = Path(__file__).resolve()
    for parent in p.parents:
        font = parent / "fonts" / "Noto_Sans_Gujarati" / "NotoSansGujarati-Bold.ttf"
        if font.exists():
            return str(font)
    return str(p.parent.parent.parent.parent / "fonts" / "Noto_Sans_Gujarati" / "NotoSansGujarati-Bold.ttf")

FONT_PATH = _find_font_path()


class TestFontShapingAndMatching(unittest.TestCase):
    def test_harfbuzz_shaping_single_char(self):
        if not os.path.exists(FONT_PATH):
            self.skipTest(f"Font not found at {FONT_PATH}")

        glyphs = shape_text_with_harfbuzz(FONT_PATH, "ક")
        self.assertGreaterEqual(len(glyphs), 1)
        glyph = glyphs[0]
        self.assertIsNotNone(glyph.local_path)
        self.assertGreater(len(glyph.local_path), 0)
        # Verify bounding box has valid width and height
        min_x, max_x, min_y, max_y = glyph.local_bbox
        self.assertGreater(max_x, min_x)
        self.assertGreater(max_y, min_y)

    def test_harfbuzz_shaping_matra_reordering(self):
        if not os.path.exists(FONT_PATH):
            self.skipTest(f"Font not found at {FONT_PATH}")

        # "કિ" = Consonant KA + Vowel Sign I (pre-base matra)
        glyphs = shape_text_with_harfbuzz(FONT_PATH, "કિ")
        self.assertEqual(len(glyphs), 2)
        # Verify both glyphs have non-empty masks
        for g in glyphs:
            self.assertEqual(g.mask_32.shape, (32, 32))
            self.assertTrue(np.any(g.mask_32))

    def test_hungarian_bipartite_matching(self):
        # Create two distinct 32x32 masks
        mask_a = np.zeros((32, 32), dtype=bool)
        mask_a[5:15, 5:15] = True  # Top-left box

        mask_b = np.zeros((32, 32), dtype=bool)
        mask_b[18:28, 18:28] = True  # Bottom-right box

        # Case 1: Identity alignment
        assignment = match_reference_to_target([mask_a, mask_b], [mask_a, mask_b])
        self.assertEqual(assignment, {0: 0, 1: 1})

        # Case 2: Swapped alignment (reordered)
        assignment_swapped = match_reference_to_target([mask_a, mask_b], [mask_b, mask_a])
        self.assertEqual(assignment_swapped, {0: 1, 1: 0})


if __name__ == "__main__":
    unittest.main()
