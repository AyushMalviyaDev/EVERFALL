/**
 * TerraForge - Core Game Engine
 * 
 * Implements the deterministic fixed-timestep accumulator game loop
 * (Glenn Fiedler pattern):
 * - Physics updates run at a constant 60 Hz (FIXED_DELTA_TIME).
 * - Canvas renders run at display refresh rate using interpolation (alpha).
 * - Built-in performance diagnostics (FPS, physics ticks/sec, frame time).
 */

import {
  FIXED_DELTA_TIME,
  MAX_FRAME_ACCUMULATOR
} from '../constants.ts';
import { InputManager } from './InputManager.ts';

export interface EngineDiagnostics {
  fps: number;
  ticksPerSec: number;
  frameTimeMs: number;
  physicsTimeMs: number;
  renderTimeMs: number;
  totalFrames: number;
  totalTicks: number;
}

export type UpdateCallback = (dt: number) => void;
export type RenderCallback = (ctx: CanvasRenderingContext2D, alpha: number) => void;
export type ResizeCallback = (width: number, height: number) => void;

export class Engine {
  public readonly canvas: HTMLCanvasElement;
  public readonly ctx: CanvasRenderingContext2D;
  public readonly input: InputManager;

  // Running State
  private isRunning = false;
  private animationFrameId: number | null = null;
  private lastTime = 0;
  private accumulator = 0;

  // Diagnostics & Performance Profiling
  public diagnostics: EngineDiagnostics = {
    fps: 0,
    ticksPerSec: 0,
    frameTimeMs: 0,
    physicsTimeMs: 0,
    renderTimeMs: 0,
    totalFrames: 0,
    totalTicks: 0,
  };

  private frameCount = 0;
  private tickCount = 0;
  private lastFpsSampleTime = 0;

  // Hooks
  public onUpdate: UpdateCallback | null = null;
  public onRender: RenderCallback | null = null;
  public onResize: ResizeCallback | null = null;

  // Bound handler for window resize
  private handleResizeBound: () => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) {
      throw new Error('Failed to acquire 2D rendering context from canvas.');
    }
    this.ctx = context;

    // Instantiate Input Subsystem
    this.input = new InputManager(canvas);

    this.handleResizeBound = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResizeBound);

    // Initial canvas sizing and pixelation setup
    this.resizeCanvas();
  }

  /**
   * Resizes internal canvas drawing buffer to match CSS layout display dimensions.
   */
  public resizeCanvas(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;

      // Note: Resizing the canvas resets 2D context properties in browsers.
      // Must re-enforce pixelated rendering for crisp retro aesthetics:
      this.ctx.imageSmoothingEnabled = false;

      if (this.onResize) {
        this.onResize(width, height);
      }
    }
  }

  private handleResize(): void {
    this.resizeCanvas();
  }

  /**
   * Starts the main game loop.
   */
  public start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.lastTime = performance.now();
    this.lastFpsSampleTime = this.lastTime;
    this.accumulator = 0;
    this.frameCount = 0;
    this.tickCount = 0;

    this.loop = this.loop.bind(this);
    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  /**
   * Stops the main game loop.
   */
  public stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Primary game loop executed per animation frame.
   */
  private loop(currentTime: number): void {
    if (!this.isRunning) return;

    const frameStart = performance.now();
    let frameDelta = (currentTime - this.lastTime) / 1000;
    this.lastTime = currentTime;

    // Spiral-of-death clamp
    if (frameDelta > MAX_FRAME_ACCUMULATOR) {
      frameDelta = MAX_FRAME_ACCUMULATOR;
    }

    this.accumulator += frameDelta;

    // --- Fixed-Timestep Physics / State Updates ---
    const physicsStart = performance.now();
    let ticksExecuted = 0;
    while (this.accumulator >= FIXED_DELTA_TIME) {
      if (this.onUpdate) {
        this.onUpdate(FIXED_DELTA_TIME);
      }
      this.accumulator -= FIXED_DELTA_TIME;
      this.tickCount++;
      ticksExecuted++;

      // Safety escape hatch against pathological frame freezes
      if (ticksExecuted > 10) {
        this.accumulator = 0;
        break;
      }
    }
    const physicsEnd = performance.now();

    // --- Variable Timestep Render ---
    const renderStart = performance.now();
    // alpha interpolation factor between 0.0 and 1.0
    const alpha = this.accumulator / FIXED_DELTA_TIME;
    if (this.onRender) {
      this.onRender(this.ctx, alpha);
    }
    const renderEnd = performance.now();

    // Flush single-frame input transitions (keys/buttons just pressed or released)
    this.input.endFrame();

    // --- Performance Diagnostics Tracking ---
    this.frameCount++;
    const frameEnd = performance.now();

    this.diagnostics.frameTimeMs = frameEnd - frameStart;
    this.diagnostics.physicsTimeMs = physicsEnd - physicsStart;
    this.diagnostics.renderTimeMs = renderEnd - renderStart;
    this.diagnostics.totalFrames = this.frameCount;
    this.diagnostics.totalTicks = this.tickCount;

    // Recalculate smoothed FPS once every second
    if (currentTime - this.lastFpsSampleTime >= 1000) {
      const elapsed = (currentTime - this.lastFpsSampleTime) / 1000;
      this.diagnostics.fps = Math.round(this.frameCount / elapsed);
      this.diagnostics.ticksPerSec = Math.round(this.tickCount / elapsed);
      this.frameCount = 0;
      this.tickCount = 0;
      this.lastFpsSampleTime = currentTime;
    }

    // Schedule next frame
    this.animationFrameId = requestAnimationFrame(this.loop);
  }

  /**
   * Cleanup all resources, listeners, and handlers.
   */
  public destroy(): void {
    this.stop();
    window.removeEventListener('resize', this.handleResizeBound);
    this.input.destroy();
  }
}
