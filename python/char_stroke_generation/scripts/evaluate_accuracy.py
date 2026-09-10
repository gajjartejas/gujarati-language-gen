#!/usr/bin/env python3
"""
evaluate_accuracy.py: Quantitative accuracy evaluation and visual comparison renderer.
Measures:
1. Medial Ridge Centeredness (EDT at stroke relative to local transverse max)
2. Ink Containment (percentage of stroke points strictly inside glyph ink)
3. Endpoint Cap Accuracy (proximity to terminal dome centroid)
4. Visual side-by-side rendering saved to IDE artifacts directory.
"""

import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Tuple

import numpy as np
import scipy.ndimage as ndi
from PIL import Image, ImageDraw, ImageFont
from svgpathtools import parse_path, Path as SvgPath

# Setup python path
package_root = Path(__file__).resolve().parent.parent
if str(package_root) not in sys.path:
    sys.path.insert(0, str(package_root))

from stroke_generator.core.raster import rasterize_glyph_mask


def evaluate_character_accuracy(
    ref_svg_path: str,
    bold_svg_path: str,
    scale_res: float = 8.0,
    pad: float = 6.0,
) -> Dict[str, float]:
    """
    Evaluates quantitative accuracy metrics for a generated bold stroke against its glyph.
    """
    import xml.etree.ElementTree as ET

    tree = ET.parse(bold_svg_path)
    root = tree.getroot()
    ns = {"svg": "http://www.w3.org/2000/svg"}

    # Find glyph outline paths and stroke paths
    outline_paths = []
    stroke_paths = []

    for g in root.findall(".//{http://www.w3.org/2000/svg}g") or root.findall(".//g"):
        for p in g.findall("{http://www.w3.org/2000/svg}path") or g.findall("path"):
            pid = p.attrib.get("id", "")
            d = p.attrib.get("d", "")
            if not d:
                continue
            if "p" in pid and "s" not in pid:
                outline_paths.append(parse_path(d))
            elif "s" in pid:
                stroke_paths.append(parse_path(d))

    if not outline_paths or not stroke_paths:
        return {"ridge_centeredness": 0.0, "ink_containment": 0.0, "endpoint_accuracy": 0.0, "overall_score": 0.0}

    # Rasterize glyph outline and compute EDT
    outline_combined = SvgPath(*[seg for p in outline_paths for seg in p])
    bx = outline_combined.bbox()
    gw = max(bx[1] - bx[0], 1.0)
    gh = max(bx[3] - bx[2], 1.0)
    cw = int(np.ceil((gw + 2 * pad) * scale_res))
    ch = int(np.ceil((gh + 2 * pad) * scale_res))

    mask = rasterize_glyph_mask(outline_combined, pad=pad, scale_res=scale_res, cw=cw, ch=ch)
    dist_map = ndi.distance_transform_edt(mask)

    centeredness_scores = []
    containment_scores = []
    endpoint_scores = []

    for s_path in stroke_paths:
        # Sample points along stroke
        num_samples = 64
        ts = np.linspace(0, 1, num_samples)
        pts_svg = np.array([[s_path.point(t).real, s_path.point(t).imag] for t in ts])
        pts_px = (pts_svg + pad) * scale_res

        # Check ink containment
        px_x = np.clip(np.round(pts_px[:, 0]).astype(int), 0, cw - 1)
        px_y = np.clip(np.round(pts_px[:, 1]).astype(int), 0, ch - 1)
        inside = mask[px_y, px_x]
        containment_scores.append(np.mean(inside) * 100.0)

        # Compute transverse centeredness
        tangents = np.zeros_like(pts_px)
        tangents[1:-1] = pts_px[2:] - pts_px[:-2]
        tangents[0] = pts_px[1] - pts_px[0]
        tangents[-1] = pts_px[-1] - pts_px[-2]
        norms = np.hypot(tangents[:, 0], tangents[:, 1])[:, None]
        tangents = tangents / np.maximum(norms, 1e-8)
        normals = np.column_stack([-tangents[:, 1], tangents[:, 0]])

        # Transverse sweep [-1.5*thickness, +1.5*thickness]
        sweep_offsets = np.linspace(-15.0, 15.0, 31)
        ratio_list = []
        for i in range(num_samples):
            sx = pts_px[i, 0] + sweep_offsets * normals[i, 0]
            sy = pts_px[i, 1] + sweep_offsets * normals[i, 1]
            vals = ndi.map_coordinates(dist_map, [sy, sx], order=1, mode="constant", cval=0.0)
            max_val = np.max(vals)
            curr_val = dist_map[px_y[i], px_x[i]]
            if max_val > 0.5:
                ratio_list.append(min(curr_val / max_val, 1.0))
            else:
                ratio_list.append(1.0 if inside[i] else 0.0)

        centeredness_scores.append(np.mean(ratio_list) * 100.0)

        # Endpoint cap accuracy
        for ep in [pts_px[0], pts_px[-1]]:
            ix, iy = int(round(ep[0])), int(round(ep[1]))
            r = int(round(2.5 * scale_res))
            ymin, ymax = max(0, iy - r), min(ch, iy + r + 1)
            xmin, xmax = max(0, ix - r), min(cw, ix + r + 1)
            patch = dist_map[ymin:ymax, xmin:xmax]
            if patch.size > 0:
                best_val = np.max(patch)
                curr_val = dist_map[iy, ix] if (0 <= iy < ch and 0 <= ix < cw) else 0.0
                endpoint_scores.append(min(curr_val / max(best_val, 1e-3), 1.0) * 100.0)

    medial_centeredness = float(np.mean(centeredness_scores)) if centeredness_scores else 0.0
    ink_containment = float(np.mean(containment_scores)) if containment_scores else 0.0
    endpoint_accuracy = float(np.mean(endpoint_scores)) if endpoint_scores else 0.0
    overall = 0.5 * medial_centeredness + 0.3 * ink_containment + 0.2 * endpoint_accuracy

    return {
        "ridge_centeredness": round(medial_centeredness, 1),
        "ink_containment": round(ink_containment, 1),
        "endpoint_accuracy": round(endpoint_accuracy, 1),
        "overall_score": round(overall, 1),
    }


