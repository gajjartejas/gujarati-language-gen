"""
HarfBuzz OpenType text shaping and FontTools contour extraction.
"""

from dataclasses import dataclass
from typing import List, Tuple
import numpy as np
import uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from svgpathtools import parse_path, Path

from ..core.raster import rasterize_path_mask_iou


@dataclass
class ShapedGlyph:
    """Represents a shaped glyph with vector path, bounding box, and layout position."""
    name: str
    local_path: Path
    local_bbox: Tuple[float, float, float, float]
    mask_32: np.ndarray
    global_pos_x: float
    global_pos_y: float


def shape_text_with_harfbuzz(
    font_path: str,
    text_string: str,
    target_font_scale: float = 100.0,
) -> List[ShapedGlyph]:
    """
    Shapes a Gujarati text string using HarfBuzz and extracts normalized vector glyphs.

    Handles OpenType Indic shaping features (pres/abvs/blws/psts, pre-base vowels,
    ligatures, and conjuncts). Correctly maintains typographic advance positioning
    without double-scaling.

    Args:
        font_path: Path to the TrueType or OpenType font file.
        text_string: Unicode text string (e.g. 'કિ', 'કા', 'જ્ઞ').
        target_font_scale: Font coordinate unit scale (default: 100.0).

    Returns:
        List of ShapedGlyph objects in shaping order.
    """
    blob = hb.Blob.from_file_path(font_path)
    face = hb.Face(blob)
    font = hb.Font(face)
    upem = face.upem
    scale = target_font_scale / upem

    ttfont = TTFont(font_path)
    glyph_set = ttfont.getGlyphSet()

    buf = hb.Buffer()
    buf.add_str(text_string)
    buf.guess_segment_properties()
    hb.shape(font, buf)

    target_glyphs: List[ShapedGlyph] = []
    x_cursor = 0.0

    for info, pos in zip(buf.glyph_infos, buf.glyph_positions):
        gname = ttfont.getGlyphName(info.codepoint)
        glyph = glyph_set[gname]

        pen = SVGPathPen(glyph_set)
        # Flip Y: Font coordinates are Y-up, SVG coordinates are Y-down
        tpen = TransformPen(pen, (scale, 0, 0, -scale, 0, 0))
        glyph.draw(tpen)
        d_cmd = pen.getCommands()

        if d_cmd.strip():
            p_obj = parse_path(d_cmd)
            bx = p_obj.bbox()

            # Global typographic placement in scaled SVG coordinates
            pos_x = (x_cursor + pos.x_offset) * scale + bx[0]
            pos_y = -pos.y_offset * scale + bx[2]

            # Translate local path so top-left bounding box sits at (0, 0)
            local_p = p_obj.translated(complex(-bx[0], -bx[2]))
            local_bx = local_p.bbox()
            mask = rasterize_path_mask_iou(p_obj, 32)

            target_glyphs.append(
                ShapedGlyph(
                    name=gname,
                    local_path=local_p,
                    local_bbox=local_bx,
                    mask_32=mask,
                    global_pos_x=pos_x,
                    global_pos_y=pos_y,
                )
            )

        # Advance cursor in unscaled font UPEM units
        x_cursor += pos.x_advance

    return target_glyphs
