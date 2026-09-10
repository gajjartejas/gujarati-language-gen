"""
End-to-end stroke generation pipeline for single glyphs and batch execution.
"""

import os
import json
import time
import xml.etree.ElementTree as ET
from concurrent.futures import ProcessPoolExecutor, as_completed
from typing import Dict, List, Optional

import numpy as np
import scipy.ndimage as ndi
from svgpathtools import parse_path

from .core.raster import rasterize_glyph_mask, rasterize_path_mask_iou
from .core.ridge import transverse_ridge_snap
from .font.shaping import shape_text_with_harfbuzz
from .font.matching import match_reference_to_target


def process_single_svg(
    ref_svg_path: str,
    font_path: str,
    text_string: str,
    output_svg_path: str,
    target_font_scale: float = 100.0,
) -> bool:
    """
    Processes a single character SVG:
    1. Parses reference groups, outlines, and handwritten strokes.
    2. Shapes the character using HarfBuzz and FontTools.
    3. Solves optimal 2D IoU bipartite assignment between groups and glyphs.
    4. Computes high-resolution hole-aware distance transform.
    5. Snaps centerline strokes to the medial ridge along transverse normals.
    6. Emits Kano-compatible SVG (<g id="gX" transform="translate(x, y)">).

    Args:
        ref_svg_path: Path to the manual Inkscape reference SVG.
        font_path: Path to target TTF/OTF font file.
        text_string: Character Unicode string (e.g. 'કિ').
        output_svg_path: File path to write the generated SVG.
        target_font_scale: Scale factor for font UPEM to SVG units.

    Returns:
        True on successful SVG generation, False otherwise.
    """
    ref_tree = ET.parse(ref_svg_path)
    ref_root = ref_tree.getroot()
    ns = '{http://www.w3.org/2000/svg}'

    ref_groups = ref_root.findall(f'{ns}g')
    if not ref_groups:
        ref_groups = ref_root.findall('g')

    # 1. Parse Reference Groups
    ref_group_data = []
    for g in ref_groups:
        gid = g.attrib.get('id', 'g0')
        glabel = g.attrib.get('{http://www.inkscape.org/namespaces/inkscape}label', gid)
        p_paths = [p for p in g.findall(f'{ns}path') if 'p' in p.attrib.get('id', '')]
        s_paths = [p for p in g.findall(f'{ns}path') if 's' in p.attrib.get('id', '')]

        if not p_paths:
            p_paths = g.findall(f'{ns}path')[:1]
            s_paths = g.findall(f'{ns}path')[1:]

        ref_p_obj = parse_path(p_paths[0].attrib['d'])
        ref_s_objs = [parse_path(s.attrib['d']) for s in s_paths]
        mask = rasterize_path_mask_iou(ref_p_obj, 32)

        ref_group_data.append({
            'id': gid,
            'label': glabel,
            'p_elem': p_paths[0],
            's_elems': s_paths,
            'p_obj': ref_p_obj,
            's_objs': ref_s_objs,
            'mask': mask,
            'bbox': ref_p_obj.bbox()
        })

    # 2. Shape with HarfBuzz & FontTools
    target_glyphs = shape_text_with_harfbuzz(font_path, text_string, target_font_scale)
    if not target_glyphs:
        return False

    # 3. Match Reference Groups to Target Glyphs via Hungarian IoU
    ref_masks = [rg['mask'] for rg in ref_group_data]
    tgt_masks = [tg.mask_32 for tg in target_glyphs]
    matches = match_reference_to_target(ref_masks, tgt_masks)

    # 4. Global Bounding Box Alignment
    matched_target_indices = list(matches.values())
    min_gx = min(target_glyphs[c].global_pos_x for c in matched_target_indices)
    min_gy = min(target_glyphs[c].global_pos_y for c in matched_target_indices)

    out_groups_xml: List[str] = []
    total_w = 0.0
    total_h = 0.0

    for r_idx, ref_g in enumerate(ref_group_data):
        c_idx = matches[r_idx]
        tgt_g = target_glyphs[c_idx]

        # Target transform offset in SVG canvas coordinates
        adj_x = tgt_g.global_pos_x - min_gx
        adj_y = tgt_g.global_pos_y - min_gy

        tgt_local_p = tgt_g.local_path
        tgt_bbox = tgt_g.local_bbox

        tw = tgt_bbox[1] - tgt_bbox[0]
        th = tgt_bbox[3] - tgt_bbox[2]

        total_w = max(total_w, adj_x + tw)
        total_h = max(total_h, adj_y + th)

        # 5. High-resolution Distance Transform
        scale_res = 8.0
        pad = 6.0
        cw = int(np.ceil((tw + pad * 2) * scale_res))
        ch = int(np.ceil((th + pad * 2) * scale_res))

        arr = rasterize_glyph_mask(tgt_local_p, pad, scale_res, cw, ch)
        dist_map = ndi.distance_transform_edt(arr)

        # 6. Deform & Snap Strokes along Transverse Normals
        snapped_strokes_xml = []
        for s_idx, (s_elem, s_obj) in enumerate(zip(ref_g['s_elems'], ref_g['s_objs'])):
            sid = f"{ref_g['id']}s{s_idx}"
            s_label = s_elem.attrib.get('{http://www.inkscape.org/namespaces/inkscape}label', sid)

            new_d = transverse_ridge_snap(
                s_obj, ref_g['bbox'], tgt_bbox, dist_map, scale_res, pad
            )

            stroke_xml = (
                f'    <path style="fill:none;stroke:#000000;stroke-width:1px;'
                f'stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1" '
                f'd="{new_d}" id="{sid}" inkscape:label="{s_label}" />'
            )
            snapped_strokes_xml.append(stroke_xml)

        pid = f"{ref_g['id']}p0"
        p_label = ref_g['p_elem'].attrib.get('{http://www.inkscape.org/namespaces/inkscape}label', pid)
        outline_xml = f'    <path d="{tgt_local_p.d()}" id="{pid}" inkscape:label="{p_label}" />'

        transform_attr = (
            f' transform="translate({adj_x:.2f},{adj_y:.2f})"'
            if (abs(adj_x) > 0.05 or abs(adj_y) > 0.05)
            else ''
        )
        group_xml = (
            f'  <g id="{ref_g["id"]}" inkscape:label="{ref_g["label"]}"{transform_attr}>\n'
            f'{outline_xml}\n' + '\n'.join(snapped_strokes_xml) + '\n  </g>'
        )
        out_groups_xml.append(group_xml)

    final_svg = f'''<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="{total_w:.2f}" height="{total_h:.2f}" viewBox="0 0 {total_w:.2f} {total_h:.2f}" version="1.1" id="svg4" xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape" xmlns="http://www.w3.org/2000/svg">
{chr(10).join(out_groups_xml)}
</svg>'''

    os.makedirs(os.path.dirname(output_svg_path), exist_ok=True)
    with open(output_svg_path, 'w', encoding='utf-8') as f:
        f.write(final_svg)

    return True


