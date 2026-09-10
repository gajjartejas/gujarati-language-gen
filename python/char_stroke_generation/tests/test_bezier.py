"""
Unit tests for core Bézier spline fitting and polyline arc-length resampling.
"""

import unittest
import numpy as np
from stroke_generator.core.bezier import fit_cubic_bezier, resample_polyline


class TestBezierFitting(unittest.TestCase):
    def test_resample_polyline_spacing(self):
        # Straight line from (0, 0) to (100, 0)
        pts = np.array([[0.0, 0.0], [50.0, 0.0], [100.0, 0.0]])
        resampled = resample_polyline(pts, num_pts=10)
        self.assertEqual(len(resampled), 10)
        # Check that x coordinates are monotonically increasing
        self.assertTrue(np.all(np.diff(resampled[:, 0]) > 0))
        # Total arc length should match ~100
        diffs = np.diff(resampled, axis=0)
        total_len = np.sum(np.linalg.norm(diffs, axis=1))
        self.assertAlmostEqual(total_len, 100.0, delta=1.0)

    def test_fit_cubic_bezier_open(self):
        # Open curve
        t = np.linspace(0, np.pi, 20)
        x = np.cos(t) * 100
        y = np.sin(t) * 100
        pts = np.column_stack([x, y])

        d_str = fit_cubic_bezier(pts, is_closed=False)
        self.assertTrue(d_str.startswith("M "))
        self.assertIn("C ", d_str)
        self.assertNotIn("Z", d_str)

    def test_fit_cubic_bezier_closed(self):
        # Circle loop
        theta = np.linspace(0, 2 * np.pi, 30, endpoint=False)
        x = np.cos(theta) * 50 + 100
        y = np.sin(theta) * 50 + 100
        pts = np.column_stack([x, y])

        d_str = fit_cubic_bezier(pts, is_closed=True)
        self.assertTrue(d_str.startswith("M "))
        self.assertIn("C ", d_str)
        self.assertTrue(d_str.endswith("Z"))


if __name__ == "__main__":
    unittest.main()
