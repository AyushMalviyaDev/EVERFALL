/**
 * TerraForge - Axis-Aligned Bounding Box (AABB)
 * 
 * Used for dynamic entity collisions and spatial intersection tests.
 * Defined in Cartesian world pixel coordinates.
 */

export class AABB {
  public x: number;
  public y: number;
  public width: number;
  public height: number;

  constructor(x = 0, y = 0, width = 16, height = 16) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  // --- Spatial Edge Accessors ---
  public get left(): number {
    return this.x;
  }

  public get right(): number {
    return this.x + this.width;
  }

  public get top(): number {
    return this.y;
  }

  public get bottom(): number {
    return this.y + this.height;
  }

  public get centerX(): number {
    return this.x + this.width / 2;
  }

  public get centerY(): number {
    return this.y + this.height / 2;
  }

  // --- Mutators ---
  public set(x: number, y: number, width: number, height: number): this {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    return this;
  }

  public setPosition(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this;
  }

  public copy(other: AABB): this {
    this.x = other.x;
    this.y = other.y;
    this.width = other.width;
    this.height = other.height;
    return this;
  }

  public clone(): AABB {
    return new AABB(this.x, this.y, this.width, this.height);
  }

  // --- Intersection Queries ---
  public intersects(other: AABB): boolean {
    return (
      this.left < other.right &&
      this.right > other.left &&
      this.top < other.bottom &&
      this.bottom > other.top
    );
  }

  public containsPoint(px: number, py: number): boolean {
    return (
      px >= this.left &&
      px <= this.right &&
      py >= this.top &&
      py <= this.bottom
    );
  }
}
