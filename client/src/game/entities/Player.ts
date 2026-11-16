/**
 * TerraForge - Player Entity
 * 
 * Manages player physics, kinematics, state machine, and pixel-art rendering.
 * Implements smooth ground/air acceleration, variable-height jumping,
 * and directional sprite animations.
 */

import {
  GRAVITY,
  TERMINAL_VELOCITY,
  PLAYER_WALK_SPEED,
  PLAYER_ACCELERATION,
  PLAYER_AIR_ACCELERATION,
  GROUND_FRICTION,
  AIR_FRICTION,
  JUMP_VELOCITY
} from '../constants.ts';
import { Vector2 } from '../math/Vector2.ts';
import { AABB } from '../physics/AABB.ts';
import { CollisionSolver } from '../physics/CollisionSolver.ts';
import { World } from '../world/World.ts';
import { InputManager } from '../core/InputManager.ts';

export type PlayerState = 'IDLE' | 'RUN' | 'JUMP' | 'FALL';
export type Direction = 'left' | 'right';

export class Player {
  // Spatial & Physics Dimensions
  public readonly width = 12; // 12px wide (slips cleanly through 16px doorways)
  public readonly height = 26; // 26px high

  public position: Vector2;
  public velocity: Vector2;
  public aabb: AABB;

  // Kinematic States
  public isGrounded = false;
  public facing: Direction = 'right';
  public state: PlayerState = 'IDLE';

  // Animation Timer
  private walkAnimTimer = 0;

  // Stats
  public health = 100;
  public maxHealth = 100;

  constructor(spawnX = 0, spawnY = 0) {
    this.position = new Vector2(spawnX, spawnY);
    this.velocity = new Vector2(0, 0);
    this.aabb = new AABB(spawnX, spawnY, this.width, this.height);
  }

  /**
   * Center position of the player (for camera tracking and reach checks).
   */
  public get center(): Vector2 {
    return new Vector2(
      this.aabb.x + this.width / 2,
      this.aabb.y + this.height / 2
    );
  }

  /**
   * Primary fixed-timestep physics update (60 Hz).
   */
  public update(dt: number, input: InputManager, world: World): void {
    // 1. Horizontal Acceleration
    const accel = this.isGrounded ? PLAYER_ACCELERATION : PLAYER_AIR_ACCELERATION;

    if (input.moveLeft) {
      this.velocity.x -= accel * dt;
      this.facing = 'left';
      if (this.velocity.x < -PLAYER_WALK_SPEED) {
        this.velocity.x = -PLAYER_WALK_SPEED;
      }
    } else if (input.moveRight) {
      this.velocity.x += accel * dt;
      this.facing = 'right';
      if (this.velocity.x > PLAYER_WALK_SPEED) {
        this.velocity.x = PLAYER_WALK_SPEED;
      }
    } else {
      // Apply friction damping when no movement key is held
      const friction = this.isGrounded ? GROUND_FRICTION : AIR_FRICTION;
      this.velocity.x *= Math.pow(friction, dt * 60);

      // Snap to zero if velocity is negligible to avoid micro-creeping
      if (Math.abs(this.velocity.x) < 2) {
        this.velocity.x = 0;
      }
    }

    // 2. Jump Handling & Variable Jump Height
    if (input.jump && this.isGrounded) {
      this.velocity.y = JUMP_VELOCITY;
      this.isGrounded = false;
    }

    // Variable jump height: releasing jump button while traveling upward cuts upward velocity
    if (!input.jump && this.velocity.y < -80) {
      this.velocity.y += GRAVITY * 1.8 * dt;
    }

    // 3. Gravity Acceleration
    this.velocity.y += GRAVITY * dt;
    if (this.velocity.y > TERMINAL_VELOCITY) {
      this.velocity.y = TERMINAL_VELOCITY;
    }

    // 4. Two-Pass Collision Resolution
    const collision = CollisionSolver.moveAndResolve(
      world,
      this.aabb,
      this.velocity,
      dt
    );
    this.isGrounded = collision.isGrounded;

    // Sync position with resolved AABB
    this.position.set(this.aabb.x, this.aabb.y);

    // 5. State Machine Update
    if (!this.isGrounded) {
      this.state = this.velocity.y < 0 ? 'JUMP' : 'FALL';
    } else if (Math.abs(this.velocity.x) > 10) {
      this.state = 'RUN';
      this.walkAnimTimer += dt * 12; // Cycle animation frames
    } else {
      this.state = 'IDLE';
      this.walkAnimTimer = 0;
    }
  }

  /**
   * Renders the stylized pixel-art character sprite.
   */
  public render(ctx: CanvasRenderingContext2D): void {
    const x = Math.round(this.aabb.x);
    const y = Math.round(this.aabb.y);
    const isFacingLeft = this.facing === 'left';

    ctx.save();

    // 1. Hair / Hat (Dark Brown)
    ctx.fillStyle = '#451a03';
    ctx.fillRect(x + 1, y, 10, 5);
    ctx.fillRect(isFacingLeft ? x : x + 2, y + 2, 10, 4);

    // 2. Face / Skin
    ctx.fillStyle = '#fde047'; // Stylized retro skin tone
    ctx.fillRect(x + 2, y + 4, 8, 6);

    // Eyes (Directional)
    ctx.fillStyle = '#0f172a';
    if (isFacingLeft) {
      ctx.fillRect(x + 3, y + 6, 2, 2); // Left-facing eye
    } else {
      ctx.fillRect(x + 7, y + 6, 2, 2); // Right-facing eye
    }

    // 3. Tunic / Shirt (Crimson Red)
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(x + 1, y + 10, 10, 8);

    // White Collar / Armor Trim
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(x + 4, y + 10, 4, 2);

    // 4. Belt (Dark Leather with Gold Buckle)
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x + 1, y + 17, 10, 2);
    ctx.fillStyle = '#eab308'; // Gold buckle
    ctx.fillRect(x + 5, y + 17, 2, 2);

    // 5. Pants & Boots (Animated Walk Cycle)
    ctx.fillStyle = '#1e3a8a'; // Deep Navy Denim
    let legOffset = 0;
    if (this.state === 'RUN') {
      legOffset = Math.sin(this.walkAnimTimer) * 2;
    }

    // Left Leg & Boot
    ctx.fillRect(x + 2, y + 19, 3, Math.max(2, 5 + legOffset));
    ctx.fillStyle = '#374151'; // Charcoal boot
    ctx.fillRect(x + 1, y + 23 + Math.round(legOffset), 4, 3);

    // Right Leg & Boot
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(x + 7, y + 19, 3, Math.max(2, 5 - legOffset));
    ctx.fillStyle = '#374151';
    ctx.fillRect(x + 7, y + 23 - Math.round(legOffset), 4, 3);

    ctx.restore();
  }
}
