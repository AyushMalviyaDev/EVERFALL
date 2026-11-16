/**
 * Automated Verification for AABB and Two-Pass CollisionSolver
 */
import { AABB } from './AABB.ts';
import { CollisionSolver } from './CollisionSolver.ts';
import { World } from '../world/World.ts';
import { TileId } from '../world/TileRegistry.ts';
import { Vector2 } from '../math/Vector2.ts';
import { TILE_SIZE } from '../constants.ts';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`[Assertion Failed] ${msg}`);
}

export function runPhysicsVerification(): boolean {
  console.log('[Test] Running TerraForge Physics & CollisionSolver Verification...');

  const world = new World();
  // Create a solid floor at ty = 10 (worldY = 160)
  for (let tx = -5; tx <= 5; tx++) {
    world.setTile(tx, 10, TileId.STONE);
  }

  // 1. AABB Intersection Tests
  const box1 = new AABB(0, 0, 16, 16);
  const box2 = new AABB(8, 8, 16, 16);
  const box3 = new AABB(32, 32, 16, 16);
  assert(box1.intersects(box2) === true, 'Overlapping boxes should intersect');
  assert(box1.intersects(box3) === false, 'Disjoint boxes should not intersect');

  // 2. Vertical Fall Collision onto Floor
  const entityAABB = new AABB(0, 100, 12, 26);
  const velocity = new Vector2(0, 200); // Falling fast at 200 px/s
  const dt = 1 / 60; // One tick

  // Simulate multiple steps until it lands
  let landed = false;
  for (let i = 0; i < 30; i++) {
    const res = CollisionSolver.moveAndResolve(world, entityAABB, velocity, dt);
    if (res.isGrounded) {
      landed = true;
      break;
    }
  }

  assert(landed === true, 'Entity should have landed on the floor');
  assert(velocity.y === 0, 'Vertical velocity should be zeroed upon landing');
  // Floor top is at 10 * 16 = 160. Height is 26.
  // So aabb.y should be 160 - 26 - EPSILON = 133.999
  const expectedY = 10 * TILE_SIZE - entityAABB.height;
  assert(
    Math.abs(entityAABB.y - expectedY) < 0.01,
    `Entity landed at wrong Y: ${entityAABB.y}, expected ~${expectedY}`
  );

  // 3. Horizontal Wall Collision
  // Place a solid wall at tx = 2 (worldX = 32)
  world.setTile(2, 8, TileId.STONE);
  world.setTile(2, 9, TileId.STONE);

  const runnerAABB = new AABB(0, 8 * TILE_SIZE, 12, 26);
  const runVel = new Vector2(150, 0); // Running right towards wall

  let hitWall = false;
  for (let i = 0; i < 30; i++) {
    const res = CollisionSolver.moveAndResolve(world, runnerAABB, runVel, dt);
    if (res.hitWallRight) {
      hitWall = true;
      break;
    }
  }

  assert(hitWall === true, 'Runner should have collided with the right wall');
  assert(runVel.x === 0, 'Horizontal velocity should be zeroed upon wall impact');
  // Wall left edge is 2 * 16 = 32. Width is 12.
  // Runner X should be 32 - 12 = 20
  const expectedX = 2 * TILE_SIZE - runnerAABB.width;
  assert(
    Math.abs(runnerAABB.x - expectedX) < 0.01,
    `Runner stopped at wrong X: ${runnerAABB.x}, expected ~${expectedX}`
  );

  console.log('[Test] Physics & CollisionSolver tests PASSED successfully!');
  return true;
}

if (typeof window === 'undefined') {
  runPhysicsVerification();
}