def render_comparison_grid(
    sample_items: List[Tuple[str, str, str]],
    ref_dir: str,
    bold_dir: str,
    output_png_path: str,
):
    """
    Renders a high-resolution visual comparison sheet showing:
    1. Reference Light SVG with manual stroke
    2. Bold SVG with generated medial stroke
    3. Distance Transform heatmap overlay showing skeleton lock
    """
    import xml.etree.ElementTree as ET

    cell_w, cell_h = 240, 240
    cols = 3  # Ref, Bold, Heatmap
    rows = len(sample_items)
    header_h = 60
    margin = 20

    img_w = cols * cell_w + 2 * margin
    img_h = rows * cell_h + header_h + 2 * margin

    canvas = Image.new("RGB", (img_w, img_h), "#0d1117")
    draw = ImageDraw.Draw(canvas)

    # Title header
    draw.text((margin, 15), "Gujarati Stroke Generation: Reference vs. Bold vs. Medial EDT Heatmap", fill="#ffffff")

    # Column titles
    col_titles = ["Reference (Inkscape Manual)", "Bold (Auto-Generated)", "Medial EDT Heatmap Lock"]
    for c_idx, title in enumerate(col_titles):
        draw.text((margin + c_idx * cell_w + 10, 40), title, fill="#58a6ff")

    scale_res = 4.0
    pad = 8.0

    for r_idx, (label, fname, cat) in enumerate(sample_items):
        ref_path = os.path.join(ref_dir, fname)
        bold_path = os.path.join(bold_dir, fname)
        if not os.path.exists(ref_path) or not os.path.exists(bold_path):
            continue

        y_base = header_h + margin + r_idx * cell_h

        # Draw row label
        draw.text((margin, y_base + 5), f"{label} ({cat})", fill="#ff7b72")

        # Parse bold paths for rendering
        bold_tree = ET.parse(bold_path)
        bold_root = bold_tree.getroot()
        outline_d = []
        stroke_d = []
        for g in bold_root.findall(".//{http://www.w3.org/2000/svg}g") or bold_root.findall(".//g"):
            for p in g.findall("{http://www.w3.org/2000/svg}path") or g.findall("path"):
                pid = p.attrib.get("id", "")
                d = p.attrib.get("d", "")
                if "p" in pid and "s" not in pid:
                    outline_d.append(d)
                elif "s" in pid:
                    stroke_d.append(d)

        # Parse ref paths for rendering
        ref_tree = ET.parse(ref_path)
        ref_root = ref_tree.getroot()
        ref_outline_d = []
        ref_stroke_d = []
        for g in ref_root.findall(".//{http://www.w3.org/2000/svg}g") or ref_root.findall(".//g"):
            for p in g.findall("{http://www.w3.org/2000/svg}path") or g.findall("path"):
                pid = p.attrib.get("id", "")
                d = p.attrib.get("d", "")
                if "p" in pid and "s" not in pid:
                    ref_outline_d.append(d)
                elif "s" in pid:
                    ref_stroke_d.append(d)

        # Col 0: Ref rendering
        col0_x = margin
        draw.rectangle([col0_x + 5, y_base + 25, col0_x + cell_w - 10, y_base + cell_h - 10], outline="#30363d", fill="#161b22")
        if ref_outline_d:
            try:
                op = SvgPath(*[seg for d in ref_outline_d for seg in parse_path(d)])
                bx = op.bbox()
                w, h = bx[1] - bx[0], bx[3] - bx[2]
                s = min((cell_w - 40) / max(w, 1), (cell_h - 60) / max(h, 1))
                ox = col0_x + (cell_w - w * s) / 2 - bx[0] * s
                oy = y_base + 35 + (cell_h - 60 - h * s) / 2 - bx[2] * s

                # Render outline mask
                for d in ref_outline_d:
                    p = parse_path(d)
                    pts = [(p.point(t).real * s + ox, p.point(t).imag * s + oy) for t in np.linspace(0, 1, 100)]
                    draw.polygon(pts, fill="#21262d", outline="#8b949e")

                # Render stroke
                for d in ref_stroke_d:
                    sp = parse_path(d)
                    pts = [(sp.point(t).real * s + ox, sp.point(t).imag * s + oy) for t in np.linspace(0, 1, 60)]
                    draw.line(pts, fill="#58a6ff", width=3)
            except Exception:
                pass

        # Col 1: Bold rendering
        col1_x = margin + cell_w
        draw.rectangle([col1_x + 5, y_base + 25, col1_x + cell_w - 10, y_base + cell_h - 10], outline="#30363d", fill="#161b22")
        if outline_d:
            try:
                op = SvgPath(*[seg for d in outline_d for seg in parse_path(d)])
                bx = op.bbox()
                w, h = bx[1] - bx[0], bx[3] - bx[2]
                s = min((cell_w - 40) / max(w, 1), (cell_h - 60) / max(h, 1))
                ox = col1_x + (cell_w - w * s) / 2 - bx[0] * s
                oy = y_base + 35 + (cell_h - 60 - h * s) / 2 - bx[2] * s

                for d in outline_d:
                    p = parse_path(d)
                    pts = [(p.point(t).real * s + ox, p.point(t).imag * s + oy) for t in np.linspace(0, 1, 100)]
                    draw.polygon(pts, fill="#21262d", outline="#ff7b72")

                for d in stroke_d:
                    sp = parse_path(d)
                    pts = [(sp.point(t).real * s + ox, sp.point(t).imag * s + oy) for t in np.linspace(0, 1, 60)]
                    draw.line(pts, fill="#3fb950", width=4)
            except Exception:
                pass

        # Col 2: Heatmap EDT overlay
        col2_x = margin + 2 * cell_w
        draw.rectangle([col2_x + 5, y_base + 25, col2_x + cell_w - 10, y_base + cell_h - 10], outline="#30363d", fill="#000000")
        if outline_d:
            try:
                op = SvgPath(*[seg for d in outline_d for seg in parse_path(d)])
                bx = op.bbox()
                w, h = bx[1] - bx[0], bx[3] - bx[2]
                s = min((cell_w - 40) / max(w, 1), (cell_h - 60) / max(h, 1))
                ox = col2_x + (cell_w - w * s) / 2 - bx[0] * s
                oy = y_base + 35 + (cell_h - 60 - h * s) / 2 - bx[2] * s

                # Compute EDT patch
                mask_w = int(w * s) + 20
                mask_h = int(h * s) + 20
                mask_img = Image.new("1", (mask_w, mask_h), 0)
                mask_draw = ImageDraw.Draw(mask_img)
                for d in outline_d:
                    p = parse_path(d)
                    sub_pts = [( (p.point(t).real - bx[0]) * s + 10, (p.point(t).imag - bx[2]) * s + 10 ) for t in np.linspace(0, 1, 80)]
                    mask_draw.polygon(sub_pts, fill=1)

                mask_arr = np.array(mask_img, dtype=bool)
                edt = ndi.distance_transform_edt(mask_arr)
                if np.max(edt) > 0:
                    edt_norm = (edt / np.max(edt) * 255).astype(np.uint8)
                    heatmap = Image.fromarray(edt_norm, mode="L").convert("RGB")
                    # Paste onto canvas
                    patch_x = int(col2_x + (cell_w - mask_w) / 2)
                    patch_y = int(y_base + 35 + (cell_h - 60 - mask_h) / 2)
                    canvas.paste(heatmap, (patch_x, patch_y))

                # Overlay bold stroke in bright red/cyan
                for d in stroke_d:
                    sp = parse_path(d)
                    pts = [(sp.point(t).real * s + ox, sp.point(t).imag * s + oy) for t in np.linspace(0, 1, 60)]
                    draw.line(pts, fill="#00ffff", width=3)
            except Exception:
                pass

    os.makedirs(os.path.dirname(output_png_path), exist_ok=True)
    canvas.save(output_png_path)
    print(f"✓ Saved visual accuracy comparison sheet: {output_png_path}")


