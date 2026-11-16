/**
 * TerraForge - Viewport Culling 2D Renderer
 * 
 * Renders the tile-based world with strict viewport culling:
 * Only chunks and tiles intersecting the camera's field of view are processed.
 * Features procedural pixel-art textures with stylized depth borders and grass fringes.
 */

import {
  TILE_SIZE,
  CHUNK_WIDTH,
  CHUNK_HEIGHT,
  CHUNK_PIXEL_WIDTH,
  CHUNK_PIXEL_HEIGHT
} from '../constants.ts';
import { World } from '../world/World.ts';
import { TileId, getTileDef } from '../world/TileRegistry.ts';
import { Camera } from './Camera.ts';

export interface RenderStats {
  renderedChunks: number;
  renderedTiles: number;
}

export class Renderer {
  public world: World;
  public camera: Camera;

  // Debug Visualization Toggles
  public showTileGrid: boolean = false;
  public showChunkBorders: boolean = false;

  // Performance Metrics
  public stats: RenderStats = {
    renderedChunks: 0,
    renderedTiles: 0,
  };

  constructor(world: World, camera: Camera) {
    this.world = world;
    this.camera = camera;
  }

  /**
   * Main render pass.
   */
  public render(ctx: CanvasRenderingContext2D): void {
    const width = this.camera.viewportWidth;
    const height = this.camera.viewportHeight;

    // Reset render stats
    this.stats.renderedChunks = 0;
    this.stats.renderedTiles = 0;

    // 1. Draw atmospheric sky background
    this.renderSky(ctx, width, height);

    // 2. Apply camera viewport transformation (Translation + Zoom)
    this.camera.applyTransform(ctx);

    // 3. Render world with viewport culling
    this.renderWorld(ctx);

    // 4. Restore camera transformation for screen-space overlays
    this.camera.restoreTransform(ctx);
  }

