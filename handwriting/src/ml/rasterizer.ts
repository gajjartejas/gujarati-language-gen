import { Strokes, BoundingBox } from '../types/handwriting';
import { getStrokesBoundingBox } from '../engine/normalizer';

export const BITMAP_SIZE = 64;

/**
 * Rasterizes vector strokes into a 64x64 grayscale matrix [0..1].
 * Uses line-drawing with anti-aliasing / brush radius for smooth offline ML recognition.
 */
export function rasterizeStrokes(
  strokes: Strokes,
  size: number = BITMAP_SIZE,
  strokeWidth: number = 2.5
): Float32Array {
  const grid = new Float32Array(size * size);
  if (strokes.length === 0) {
    return grid;
  }

  const bbox = getStrokesBoundingBox(strokes);
  const maxDim = Math.max(bbox.width, bbox.height);
  const padding = 4;
  const drawableSize = size - 2 * padding;

  // Helper to draw anti-aliased point onto grid
  const plot = (px: number, py: number, intensity: number = 1.0) => {
    const x0 = Math.floor(px);
    const y0 = Math.floor(py);
    const radius = Math.ceil(strokeWidth);

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const nx = x0 + dx;
        const ny = y0 + dy;
        if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
          const dist = Math.hypot(nx - px, ny - py);
          if (dist <= strokeWidth) {
            const alpha = Math.max(0, 1 - dist / strokeWidth) * intensity;
            const idx = ny * size + nx;
            grid[idx] = Math.min(1.0, grid[idx] + alpha);
          }
        }
      }
    }
  };

  // Helper to draw segment between two points
  const drawSegment = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const steps = Math.max(1, Math.ceil(dist * 2));

    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const x = p1.x + (p2.x - p1.x) * t;
      const y = p1.y + (p2.y - p1.y) * t;
      plot(x, y);
    }
  };

  // Transform and rasterize each stroke
  for (const stroke of strokes) {
    if (stroke.length === 0) continue;

    const transformed = stroke.map(p => {
      let xNorm = 0.5;
      let yNorm = 0.5;
      if (maxDim > 1e-4) {
        xNorm = (p.x - bbox.minX) / maxDim;
        yNorm = (p.y - bbox.minY) / maxDim;
      }
      return {
        x: padding + xNorm * drawableSize,
        y: padding + yNorm * drawableSize,
      };
    });

    if (transformed.length === 1) {
      plot(transformed[0].x, transformed[0].y);
    } else {
      for (let i = 0; i < transformed.length - 1; i++) {
        drawSegment(transformed[i], transformed[i + 1]);
      }
    }
  }

  return grid;
}
