/**
 * stage.js: SVG comparison stage renderer, stroke width adjuster, and synchronized animation engine.
 */

class StageManager {
  constructor() {
    this.speed = 0.75;
    this.strokeWidth = 3.5; // Default stroke width in px
    this.showOutlines = true;
    this.centerlinesOnly = false;
    this.animTimeout = null;
  }

  initUI() {
    // Speed slider
    const speedSlider = document.getElementById('slider-speed');
    const speedVal = document.getElementById('speed-val');
    if (speedSlider) {
      speedSlider.value = this.speed;
      speedSlider.addEventListener('input', (e) => {
        this.speed = parseFloat(e.target.value);
        if (speedVal) speedVal.innerText = `${this.speed.toFixed(2)}x`;
        this.replay();
      });
    }

    // Stroke width slider
    const widthSlider = document.getElementById('slider-stroke-width');
    const widthVal = document.getElementById('width-val');
    if (widthSlider) {
      widthSlider.value = this.strokeWidth;
      widthSlider.addEventListener('input', (e) => {
        this.setStrokeWidth(parseFloat(e.target.value));
      });
    }

    // Preset pills
    document.querySelectorAll('.width-pill').forEach((pill) => {
      pill.addEventListener('click', (e) => {
        const val = parseFloat(e.target.getAttribute('data-width'));
        this.setStrokeWidth(val);
      });
    });
  }

  setStrokeWidth(px) {
    this.strokeWidth = px;
    const widthSlider = document.getElementById('slider-stroke-width');
    const widthVal = document.getElementById('width-val');
    if (widthSlider) widthSlider.value = px;
    if (widthVal) widthVal.innerText = `${px}px`;

    // Update active pill state
    document.querySelectorAll('.width-pill').forEach((pill) => {
      const val = parseFloat(pill.getAttribute('data-width'));
      pill.classList.toggle('active', Math.abs(val - px) < 0.2);
    });

    // Apply directly to SVG paths in both stages
    ['#stage-ref svg', '#stage-gen svg'].forEach((sel) => {
      const svg = document.querySelector(sel);
      if (svg) {
        svg.querySelectorAll('path[id*="s"]').forEach((path) => {
          path.style.strokeWidth = `${px}px`;
        });
      }
    });
  }

  async loadCharacter(item) {
    const stageRef = document.getElementById('stage-ref');
    const stageGen = document.getElementById('stage-gen');
    if (!stageRef || !stageGen) return;

    // Fetch and inject Reference SVG
    try {
      const resRef = await fetch(item.ref_svg);
      const refText = await resRef.text();
      stageRef.innerHTML = refText;
      this.normalizeSvg(stageRef.querySelector('svg'));
    } catch (e) {
      stageRef.innerHTML = `<div class="error">Failed to load reference SVG</div>`;
    }

    // Fetch and inject Bold SVG
    try {
      const resBold = await fetch(item.bold_svg);
      const boldText = await resBold.text();
      stageGen.innerHTML = boldText;
      this.normalizeSvg(stageGen.querySelector('svg'));
    } catch (e) {
      stageGen.innerHTML = `<div class="error">Failed to load bold SVG</div>`;
    }

    // Apply current display preferences
    this.applyViewPreferences();
    this.replay();
  }

  normalizeSvg(svg) {
    if (!svg) return;
    // Sizing fix: Ensure explicit viewBox exists so reference and bold scale identically
    if (!svg.getAttribute('viewBox')) {
      const w = parseFloat(svg.getAttribute('width')) || 100;
      const h = parseFloat(svg.getAttribute('height')) || 100;
      svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    }
  }

  applyViewPreferences() {
    ['#stage-ref svg', '#stage-gen svg'].forEach((sel) => {
      const svg = document.querySelector(sel);
      if (!svg) return;

      // Apply stroke width
      svg.querySelectorAll('path[id*="s"]').forEach((path) => {
        path.style.strokeWidth = `${this.strokeWidth}px`;
      });

      // Apply outline visibility
      svg.querySelectorAll('path[id*="p0"]').forEach((path) => {
        path.style.display = (this.showOutlines && !this.centerlinesOnly) ? 'block' : 'none';
      });
    });
  }

  toggleOutlines() {
    this.showOutlines = !this.showOutlines;
    const btn = document.getElementById('btn-toggle-outline');
    if (btn) btn.classList.toggle('active', !this.showOutlines);
    this.applyViewPreferences();
  }

  toggleCenterlinesOnly() {
    this.centerlinesOnly = !this.centerlinesOnly;
    const btn = document.getElementById('btn-toggle-centerlines');
    if (btn) btn.classList.toggle('active', this.centerlinesOnly);
    this.applyViewPreferences();
  }

  replay() {
    if (this.animTimeout) clearTimeout(this.animTimeout);

    const stages = ['#stage-ref svg', '#stage-gen svg'];
    stages.forEach((sel) => {
      const svg = document.querySelector(sel);
      if (!svg) return;

      const strokes = Array.from(svg.querySelectorAll('path[id*="s"]'));
      strokes.sort((a, b) => (a.id > b.id ? 1 : -1));

      // Reset strokes
      strokes.forEach((stroke) => {
        stroke.style.animation = 'none';
        stroke.style.strokeDashoffset = '1000';
        stroke.style.opacity = '0';
      });

      let accumulatedDelay = 0.05;
      strokes.forEach((stroke) => {
        let length = 100;
        try {
          length = stroke.getTotalLength() || 100;
        } catch (e) {}

        const duration = Math.max(0.4, (length / 80) / this.speed);
        stroke.style.strokeDasharray = `${length}`;
        stroke.style.strokeDashoffset = `${length}`;
        stroke.style.opacity = '1';

        // Trigger animation via keyframes
        stroke.style.animation = `drawStroke ${duration}s ease-in-out ${accumulatedDelay}s forwards`;
        accumulatedDelay += duration + 0.15;
      });
    });
  }
}

window.stageManager = new StageManager();
