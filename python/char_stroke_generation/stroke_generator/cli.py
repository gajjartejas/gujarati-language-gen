"""
stroke_generator.cli: Unified Command Line Interface for stroke extraction,
batch generation, sample creation, and interactive viewer compilation.
"""

import argparse
import http.server
import json
import os
import shutil
import socketserver
import sys
import time
from pathlib import Path
from typing import List, Optional

from stroke_generator.pipeline import (
    process_single_svg,
    run_batch,
)
from stroke_generator.viewer import (
    build_viewer_html,
)

def _find_repo_root() -> Path:
    p = Path(__file__).resolve()
    for parent in p.parents:
        if (parent / "fonts").exists() and (parent / "resources").exists():
            return parent
    return p.parent.parent.parent.parent

REPO_ROOT = _find_repo_root()
DEFAULT_FONT = str(REPO_ROOT / "fonts" / "Noto_Sans_Gujarati" / "NotoSansGujarati-Bold.ttf")
DEFAULT_TEMPLATES = str(REPO_ROOT / "interpolate-svg" / "svgs")
DEFAULT_RESOURCES = str(REPO_ROOT / "resources")


def cmd_generate(args: argparse.Namespace) -> int:
    """Generate stroke-extracted SVG for a single character."""
    ref_path = os.path.abspath(args.ref)
    font_path = os.path.abspath(args.font)
    output_path = os.path.abspath(args.output)
    char = args.char

    if not os.path.exists(ref_path):
        print(f"Error: Reference SVG not found: {ref_path}", file=sys.stderr)
        return 1
    if not os.path.exists(font_path):
        print(f"Error: Font file not found: {font_path}", file=sys.stderr)
        return 1

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    print(f"Generating stroke SVG for '{char}' from {ref_path} -> {output_path}...")
    t0 = time.time()
    res = process_single_svg(ref_path, font_path, char, output_path, target_font_scale=args.scale)
    dt = time.time() - t0
    if res:
        print(f"✓ Successfully generated: {output_path} ({dt:.2f}s)")
        return 0
    else:
        print(f"✗ Failed to generate '{char}'", file=sys.stderr)
        return 1


def cmd_batch(args: argparse.Namespace) -> int:
    """Batch generate stroke SVGs across Barakhadi and Numerals."""
    font_path = os.path.abspath(args.font)
    templates_dir = os.path.abspath(args.templates)
    resources_dir = os.path.abspath(args.resources)
    output_dir = os.path.abspath(args.output_dir)

    success_count = run_batch(
        font_path=font_path,
        templates_dir=templates_dir,
        resources_dir=resources_dir,
        output_dir=output_dir,
        category=args.category,
        workers=args.workers,
    )
    return 0 if success_count > 0 else 1


def cmd_samples(args: argparse.Namespace) -> int:
    """Generate the 56 standard preview characters (vowels, consonants, digits, barakhadi)."""
    font_path = os.path.abspath(args.font)
    templates_dir = os.path.abspath(args.templates)
    resources_dir = os.path.abspath(args.resources)
    output_dir = os.path.abspath(args.output_dir)

    barakhdi_file = os.path.join(resources_dir, "barakhdi", "barakhdi.json")
    numerals_file = os.path.join(resources_dir, "numerals", "numerals.json")

    with open(barakhdi_file, "r", encoding="utf-8") as f:
        b = json.load(f)
    with open(numerals_file, "r", encoding="utf-8") as f:
        nums = json.load(f)

    selection = []

    # 1. Base consonants & vowels (35 items)
    for g in b:
        gid = g["id"]
        barakhadi_dir = os.path.join(templates_dir, "barakhadi")
        dirs = [d for d in os.listdir(barakhadi_dir) if d.startswith(f"{gid}_")]
        if not dirs:
            continue
        dir_name = dirs[0]
        ch = g["chars"][0]
        cid = ch["id"]
        cen = ch["en"].replace(" / ", "_or_").lower()
        ref_path = os.path.join(barakhadi_dir, dir_name, f"{cid}_{cen}.svg")
        cat = "Vowels" if gid == 0 else "Consonants"
        if os.path.exists(ref_path):
            selection.append((ch["gu"], ref_path, f"{dir_name}_{cid}_{cen}.svg", cat))

    # 2. Complete barakhadi for 'ક' (11 items)
    k_group = [g for g in b if g["id"] == 1][0]
    barakhadi_dir = os.path.join(templates_dir, "barakhadi")
    dirs = [d for d in os.listdir(barakhadi_dir) if d.startswith("1_")]
    dir_name = dirs[0]
    for ch in k_group["chars"][1:]:
        cid = ch["id"]
        cen = ch["en"].replace(" / ", "_or_").lower()
        ref_path = os.path.join(barakhadi_dir, dir_name, f"{cid}_{cen}.svg")
        if os.path.exists(ref_path):
            selection.append((ch["gu"], ref_path, f"{dir_name}_{cid}_{cen}.svg", "Barakhadi (ક)"))

    # 3. Numerals 0-9 (10 items)
    for n in nums[:10]:
        nid = n["id"]
        ref_path = os.path.join(templates_dir, "numbers", f"{nid}_num.svg")
        if os.path.exists(ref_path):
            selection.append((n["gu"], ref_path, f"num_{nid}.svg", "Numerals"))

    print(f"Starting generation of {len(selection)} preview characters into {output_dir}...")
    ref_dir = os.path.join(output_dir, "ref")
    bold_dir = os.path.join(output_dir, "bold")
    os.makedirs(ref_dir, exist_ok=True)
    os.makedirs(bold_dir, exist_ok=True)

    start_time = time.time()
    success_count = 0
    generated_items = []

    for ch_gu, ref_p, fname, cat in selection:
        dest_ref = os.path.join(ref_dir, fname)
        shutil.copyfile(ref_p, dest_ref)
        out_p = os.path.join(bold_dir, fname)

        t0 = time.time()
        try:
            res = process_single_svg(ref_p, font_path, ch_gu, out_p)
            dt = time.time() - t0
            if res:
                success_count += 1
                generated_items.append((ch_gu, fname, cat))
                print(f"[{success_count:02d}/{len(selection)}] {ch_gu} ({fname}) -> ok ({dt:.3f}s)")
            else:
                print(f"[FAIL] {ch_gu} ({fname}) -> returned False")
        except Exception as e:
            print(f"[ERROR] {ch_gu} ({fname}) -> {e}")

    total_time = time.time() - start_time
    print(f"\nDone! Successfully generated {success_count}/{len(selection)} SVGs in {total_time:.2f}s")

    catalog_file = os.path.join(output_dir, "catalog.json")
    with open(catalog_file, "w", encoding="utf-8") as f:
        json.dump(generated_items, f, ensure_ascii=False, indent=2)
    print(f"Saved catalog to: {catalog_file}")

    return 0 if success_count == len(selection) else 1


