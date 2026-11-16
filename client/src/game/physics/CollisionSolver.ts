/**
 * TerraForge - Two-Pass AABB Collision Solver
 * 
 * Resolves kinetic entity collisions against the discrete voxel tile grid.
 * Separates X and Y axis resolution into two distinct passes:
 * 1. Horizontal Move & Resolve (prevents corner snagging and wall clipping)
 * 2. Vertical Move & Resolve (ensures rock-solid floor landing and ceiling bumping)
 */

import { TILE_SIZE } from '../constants.ts';
import { World } from '../world/World.ts';
import { Vector2 } from '../math/Vector2.ts';
import { AABB } from './AABB.ts';

export interface CollisionResult {
  isGrounded: boolean;
  hitCeiling: boolean;
  hitWallLeft: boolean;
  hitWallRight: boolean;
}

export class CollisionSolver {
  private static readonly EPSILON = 0.001;

  /**
   * Updates an entity's AABB position based on velocity, resolving collisions against the world.
   */
  public static moveAndResolve(
    world: World,
    aabb: AABB,
    velocity: Vector2,
    dt: number
  ): CollisionResult {
    const result: CollisionResult = {
      isGrounded: false,
      hitCeiling: false,
      hitWallLeft: false,
      hitWallRight: false,
    };

    // --- PASS 1: Horizontal Movement & Resolution ---
    aabb.x += velocity.x * dt;

    let minTx = Math.floor(aabb.left / TILE_SIZE);
    let maxTx = Math.floor((aabb.right - this.EPSILON) / TILE_SIZE);
    let minTy = Math.floor(aabb.top / TILE_SIZE);
    let maxTy = Math.floor((aabb.bottom - this.EPSILON) / TILE_SIZE);

    if (velocity.x > 0) {
      // Moving Right: test right-most tiles
      for (let ty = minTy; ty <= maxTy; ty++) {
        if (world.isSolid(maxTx, ty)) {
          // Snap left of the solid tile
          aabb.x = maxTx * TILE_SIZE - aabb.width - this.EPSILON;
          velocity.x = 0;
          result.hitWallRight = true;
          break;
        }
      }
    } else if (velocity.x < 0) {
      // Moving Left: test left-most tiles
      for (let ty = minTy; ty <= maxTy; ty++) {
        if (world.isSolid(minTx, ty)) {
          // Snap right of the solid tile
          aabb.x = (minTx + 1) * TILE_SIZE + this.EPSILON;
          velocity.x = 0;
          result.hitWallLeft = true;
          break;
        }
      }
    }

    // --- PASS 2: Vertical Movement & Resolution ---
    aabb.y += velocity.y * dt;

    minTx = Math.floor(aabb.left / TILE_SIZE);
    maxTx = Math.floor((aabb.right - this.EPSILON) / TILE_SIZE);
    minTy = Math.floor(aabb.top / TILE_SIZE);
    maxTy = Math.floor((aabb.bottom - this.EPSILON) / TILE_SIZE);

    if (velocity.y > 0) {
      // Falling Down: test bottom-most tiles
      for (let tx = minTx; tx <= maxTx; tx++) {
        if (world.isSolid(tx, maxTy)) {
          // Snap on top of the solid tile
          aabb.y = maxTy * TILE_SIZE - aabb.height - this.EPSILON;
          velocity.y = 0;
          result.isGrounded = true;
          break;
        }
      }
    } else if (velocity.y < 0) {
      // Jumping Up: test top-most tiles (Ceiling Bonk)
      for (let tx = minTx; tx <= maxTx; tx++) {
        if (world.isSolid(tx, minTy)) {
          // Snap below the ceiling tile
          aabb.y = (minTy + 1) * TILE_SIZE + this.EPSILON;
          velocity.y = 0;
          result.hitCeiling = true;
          break;
        }
      }
    }

    return result;
  }

  /**
   * Checks whether the specified AABB overlaps any solid tile in the world.
   * Useful for validating spawn points and block placement.
   */
  public static isAreaClear(world: World, aabb: AABB): boolean {
    const minTx = Math.floor(aabb.left / TILE_SIZE);
    const maxTx = Math.floor((aabb.right - this.EPSILON) / TILE_SIZE);
    const minTy = Math.floor(aabb.top / TILE_SIZE);
    const maxTy = Math.floor((aabb.bottom - this.EPSILON) / TILE_SIZE);

    for (let tx = minTx; tx <= maxTx; tx++) {
      for (let ty = minTy; ty <= maxTy; ty++) {
        if (world.isSolid(tx, ty)) {
          return false;
        }
      }
    }
    return true;
  }
}
