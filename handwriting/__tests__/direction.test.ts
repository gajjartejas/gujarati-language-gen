import {
  cosineSimilarity,
  matchStrokeDirections,
  computeStrokeDirectionVectors,
} from '../src/engine/direction';
import { Stroke } from '../src/types/handwriting';

describe('Direction Matching & Reverse Stroke Detection', () => {
  test('cosineSimilarity returns 1 for identical, 0 for orthogonal, -1 for opposite', () => {
    const vRight = { dx: 1, dy: 0, angle: 0 };
    const vLeft = { dx: -1, dy: 0, angle: Math.PI };
    const vDown = { dx: 0, dy: 1, angle: Math.PI / 2 };

    expect(cosineSimilarity(vRight, vRight)).toBeCloseTo(1.0);
    expect(cosineSimilarity(vRight, vLeft)).toBeCloseTo(-1.0);
    expect(cosineSimilarity(vRight, vDown)).toBeCloseTo(0.0);
  });

  test('matchStrokeDirections flags reversed strokes correctly', () => {
    // Template: left-to-right line
    const template: Stroke = Array.from({ length: 32 }, (_, i) => ({
      x: i / 31,
      y: 0.5,
    }));

    // User: drawn right-to-left (reverse direction!)
    const userReversed: Stroke = Array.from({ length: 32 }, (_, i) => ({
      x: (31 - i) / 31,
      y: 0.5,
    }));

    const match = matchStrokeDirections(userReversed, template);
    expect(match.isReversed).toBe(true);
    expect(match.averageCosine).toBeLessThan(-0.5);
    expect(match.score).toBeLessThan(0.4);
  });

  test('matchStrokeDirections awards high score for stroke in correct direction', () => {
    const stroke: Stroke = Array.from({ length: 32 }, (_, i) => ({
      x: i / 31,
      y: Math.sin((i / 31) * Math.PI),
    }));

    const match = matchStrokeDirections(stroke, stroke);
    expect(match.isReversed).toBe(false);
    expect(match.averageCosine).toBeCloseTo(1.0);
    expect(match.score).toBeCloseTo(1.0);
  });
});
