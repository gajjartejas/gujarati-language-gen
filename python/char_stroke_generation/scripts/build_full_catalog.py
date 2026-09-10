#!/usr/bin/env python3
"""
build_full_catalog.py: Batch generator for all 521 characters (Kakko, Barakhadi, Numbers).
Normalizes reference SVGs (viewBox fix) and generates bold medial-ridge snapped SVGs.
Emits docs/assets/catalog.json and docs/assets/catalog.js.
"""

import json
import os
import re
import sys
import time
import xml.etree.ElementTree as ET
from concurrent.futures import ProcessPoolExecutor, as_completed
from pathlib import Path
from typing import Dict, List, Tuple

package_root = Path(__file__).resolve().parent.parent
if str(package_root) not in sys.path:
    sys.path.insert(0, str(package_root))

from stroke_generator.pipeline import process_single_svg


def get_repo_root() -> Path:
    p = Path(__file__).resolve()
    for parent in p.parents:
        if (parent / "resources").exists() and (parent / "fonts").exists():
            return parent
    return p.parent.parent.parent.parent


def normalize_ref_svg(src_path: str, dest_path: str) -> bool:
    """Copies reference SVG while ensuring an explicit, correct viewBox attribute."""
    try:
        os.makedirs(os.path.dirname(dest_path), exist_ok=True)
        with open(src_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Parse root svg tag
        tree = ET.fromstring(content)
        w_str = tree.attrib.get("width", "100")
        h_str = tree.attrib.get("height", "100")
        viewbox = tree.attrib.get("viewBox")

        w = float(re.findall(r"[\d.]+", w_str)[0]) if re.findall(r"[\d.]+", w_str) else 100.0
        h = float(re.findall(r"[\d.]+", h_str)[0]) if re.findall(r"[\d.]+", h_str) else 100.0

        if not viewbox:
            # Inject viewBox into the SVG text directly to preserve namespaces & comments
            tree.set("viewBox", f"0 0 {w:.2f} {h:.2f}")
            # Format nicely
            svg_tag_match = re.search(r"<svg[^>]*>", content)
            if svg_tag_match:
                orig_tag = svg_tag_match.group(0)
                if "viewBox" not in orig_tag:
                    new_tag = orig_tag[:-1] + f' viewBox="0 0 {w:.2f} {h:.2f}">'
                    content = content[:svg_tag_match.start()] + new_tag + content[svg_tag_match.end():]

        with open(dest_path, "w", encoding="utf-8") as f:
            f.write(content)
        return True
    except Exception as e:
        print(f"Error normalizing SVG {src_path}: {e}")
        return False


def count_strokes_in_svg(svg_path: str) -> int:
    try:
        with open(svg_path, "r", encoding="utf-8") as f:
            c = f.read()
        return len(re.findall(r'id=["\']g\d+s\d+["\']', c))
    except Exception:
        return 1


def main():
    root = get_repo_root()
    font_path = str(root / "fonts" / "Noto_Sans_Gujarati" / "NotoSansGujarati-Bold.ttf")
    templates_dir = root / "interpolate-svg" / "svgs"
    res_dir = root / "resources"
    docs_dir = root / "docs"

    ref_out_dir = docs_dir / "assets" / "svgs" / "ref"
    bold_out_dir = docs_dir / "assets" / "svgs" / "bold"

    with open(res_dir / "kakko" / "kakko.json", "r", encoding="utf-8") as f:
        kakko_data = json.load(f)

    with open(res_dir / "barakhdi" / "barakhdi.json", "r", encoding="utf-8") as f:
        barakhdi_data = json.load(f)

    with open(res_dir / "numerals" / "numerals.json", "r", encoding="utf-8") as f:
        numerals_data = json.load(f)

    catalog: List[Dict] = []
    bold_tasks: List[Tuple[str, str, str, str]] = []

    print("📚 Building catalog and normalizing reference SVGs...")

    # 1. KAKKO (45 items: 34 consonants + 11 vowels)
    for item in kakko_data:
        kid = item["id"]
        char_str = item["gu"]
        en_name = item["en"]

        # Determine reference SVG from interpolate-svg
        if kid <= 34:
            # Consonant (1_k to 34_gy)
            # Find matching dir in barakhadi
            dirs = [d for d in os.listdir(templates_dir / "barakhadi") if d.startswith(f"{kid}_")]
            if dirs:
                dir_name = dirs[0]
                # Consonant base is file starting with 0_
                base_files = [f for f in os.listdir(templates_dir / "barakhadi" / dir_name) if f.startswith("0_")]
                if base_files:
                    src_ref = str(templates_dir / "barakhadi" / dir_name / base_files[0])
                else:
                    src_ref = ""
            else:
                src_ref = ""
            cat_type = "consonant"
        else:
            # Vowel (35_a to 45_am in 0_aa)
            vowel_map = {
                35: "0_aa.svg", 36: "1_aa.svg", 37: "2_i.svg", 38: "3_ee.svg",
                39: "4_u.svg", 40: "5_oo.svg", 41: "", 42: "6_e.svg",
                43: "7_ai.svg", 44: "8_o.svg", 45: "10_am_or_an.svg"
            }
            fname = vowel_map.get(kid, "")
            if fname and (templates_dir / "barakhadi" / "0_aa" / fname).exists():
                src_ref = str(templates_dir / "barakhadi" / "0_aa" / fname)
            else:
                src_ref = ""
            cat_type = "vowel"

        if not src_ref or not os.path.exists(src_ref):
            continue

        rel_ref = f"assets/svgs/ref/kakko/{kid}_{en_name.lower().replace(' / ', '_')}.svg"
        rel_bold = f"assets/svgs/bold/kakko/{kid}_{en_name.lower().replace(' / ', '_')}.svg"
        dest_ref = str(docs_dir / rel_ref)
        dest_bold = str(docs_dir / rel_bold)

        # Audio
        # Find audio in kakko/audio
        audio_files = [f for f in os.listdir(res_dir / "kakko" / "audio") if f.startswith(f"{kid}_")]
        rel_audio = f"assets/audio/kakko/{audio_files[0].replace('.wav', '.mp3')}" if audio_files else ""

        normalize_ref_svg(src_ref, dest_ref)
        bold_tasks.append((dest_ref, font_path, char_str, dest_bold))

        catalog.append({
            "id": f"kakko_{kid}",
            "char": char_str,
            "en": en_name,
            "category": "kakko",
            "type": cat_type,
            "num": kid,
            "ref_svg": rel_ref,
            "bold_svg": rel_bold,
            "audio": rel_audio,
            "stroke_count": count_strokes_in_svg(dest_ref)
        })

    # 2. BARAKHADI (35 groups x 12 forms = 420 items)
    vowel_labels = ["અ", "આ", "ઇ", "ઈ", "ઉ", "ઊ", "એ", "ઐ", "ઓ", "ઔ", "અં", "અઃ"]
    for group in barakhdi_data:
        gid = group["id"]
        group_gu = group["gu"]
        group_en = group["en"]

        dirs = [d for d in os.listdir(templates_dir / "barakhadi") if d.startswith(f"{gid}_")]
        if not dirs:
            continue
        dir_name = dirs[0]

        for ch in group["chars"]:
            cid = ch["id"]
            cen = ch["en"].replace(" / ", "_or_").lower()
            char_str = ch["gu"]
            src_ref = str(templates_dir / "barakhadi" / dir_name / f"{cid}_{cen}.svg")
            if not os.path.exists(src_ref):
                continue

            rel_ref = f"assets/svgs/ref/barakhadi/{dir_name}/{cid}_{cen}.svg"
            rel_bold = f"assets/svgs/bold/barakhadi/{dir_name}/{cid}_{cen}.svg"
            dest_ref = str(docs_dir / rel_ref)
            dest_bold = str(docs_dir / rel_bold)

            rel_audio = f"assets/audio/barakhadi/{dir_name}/{cid}_{cen}.mp3"

            normalize_ref_svg(src_ref, dest_ref)
            bold_tasks.append((dest_ref, font_path, char_str, dest_bold))

            vowel_sign = vowel_labels[cid] if cid < len(vowel_labels) else ""
            catalog.append({
                "id": f"barakhadi_{gid}_{cid}",
                "char": char_str,
                "base_char": group_gu,
                "base_id": gid,
                "vowel_idx": cid,
                "vowel_sign": vowel_sign,
                "en": ch["en"],
                "group_en": group_en,
                "category": "barakhadi",
                "group": dir_name,
                "ref_svg": rel_ref,
                "bold_svg": rel_bold,
                "audio": rel_audio,
                "stroke_count": count_strokes_in_svg(dest_ref)
            })

    # 3. NUMERALS (101 items: 0 to 100)
    for num_item in numerals_data:
        nid = num_item["id"]
        char_str = num_item["gu"]
        src_ref = str(templates_dir / "numbers" / f"{nid}_num.svg")
        if not os.path.exists(src_ref):
            continue

        rel_ref = f"assets/svgs/ref/numbers/{nid}.svg"
        rel_bold = f"assets/svgs/bold/numbers/{nid}.svg"
        dest_ref = str(docs_dir / rel_ref)
        dest_bold = str(docs_dir / rel_bold)

        rel_audio = f"assets/audio/numbers/{nid}.mp3"

        normalize_ref_svg(src_ref, dest_ref)
        bold_tasks.append((dest_ref, font_path, char_str, dest_bold))

        catalog.append({
            "id": f"num_{nid}",
            "char": char_str,
            "num": nid,
            "name_gu": num_item.get("name_gu", ""),
            "name_en": num_item.get("name_en", ""),
            "category": "numbers",
            "ref_svg": rel_ref,
            "bold_svg": rel_bold,
            "audio": rel_audio,
            "stroke_count": count_strokes_in_svg(dest_ref)
        })

    print(f"📊 Catalog assembled with {len(catalog)} characters:")
    print(f"   - Kakko: {len([c for c in catalog if c['category'] == 'kakko'])}")
    print(f"   - Barakhadi: {len([c for c in catalog if c['category'] == 'barakhadi'])}")
    print(f"   - Numbers: {len([c for c in catalog if c['category'] == 'numbers'])}")

    # Check which bold SVGs already exist to avoid redundant regeneration
    tasks_to_run = []
    for ref, font, txt, out in bold_tasks:
        if not os.path.exists(out) or os.path.getsize(out) < 200:
            tasks_to_run.append((ref, font, txt, out))

    print(f"⚡ Generating {len(tasks_to_run)} bold SVGs (out of {len(bold_tasks)} total) using {os.cpu_count()} worker processes...")
    t0 = time.time()
    success = 0

    if tasks_to_run:
        with ProcessPoolExecutor(max_workers=os.cpu_count() or 4) as executor:
            futures = {
                executor.submit(process_single_svg, ref, font, txt, out): (txt, out)
                for (ref, font, txt, out) in tasks_to_run
            }
            done_cnt = 0
            for f in as_completed(futures):
                done_cnt += 1
                txt, out = futures[f]
                try:
                    res = f.result()
                    if res:
                        success += 1
                except Exception as e:
                    print(f"⚠️ Error on '{txt}': {e}", flush=True)

                if done_cnt % 50 == 0 or done_cnt == len(tasks_to_run):
                    print(f"   Progress: {done_cnt}/{len(tasks_to_run)} ({done_cnt * 100 // len(tasks_to_run)}%)...", flush=True)

    dt = time.time() - t0
    print(f"✓ Generated {success} bold SVGs in {dt:.2f}s!")

    # Save catalog.json
    cat_json_path = docs_dir / "assets" / "catalog.json"
    with open(cat_json_path, "w", encoding="utf-8") as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)

    # Save catalog.js for local/CORS-free execution
    cat_js_path = docs_dir / "assets" / "catalog.js"
    with open(cat_js_path, "w", encoding="utf-8") as f:
        f.write("// Auto-generated Gujarati character catalog (521 items)\n")
        f.write("window.GUJARATI_CATALOG = ")
        json.dump(catalog, f, ensure_ascii=False)
        f.write(";\n")

    print(f"📁 Saved catalog to {cat_json_path} and {cat_js_path}")


if __name__ == "__main__":
    main()
