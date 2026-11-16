/**
 * Automated Verification Test for Vector2 and Coordinates System
 */
import { Vector2 } from './Vector2.ts';
import {
  worldToTile,
  tileToWorld,
  tileToChunk,
  chunkToTile,
  localTileIndex,
  indexToLocalTile,
  chunkKey,
  parseChunkKey,
  screenToWorld,
  worldToScreen
} from './Coordinates.ts';
import { TILE_SIZE, CHUNK_WIDTH, CHUNK_HEIGHT } from '../constants.ts';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${msg}`);
  }
}

export function runMathVerification(): boolean {
  console.log('[Test] Running TerraForge Math & Coordinates Verification...');

  // 1. Vector2 Tests
  const v1 = new Vector2(3, 4);
  assert(v1.length() === 5, 'Vector2 length calculation failed');
  
  const norm = v1.normalize();
  assert(Math.abs(norm.length() - 1.0) < 1e-6, 'Vector2 normalization failed');

  const v2 = new Vector2(1, 2);
  const sum = v1.add(v2);
  assert(sum.x === 4 && sum.y === 6, 'Vector2 immutable addition failed');
  assert(v1.x === 3 && v1.y === 4, 'Vector2 mutated unexpectedly');

  v1.addMut(v2);
  assert(v1.x === 4 && v1.y === 6, 'Vector2 mutable addMut failed');

  const lerpVal = new Vector2(0, 0).lerp(new Vector2(10, 20), 0.5);
  assert(lerpVal.x === 5 && lerpVal.y === 10, 'Vector2 lerp failed');

  // 2. Coordinates Tests - Positive and Negative Grid Transitions
  const testCoords = [
    { tx: 0, ty: 0 },
    { tx: 15, ty: 15 },
    { tx: 16, ty: 16 },
    { tx: 31, ty: 47 },
    { tx: -1, ty: -1 },
    { tx: -16, ty: -16 },
    { tx: -17, ty: -33 },
    { tx: 100, ty: -50 }
  ];

  for (const { tx, ty } of testCoords) {
    const decomp = tileToChunk(tx, ty);
    
    // Bounds check on local coords
    assert(
      decomp.lx >= 0 && decomp.lx < CHUNK_WIDTH,
      `Local X out of bounds for tx=${tx}: lx=${decomp.lx}`
    );
    assert(
      decomp.ly >= 0 && decomp.ly < CHUNK_HEIGHT,
      `Local Y out of bounds for ty=${ty}: ly=${decomp.ly}`
    );

    // Roundtrip verification
    const roundtrip = chunkToTile(decomp.cx, decomp.cy, decomp.lx, decomp.ly);
    assert(
      roundtrip.tx === tx && roundtrip.ty === ty,
      `Chunk decomposition roundtrip mismatch for (${tx}, ${ty}) -> decomp=(${decomp.cx},${decomp.cy},${decomp.lx},${decomp.ly}) -> result=(${roundtrip.tx},${roundtrip.ty})`
    );

    // 1D Array index mapping roundtrip
    const idx = localTileIndex(decomp.lx, decomp.ly);
    assert(idx >= 0 && idx < 256, `Local tile index out of bounds: ${idx}`);
    const localCoord = indexToLocalTile(idx);
    assert(
      localCoord.lx === decomp.lx && localCoord.ly === decomp.ly,
      `Index to local tile roundtrip mismatch for index ${idx}`
    );
  }

  // 3. World <-> Tile Tests
  const worldPos = new Vector2(35.5, 68.2); // (35.5/16 = 2.21875 -> tx=2, 68.2/16 = 4.2625 -> ty=4)
  const tilePos = worldToTile(worldPos.x, worldPos.y);
  assert(tilePos.tx === 2 && tilePos.ty === 4, 'worldToTile positive conversion failed');

  const negWorldPos = new Vector2(-5.0, -20.0); // -5/16 = -0.3125 -> -1, -20/16 = -1.25 -> -2
  const negTilePos = worldToTile(negWorldPos.x, negWorldPos.y);
  assert(negTilePos.tx === -1 && negTilePos.ty === -2, 'worldToTile negative conversion failed');

  const tileOrigin = tileToWorld(2, 4);
  assert(tileOrigin.x === 2 * TILE_SIZE && tileOrigin.y === 4 * TILE_SIZE, 'tileToWorld failed');

  // 4. Chunk Key Formatting & Parsing
  const key = chunkKey(-3, 14);
  assert(key === '-3,14', 'chunkKey format failed');
  const parsedKey = parseChunkKey(key);
  assert(parsedKey.cx === -3 && parsedKey.cy === 14, 'parseChunkKey failed');

  // 5. Screen <-> World Transformation Roundtrip
  const canvasW = 1280;
  const canvasH = 720;
  const camX = 500;
  const camY = 300;
  const zoom = 2.0;

  const testPoints = [
    { sx: 0, sy: 0 },
    { sx: 640, sy: 360 }, // Center of screen
    { sx: 1280, sy: 720 },
    { sx: 421, sy: 189 }
  ];

  for (const pt of testPoints) {
    const worldPoint = screenToWorld(pt.sx, pt.sy, camX, camY, canvasW, canvasH, zoom);
    const screenPoint = worldToScreen(worldPoint.x, worldPoint.y, camX, camY, canvasW, canvasH, zoom);
    
    assert(
      Math.abs(screenPoint.x - pt.sx) < 1e-4 && Math.abs(screenPoint.y - pt.sy) < 1e-4,
      `Screen to World roundtrip failed for point (${pt.sx}, ${pt.sy})`
    );
  }

  console.log('[Test] All Math & Coordinates Verification Tests PASSED successfully!');
  return true;
}

// Auto-run if executed directly
if (typeof window === 'undefined') {
  runMathVerification();
}
