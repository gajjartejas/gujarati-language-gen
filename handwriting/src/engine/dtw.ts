import { Stroke } from '../types/handwriting';

export const DTW_WINDOW = 8; // Sakoe-Chiba band width

/**
 * Calculates Euclidean distance between two points in 2D space.
 */
export function pointDistance(p1: { x: number; y: number }, p2: { x: number; y: number }): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.hypot(dx, dy);
}

/**
 * Calculates Sakoe-Chiba windowed Dynamic Time Warping (DTW) distance
 * between two normalized strokes (each typically 32 points).
 *
 * @param strokeA Normalized user stroke
 * @param strokeB Normalized template stroke
 * @param window Sakoe-Chiba constraint window (default 8)
 * @returns Normalized average warping path distance
 */
export function calculateDtwDistance(
  strokeA: Stroke,
  strokeB: Stroke,
  window: number = DTW_WINDOW
): number {
  const n = strokeA.length;
  const m = strokeB.length;

  if (n === 0 && m === 0) return 0;
  if (n === 0 || m === 0) return Infinity;

  // Initialize DP matrix with Infinity
  const w = Math.max(window, Math.abs(n - m));
  const dtw: number[][] = Array.from({ length: n + 1 }, () =>
    new Array(m + 1).fill(Infinity)
  );

  dtw[0][0] = 0;

  for (let i = 1; i <= n; i++) {
    const jStart = Math.max(1, i - w);
    const jEnd = Math.min(m, i + w);

    for (let j = jStart; j <= jEnd; j++) {
      const cost = pointDistance(strokeA[i - 1], strokeB[j - 1]);
      const minPrev = Math.min(
        dtw[i - 1][j],     // Insertion
        dtw[i][j - 1],     // Deletion
        dtw[i - 1][j - 1]  // Match
      );
      dtw[i][j] = cost + minPrev;
    }
  }

  // Normalize by the warping path length approximation (n + m)
  const totalCost = dtw[n][m];
  return totalCost === Infinity ? 1.0 : totalCost / ((n + m) / 2);
}

/**
 * Converts a DTW distance into a shape similarity score in [0, 1].
 * Uses exponential decay: S = exp(-dist / sigma).
 * With sigma = 0.22, a near-perfect drawing (dist < 0.05) gives > 0.8,
 * and a loose drawing (dist > 0.3) gives < 0.25.
 */
export function dtwDistanceToShapeScore(distance: number, sigma = 0.22): number {
  if (distance === Infinity || isNaN(distance)) return 0;
  const score = Math.exp(-distance / sigma);
  return Math.max(0, Math.min(1, score));
}
