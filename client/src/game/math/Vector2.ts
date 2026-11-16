/**
 * TerraForge - 2D Vector Math
 * Provides both immutable methods (for clean expressions)
 * and in-place mutation methods (to prevent garbage collector pressure in 60 FPS hot loops).
 */
export class Vector2 {
  public x: number;
  public y: number;

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  // --- Static Factories ---
  public static zero(): Vector2 {
    return new Vector2(0, 0);
  }

  public static one(): Vector2 {
    return new Vector2(1, 1);
  }

  public static up(): Vector2 {
    return new Vector2(0, -1);
  }

  public static down(): Vector2 {
    return new Vector2(0, 1);
  }

  public static left(): Vector2 {
    return new Vector2(-1, 0);
  }

  public static right(): Vector2 {
    return new Vector2(1, 0);
  }

  public static from(v: { x: number; y: number }): Vector2 {
    return new Vector2(v.x, v.y);
  }

  // --- In-place Mutations (Zero-allocation hot loops) ---
  public set(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this;
  }

  public copy(v: Vector2): this {
    this.x = v.x;
    this.y = v.y;
    return this;
  }

  public addMut(v: Vector2): this {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  public addScaledMut(v: Vector2, scalar: number): this {
    this.x += v.x * scalar;
    this.y += v.y * scalar;
    return this;
  }

  public subMut(v: Vector2): this {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  public scaleMut(scalar: number): this {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  // --- Immutable Operations ---
  public clone(): Vector2 {
    return new Vector2(this.x, this.y);
  }

  public add(v: Vector2): Vector2 {
    return new Vector2(this.x + v.x, this.y + v.y);
  }

  public sub(v: Vector2): Vector2 {
    return new Vector2(this.x - v.x, this.y - v.y);
  }

  public scale(scalar: number): Vector2 {
    return new Vector2(this.x * scalar, this.y * scalar);
  }

  public dot(v: Vector2): number {
    return this.x * v.x + this.y * v.y;
  }

  public lengthSq(): number {
    return this.x * this.x + this.y * this.y;
  }

  public length(): number {
    return Math.sqrt(this.lengthSq());
  }

  public normalize(): Vector2 {
    const len = this.length();
    if (len === 0) return Vector2.zero();
    return new Vector2(this.x / len, this.y / len);
  }

  public distanceToSq(v: Vector2): number {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return dx * dx + dy * dy;
  }

  public distanceTo(v: Vector2): number {
    return Math.sqrt(this.distanceToSq(v));
  }

  public lerp(target: Vector2, alpha: number): Vector2 {
    return new Vector2(
      this.x + (target.x - this.x) * alpha,
      this.y + (target.y - this.y) * alpha
    );
  }

  public equals(v: Vector2, epsilon = 1e-6): boolean {
    return (
      Math.abs(this.x - v.x) <= epsilon &&
      Math.abs(this.y - v.y) <= epsilon
    );
  }
}
