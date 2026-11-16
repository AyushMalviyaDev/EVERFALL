/**
 * TerraForge - Coordinate Transformation System
 * 
 * Handles bidirectional mathematical mappings between:
 * 1. Screen Space: Pixel coordinates on the HTML5 Canvas DOM element.
 * 2. World Space: Continuous Cartesian pixel coordinates (x, y).
 * 3. Tile Space: Discrete integer grid coordinates (tx, ty).
 * 4. Chunk Space: Discrete chunk coordinates (cx, cy) and local chunk tile indices (lx, ly).
 */

import {
  TILE_SIZE,
  CHUNK_WIDTH,
  CHUNK_HEIGHT,
  CHUNK_PIXEL_WIDTH,
  CHUNK_PIXEL_HEIGHT
} from '../constants.ts';
import { Vector2 } from './Vector2.ts';

export interface TileCoord {
  tx: number;
  ty: number;
}

export interface ChunkCoord {
  cx: number;
  cy: number;
}

export interface LocalTileCoord {
  lx: number;
  ly: number;
}

export interface ChunkTileDecomposition {
  cx: number;
  cy: number;
  lx: number;
  ly: number;
}

/**
 * Converts continuous world pixel coordinates to discrete global tile coordinates.
 */
export function worldToTile(worldX: number, worldY: number): TileCoord {
  return {
    tx: Math.floor(worldX / TILE_SIZE),
    ty: Math.floor(worldY / TILE_SIZE),
  };
}

/**
 * Converts discrete global tile coordinates to top-left world pixel coordinates.
 */
export function tileToWorld(tx: number, ty: number): Vector2 {
  return new Vector2(tx * TILE_SIZE, ty * TILE_SIZE);
}

/**
 * Converts discrete global tile coordinates to top-left world pixel coordinates (in-place target).
 */
export function tileToWorldMut(tx: number, ty: number, out: Vector2): Vector2 {
  out.x = tx * TILE_SIZE;
  out.y = ty * TILE_SIZE;
  return out;
}

/**
 * Decomposes global tile coordinates into chunk coordinates and local [0..CHUNK_SIZE-1] offsets.
 * Properly accounts for negative numbers in Cartesian space.
 */
export function tileToChunk(tx: number, ty: number): ChunkTileDecomposition {
  const cx = Math.floor(tx / CHUNK_WIDTH);
  const cy = Math.floor(ty / CHUNK_HEIGHT);

  const lx = ((tx % CHUNK_WIDTH) + CHUNK_WIDTH) % CHUNK_WIDTH;
  const ly = ((ty % CHUNK_HEIGHT) + CHUNK_HEIGHT) % CHUNK_HEIGHT;

  return { cx, cy, lx, ly };
}

/**
 * Converts chunk coordinates + local chunk tile offsets back to global tile coordinates.
 */
export function chunkToTile(cx: number, cy: number, lx: number, ly: number): TileCoord {
  return {
    tx: cx * CHUNK_WIDTH + lx,
    ty: cy * CHUNK_HEIGHT + ly,
  };
}

/**
 * Converts chunk coordinates to the world pixel position of the chunk's top-left corner.
 */
export function chunkToWorld(cx: number, cy: number): Vector2 {
  return new Vector2(cx * CHUNK_PIXEL_WIDTH, cy * CHUNK_PIXEL_HEIGHT);
}

/**
 * Maps 2D local chunk coordinates (lx, ly) to a flat 1D array index [0..255].
 */
export function localTileIndex(lx: number, ly: number): number {
  return ly * CHUNK_WIDTH + lx;
}

/**
 * Maps a flat 1D array index back to 2D local chunk coordinates (lx, ly).
 */
export function indexToLocalTile(index: number): LocalTileCoord {
  return {
    lx: index % CHUNK_WIDTH,
    ly: Math.floor(index / CHUNK_WIDTH),
  };
}

/**
 * Generates a spatial hash map key for a chunk: "${cx},${cy}"
 */
export function chunkKey(cx: number, cy: number): string {
  return `${cx},${cy}`;
}

/**
 * Parses a spatial hash map key back into numeric chunk coordinates.
 */
export function parseChunkKey(key: string): ChunkCoord {
  const parts = key.split(',');
  return {
    cx: parseInt(parts[0], 10),
    cy: parseInt(parts[1], 10),
  };
}

/**
 * Converts Screen Space coordinates (canvas mouse pixels) to World Space coordinates.
 * 
 * @param screenX Mouse X in canvas pixels
 * @param screenY Mouse Y in canvas pixels
 * @param cameraX World X that camera is centered on
 * @param cameraY World Y that camera is centered on
 * @param canvasWidth Viewport pixel width
 * @param canvasHeight Viewport pixel height
 * @param zoom Camera zoom multiplier (e.g. 2.0)
 */
export function screenToWorld(
  screenX: number,
  screenY: number,
  cameraX: number,
  cameraY: number,
  canvasWidth: number,
  canvasHeight: number,
  zoom: number
): Vector2 {
  return new Vector2(
    cameraX + (screenX - canvasWidth / 2) / zoom,
    cameraY + (screenY - canvasHeight / 2) / zoom
  );
}

/**
 * Converts World Space coordinates to Screen Space coordinates.
 * 
 * @param worldX World X position
 * @param worldY World Y position
 * @param cameraX World X that camera is centered on
 * @param cameraY World Y that camera is centered on
 * @param canvasWidth Viewport pixel width
 * @param canvasHeight Viewport pixel height
 * @param zoom Camera zoom multiplier
 */
export function worldToScreen(
  worldX: number,
  worldY: number,
  cameraX: number,
  cameraY: number,
  canvasWidth: number,
  canvasHeight: number,
  zoom: number
): Vector2 {
  return new Vector2(
    (worldX - cameraX) * zoom + canvasWidth / 2,
    (worldY - cameraY) * zoom + canvasHeight / 2
  );
}
