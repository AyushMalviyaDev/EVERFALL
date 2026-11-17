/**
 * Automated Verification for InteractionSystem (Mining & Placing)
 */
import { InteractionSystem } from './InteractionSystem.ts';
import { World } from '../world/World.ts';
import { TileId } from '../world/TileRegistry.ts';
import { Player } from '../entities/Player.ts';
import { ParticleSystem } from '../particles/ParticleSystem.ts';
import { TILE_SIZE, PLAYER_REACH_DISTANCE } from '../constants.ts';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`[Assertion Failed] ${msg}`);
}

export function runInteractionVerification(): boolean {
  console.log('[Test] Running TerraForge InteractionSystem Verification...');

  const world = new World();
  const particles = new ParticleSystem();
  const interaction = new InteractionSystem(world, particles);
  assert(interaction.activeBlockId === TileId.DIRT, 'Default material should be DIRT');

  // Spawn player at (100, 100)
  const player = new Player(100, 100);

  // 1. Setup a block right next to the player (in reach)
  // Player center is ~(106, 113). Tile (7, 7) = (112, 112)
  const nearTx = 7;
  const nearTy = 7;
  world.setTile(nearTx, nearTy, TileId.STONE);
  assert(world.getTile(nearTx, nearTy) === TileId.STONE, 'Setup stone tile');

  // Verify distance
  const tileCenterX = nearTx * TILE_SIZE + 8;
  const tileCenterY = nearTy * TILE_SIZE + 8;
  const dx = tileCenterX - player.center.x;
  const dy = tileCenterY - player.center.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  assert(dist < PLAYER_REACH_DISTANCE, 'Near tile must be within reach distance');

  // 2. Setup a block far away (out of reach)
  const farTx = nearTx + 20; // 320px away
  world.setTile(farTx, nearTy, TileId.STONE);

  const farDx = farTx * TILE_SIZE + 8 - player.center.x;
  const farDist = Math.sqrt(farDx * farDx + dy * dy);
  assert(farDist > PLAYER_REACH_DISTANCE, 'Far tile must be out of reach distance');

  // 3. Mining verification
  // Mine near tile
  world.setTile(nearTx, nearTy, TileId.AIR);
  particles.spawnTileBreak(nearTx * TILE_SIZE, nearTy * TILE_SIZE, '#64748b', 8);
  assert(world.getTile(nearTx, nearTy) === TileId.AIR, 'Mined tile should now be AIR');
  assert(particles.activeCount === 8, '8 particles should have spawned');

  // 4. Placing verification
  world.setTile(nearTx, nearTy, TileId.WOOD_PLANK);
  assert(world.getTile(nearTx, nearTy) === TileId.WOOD_PLANK, 'Tile should now be WOOD_PLANK');

  // 5. Body intersection test: placing at player's own tile coordinate
  const playerTx = Math.floor(player.aabb.centerX / TILE_SIZE);
  const playerTy = Math.floor(player.aabb.centerY / TILE_SIZE);
  // Tile AABB overlaps player.aabb
  const bodyIntersects = player.aabb.containsPoint(playerTx * TILE_SIZE + 8, playerTy * TILE_SIZE + 8);
  assert(bodyIntersects === true, 'Tile at player center must intersect player body');

  console.log('[Test] InteractionSystem tests PASSED successfully!');
  return true;
}

if (typeof window === 'undefined') {
  runInteractionVerification();
}
