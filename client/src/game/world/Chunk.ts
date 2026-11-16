/**
 * TerraForge - Chunk
 * 
 * Represents a discrete 16x16 block partition of the voxel world.
 * Internally backed by a compact 1D Uint8Array for high performance
 * and minimal memory footprint (256 bytes per chunk).
 */

import {
  CHUNK_WIDTH,
  CHUNK_HEIGHT,
  CHUNK_TOTAL_TILES
} from '../constants.ts';
import { localTileIndex } from '../math/Coordinates.ts';
import { TileId, isTileSolid } from './TileRegistry.ts';

export class Chunk {
  public readonly cx: number;
  public readonly cy: number;
  public readonly tiles: Uint8Array;
  public isDirty: boolean = false;

  constructor(cx: number, cy: number, initialTiles?: Uint8Array) {
    this.cx = cx;
    this.cy = cy;

    if (initialTiles && initialTiles.length === CHUNK_TOTAL_TILES) {
      this.tiles = new Uint8Array(initialTiles);
    } else {
      this.tiles = new Uint8Array(CHUNK_TOTAL_TILES); // Defaults to 0 (TileId.AIR)
    }
  }

  /**
   * Retrieves tile ID at local chunk coordinates (lx, ly) in [0..15].
   * Returns AIR if out of bounds.
   */
  public getTile(lx: number, ly: number): number {
    if (lx < 0 || lx >= CHUNK_WIDTH || ly < 0 || ly >= CHUNK_HEIGHT) {
      return TileId.AIR;
    }
    return this.tiles[localTileIndex(lx, ly)];
  }

  /**
   * Sets tile ID at local chunk coordinates (lx, ly).
   */
  public setTile(lx: number, ly: number, tileId: number): boolean {
    if (lx < 0 || lx >= CHUNK_WIDTH || ly < 0 || ly >= CHUNK_HEIGHT) {
      return false;
    }
    const idx = localTileIndex(lx, ly);
    if (this.tiles[idx] !== tileId) {
      this.tiles[idx] = tileId;
      this.isDirty = true;
      return true;
    }
    return false;
  }

  /**
   * Checks whether the tile at local chunk coordinates is solid.
   */
  public isSolid(lx: number, ly: number): boolean {
    return isTileSolid(this.getTile(lx, ly));
  }

  /**
   * Clones chunk tile buffer.
   */
  public cloneTiles(): Uint8Array {
    return new Uint8Array(this.tiles);
  }
}
