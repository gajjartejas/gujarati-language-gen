import {
  calculateDtwDistance,
  dtwDistanceToShapeScore,
  pointDistance,
  DTW_WINDOW,
} from '../src/engine/dtw';
import { Stroke } from '../src/types/handwriting';

describe('Sakoe-Chiba Windowed DTW Engine', () => {
  test('DTW_WINDOW matches PRD specification of 8', () => {
    expect(DTW_WINDOW).toBe(8);
  });

  test('pointDistance calculates 2D Euclidean distance', () => {
    expect(pointDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    expect(pointDistance({ x: 1, y: 1 }, { x: 1, y: 1 })).toBe(0);
  });

  test('calculateDtwDistance returns 0 for identical strokes', () => {
    const stroke: Stroke = Array.from({ length: 32 }, (_, i) => ({
      x: i / 31,
      y: (i / 31) ** 2,
    }));

    const dist = calculateDtwDistance(stroke, stroke);
    expect(dist).toBe(0);

    const shapeScore = dtwDistanceToShapeScore(dist);
    expect(shapeScore).toBe(1.0);
  });

  test('calculateDtwDistance returns small distance for slightly warped stroke', () => {
    const strokeA: Stroke = Array.from({ length: 32 }, (_, i) => ({
      x: i / 31,
      y: 0.5,
    }));
    const strokeB: Stroke = Array.from({ length: 32 }, (_, i) => ({
      x: i / 31,
      y: 0.52, // slight 0.02 vertical shift
    }));

    const dist = calculateDtwDistance(strokeA, strokeB);
    expect(dist).toBeGreaterThan(0);
    expect(dist).toBeLessThan(0.05);

    const score = dtwDistanceToShapeScore(dist);
    expect(score).toBeGreaterThan(0.8);
  });

  test('dtwDistanceToShapeScore maps large distances to low scores', () => {
    const scoreClose = dtwDistanceToShapeScore(0.02);
    const scoreFar = dtwDistanceToShapeScore(0.8);

    expect(scoreClose).toBeGreaterThan(0.9);
    expect(scoreFar).toBeLessThan(0.1);
  });
});
