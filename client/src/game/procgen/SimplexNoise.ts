/**
 * TerraForge - 2D Simplex Noise Engine
 * 
 * Deterministic, seed-based 2D Simplex Noise implementation:
 * - O(N+1) vertex sampling (evaluates 3 simplex corners instead of 4 in classic Perlin)
 * - Free of square grid directional bias
 * - Features Fractal Brownian Motion (FBM) with configurable octaves, lacunarity, and persistence.
 */

import { SeededRandom } from './SeededRandom.ts';

export class SimplexNoise {
  // Skewing and unskewing constants for 2D
  private static readonly F2 = 0.5 * (Math.sqrt(3.0) - 1.0); // ~0.36602540378
  private static readonly G2 = (3.0 - Math.sqrt(3.0)) / 6.0; // ~0.21132486540

  // 8 standard 2D gradient vectors
  private static readonly GRAD2: ReadonlyArray<[number, number]> = [
    [1, 1], [-1, 1], [1, -1], [-1, -1],
    [1, 0], [-1, 0], [0, 1], [0, -1]
  ];

  private readonly perm = new Uint8Array(512);
  private readonly permMod12 = new Uint8Array(512);

  constructor(seed: number = 42) {
    this.initPermutations(seed);
  }

  /**
   * Initializes the 512-entry permutation table using a seeded Fisher-Yates shuffle.
   */
  private initPermutations(seed: number): void {
    const rng = new SeededRandom(seed);
    const p = new Uint8Array(256);

    for (let i = 0; i < 256; i++) {
      p[i] = i;
    }

    // Fisher-Yates shuffle
    for (let i = 255; i > 0; i--) {
      const j = rng.nextInt(0, i);
      const temp = p[i];
      p[i] = p[j];
      p[j] = temp;
    }

    // Duplicate table to wrap around without modulo arithmetic
    for (let i = 0; i < 512; i++) {
      this.perm[i] = p[i & 255];
      this.permMod12[i] = this.perm[i] % 8;
    }
  }

  /**
   * Computes 2D Simplex Noise at coordinates (x, y).
   * Returns a continuous value normalized in range [-1.0, 1.0].
   */
  public noise2D(xin: number, yin: number): number {
    // 1. Skew input space to determine which simplex cell we are in
    const s = (xin + yin) * SimplexNoise.F2;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);

    // Unskew cell origin back to (x, y) space
    const t = (i + j) * SimplexNoise.G2;
    const X0 = i - t;
    const Y0 = j - t;

    // Distances from cell origin
    const x0 = xin - X0;
    const y0 = yin - Y0;

    // 2. Determine which simplex triangle we are in (upper or lower)
    let i1: number, j1: number;
    if (x0 > y0) {
      i1 = 1;
      j1 = 0; // Lower triangle: (0,0) -> (1,0) -> (1,1)
    } else {
      i1 = 0;
      j1 = 1; // Upper triangle: (0,0) -> (0,1) -> (1,1)
    }

    // Offsets for second and third corners
    const x1 = x0 - i1 + SimplexNoise.G2;
    const y1 = y0 - j1 + SimplexNoise.G2;
    const x2 = x0 - 1.0 + 2.0 * SimplexNoise.G2;
    const y2 = y0 - 1.0 + 2.0 * SimplexNoise.G2;

    // Wrap coordinates to [0..255]
    const ii = i & 255;
    const jj = j & 255;

    // 3. Calculate gradient contributions from each of the 3 corners
    let n0 = 0.0;
    let n1 = 0.0;
    let n2 = 0.0;

    // Corner 0
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    if (t0 > 0) {
      t0 *= t0;
      const gi0 = this.permMod12[ii + this.perm[jj]];
      const grad0 = SimplexNoise.GRAD2[gi0];
      n0 = t0 * t0 * (grad0[0] * x0 + grad0[1] * y0);
    }

    // Corner 1
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    if (t1 > 0) {
      t1 *= t1;
      const gi1 = this.permMod12[ii + i1 + this.perm[jj + j1]];
      const grad1 = SimplexNoise.GRAD2[gi1];
      n1 = t1 * t1 * (grad1[0] * x1 + grad1[1] * y1);
    }

    // Corner 2
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    if (t2 > 0) {
      t2 *= t2;
      const gi2 = this.permMod12[ii + 1 + this.perm[jj + 1]];
      const grad2 = SimplexNoise.GRAD2[gi2];
      n2 = t2 * t2 * (grad2[0] * x2 + grad2[1] * y2);
    }

    // 4. Sum contributions and scale to [-1.0, 1.0]
    return 70.0 * (n0 + n1 + n2);
  }

  /**
   * Fractal Brownian Motion (FBM)
   * Layers multiple noise octaves together for natural terrain roughness.
   * 
   * @param x Coordinate X
   * @param y Coordinate Y
   * @param octaves Number of layered noise frequencies (default: 4)
   * @param lacunarity Frequency multiplier per octave (default: 2.0)
   * @param persistence Amplitude decay factor per octave (default: 0.5)
   * @returns Value normalized in [-1.0, 1.0]
   */
  public fbm2D(
    x: number,
    y: number,
    octaves = 4,
    lacunarity = 2.0,
    persistence = 0.5
  ): number {
    let total = 0.0;
    let frequency = 1.0;
    let amplitude = 1.0;
    let maxAmplitude = 0.0;

    for (let o = 0; o < octaves; o++) {
      total += this.noise2D(x * frequency, y * frequency) * amplitude;
      maxAmplitude += amplitude;
      frequency *= lacunarity;
      amplitude *= persistence;
    }

    return total / maxAmplitude;
  }
}
