/**
 * TerraForge - World
 * 
 * Manages the collection of active chunks using a spatial hash map.
 * Provides global tile coordinate access and procedural test terrain generation.
 */

import {
  CHUNK_WIDTH,
  CHUNK_HEIGHT
} from '../constants.ts';
import {
  tileToChunk,
  chunkKey
} from '../math/Coordinates.ts';
import { Chunk } from './Chunk.ts';
import { TileId, isTileSolid } from './TileRegistry.ts';

export class World {
  private chunks = new Map<string, Chunk>();

  /**
   * Retrieves a chunk by its chunk coordinates.
   */
  public getChunk(cx: number, cy: number): Chunk | undefined {
    return this.chunks.get(chunkKey(cx, cy));
  }

  /**
   * Sets or replaces a chunk.
   */
  public setChunk(chunk: Chunk): void {
    this.chunks.set(chunkKey(chunk.cx, chunk.cy), chunk);
  }

  /**
   * Retrieves an existing chunk or instantiates a new empty one.
   */
  public getOrCreateChunk(cx: number, cy: number): Chunk {
    const key = chunkKey(cx, cy);
    let chunk = this.chunks.get(key);
    if (!chunk) {
      chunk = new Chunk(cx, cy);
      this.chunks.set(key, chunk);
    }
    return chunk;
  }

  /**
   * Retrieves tile ID at global tile coordinates (tx, ty).
   */
  public getTile(tx: number, ty: number): number {
    const { cx, cy, lx, ly } = tileToChunk(tx, ty);
    const chunk = this.getChunk(cx, cy);
    if (!chunk) {
      return TileId.AIR;
    }
    return chunk.getTile(lx, ly);
  }

  /**
   * Sets tile ID at global tile coordinates (tx, ty).
   * Automatically creates the containing chunk if it does not yet exist.
   */
  public setTile(tx: number, ty: number, tileId: number): boolean {
    const { cx, cy, lx, ly } = tileToChunk(tx, ty);
    const chunk = this.getOrCreateChunk(cx, cy);
    return chunk.setTile(lx, ly, tileId);
  }

  /**
   * Checks whether the tile at global tile coordinates is solid.
   */
  public isSolid(tx: number, ty: number): boolean {
    return isTileSolid(this.getTile(tx, ty));
  }

  /**
   * Returns all currently loaded chunks.
   */
  public getAllChunks(): Chunk[] {
    return Array.from(this.chunks.values());
  }

  /**
   * Returns total number of active chunks loaded in memory.
   */
  public get loadedChunkCount(): number {
    return this.chunks.size;
  }

  /**
   * Retrieves chunks overlapping the given chunk bounding box.
   */
  public getChunksInRegion(
    minCx: number,
    minCy: number,
    maxCx: number,
    maxCy: number
  ): Chunk[] {
    const result: Chunk[] = [];
    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const chunk = this.getChunk(cx, cy);
        if (chunk) {
          result.push(chunk);
        }
      }
    }
    return result;
  }

  /**
   * Generates a playable, multi-chunk test world with rolling hills,
   * grass, dirt layers, stone underbelly, cave pockets, and wood structures.
   */
  public generateTestWorld(
    startChunkX = -4,
    endChunkX = 12,
    startChunkY = 0,
    endChunkY = 7
  ): void {
    const baseSurfaceTileY = 32; // Surface level starts around tile Y = 32 (chunk 2)
    const bedrockTileY = endChunkY * CHUNK_HEIGHT - 1;

    for (let cx = startChunkX; cx <= endChunkX; cx++) {
      for (let cy = startChunkY; cy <= endChunkY; cy++) {
        const chunk = this.getOrCreateChunk(cx, cy);

        for (let lx = 0; lx < CHUNK_WIDTH; lx++) {
          const globalTx = cx * CHUNK_WIDTH + lx;

          // Rolling hills surface height function
          const surfaceY = Math.round(
            baseSurfaceTileY +
            Math.sin(globalTx * 0.08) * 5 +
            Math.cos(globalTx * 0.03) * 3
          );

          for (let ly = 0; ly < CHUNK_HEIGHT; ly++) {
            const globalTy = cy * CHUNK_HEIGHT + ly;

            if (globalTy < surfaceY) {
              // Sky / Atmosphere
              chunk.setTile(lx, ly, TileId.AIR);
            } else if (globalTy === surfaceY) {
              // Surface Grass
              chunk.setTile(lx, ly, TileId.GRASS);
            } else if (globalTy > surfaceY && globalTy <= surfaceY + 4) {
              // Subsurface Dirt Layer (4 tiles deep)
              chunk.setTile(lx, ly, TileId.DIRT);
            } else if (globalTy >= bedrockTileY) {
              // Bedrock floor
              chunk.setTile(lx, ly, TileId.BEDROCK);
            } else {
              // Deep Stone layer with occasional cave pockets
              // Simple trigonometric carve for test caves
              const caveNoise =
                Math.sin(globalTx * 0.15) * Math.cos(globalTy * 0.15) +
                Math.sin(globalTx * 0.07 + globalTy * 0.07);

              if (caveNoise > 0.8 && globalTy > surfaceY + 8) {
                // Cave cavity
                chunk.setTile(lx, ly, TileId.AIR);
              } else {
                chunk.setTile(lx, ly, TileId.STONE);
              }
            }
          }
        }
      }
    }

    // Place a couple of wooden platforms & structures near origin (tx = 0 to 10)
    for (let x = -2; x <= 6; x++) {
      this.setTile(x, 26, TileId.WOOD_PLANK); // Elevated platform
    }
    for (let x = 8; x <= 14; x++) {
      this.setTile(x, 23, TileId.WOOD_PLANK); // Higher platform
    }

    // A small brick house framework
    for (let y = 28; y <= 31; y++) {
      this.setTile(-6, y, TileId.BRICK); // Left wall
      this.setTile(-1, y, TileId.BRICK); // Right wall
    }
    for (let x = -6; x <= -1; x++) {
      this.setTile(x, 27, TileId.BRICK); // Roof
    }
  }
}
