import { Stroke, DirectionVector } from '../types/handwriting';

/**
 * Computes unit tangent direction vectors between consecutive points in a stroke.
 */
export function computeStrokeDirectionVectors(stroke: Stroke): DirectionVector[] {
  if (stroke.length < 2) return [];

  const vectors: DirectionVector[] = [];

  for (let i = 0; i < stroke.length - 1; i++) {
    const p1 = stroke[i];
    const p2 = stroke[i + 1];

    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const mag = Math.hypot(dx, dy);

    if (mag > 1e-6) {
      vectors.push({
        dx: dx / mag,
        dy: dy / mag,
        angle: Math.atan2(dy, dx),
      });
    } else {
      // Very close points, duplicate prior direction or neutral zero
      const prev = vectors[vectors.length - 1];
      vectors.push(prev ? { ...prev } : { dx: 0, dy: 0, angle: 0 });
    }
  }

  return vectors;
}

/**
 * Calculates cosine similarity between two unit direction vectors.
 * Returns value in [-1, 1], where 1 = identical, 0 = orthogonal, -1 = reversed.
 */
export function cosineSimilarity(v1: DirectionVector, v2: DirectionVector): number {
  return v1.dx * v2.dx + v1.dy * v2.dy;
}

export interface DirectionMatchResult {
  score: number; // 0..1
  isReversed: boolean;
  averageCosine: number; // -1..1
}

/**
 * Compares direction vectors between user stroke and expected template stroke.
 * Flags reversed strokes when average cosine is < -0.4.
 */
export function matchStrokeDirections(
  userStroke: Stroke,
  templateStroke: Stroke
): DirectionMatchResult {
  const userVecs = computeStrokeDirectionVectors(userStroke);
  const tmplVecs = computeStrokeDirectionVectors(templateStroke);

  if (userVecs.length === 0 || tmplVecs.length === 0) {
    return { score: 1.0, isReversed: false, averageCosine: 1.0 };
  }

  const sampleCount = Math.min(userVecs.length, tmplVecs.length);
  let totalCosine = 0;

  for (let i = 0; i < sampleCount; i++) {
    // Linear index mapping between the two vector sets
    const userIdx = Math.floor((i / sampleCount) * userVecs.length);
    const tmplIdx = Math.floor((i / sampleCount) * tmplVecs.length);

    totalCosine += cosineSimilarity(userVecs[userIdx], tmplVecs[tmplIdx]);
  }

  const avgCosine = totalCosine / sampleCount;

  // Detect if user drew stroke in reverse direction (e.g. bottom-to-top instead of top-to-bottom)
  const isReversed = avgCosine < -0.4;

  // Map cosine [-1, 1] to a normalized score [0, 1]
  // Cosine >= 0 maps to [0.5, 1.0]. Negative cosine gets penalized heavily.
  let score: number;
  if (isReversed) {
    score = Math.max(0, 0.2 + 0.3 * (avgCosine + 1)); // 0..0.38
  } else {
    score = Math.max(0, Math.min(1, (avgCosine + 1) / 2));
  }

  return {
    score,
    isReversed,
    averageCosine: avgCosine,
  };
}
