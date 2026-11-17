/**
 * TerraForge - Seeded Pseudo-Random Number Generator (PRNG)
 * 
 * Implements the Mulberry32 algorithm:
 * - High-speed 32-bit integer bitwise operations.
 * - Uniform distribution across [0, 1).
 * - Deterministic: the same initial seed produces the exact same sequence of numbers.
 */

export class SeededRandom {
  private seedState: number;

  constructor(seed: number = 1337) {
    // Force seed to 32-bit unsigned integer
    this.seedState = seed >>> 0;
  }

  /**
   * Resets the PRNG to a new seed.
   */
  public reseed(seed: number): void {
    this.seedState = seed >>> 0;
  }

  /**
   * Generates next pseudo-random floating point number in range [0, 1).
   */
  public next(): number {
    this.seedState = (this.seedState + 0x6d2b79f5) | 0;
    let t = Math.imul(this.seedState ^ (this.seedState >>> 15), 1 | this.seedState);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns pseudo-random integer in range [min, max] inclusive.
   */
  public nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Returns pseudo-random float in range [min, max).
   */
  public nextFloat(min: number, max: number): number {
    return min + this.next() * (max - min);
  }

  /**
   * Returns true or false with given probability (default 0.5).
   */
  public nextBool(chance = 0.5): boolean {
    return this.next() < chance;
  }
}
