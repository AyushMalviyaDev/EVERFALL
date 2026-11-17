/**
 * TerraForge - Lightweight Particle System
 * 
 * Manages transient visual debris particles when blocks are mined or placed.
 * Uses an efficient array pool with zero external dependencies.
 */

import { GRAVITY } from '../constants.ts';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];

  /**
   * Spawns a burst of debris particles when a tile is mined.
   */
  public spawnTileBreak(tileWorldX: number, tileWorldY: number, color: string, count = 8): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 120; // Random explosive burst speed

      this.particles.push({
        x: tileWorldX + Math.random() * 16,
        y: tileWorldY + Math.random() * 16,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 60, // Slight upward pop
        size: 2 + Math.floor(Math.random() * 2), // 2-3px square
        color,
        life: 0.35 + Math.random() * 0.25, // 0.35s - 0.6s lifespan
        maxLife: 0.6,
      });
    }
  }

  /**
   * Updates particle kinematics and lifetimes (60 Hz).
   */
  public update(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;

      if (p.life <= 0) {
        // Fast swap-and-pop removal for performance
        this.particles[i] = this.particles[this.particles.length - 1];
        this.particles.pop();
        continue;
      }

      p.vy += GRAVITY * 0.7 * dt; // Slightly lighter gravity for debris feel
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  /**
   * Renders active particles in world space.
   */
  public render(ctx: CanvasRenderingContext2D): void {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const alpha = Math.max(0, p.life / p.maxLife);

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.size, p.size);
      ctx.restore();
    }
  }

  public get activeCount(): number {
    return this.particles.length;
  }
}