def run_batch(
    font_path: str,
    templates_dir: str = 'interpolate-svg/svgs',
    output_dir: str = 'generated_svgs',
    category: str = 'all',
    workers: int = 4,
    resources_dir: str = 'resources',
) -> int:
    """
    Executes parallel batch generation across the full font catalog (up to 521 glyphs).

    Args:
        font_path: Path to target font file.
        templates_dir: Root directory of Inkscape SVG templates.
        output_dir: Output root directory for generated SVGs.
        category: Filter category ('all', 'barakhadi', 'numbers').
        workers: Number of parallel worker processes.
        resources_dir: Directory containing barakhdi.json and numerals.json.

    Returns:
        Number of successfully generated SVG files.
    """
    barakhdi_file = os.path.join(resources_dir, 'barakhdi', 'barakhdi.json')
    numerals_file = os.path.join(resources_dir, 'numerals', 'numerals.json')

    with open(barakhdi_file, 'r', encoding='utf-8') as f:
        barakhdi = json.load(f)
    with open(numerals_file, 'r', encoding='utf-8') as f:
        numerals = json.load(f)

    tasks = []

    # 1. Barakhadi
    if category in ('all', 'barakhadi'):
        for group in barakhdi:
            gid = group['id']
            dirs = [d for d in os.listdir(os.path.join(templates_dir, 'barakhadi')) if d.startswith(f'{gid}_')]
            if not dirs:
                continue
            dir_name = dirs[0]
            for ch in group['chars']:
                cid = ch['id']
                cen = ch['en'].replace(' / ', '_or_').lower()
                char_str = ch['gu']
                ref_path = os.path.join(templates_dir, 'barakhadi', dir_name, f'{cid}_{cen}.svg')
                out_path = os.path.join(output_dir, 'barakhadi', dir_name, f'{cid}_{cen}.svg')
                if os.path.exists(ref_path):
                    tasks.append((ref_path, font_path, char_str, out_path))

    # 2. Numerals
    if category in ('all', 'numbers', 'numerals'):
        for num in numerals:
            nid = num['id']
            char_str = num['gu']
            ref_path = os.path.join(templates_dir, 'numbers', f'{nid}_num.svg')
            out_path = os.path.join(output_dir, 'numbers', f'{nid}_num.svg')
            if os.path.exists(ref_path):
                tasks.append((ref_path, font_path, char_str, out_path))

    print(f"🚀 Starting batch generation for {len(tasks)} SVG files using {workers} workers...")
    start_time = time.time()
    success_count = 0

    with ProcessPoolExecutor(max_workers=workers) as executor:
        future_map = {
            executor.submit(process_single_svg, ref, font, txt, out): (txt, out)
            for (ref, font, txt, out) in tasks
        }
        for future in as_completed(future_map):
            txt, out = future_map[future]
            try:
                res = future.result()
                if res:
                    success_count += 1
            except Exception as e:
                print(f"⚠️ Error processing '{txt}' -> {out}: {e}")

    elapsed = time.time() - start_time
    print(f"\n🎉 Finished! Successfully generated {success_count}/{len(tasks)} SVGs in {elapsed:.2f}s!")
    print(f"📁 Output directory: {os.path.abspath(output_dir)}")
    return success_count
