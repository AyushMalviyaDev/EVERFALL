/**
 * Automated Verification for World, Chunk, and TileRegistry
 */
import { World } from './World.ts';
import { TileId, isTileSolid } from './TileRegistry.ts';

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`[Assertion Failed] ${msg}`);
}

export function runWorldVerification(): boolean {
  console.log('[Test] Running TerraForge World & Chunk Verification...');

  const world = new World();

  // Test 1: Single block placement across positive and negative chunk boundaries
  world.setTile(0, 0, TileId.GRASS);
  assert(world.getTile(0, 0) === TileId.GRASS, 'Tile at (0, 0) should be GRASS');
  assert(world.isSolid(0, 0) === true, 'GRASS should be solid');

  // Negative boundary: tx = -1, ty = 0 should land in chunk (-1, 0), local (15, 0)
  world.setTile(-1, 0, TileId.DIRT);
  assert(world.getTile(-1, 0) === TileId.DIRT, 'Tile at (-1, 0) should be DIRT');
  const negChunk = world.getChunk(-1, 0);
  assert(negChunk !== undefined, 'Chunk (-1, 0) must exist');
  assert(negChunk!.getTile(15, 0) === TileId.DIRT, 'Local (-1, 0) tile must be at local index (15, 0)');

  // Chunk boundary: tx = 16, ty = 0 should land in chunk (1, 0), local (0, 0)
  world.setTile(16, 0, TileId.STONE);
  assert(world.getTile(16, 0) === TileId.STONE, 'Tile at (16, 0) should be STONE');
  const nextChunk = world.getChunk(1, 0);
  assert(nextChunk !== undefined, 'Chunk (1, 0) must exist');
  assert(nextChunk!.getTile(0, 0) === TileId.STONE, 'Local (1, 0) tile must be at local index (0, 0)');

  // Test 2: Solidity and AIR
  assert(world.isSolid(999, 999) === false, 'Unloaded air should not be solid');
  assert(isTileSolid(TileId.AIR) === false, 'AIR must not be solid');
  assert(isTileSolid(TileId.WOOD_PLANK) === true, 'WOOD_PLANK must be solid');

  // Test 3: Generate Test World
  const testWorld = new World();
  testWorld.generateTestWorld(-2, 2, 0, 4);
  assert(testWorld.loadedChunkCount > 0, 'Test world should have loaded chunks');
  
  // Verify sky is AIR and subterranean is solid
  assert(testWorld.getTile(0, 5) === TileId.AIR, 'High sky tile should be AIR');
  assert(testWorld.isSolid(0, 35) === true, 'Surface grass tile should be solid');
  assert(testWorld.isSolid(0, 40) === true, 'Underground tile should be solid');

  console.log(`[Test] World test passed with ${testWorld.loadedChunkCount} generated chunks!`);
  return true;
}

if (typeof window === 'undefined') {
  runWorldVerification();
}
