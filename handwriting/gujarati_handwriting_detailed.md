
# 🧠 Gujarati Handwriting Recognition System (Full PRD + Technical Spec)

## 1. Overview
This document defines a **production-grade handwriting recognition system** for Gujarati script,
designed for **React Native mobile apps**, targeting **low-end 4GB RAM devices**.

The system uses a **hybrid architecture**:
- Stroke-based deterministic engine (DTW)
- Lightweight ML fallback (TFLite)

---

## 2. Goals

### Functional
- Detect handwritten Gujarati characters
- Support:
  - Kakko (Vowels + Consonants)
  - Barakhadi
  - Numbers
- Provide:
  - Accuracy score
  - Stroke-level feedback
  - Direction errors
  - Missing/extra strokes

### Non-functional
- 100% offline
- <1000ms response time
- Works on low-end Android/iOS devices
- App size minimal (<10MB impact)

---

## 3. User Modes

### 3.1 Free Drawing
- User draws freely
- Multi-stroke capture
- No strict guidance

### 3.2 Guided Drawing
- Overlay SVG strokes
- Step-by-step drawing

---

## 4. Input System

### Touch Capture
- Capture continuous points
- Group into strokes (on touch end)

```ts
type Point = { x: number; y: number; t?: number };
type Stroke = Point[];
type Strokes = Stroke[];
```

---

## 5. SVG Stroke System

### Source
- Provided SVGs with <g> groups

### Interpretation
- Each <g> = stroke
- Each <path> = vector path
- Order = stroke sequence

### Conversion Pipeline
1. Parse SVG
2. Extract paths
3. Interpolate into points
4. Normalize

---

## 6. Normalization Pipeline

- Scale to bounding box
- Translate to origin
- Resample to fixed points (32)
- Remove noise

---

## 7. Stroke Engine (Core)

### Algorithms
- DTW (Dynamic Time Warping)
- Direction vector matching
- Stroke count validation

### DTW Config
- Window: 8 (Sakoe-Chiba)
- Points per stroke: 32

---

## 8. Scoring System

```
finalScore =
  0.5 * shape +
  0.2 * strokeCount +
  0.3 * direction
```

---

## 9. Feedback System

### Output

```ts
{
  confidence: number,
  isCorrect: boolean,
  errors: {
    missingStrokes: number,
    extraStrokes: number,
    wrongDirection: boolean
  }
}
```

---

## 10. ML System (Fallback)

### Model
- Tiny CNN
- Input: 64x64 grayscale

### Optimization
- INT8 quantized
- Size: ~1MB

---

## 11. React Native Architecture

```
/src
  /components
  /engine
  /ml
  /data
```

---

## 12. Performance

| Component | Time |
|----------|------|
| Capture | <5ms |
| Normalize | <10ms |
| DTW | 10–30ms |
| ML | 50–150ms |

---

## 13. Edge Cases

- Single stroke drawn
- Reverse direction
- Incomplete shape
- Overdrawing

---

## 14. Future Scope

- Real-time validation
- Stroke-level hints
- ML improvements
- Cloud sync

---

## 15. Summary

This system ensures:
- High accuracy
- Low latency
- Offline capability
- Scalable architecture

# 🧠 Gujarati Handwriting Recognition System (Full PRD + Technical Spec)

## 1. Overview
This document defines a **production-grade handwriting recognition system** for Gujarati script,
designed for **React Native mobile apps**, targeting **low-end 4GB RAM devices**.

The system uses a **hybrid architecture**:
- Stroke-based deterministic engine (DTW)
- Lightweight ML fallback (TFLite)

---

## 2. Goals

### Functional
- Detect handwritten Gujarati characters
- Support:
  - Kakko (Vowels + Consonants)
  - Barakhadi
  - Numbers
- Provide:
  - Accuracy score
  - Stroke-level feedback
  - Direction errors
  - Missing/extra strokes

### Non-functional
- 100% offline
- <1000ms response time
- Works on low-end Android/iOS devices
- App size minimal (<10MB impact)

---

## 3. User Modes

### 3.1 Free Drawing
- User draws freely
- Multi-stroke capture
- No strict guidance

### 3.2 Guided Drawing
- Overlay SVG strokes
- Step-by-step drawing

---

## 4. Input System

### Touch Capture
- Capture continuous points
- Group into strokes (on touch end)

```ts
type Point = { x: number; y: number; t?: number };
type Stroke = Point[];
type Strokes = Stroke[];
```

---

## 5. SVG Stroke System

### Source
- Provided SVGs with <g> groups

### Interpretation
- Each <g> = stroke
- Each <path> = vector path
- Order = stroke sequence

### Conversion Pipeline
1. Parse SVG
2. Extract paths
3. Interpolate into points
4. Normalize

