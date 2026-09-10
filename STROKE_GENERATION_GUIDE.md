# 🖋️ Automated Gujarati Font Center Stroke Generator

An automated computer-vision and computational-geometry pipeline to generate animated centerline strokes (`g0s0`, `g0s1`, etc.) for **any Gujarati font**, eliminating the need for manual Inkscape path interpolation (which previously took 15 days).

The output SVGs are **100% drop-in compatible** with the **Kano** React Native application's drawing animation system ([`AnimatedCharacter.tsx`](file:///Users/tejas/Desktop/GitHub/Kano/Kano/app/components/AnimatedCharacter.tsx) and [`useSvgReader.ts`](file:///Users/tejas/Desktop/GitHub/Kano/Kano/app/hooks/useSvgReader.ts)).

---

## ⚡ The Problem & The Solution

### Why Manual Tracing Took 15 Days
In the Kano app, character stroke animations rely on two types of paths inside each `<g id="gX">` group:
1. **Glyph Outline (`gXp0`)**: The filled boundary path of the character glyph (used as a clip-path and background hint).
2. **Centerline Strokes (`gXs0`, `gXs1`, ...)**: Single-line center paths that animate via `strokeDashoffset` from `length` to `0` in exact handwriting order and direction.

Previously, for each of the 521 characters (kakko, barakhdi, numerals), you had to:
1. Open the glyph in Inkscape.
2. Manually separate the inner and outer contour boundaries.
3. Run `Extensions > Generate from Path > Interpolate` with step 1.
4. Manually re-orient the stroke direction (start to finish).
5. Repeat for 521 characters (taking ~15 days per font!).

### How This Script Automates It in ~30 Seconds
[`generate_strokes.py`](file:///Users/tejas/Desktop/GitHub/gujarati-language-gen/generate_strokes.py) leverages your curated 521 reference templates in `interpolate-svg/` combined with **Medial Axis Ridge Snapping**:
1. **HarfBuzz + FontTools Glyph Shaping**: Automatically renders and extracts the exact vector contours for any target `.ttf` / `.otf` font file.
2. **Topology & Handwriting Preservation**: Inherits the semantic grouping (`g0`, `g1`), stroke count, stroke order, and drawing direction from the reference template.
3. **Medial Ridge Snapping (Euclidean Distance Transform)**: Rather than naive linear scaling, the script evaluates the distance field of the new font's glyph and searches along stroke normal vectors to magnetically snap each point to the exact physical centerline (the maximal ridge of $\nabla D$).
4. **Smooth Cubic Bézier Fitting**: Converts the snapped centerline points into smooth Catmull-Rom cubic Bézier curves (`C ...`), avoiding any raster artifacts or sharp corners.

---

## 🚀 Quick Start

### 1. Requirements & Setup
The project uses the Python virtual environment in `.venv/`:
```bash
# Activate virtual environment
source .venv/bin/activate

# Dependencies (already installed in .venv)
# numpy, scipy, pillow, fonttools, svgpathtools, uharfbuzz, scikit-image
pip install -r requirements.txt
```

### 2. Generate for Any Font

#### Generate All 521 Characters & Numbers:
```bash
python generate_strokes.py \
  --font fonts/Noto_Sans_Gujarati/NotoSansGujarati-Bold.ttf \
  --output-dir generated_svgs/bold/ \
  --workers 4
```

#### Generate Only Numerals (0–100):
```bash
python generate_strokes.py \
  --font fonts/Noto_Sans_Gujarati/NotoSansGujarati-Bold.ttf \
  --output-dir generated_svgs/bold/ \
  --category numbers
```

#### Generate Only Barakhadi:
```bash
python generate_strokes.py \
  --font fonts/Noto_Sans_Gujarati/NotoSansGujarati-Bold.ttf \
  --output-dir generated_svgs/bold/ \
  --category barakhadi
```

#### Test a Single Character:
```bash
python generate_strokes.py \
  --font fonts/Noto_Sans_Gujarati/NotoSansGujarati-Bold.ttf \
  --char "ક" \
  --output-dir test_out/
```

---

## 📱 Integration with Kano React Native App

Once generated, simply copy the output directories into the Kano app:
```bash
# Copy generated SVGs to Kano's assets folder
cp -r generated_svgs/bold/barakhadi/ /Users/tejas/Desktop/GitHub/Kano/Kano/assets/svgs/barakhadi/
cp -r generated_svgs/bold/numbers/ /Users/tejas/Desktop/GitHub/Kano/Kano/assets/svgs/numbers/
```

Kano's [`useSvgReader.ts`](file:///Users/tejas/Desktop/GitHub/Kano/Kano/app/hooks/useSvgReader.ts) will automatically parse the new glyphs and [`AnimatedCharacter.tsx`](file:///Users/tejas/Desktop/GitHub/Kano/Kano/app/components/AnimatedCharacter.tsx) will animate them flawlessly.

---

## 🖥️ Visual Inspection & Testing Tool

Open [`viewer.html`](file:///Users/tejas/Desktop/GitHub/gujarati-language-gen/viewer.html) in any web browser to see the stroke animation live:
- Side-by-side comparison between the reference font (Light) and auto-generated font (Bold).
- Scrubbable controls to replay animations, inspect outlines, and toggle centerlines.
