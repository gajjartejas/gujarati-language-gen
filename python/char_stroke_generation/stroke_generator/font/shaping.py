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


def get_glyph_components(glyph_path: Path) -> List[Path]:
    """
    Extracts visually independent components from a glyph path.
    Groups inner holes (subpaths with bboxes strictly contained inside an outer contour's bbox)
    with their outer parent contour, while separating disconnected disjoint contours.
    """
    subs = glyph_path.continuous_subpaths()
    if len(subs) <= 1:
        return [glyph_path]

    bboxes = [s.bbox() for s in subs]
    parent = {}
    for j, bj in enumerate(bboxes):
        for i, bi in enumerate(bboxes):
            if i != j:
                # Check if bj is strictly contained inside bi
                if bi[0] <= bj[0] and bi[1] >= bj[1] and bi[2] <= bj[2] and bi[3] >= bj[3]:
                    parent[j] = i
                    break

    components = {}
    for j, s in enumerate(subs):
        root = parent.get(j, j)
        if root not in components:
            components[root] = []
        components[root].append(s)

    result = []
    for root, sub_list in components.items():
        comp_path = Path(*[seg for sub in sub_list for seg in sub])
        result.append(comp_path)
    return result


def decompose_target_glyphs(
    target_glyphs: List[ShapedGlyph],
    expected_count: int,
) -> List[ShapedGlyph]:
    """
    Decomposes compound font glyphs (e.g. ovowelsign containing both kana bar and matra)
    into individual components when the reference template expects separate stroke groups.
    """
    if len(target_glyphs) >= expected_count:
        return target_glyphs

    decomposed: List[ShapedGlyph] = []
    for tg in target_glyphs:
        comps = get_glyph_components(tg.local_path)
        if len(comps) > 1 and (len(decomposed) + len(comps) <= expected_count or len(target_glyphs) <= 2):
            for idx, c in enumerate(comps):
                bx = c.bbox()
                local_p = c.translated(complex(-bx[0], -bx[2]))
                mask = rasterize_path_mask_iou(local_p, 32)
                decomposed.append(
                    ShapedGlyph(
                        name=f"{tg.name}_part{idx}",
                        local_path=local_p,
                        local_bbox=local_p.bbox(),
                        mask_32=mask,
                        global_pos_x=tg.global_pos_x + bx[0],
                        global_pos_y=tg.global_pos_y + bx[2],
                    )
                )
        else:
            decomposed.append(tg)

    return decomposed

