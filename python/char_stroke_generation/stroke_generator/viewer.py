"""
Interactive animation viewer and preview HTML compiler.
"""

import json
import os
from typing import Dict, List, Tuple


def build_viewer_html(
    catalog_path: str = 'output/preview_svgs/catalog.json',
    ref_dir: str = 'output/preview_svgs/ref',
    bold_dir: str = 'output/preview_svgs/bold',
    output_html_path: str = 'viewer.html',
) -> int:
    """
    Compiles an interactive web previewer embedding all showcase character SVGs.

    Args:
        catalog_path: Path to the JSON catalog file containing [char, filename, category].
        ref_dir: Directory containing reference (Light) SVGs.
        bold_dir: Directory containing auto-generated (Bold) SVGs.
        output_html_path: Destination path for the standalone HTML file.

    Returns:
        Number of characters embedded in the viewer.
    """
    if not os.path.exists(catalog_path):
        # Fallback to legacy preview_svgs directory if present
        legacy_catalog = 'preview_svgs/catalog.json'
        if os.path.exists(legacy_catalog):
            catalog_path = legacy_catalog
            ref_dir = 'preview_svgs/ref'
            bold_dir = 'preview_svgs/bold'
        else:
            raise FileNotFoundError(f"Catalog file not found: {catalog_path}")

    with open(catalog_path, 'r', encoding='utf-8') as f:
        catalog: List[Tuple[str, str, str]] = json.load(f)

    data: Dict[str, dict] = {}
    for label, filename, category in catalog:
        ref_path = os.path.join(ref_dir, filename)
        bold_path = os.path.join(bold_dir, filename)
        if os.path.exists(ref_path) and os.path.exists(bold_path):
            with open(ref_path, 'r', encoding='utf-8') as f:
                ref_svg = f.read()
            with open(bold_path, 'r', encoding='utf-8') as f:
                bold_svg = f.read()
            data[label] = {
                'filename': filename,
                'category': category,
                'ref': ref_svg,
                'bold': bold_svg
            }

    json_data_str = json.dumps(data)

    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gujarati Font Stroke Animator & Tester ({len(data)} Characters)</title>
  <style>
    :root {{
      --bg: #0d1117;
      --card-bg: #161b22;
      --border: #30363d;
      --accent: #ff6b35;
      --accent-glow: rgba(255, 107, 53, 0.25);
      --text: #c9d1d9;
      --text-bright: #ffffff;
      --green: #238636;
      --green-hover: #2ea043;
      --blue: #1f6feb;
    }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 24px 20px;
    }}
    header {{
      text-align: center;
      margin-bottom: 20px;
    }}
    h1 {{
      font-size: 26px;
      color: var(--text-bright);
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
    }}
    p.subtitle {{
      font-size: 14px;
      color: #8b949e;
    }}

    .char-section {{
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 14px;
      padding: 14px 18px;
      max-width: 960px;
      width: 100%;
      margin-bottom: 22px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    }}

    .cat-tabs {{
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
      border-bottom: 1px solid var(--border);
      padding-bottom: 10px;
      flex-wrap: wrap;
    }}
    .cat-tab {{
      background: #21262d;
      color: var(--text);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 6px 14px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s;
    }}
    .cat-tab:hover {{
      background: #30363d;
      color: var(--text-bright);
    }}
    .cat-tab.active {{
      background: var(--blue);
      color: white;
      border-color: var(--blue);
    }}

    .char-grid {{
      display: flex;
      flex-wrap: wrap;
      gap: 7px;
      max-height: 170px;
      overflow-y: auto;
      padding: 4px 2px;
    }}
    .char-grid::-webkit-scrollbar {{
      width: 6px;
    }}
    .char-grid::-webkit-scrollbar-thumb {{
      background: #30363d;
      border-radius: 3px;
    }}

    .char-btn {{
      background: #21262d;
      color: var(--text-bright);
      border: 1px solid var(--border);
      border-radius: 8px;
      font-size: 17px;
      width: 42px;
      height: 42px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s;
      flex-shrink: 0;
    }}
    .char-btn:hover {{
      background: #30363d;
      transform: translateY(-2px);
    }}
    .char-btn.active {{
      background: var(--accent);
      color: white;
      border-color: var(--accent);
      box-shadow: 0 0 12px var(--accent-glow);
    }}

    .container {{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 22px;
      max-width: 960px;
      width: 100%;
      margin-bottom: 20px;
    }}
    .card {{
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      box-shadow: 0 10px 30px rgba(0,0,0,0.4);
      position: relative;
    }}
    .card-title {{
      font-size: 14px;
      font-weight: 600;
      color: #58a6ff;
      margin-bottom: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }}
    .svg-stage {{
      width: 280px;
      height: 280px;
      background: #090d13;
      border: 1px dashed #30363d;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      margin-bottom: 14px;
      padding: 16px;
    }}
    .svg-stage svg {{
      width: 100%;
      height: 100%;
      max-width: 240px;
      max-height: 240px;
      overflow: visible;
    }}
    .controls {{
      display: flex;
      gap: 12px;
      align-items: center;
      flex-wrap: wrap;
      justify-content: center;
      max-width: 960px;
      margin-bottom: 20px;
    }}
    button.action-btn {{
      background: var(--green);
      color: white;
      border: none;
      padding: 9px 20px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: background 0.15s, transform 0.1s;
    }}
    button.action-btn:hover {{
      background: var(--green-hover);
      transform: translateY(-1px);
    }}
    button.action-btn.secondary {{
      background: #21262d;
      border: 1px solid var(--border);
      color: var(--text);
    }}
    button.action-btn.secondary:hover {{
      background: #30363d;
      color: var(--text-bright);
    }}
    button.action-btn.secondary.active {{
      background: #1f6feb;
      border-color: #1f6feb;
      color: white;
    }}
    .speed-control {{
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 6px 14px;
      font-size: 13px;
    }}
    .speed-control input {{
      accent-color: var(--accent);
      cursor: pointer;
    }}

    .badge {{
      display: inline-block;
      font-size: 11px;
      font-weight: 600;
      padding: 3px 10px;
      border-radius: 12px;
      margin-top: 4px;
    }}
    .badge-ref {{ background: rgba(88, 166, 255, 0.15); color: #58a6ff; border: 1px solid rgba(88, 166, 255, 0.3); }}
    .badge-auto {{ background: rgba(35, 134, 54, 0.15); color: #3fb950; border: 1px solid rgba(35, 134, 54, 0.3); }}

    .info-box {{
      max-width: 960px;
      width: 100%;
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 16px 20px;
      font-size: 13px;
      line-height: 1.6;
    }}
    .info-box h4 {{
      color: var(--text-bright);
      margin-bottom: 6px;
      font-size: 14px;
    }}
    .info-box p {{
      color: #8b949e;
    }}
    code {{
      background: #21262d;
      padding: 2px 5px;
      border-radius: 4px;
      font-family: monospace;
      color: #f0883e;
    }}
  </style>
</head>
<body>

  <header>
    <h1>🖋️ Gujarati Animated Stroke Preview ({len(data)} Chars)</h1>
    <p class="subtitle">Reference Template (Noto Sans Light) vs Auto-Generated Medial Ridge Snapped (Noto Sans Bold)</p>
  </header>

  <div class="char-section">
    <div class="cat-tabs" id="cat-tabs">
      <button class="cat-tab active" onclick="filterCategory('All')">All ({len(data)})</button>
      <button class="cat-tab" onclick="filterCategory('Consonants')">Consonants (34)</button>
      <button class="cat-tab" onclick="filterCategory('Barakhadi (ક)')">Barakhadi ક (11)</button>
      <button class="cat-tab" onclick="filterCategory('Numerals')">Numerals ૦-૯ (10)</button>
      <button class="cat-tab" onclick="filterCategory('Vowels')">Vowels (1)</button>
    </div>
    <div class="char-grid" id="char-buttons"></div>
  </div>

  <div class="container">
    <!-- Reference Card -->
    <div class="card">
      <div class="card-title">
        <span>📄 Reference (Light)</span>
      </div>
      <div class="svg-stage" id="stage-ref"></div>
      <span class="badge badge-ref">15 Days Manual Inkscape Work</span>
    </div>

    <!-- Generated Card -->
    <div class="card">
      <div class="card-title">
        <span>⚡ Auto-Generated (Bold)</span>
      </div>
      <div class="svg-stage" id="stage-gen"></div>
      <span class="badge badge-auto">Generated & Snapped in 0.05s</span>
    </div>
  </div>

  <div class="controls">
    <button class="action-btn" onclick="playCurrent()">▶ Replay Animation</button>
    <button class="action-btn secondary" id="btn-toggle-outline" onclick="toggleOutline()">Toggle Outlines</button>
    <button class="action-btn secondary" id="btn-toggle-centerlines" onclick="toggleCenterlinesOnly()">Toggle Centerlines Only</button>
    <div class="speed-control">
      <span>Speed:</span>
      <input type="range" id="speed" min="0.25" max="2" step="0.25" value="0.75" oninput="onSpeedChange()">
      <span id="speed-val">0.75x</span>
    </div>
  </div>

  <div class="info-box">
    <h4>✨ How it animates in Kano:</h4>
    <p>
      In your React Native Kano app, <code>AnimatedCharacter</code> clips each center stroke using the glyph outline path (<code>gXp0</code>).
      As each stroke animates from <code>strokeDashoffset = length</code> down to <code>0</code>, it reveals the character from starting point to ending point in exact handwriting order.
    </p>
  </div>

  <script>
    const CHAR_DATA = {json_data_str};

    let currentChar = 'ક';
    let currentCategory = 'All';
    let showOutline = true;
    let centerlinesOnly = false;
    let animSpeed = 0.75;
    let activeTimers = [];

    function init() {{
      renderCharButtons();
      loadChar(currentChar);
    }}

    function filterCategory(cat) {{
      currentCategory = cat;
      document.querySelectorAll('.cat-tab').forEach(t => {{
        t.classList.toggle('active', t.innerText.startsWith(cat));
      }});
      renderCharButtons();
    }}

    function renderCharButtons() {{
      const btnContainer = document.getElementById('char-buttons');
      btnContainer.innerHTML = '';
      Object.keys(CHAR_DATA).forEach((char) => {{
        const item = CHAR_DATA[char];
        if (currentCategory !== 'All' && item.category !== currentCategory) {{
          return;
        }}
        const btn = document.createElement('button');
        btn.className = 'char-btn' + (char === currentChar ? ' active' : '');
        btn.innerText = char;
        btn.title = `${{char}} (${{item.category}})`;
        btn.onclick = () => selectChar(char);
        btnContainer.appendChild(btn);
      }});
    }}

    function selectChar(char) {{
      currentChar = char;
      document.querySelectorAll('.char-btn').forEach(btn => {{
        btn.classList.toggle('active', btn.innerText === char);
      }});
      loadChar(char);
    }}

    function loadChar(char) {{
      const item = CHAR_DATA[char];
      if (!item) return;

      document.getElementById('stage-ref').innerHTML = item.ref;
      document.getElementById('stage-gen').innerHTML = item.bold;

      prepareSvgForAnimation(document.querySelector('#stage-ref svg'));
      prepareSvgForAnimation(document.querySelector('#stage-gen svg'));

      applyVisibilityStyles();
      playAnimation();
    }}

    function prepareSvgForAnimation(svg) {{
      if (!svg) return;
      const strokes = svg.querySelectorAll('path[id*="s"]');
      strokes.forEach(path => {{
        const len = path.getTotalLength();
        path.dataset.len = len;
        path.style.stroke = '#00f0ff';
        path.style.strokeWidth = '3.5px';
        path.style.strokeLinecap = 'round';
        path.style.strokeLinejoin = 'round';
        path.style.strokeDasharray = len;
        path.style.strokeDashoffset = len;
      }});

      const outlines = svg.querySelectorAll('path[id*="p0"]');
      outlines.forEach(path => {{
        path.style.fill = '#162230';
        path.style.fillOpacity = '0.75';
        path.style.stroke = '#3b506b';
        path.style.strokeWidth = '1px';
      }});
    }}

    function applyVisibilityStyles() {{
      document.querySelectorAll('.svg-stage svg').forEach(svg => {{
        const outlines = svg.querySelectorAll('path[id*="p0"]');
        const strokes = svg.querySelectorAll('path[id*="s"]');

        outlines.forEach(p => {{
          if (centerlinesOnly) {{
            p.style.display = 'none';
          }} else {{
            p.style.display = showOutline ? 'block' : 'none';
          }}
        }});

        strokes.forEach(s => {{
          s.style.display = 'block';
        }});
      }});
    }}

    function clearTimers() {{
      activeTimers.forEach(t => clearTimeout(t));
      activeTimers = [];
    }}

    function playAnimation() {{
      clearTimers();

      ['#stage-ref svg', '#stage-gen svg'].forEach(selector => {{
        const svg = document.querySelector(selector);
        if (!svg) return;

        const strokes = Array.from(svg.querySelectorAll('path[id*="s"]'));
        strokes.forEach(s => {{
          s.style.transition = 'none';
          s.style.strokeDashoffset = s.dataset.len;
        }});

        let delay = 100;
        strokes.forEach(s => {{
          const len = parseFloat(s.dataset.len) || 100;
          const duration = Math.max(350, (len * 9) / animSpeed);

          const timer1 = setTimeout(() => {{
            s.style.transition = `stroke-dashoffset ${{duration}}ms cubic-bezier(0.4, 0, 0.2, 1)`;
            s.style.strokeDashoffset = '0';
          }}, delay);
          activeTimers.push(timer1);

          delay += duration + 80;
        }});
      }});
    }}

    function playCurrent() {{
      playAnimation();
    }}

    function toggleOutline() {{
      showOutline = !showOutline;
      centerlinesOnly = false;
      document.getElementById('btn-toggle-centerlines').classList.remove('active');
      document.getElementById('btn-toggle-outline').classList.toggle('active', showOutline);
      applyVisibilityStyles();
    }}

    function toggleCenterlinesOnly() {{
      centerlinesOnly = !centerlinesOnly;
      document.getElementById('btn-toggle-centerlines').classList.toggle('active', centerlinesOnly);
      applyVisibilityStyles();
    }}

    function onSpeedChange() {{
      animSpeed = parseFloat(document.getElementById('speed').value);
      document.getElementById('speed-val').innerText = animSpeed + 'x';
    }}

    window.onload = init;
  </script>
</body>
</html>
"""

    os.makedirs(os.path.dirname(output_html_path) or '.', exist_ok=True)
    with open(output_html_path, 'w', encoding='utf-8') as f:
        f.write(html_content)

    return len(data)