  /**
   * Draws a soft retro gradient for the sky.
   */
  private renderSky(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#38bdf8'); // Sky blue
    gradient.addColorStop(0.7, '#7dd3fc');
    gradient.addColorStop(1, '#bae6fd'); // Horizon glow
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  /**
   * Iterates through visible chunks and tiles, drawing only what is within the camera bounds.
   */
  private renderWorld(ctx: CanvasRenderingContext2D): void {
    const bounds = this.camera.getVisibleBounds(16); // 16px safety padding

    // Compute visible chunk coordinate span
    const minCx = Math.floor(bounds.minX / CHUNK_PIXEL_WIDTH);
    const maxCx = Math.floor(bounds.maxX / CHUNK_PIXEL_WIDTH);
    const minCy = Math.floor(bounds.minY / CHUNK_PIXEL_HEIGHT);
    const maxCy = Math.floor(bounds.maxY / CHUNK_PIXEL_HEIGHT);

    for (let cx = minCx; cx <= maxCx; cx++) {
      for (let cy = minCy; cy <= maxCy; cy++) {
        const chunk = this.world.getChunk(cx, cy);
        if (!chunk) continue;

        this.stats.renderedChunks++;
        const chunkWorldX = cx * CHUNK_PIXEL_WIDTH;
        const chunkWorldY = cy * CHUNK_PIXEL_HEIGHT;

        // Render each tile inside the visible chunk
        for (let ly = 0; ly < CHUNK_HEIGHT; ly++) {
          const worldY = chunkWorldY + ly * TILE_SIZE;
          if (worldY + TILE_SIZE < bounds.minY || worldY > bounds.maxY) continue;

          for (let lx = 0; lx < CHUNK_WIDTH; lx++) {
            const worldX = chunkWorldX + lx * TILE_SIZE;
            if (worldX + TILE_SIZE < bounds.minX || worldX > bounds.maxX) continue;

            const tileId = chunk.getTile(lx, ly);
            if (tileId === TileId.AIR) continue;

            this.stats.renderedTiles++;
            this.renderTile(ctx, tileId, worldX, worldY);
          }
        }

        // Draw chunk borders if debug flag enabled
        if (this.showChunkBorders) {
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1;
          ctx.strokeRect(chunkWorldX, chunkWorldY, CHUNK_PIXEL_WIDTH, CHUNK_PIXEL_HEIGHT);

          ctx.fillStyle = '#ef4444';
          ctx.font = '10px monospace';
          ctx.fillText(`Chunk (${cx}, ${cy})`, chunkWorldX + 4, chunkWorldY + 12);
        }
      }
    }

    // Draw tile grid if debug flag enabled
    if (this.showTileGrid) {
      this.renderGrid(ctx, bounds);
    }
  }

  /**
   * Procedural pixel-art styled tile rendering.
   */
  private renderTile(
    ctx: CanvasRenderingContext2D,
    tileId: number,
    x: number,
    y: number
  ): void {
    const def = getTileDef(tileId);

    // 1. Base tile body
    ctx.fillStyle = def.color;
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

    // 2. Tile-specific stylized textures
    switch (tileId) {
      case TileId.GRASS: {
        // Lush green top cap (3px)
        ctx.fillStyle = def.topColor || '#4ade80';
        ctx.fillRect(x, y, TILE_SIZE, 3);

        // Grass fringe droplets hanging down
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(x + 2, y + 3, 2, 2);
        ctx.fillRect(x + 7, y + 3, 3, 1);
        ctx.fillRect(x + 12, y + 3, 2, 2);
        break;
      }

      case TileId.DIRT: {
        // Subtle darker dirt specks
        ctx.fillStyle = def.borderColor || '#6b3f27';
        ctx.fillRect(x + 3, y + 4, 2, 2);
        ctx.fillRect(x + 10, y + 2, 2, 2);
        ctx.fillRect(x + 6, y + 10, 2, 2);
        ctx.fillRect(x + 12, y + 11, 2, 2);
        break;
      }

      case TileId.STONE: {
        // Subtle rocky shading and fractures
        ctx.fillStyle = def.borderColor || '#475569';
        ctx.fillRect(x + 2, y + 2, 3, 1);
        ctx.fillRect(x + 5, y + 3, 4, 1);
        ctx.fillRect(x + 1, y + 10, 5, 1);
        ctx.fillRect(x + 10, y + 8, 4, 2);
        break;
      }

      case TileId.WOOD_PLANK: {
        // Horizontal plank separator lines
        ctx.fillStyle = def.borderColor || '#b45309';
        ctx.fillRect(x, y, TILE_SIZE, 1);
        ctx.fillRect(x, y + 7, TILE_SIZE, 1);
        ctx.fillRect(x, y + 15, TILE_SIZE, 1);
        // Vertical nail/stud accents
        ctx.fillRect(x + 4, y + 3, 1, 2);
        ctx.fillRect(x + 12, y + 11, 1, 2);
        break;
      }

      case TileId.BRICK: {
        // Staggered brick mortar seams
        ctx.fillStyle = def.borderColor || '#334155';
        ctx.fillRect(x, y + 5, TILE_SIZE, 1);
        ctx.fillRect(x, y + 11, TILE_SIZE, 1);
        ctx.fillRect(x + 7, y, 1, 5);
        ctx.fillRect(x + 3, y + 5, 1, 6);
        ctx.fillRect(x + 11, y + 5, 1, 6);
        ctx.fillRect(x + 7, y + 11, 1, 5);
        break;
      }

      case TileId.BEDROCK: {
        // Dark, cracked bedrock pattern
        ctx.fillStyle = def.borderColor || '#0f172a';
        ctx.fillRect(x + 1, y + 3, 6, 2);
        ctx.fillRect(x + 5, y + 5, 2, 6);
        ctx.fillRect(x + 9, y + 2, 4, 3);
        ctx.fillRect(x + 8, y + 9, 7, 2);
        break;
      }
    }

    // 3. Faint bottom & right bevel for subtle tactile depth
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(x, y + TILE_SIZE - 1, TILE_SIZE, 1);
    ctx.fillRect(x + TILE_SIZE - 1, y, 1, TILE_SIZE);
  }

  /**
   * Draws tile grid lines across the visible bounds.
   */
  private renderGrid(ctx: CanvasRenderingContext2D, bounds: { minX: number; minY: number; maxX: number; maxY: number }): void {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;

    const startX = Math.floor(bounds.minX / TILE_SIZE) * TILE_SIZE;
    const endX = Math.ceil(bounds.maxX / TILE_SIZE) * TILE_SIZE;
    const startY = Math.floor(bounds.minY / TILE_SIZE) * TILE_SIZE;
    const endY = Math.ceil(bounds.maxY / TILE_SIZE) * TILE_SIZE;

    ctx.beginPath();
    for (let x = startX; x <= endX; x += TILE_SIZE) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = startY; y <= endY; y += TILE_SIZE) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();
  }
}
