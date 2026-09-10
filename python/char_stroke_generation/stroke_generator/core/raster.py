"""
Even-Odd boolean rasterization and shape mask generation.
"""

import numpy as np
from PIL import Image, ImageDraw
from svgpathtools import Path


def rasterize_glyph_mask(path_obj: Path, pad: float, scale_res: float, cw: int, ch: int) -> np.ndarray:
    """
    Renders a high-resolution boolean mask of an SVG path using the Even-Odd rule.
    
    Correctly isolates inner counter holes (e.g. loops in ૦, ૧, ઠ, ઢ) by XOR-combining
    closed subpaths so empty regions have distance 0 in the distance transform.

    Args:
        path_obj: Parsed svgpathtools.Path object.
        pad: Extra border padding in SVG units.
        scale_res: Scale multiplier from SVG units to raster pixels.
        cw: Canvas width in raster pixels.
        ch: Canvas height in raster pixels.

    Returns:
        (ch, cw) boolean 2D numpy array where True represents glyph ink.
    """
    img_arr = np.zeros((ch, cw), dtype=bool)

    for sp in path_obj.continuous_subpaths():
        pts = []
        for seg in sp:
            for t in np.linspace(0, 1, 8):
                pt = seg.point(t)
                pts.append(((pt.real + pad) * scale_res, (pt.imag + pad) * scale_res))

        if len(pts) >= 3:
            im = Image.new('1', (cw, ch), 0)
            dr = ImageDraw.Draw(im)
            dr.polygon(pts, fill=1)
            img_arr ^= np.array(im, dtype=bool)

    return img_arr


def rasterize_path_mask_iou(path_obj: Path, res: int = 32) -> np.ndarray:
    """
    Renders a normalized res x res binary footprint of a path for shape-matching (IoU).
    
    Supports multiple subpaths and inner holes with the Even-Odd XOR rule.

    Args:
        path_obj: Parsed svgpathtools.Path object.
        res: Resolution of the square binary grid (default: 32x32).

    Returns:
        (res, res) boolean numpy array.
    """
    bx = path_obj.bbox()
    w = max(bx[1] - bx[0], 1e-3)
    h = max(bx[3] - bx[2], 1e-3)
    img_arr = np.zeros((res, res), dtype=bool)

    for sp in path_obj.continuous_subpaths():
        pts = []
        for seg in sp:
            for t in np.linspace(0, 1, 8):
                pt = seg.point(t)
                nx = (pt.real - bx[0]) / w * (res - 2) + 1
                ny = (pt.imag - bx[2]) / h * (res - 2) + 1
                pts.append((nx, ny))

        if len(pts) >= 3:
            im = Image.new('1', (res, res), 0)
            dr = ImageDraw.Draw(im)
            dr.polygon(pts, fill=1)
            img_arr ^= np.array(im, dtype=bool)

    return img_arr
