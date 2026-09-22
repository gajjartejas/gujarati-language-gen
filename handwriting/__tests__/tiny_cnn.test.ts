import { rasterizeStrokes, BITMAP_SIZE } from '../src/ml/rasterizer';
import {
  conv2dSame,
  maxPool2d,
  denseRelu,
  softmax,
  calculateCosineEmbedding,
} from '../src/ml/tiny_cnn';
import { EmbeddedTinyClassifier } from '../src/ml/classifier';
import { Strokes, CharacterTemplate } from '../src/types/handwriting';

describe('Lightweight Cross-Platform ML Engine', () => {
  test('rasterizeStrokes creates Float32Array of exactly 64x64 = 4096 cells in [0..1]', () => {
    const strokes: Strokes = [
      [
        { x: 10, y: 10 },
        { x: 50, y: 50 },
      ],
    ];

    const raster = rasterizeStrokes(strokes, BITMAP_SIZE);
    expect(raster.length).toBe(64 * 64);
    expect(raster).toBeInstanceOf(Float32Array);

    let hasNonZero = false;
    for (let i = 0; i < raster.length; i++) {
      expect(raster[i]).toBeGreaterThanOrEqual(0);
      expect(raster[i]).toBeLessThanOrEqual(1.0);
      if (raster[i] > 0) hasNonZero = true;
    }
    expect(hasNonZero).toBe(true);
  });

  test('softmax converts arbitrary logits into valid probability distribution summing to 1.0', () => {
    const logits = new Float32Array([2.5, 1.0, 0.1, -1.2]);
    const probs = softmax(logits);

    expect(probs.length).toBe(logits.length);
    let sum = 0;
    for (let i = 0; i < probs.length; i++) {
      expect(probs[i]).toBeGreaterThan(0);
      expect(probs[i]).toBeLessThanOrEqual(1.0);
      sum += probs[i];
    }
    expect(sum).toBeCloseTo(1.0, 4);
    // Highest logit must have highest probability
    expect(probs[0]).toBeGreaterThan(probs[1]);
    expect(probs[1]).toBeGreaterThan(probs[2]);
  });

  test('maxPool2d halves spatial dimensions', () => {
    const inH = 64;
    const inW = 64;
    const channels = 1;
    const input = new Float32Array(inH * inW * channels);
    input[0] = 1.0;

    const pooled = maxPool2d(input, inH, inW, channels);
    expect(pooled.outH).toBe(32);
    expect(pooled.outW).toBe(32);
    expect(pooled.output[0]).toBe(1.0);
  });

  test('calculateCosineEmbedding yields 1.0 for identical rasters and 0.0 for disjoint', () => {
    const gridA = new Float32Array(100);
    const gridB = new Float32Array(100);

    for (let i = 0; i < 50; i++) {
      gridA[i] = 0.8;
      gridB[i] = 0.8;
    }

    const simSelf = calculateCosineEmbedding(gridA, gridA);
    expect(simSelf).toBeCloseTo(1.0, 4);

    const gridC = new Float32Array(100);
    for (let i = 50; i < 100; i++) {
      gridC[i] = 0.8;
    }
    const simDisjoint = calculateCosineEmbedding(gridA, gridC);
    expect(simDisjoint).toBeCloseTo(0.0, 4);
  });

  test('EmbeddedTinyClassifier classifies drawn strokes against templates', () => {
    const sampleTemplate: CharacterTemplate = {
      id: 'test_k',
      name: 'Ka',
      gujarati: 'ક',
      transliteration: 'ka',
      category: 'consonant',
      strokeCount: 1,
      strokes: [
        {
          id: 's0',
          points: [
            { x: 0.1, y: 0.1 },
            { x: 0.9, y: 0.9 },
          ],
          startPoint: { x: 0.1, y: 0.1 },
          endPoint: { x: 0.9, y: 0.9 },
          length: 1,
        },
      ],
    };

    const classifier = new EmbeddedTinyClassifier([sampleTemplate]);
    const candidates = classifier.classify(
      [
        [
          { x: 10, y: 10 },
          { x: 90, y: 90 },
        ],
      ],
      [sampleTemplate],
      1
    );

    expect(candidates.length).toBe(1);
    expect(candidates[0].template.id).toBe('test_k');
    expect(candidates[0].confidence).toBeGreaterThanOrEqual(70);
    expect(candidates[0].method).toBe('ml-fallback');
  });
});
