/**
 * Lightweight Cross-Platform Tiny CNN Forward-Pass Engine
 * Executes tensor forward pass (Conv2D -> MaxPool -> Dense -> Softmax)
 * Pure TypeScript / TypedArray implementation for zero-native-dependency execution
 * Works identically on Web, iOS, Android, and Node.
 */

export interface TinyCnnWeights {
  classes: string[]; // Character labels
  // Conv1: 16 filters, 3x3 kernel, 1 input channel -> [16, 1, 3, 3] + bias [16]
  conv1Weights: number[][][][];
  conv1Bias: number[];
  // Conv2: 32 filters, 3x3 kernel, 16 input channels -> [32, 16, 3, 3] + bias [32]
  conv2Weights: number[][][][];
  conv2Bias: number[];
  // Dense1: 64 units, input size (32 * 16 * 16) -> [64, 8192] + bias [64]
  dense1Weights: number[][];
  dense1Bias: number[];
  // Output Dense: N classes, 64 inputs -> [N, 64] + bias [N]
  outputWeights: number[][];
  outputBias: number[];
}

/**
 * 2D Convolution with stride 1 and zero padding (same).
 * Input: [H, W, inChannels]
 * Output: [H, W, outChannels]
 */
export function conv2dSame(
  input: Float32Array,
  inHeight: number,
  inWidth: number,
  inChannels: number,
  filters: number[][][][], // [outChannels][inChannels][kernelH][kernelW]
  bias: number[]
): { output: Float32Array; outH: number; outW: number; outChannels: number } {
  const outChannels = filters.length;
  const kH = 3;
  const kW = 3;
  const padH = 1;
  const padW = 1;

  const outH = inHeight;
  const outW = inWidth;
  const output = new Float32Array(outH * outW * outChannels);

  for (let oc = 0; oc < outChannels; oc++) {
    const filterOc = filters[oc];
    const b = bias[oc];

    for (let y = 0; y < outH; y++) {
      for (let x = 0; x < outW; x++) {
        let sum = b;

        for (let ic = 0; ic < inChannels; ic++) {
          const filterIc = filterOc[ic];

          for (let ky = 0; ky < kH; ky++) {
            const inY = y + ky - padH;
            if (inY < 0 || inY >= inHeight) continue;

            for (let kx = 0; kx < kW; kx++) {
              const inX = x + kx - padW;
              if (inX < 0 || inX >= inWidth) continue;

              const inIdx = (inY * inWidth + inX) * inChannels + ic;
              sum += input[inIdx] * filterIc[ky][kx];
            }
          }
        }

        // ReLU activation
        const outIdx = (y * outW + x) * outChannels + oc;
        output[outIdx] = sum > 0 ? sum : 0;
      }
    }
  }

  return { output, outH, outW, outChannels };
}

/**
 * 2x2 Max Pooling with stride 2.
 */
export function maxPool2d(
  input: Float32Array,
  inHeight: number,
  inWidth: number,
  channels: number
): { output: Float32Array; outH: number; outW: number; channels: number } {
  const outH = Math.floor(inHeight / 2);
  const outW = Math.floor(inWidth / 2);
  const output = new Float32Array(outH * outW * channels);

  for (let c = 0; c < channels; c++) {
    for (let y = 0; y < outH; y++) {
      for (let x = 0; x < outW; x++) {
        const inY = y * 2;
        const inX = x * 2;

        const val00 = input[(inY * inWidth + inX) * channels + c];
        const val01 = input[(inY * inWidth + inX + 1) * channels + c];
        const val10 = input[((inY + 1) * inWidth + inX) * channels + c];
        const val11 = input[((inY + 1) * inWidth + inX + 1) * channels + c];

        const maxVal = Math.max(val00, val01, val10, val11);
        output[(y * outW + x) * channels + c] = maxVal;
      }
    }
  }

  return { output, outH, outW, channels };
}

/**
 * Fully Connected (Dense) Layer + ReLU.
 */
export function denseRelu(
  input: Float32Array,
  weights: number[][], // [outUnits][inUnits]
  bias: number[]
): Float32Array {
  const outUnits = weights.length;
  const inUnits = weights[0].length;
  const output = new Float32Array(outUnits);

  for (let i = 0; i < outUnits; i++) {
    const wRow = weights[i];
    let sum = bias[i];
    for (let j = 0; j < inUnits; j++) {
      sum += input[j] * wRow[j];
    }
    output[i] = sum > 0 ? sum : 0;
  }

  return output;
}

/**
 * Softmax probability distribution.
 */
export function softmax(logits: Float32Array): Float32Array {
  let max = -Infinity;
  for (let i = 0; i < logits.length; i++) {
    if (logits[i] > max) max = logits[i];
  }

  let sum = 0;
  const exp = new Float32Array(logits.length);
  for (let i = 0; i < logits.length; i++) {
    exp[i] = Math.exp(logits[i] - max);
    sum += exp[i];
  }

  const probs = new Float32Array(logits.length);
  const invSum = sum > 0 ? 1 / sum : 1;
  for (let i = 0; i < logits.length; i++) {
    probs[i] = exp[i] * invSum;
  }

  return probs;
}

/**
 * High-speed cosine embedding matcher for fast lightweight fallback.
 * Computes cosine similarity between input raster and reference embeddings.
 */
export function calculateCosineEmbedding(
  raster64: Float32Array,
  reference: Float32Array
): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < raster64.length; i++) {
    const a = raster64[i];
    const b = reference[i];
    dot += a * b;
    normA += a * a;
    normB += b * b;
  }

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