---

## 6. Normalization Pipeline

- Scale to bounding box
- Translate to origin
- Resample to fixed points (32)
- Remove noise

---

## 7. Stroke Engine (Core)

### Algorithms
- DTW (Dynamic Time Warping)
- Direction vector matching
- Stroke count validation

### DTW Config
- Window: 8 (Sakoe-Chiba)
- Points per stroke: 32

---

## 8. Scoring System

```
finalScore =
  0.5 * shape +
  0.2 * strokeCount +
  0.3 * direction
```

---

## 9. Feedback System

### Output

```ts
{
  confidence: number,
  isCorrect: boolean,
  errors: {
    missingStrokes: number,
    extraStrokes: number,
    wrongDirection: boolean
  }
}
```

---

## 10. ML System (Fallback)

### Model
- Tiny CNN
- Input: 64x64 grayscale

### Optimization
- INT8 quantized
- Size: ~1MB

---

## 11. React Native Architecture

```
/src
  /components
  /engine
  /ml
  /data
```

---

## 12. Performance

| Component | Time |
|----------|------|
| Capture | <5ms |
| Normalize | <10ms |
| DTW | 10–30ms |
| ML | 50–150ms |

---

## 13. Edge Cases

- Single stroke drawn
- Reverse direction
- Incomplete shape
- Overdrawing

---

## 14. Future Scope

- Real-time validation
- Stroke-level hints
- ML improvements
- Cloud sync

---

## 15. Summary

This system ensures:
- High accuracy
- Low latency
- Offline capability
- Scalable architecture

# 🧠 Gujarati Handwriting Recognition System (Full PRD + Technical Spec)

## 1. Overview
This document defines a **production-grade handwriting recognition system** for Gujarati script,
designed for **React Native mobile apps**, targeting **low-end 4GB RAM devices**.

The system uses a **hybrid architecture**:
- Stroke-based deterministic engine (DTW)
- Lightweight ML fallback (TFLite)

---

## 2. Goals

### Functional
- Detect handwritten Gujarati characters
- Support:
  - Kakko (Vowels + Consonants)
  - Barakhadi
  - Numbers
- Provide:
  - Accuracy score
  - Stroke-level feedback
  - Direction errors
  - Missing/extra strokes

### Non-functional
- 100% offline
- <1000ms response time
- Works on low-end Android/iOS devices
- App size minimal (<10MB impact)

---

## 3. User Modes

### 3.1 Free Drawing
- User draws freely
- Multi-stroke capture
- No strict guidance

### 3.2 Guided Drawing
- Overlay SVG strokes
- Step-by-step drawing

---

## 4. Input System

### Touch Capture
- Capture continuous points
- Group into strokes (on touch end)

```ts
type Point = { x: number; y: number; t?: number };
type Stroke = Point[];
type Strokes = Stroke[];
```

---

## 5. SVG Stroke System

### Source
- Provided SVGs with <g> groups

### Interpretation
- Each <g> = stroke
- Each <path> = vector path
- Order = stroke sequence

### Conversion Pipeline
1. Parse SVG
2. Extract paths
3. Interpolate into points
4. Normalize

---

## 6. Normalization Pipeline

- Scale to bounding box
- Translate to origin
- Resample to fixed points (32)
- Remove noise

---

## 7. Stroke Engine (Core)

### Algorithms
- DTW (Dynamic Time Warping)
- Direction vector matching
- Stroke count validation

### DTW Config
- Window: 8 (Sakoe-Chiba)
- Points per stroke: 32

---

## 8. Scoring System

```
finalScore =
  0.5 * shape +
  0.2 * strokeCount +
  0.3 * direction
```

---

## 9. Feedback System

### Output

```ts
{
  confidence: number,
  isCorrect: boolean,
  errors: {
    missingStrokes: number,
    extraStrokes: number,
    wrongDirection: boolean
  }
}
```

---

## 10. ML System (Fallback)

### Model
- Tiny CNN
- Input: 64x64 grayscale

### Optimization
- INT8 quantized
- Size: ~1MB

---

## 11. React Native Architecture

```
/src
  /components
  /engine
  /ml
  /data
```

---

## 12. Performance

| Component | Time |
|----------|------|
| Capture | <5ms |
| Normalize | <10ms |
| DTW | 10–30ms |
| ML | 50–150ms |

---

## 13. Edge Cases

- Single stroke drawn
- Reverse direction
- Incomplete shape
- Overdrawing

---

## 14. Future Scope

- Real-time validation
- Stroke-level hints
- ML improvements
- Cloud sync

---

## 15. Summary

This system ensures:
- High accuracy
- Low latency
- Offline capability
- Scalable architecture
