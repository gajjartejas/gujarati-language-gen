# ✍️ KanoAI: Real-Time Gujarati Handwriting Recognition Suite

A production-grade, 100% offline handwriting recognition and stroke evaluation engine for the Gujarati script, powering the handwriting intelligence module of **KanoAI**. Built with a **Hybrid Architecture** combining deterministic **Sakoe-Chiba Dynamic Time Warping (DTW)** and a lightweight **Cross-Platform Tiny CNN (Conv2D/MaxPool/Dense)**.

---

## 🌟 Interactive Features

1. **✍️ Guided Practice (`GuidedPracticeScreen`)**:
   - Step-by-step Gujarati character tracing with dynamic SVG overlays.
   - Real-time animated directional hints with sequence bubbles (①, ②, ③).
   - Instant stroke-by-stroke accuracy evaluation with granular feedback in both Gujarati and English.
   - Replay modal and printable SVG/HTML worksheet generator.

2. **🎬 Animated Player (`AnimatedDrawingScreen`)**:
   - Progressive stroke-by-stroke animated visualization of all 565 Gujarati characters.
   - Playback speed adjustment, step navigation, and stroke order verification.
   - High-fidelity Kano audio pronunciation integration.

3. **🎮 Quiz Game (`QuizGameScreen`)**:
   - Gamified vocabulary challenges associating characters with Gujarati words and illustrations.
   - Interactive drawing canvas requiring correct stroke formation to score points and build streaks.
   - Auditory reinforcement and celebratory feedback.

4. **🔍 Free Drawing & Recognition (`FreeDrawingScreen`)**:
   - Unconstrained handwriting canvas supporting multi-stroke characters.
   - Dual-engine recognition: DTW template matching + Tiny CNN raster classification.
   - Real-time top-3 predictions with confidence metrics and stroke diagnostics.

5. **⚡ Benchmark Suite (`BenchmarkScreen`)**:
   - Automated testing suite verifying inference latency and accuracy across character sets.
   - Real-time profiling: DTW (<20ms) and Tiny CNN forward pass (<10ms).

---

## 📁 Workspace Structure

```
handwriting/
├── src/
│   ├── components/       # UI Components (Canvas, Overlay, ScoreCard, Diagnostics, Replay, Worksheet)
│   ├── data/             # Character templates (565 glyphs), word associations, catalog
│   ├── engine/           # Deterministic DTW, normalizer, direction matcher, scoring, feedback
│   ├── ml/               # Tiny CNN (Conv2D, MaxPool, Dense), rasterizer (64x64), weights
│   ├── screens/          # GuidedPractice, AnimatedDrawing, QuizGame, FreeDrawing, Benchmark
│   ├── types/            # TypeScript interfaces (Point, Stroke, CharacterTemplate, etc.)
│   └── utils/            # Audio & Web Speech synthesis integration
├── scripts/
│   ├── extract-templates.ts  # Extracts stroke templates from interpolate-svg/svgs
│   ├── generate_model.ts     # Generates Tiny CNN weights from character raster signatures
│   └── train_export_model.py # Optional Python PyTorch/TFLite export pipeline
├── __tests__/            # 7 Jest test suites (30 tests)
├── App.tsx               # Main 5-tab application controller
├── app.json              # Expo configuration with GitHub Pages baseUrl
├── package.json          # Dependencies, scripts, and build targets
└── tsconfig.json         # TypeScript configuration
```

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Automated Unit Tests
```bash
npm test
```
Runs all 7 Jest test suites covering normalization, DTW, direction vectors, scoring, CNN forward pass, quiz logic, and hybrid recognizer.

### 3. Launch Development Server
```bash
npm run web
```
Launches Metro bundler in web mode at `http://localhost:8081`.

### 4. Build for GitHub Pages
```bash
npm run build:web
```
Exports the optimized web bundle directly to `../docs/handwriting`.

### 5. Re-generate Templates & ML Weights
```bash
# Re-extract vector stroke templates from ../interpolate-svg/svgs
npm run extract-templates

# Re-generate Tiny CNN model weights
npm run generate-model
```
