# Gujarati Language Resource Generator (Node.js)

A Node.js tool to generate static SVG glyphs, CSV tables, and synthesized audio pronunciations for Gujarati **Kakko** (consonants), **Barakhadi** (syllables), and **Numerals** (0–9).

---

## 📁 Directory Layout

```
node/
├── package.json        # Dependencies (text-to-svg, node-fetch)
├── package-lock.json   # Locked dependency versions
├── index.js            # Generation script
└── README.md           # Documentation & usage instructions
```

---

## ⚙️ Installation

Navigate to the `node/` directory and install dependencies:

```bash
cd node
npm install
```

---

## 🚀 Usage

Run the generator to produce SVGs and CSVs in `resources/`:

```bash
# Run directly with Node.js
node index.js

# Or from repository root
node node/index.js
```

### Outputs Generated in `resources/`:
- **Kakko (Consonants)**:
  - `resources/kakko/svgs/`: 34 vector SVGs (e.g. `0_ka.svg`, `1_kha.svg`)
  - `resources/kakko/kakko.csv`: Gujarati characters mapped to English transliteration
- **Barakhadi (Syllables)**:
  - `resources/barakhdi/svgs/`: Complete 500+ syllable SVGs across all consonant classes
  - `resources/barakhdi/barakhdi.csv`: Grid matrix of all consonant + vowel combinations
- **Numerals (0–9)**:
  - `resources/numerals/svgs/`: Standard digit SVGs (`0.svg`, `1.svg`, ..., `9.svg`)
  - `resources/numerals/numerals.csv`: Transliteration and English/Gujarati numeral names

---

## 🎙️ Audio Generation (Optional)

`index.js` includes functions to fetch synthesized Gujarati speech (Wavenet) from Google Text-to-Speech:
- `generateBarakhadiAudio()`: Generates MP3 audio for each syllable
- `generateKakkoAudio()`: Generates MP3 audio for consonants
- `generateNumeralsAudio()`: Generates MP3 audio for numbers

To generate audio files, invoke `generateAudio()` inside `index.js`.