def main():
    repo_root = Path(__file__).resolve().parent.parent.parent.parent
    bold_dir = str(repo_root / "output" / "preview_svgs" / "bold")
    ref_dir = str(repo_root / "output" / "preview_svgs" / "ref")
    catalog_path = str(repo_root / "output" / "preview_svgs" / "catalog.json")

    if not os.path.exists(catalog_path):
        print(f"Error: Catalog not found at {catalog_path}")
        return 1

    with open(catalog_path, "r", encoding="utf-8") as f:
        catalog = json.load(f)

    print(f"Benchmarking {len(catalog)} characters against target glyph outlines...")
    scores = []
    for label, fname, cat in catalog:
        ref_p = os.path.join(ref_dir, fname)
        bold_p = os.path.join(bold_dir, fname)
        res = evaluate_character_accuracy(ref_p, bold_p)
        scores.append((label, fname, cat, res))

    avg_centeredness = np.mean([s[3]["ridge_centeredness"] for s in scores])
    avg_containment = np.mean([s[3]["ink_containment"] for s in scores])
    avg_endpoint = np.mean([s[3]["endpoint_accuracy"] for s in scores])
    avg_overall = np.mean([s[3]["overall_score"] for s in scores])

    print("\n==================================================================")
    print("📊 CURRENT ACCURACY BENCHMARK REPORT")
    print("==================================================================")
    print(f"• Medial Ridge Centeredness:  {avg_centeredness:.1f}%")
    print(f"• Ink Boundary Containment:   {avg_containment:.1f}%")
    print(f"• Terminal Cap Alignment:     {avg_endpoint:.1f}%")
    print(f"★ OVERALL ACCURACY SCORE:     {avg_overall:.1f}%")
    print("==================================================================")

    # Render visual comparison for top showcase characters
    artifact_dir = "/Users/tejas/.gemini/antigravity-ide/brain/2e41c40f-97e9-4d0c-8193-4aacbe625fad"
    out_png = os.path.join(artifact_dir, "stroke_accuracy_comparison.png")

    showcase_chars = ["ક", "અ", "ક્ષ", "જ્ઞ", "૦", "૧"]
    showcase_items = [item for item in catalog if item[0] in showcase_chars][:6]
    if not showcase_items:
        showcase_items = catalog[:6]

    render_comparison_grid(showcase_items, ref_dir, bold_dir, out_png)
    return 0


if __name__ == "__main__":
    sys.exit(main())