def cmd_viewer(args: argparse.Namespace) -> int:
    """Compile the standalone interactive HTML viewer."""
    catalog_path = os.path.abspath(args.catalog)
    ref_dir = os.path.abspath(args.ref_dir)
    bold_dir = os.path.abspath(args.bold_dir)
    output_html = os.path.abspath(args.output)

    print(f"Compiling viewer: {output_html} (using catalog: {catalog_path})")
    count = build_viewer_html(
        catalog_path=catalog_path,
        ref_dir=ref_dir,
        bold_dir=bold_dir,
        output_html_path=output_html,
    )
    print(f"✓ Successfully built viewer with {count} characters at: {output_html}")

    if args.serve:
        port = args.serve
        serve_dir = os.path.dirname(output_html) or "."
        os.chdir(serve_dir)
        print(f"\nStarting HTTP preview server at http://localhost:{port}/ ... (Press Ctrl+C to stop)")
        handler = http.server.SimpleHTTPRequestHandler
        with socketserver.TCPServer(("", port), handler) as httpd:
            try:
                httpd.serve_forever()
            except KeyboardInterrupt:
                print("\nServer stopped.")
    return 0


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(
        prog="stroke-gen",
        description="Medial stroke extractor and animated SVG synthesizer for Gujarati script.",
    )
    subparsers = parser.add_subparsers(dest="command", help="Available subcommands")

    # Command: generate
    p_gen = subparsers.add_parser("generate", help="Generate stroke SVG for a single character")
    p_gen.add_argument("--ref", "-r", required=True, help="Path to reference Inkscape SVG template")
    p_gen.add_argument("--char", "-c", required=True, help="Gujarati character string (e.g. 'ક', 'અ', 'ક્ષ')")
    p_gen.add_argument("--font", "-f", default=DEFAULT_FONT, help="Path to TTF/OTF font file")
    p_gen.add_argument("--output", "-o", default="output.svg", help="Output SVG destination path")
    p_gen.add_argument("--scale", type=float, default=100.0, help="Target font UPEM scale factor")

    # Command: batch
    p_batch = subparsers.add_parser("batch", help="Batch process multiple characters across categories")
    p_batch.add_argument("--font", "-f", default=DEFAULT_FONT, help="Path to TTF/OTF font file")
    p_batch.add_argument("--templates", default=DEFAULT_TEMPLATES, help="Path to interpolate-svg templates")
    p_batch.add_argument("--resources", default=DEFAULT_RESOURCES, help="Path to resources directory")
    p_batch.add_argument("--output-dir", "-o", default="output/generated_svgs", help="Output directory")
    p_batch.add_argument("--category", choices=["all", "barakhadi", "numbers", "numerals"], default="all")
    p_batch.add_argument("--workers", "-w", type=int, default=4, help="Parallel worker processes")

    # Command: samples
    p_samples = subparsers.add_parser("samples", help="Generate the 56 standard showcase preview characters")
    p_samples.add_argument("--font", "-f", default=DEFAULT_FONT, help="Path to TTF/OTF font file")
    p_samples.add_argument("--templates", default=DEFAULT_TEMPLATES, help="Path to interpolate-svg templates")
    p_samples.add_argument("--resources", default=DEFAULT_RESOURCES, help="Path to resources directory")
    p_samples.add_argument("--output-dir", "-o", default="output/preview_svgs", help="Output directory")

    # Command: viewer
    p_viewer = subparsers.add_parser("viewer", help="Compile the interactive HTML viewer")
    p_viewer.add_argument("--catalog", default="output/preview_svgs/catalog.json", help="Path to catalog.json")
    p_viewer.add_argument("--ref-dir", default="output/preview_svgs/ref", help="Path to reference SVGs directory")
    p_viewer.add_argument("--bold-dir", default="output/preview_svgs/bold", help="Path to generated bold SVGs directory")
    p_viewer.add_argument("--output", "-o", default="viewer.html", help="Path to output HTML file")
    p_viewer.add_argument("--serve", type=int, nargs="?", const=8765, help="Serve on local HTTP port (default 8765)")

    args = parser.parse_args(argv)
    if not args.command:
        parser.print_help()
        return 1

    if args.command == "generate":
        return cmd_generate(args)
    elif args.command == "batch":
        return cmd_batch(args)
    elif args.command == "samples":
        return cmd_samples(args)
    elif args.command == "viewer":
        return cmd_viewer(args)
    return 0


if __name__ == "__main__":
    sys.exit(main())
