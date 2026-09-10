"""
Unit tests for Even-Odd XOR rasterization and hole preservation.
"""

import unittest
import numpy as np
from svgpathtools import parse_path
from stroke_generator.core.raster import rasterize_glyph_mask, rasterize_path_mask_iou


class TestRasterMasks(unittest.TestCase):
    def test_solid_square_rasterization(self):
        # A simple square path from (20,20) to (80,80)
        path = parse_path("M 20 20 L 80 20 L 80 80 L 20 80 Z")
        # Pad=10, scale=1.0, canvas=100x100
        mask = rasterize_glyph_mask(path, pad=10.0, scale_res=1.0, cw=100, ch=100)
        # Inside center (50+10, 50+10) = (60, 60) should be True
        self.assertTrue(mask[60, 60])
        # Outside (5, 5) should be False
        self.assertFalse(mask[5, 5])

    def test_even_odd_xor_hole_preservation(self):
        # Outer square (10,10) to (90,90), inner hole (30,30) to (70,70)
        path_str = "M 10 10 L 90 10 L 90 90 L 10 90 Z M 30 30 L 70 30 L 70 70 L 30 70 Z"
        path = parse_path(path_str)
        mask = rasterize_glyph_mask(path, pad=0.0, scale_res=1.0, cw=100, ch=100)

        # Point inside hole (50, 50) must be False (XOR cancels outer & inner)
        self.assertFalse(mask[50, 50])

        # Point in solid rim (20, 20) must be True
        self.assertTrue(mask[20, 20])

    def test_path_mask_iou(self):
        path = parse_path("M 0 0 L 100 0 L 100 100 L 0 100 Z")
        mask32 = rasterize_path_mask_iou(path, res=32)
        self.assertEqual(mask32.shape, (32, 32))
        self.assertTrue(np.any(mask32))


if __name__ == "__main__":
    unittest.main()
