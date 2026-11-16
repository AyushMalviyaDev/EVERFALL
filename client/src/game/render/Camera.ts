/**
 * TerraForge - 2D Smooth Tracking Camera
 * 
 * Provides smooth exponential interpolation (lerp) toward a target,
 * handles zoom scaling, viewport bounds calculation, and applies
 * integer-rounded affine transformations to Canvas2D to prevent sub-pixel blurring.
 */

import {
  DEFAULT_CAMERA_ZOOM,
  MIN_CAMERA_ZOOM,
  MAX_CAMERA_ZOOM,
  CAMERA_LERP_FACTOR
} from '../constants.ts';
import { Vector2 } from '../math/Vector2.ts';

export interface ViewportBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export class Camera {
  public position: Vector2;
  public target: Vector2 | null = null;
  public zoom: number;
  public lerpFactor: number;

  public viewportWidth: number;
  public viewportHeight: number;

  constructor(viewportWidth: number, viewportHeight: number) {
    this.viewportWidth = viewportWidth;
    this.viewportHeight = viewportHeight;
    this.position = new Vector2(0, 0);
    this.zoom = DEFAULT_CAMERA_ZOOM;
    this.lerpFactor = CAMERA_LERP_FACTOR;
  }

  /**
   * Resizes viewport dimensions when window or canvas resizes.
   */
  public resize(width: number, height: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;
  }

  /**
   * Snaps camera position directly to coordinates without lerp smoothing.
   */
  public snapTo(x: number, y: number): void {
    this.position.set(x, y);
  }

  /**
   * Sets target vector to follow smoothly.
   */
  public follow(target: Vector2): void {
    this.target = target;
  }

  /**
   * Updates camera position towards target with exponential smoothing.
   */
  public update(dt: number): void {
    if (!this.target) return;

    // Frame-rate independent exponential decay: 1 - exp(-rate * dt)
    const decay = 1 - Math.exp(-this.lerpFactor * 60 * dt);
    this.position.x += (this.target.x - this.position.x) * decay;
    this.position.y += (this.target.y - this.position.y) * decay;
  }

  /**
   * Adjusts zoom factor clamped to valid limits.
   */
  public setZoom(zoom: number): void {
    this.zoom = Math.max(MIN_CAMERA_ZOOM, Math.min(MAX_CAMERA_ZOOM, zoom));
  }

  /**
   * Computes the bounding box of world coordinates currently visible on screen.
   * Includes a safety margin (padding) to prevent edge pop-in.
   */
  public getVisibleBounds(paddingPx = 16): ViewportBounds {
    const halfWidth = (this.viewportWidth / 2) / this.zoom;
    const halfHeight = (this.viewportHeight / 2) / this.zoom;

    return {
      minX: this.position.x - halfWidth - paddingPx,
      minY: this.position.y - halfHeight - paddingPx,
      maxX: this.position.x + halfWidth + paddingPx,
      maxY: this.position.y + halfHeight + paddingPx,
    };
  }

  /**
   * Applies camera translation and zoom scale to the 2D rendering context.
   * Uses rounded pixel coordinates to keep pixel art perfectly crisp.
   */
  public applyTransform(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    // 1. Move to canvas center
    ctx.translate(
      Math.floor(this.viewportWidth / 2),
      Math.floor(this.viewportHeight / 2)
    );
    // 2. Apply pixel-perfect zoom scale
    ctx.scale(this.zoom, this.zoom);
    // 3. Translate by negative camera world position (rounded to avoid sub-pixel blur)
    ctx.translate(
      -Math.round(this.position.x),
      -Math.round(this.position.y)
    );
  }

  /**
   * Restores canvas transformation state.
   */
  public restoreTransform(ctx: CanvasRenderingContext2D): void {
    ctx.restore();
  }
}
