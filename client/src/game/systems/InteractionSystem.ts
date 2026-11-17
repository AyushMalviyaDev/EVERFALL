/**
 * TerraForge - Interaction System (Mining & Block Placement)
 * 
 * Manages player-to-world interactions:
 * - Reach radius calculation (Euclidean distance to tile center)
 * - Block mining with break particles and bedrock protection
 * - Block placement with player body intersection validation
 * - Hotbar active material selection
 */

import {
  TILE_SIZE,
  PLAYER_REACH_DISTANCE
} from '../constants.ts';
import { World } from '../world/World.ts';
import { TileId, getTileDef } from '../world/TileRegistry.ts';
import { Player } from '../entities/Player.ts';
import { InputManager, MouseButton } from '../core/InputManager.ts';
import { Camera } from '../render/Camera.ts';
import { ParticleSystem } from '../particles/ParticleSystem.ts';
import { AABB } from '../physics/AABB.ts';
import { worldToTile, screenToWorld } from '../math/Coordinates.ts';

export interface InteractionState {
  hoverTx: number;
  hoverTy: number;
  hoverTileId: number;
  distancePx: number;
  inReach: boolean;
  canMine: boolean;
  canPlace: boolean;
  activeBlockId: number;
}

export class InteractionSystem {
  public world: World;
  public particles: ParticleSystem;

  // Active Block Material (Default: Dirt)
  public activeBlockId: number = TileId.DIRT;

  // Hotbar Items available for placement
  public readonly hotbarItems = [
    { key: '1', id: TileId.DIRT, name: 'Dirt', color: '#865439' },
    { key: '2', id: TileId.STONE, name: 'Stone', color: '#64748b' },
    { key: '3', id: TileId.WOOD_PLANK, name: 'Wood', color: '#d97706' },
    { key: '4', id: TileId.BRICK, name: 'Bricks', color: '#94a3b8' },
  ];

  // Mining Cooldown (seconds between block breaks when holding mouse)
  private mineCooldown = 0;
  private readonly MINE_DELAY = 0.15; // 150ms per hit

  // State snapshot for rendering HUD and Reticle
  public state: InteractionState = {
    hoverTx: 0,
    hoverTy: 0,
    hoverTileId: TileId.AIR,
    distancePx: 0,
    inReach: false,
    canMine: false,
    canPlace: false,
    activeBlockId: TileId.DIRT,
  };

  private tileBoxHelper = new AABB(0, 0, TILE_SIZE, TILE_SIZE);

  constructor(world: World, particles: ParticleSystem) {
    this.world = world;
    this.particles = particles;
  }

  /**
   * Updates interactions, reach checks, inputs, mining, and placing (60 Hz).
   */
  public update(
    dt: number,
    input: InputManager,
    player: Player,
    camera: Camera,
    canvasWidth: number,
    canvasHeight: number
  ): void {
    if (this.mineCooldown > 0) {
      this.mineCooldown -= dt;
    }

    // 1. Hotbar Selection via Number Keys (1-4)
    if (input.isKeyJustPressed('Digit1')) this.activeBlockId = TileId.DIRT;
    if (input.isKeyJustPressed('Digit2')) this.activeBlockId = TileId.STONE;
    if (input.isKeyJustPressed('Digit3')) this.activeBlockId = TileId.WOOD_PLANK;
    if (input.isKeyJustPressed('Digit4')) this.activeBlockId = TileId.BRICK;

    // 2. Unproject Screen Mouse to World Coordinates
    const mouseWorld = screenToWorld(
      input.mouseScreenPos.x,
      input.mouseScreenPos.y,
      camera.position.x,
      camera.position.y,
      canvasWidth,
      canvasHeight,
      camera.zoom
    );

    // Convert to Tile Coordinates
    const tilePos = worldToTile(mouseWorld.x, mouseWorld.y);
    const tx = tilePos.tx;
    const ty = tilePos.ty;
    const tileId = this.world.getTile(tx, ty);

    // 3. Reach Distance Check (Distance between Player Center and Tile Center)
    const tileCenterX = tx * TILE_SIZE + TILE_SIZE / 2;
    const tileCenterY = ty * TILE_SIZE + TILE_SIZE / 2;
    const playerCenter = player.center;

    const dx = tileCenterX - playerCenter.x;
    const dy = tileCenterY - playerCenter.y;
    const distancePx = Math.sqrt(dx * dx + dy * dy);
    const inReach = distancePx <= PLAYER_REACH_DISTANCE;

    // 4. Validate Mining & Placement Rules
    const tileDef = getTileDef(tileId);
    const isSolid = tileDef.solid;
    const isUnbreakable = tileDef.hardness === -1; // e.g. Bedrock

    // Tile bounding box for intersection with player body
    this.tileBoxHelper.set(tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE);
    const overlapsPlayer = this.tileBoxHelper.intersects(player.aabb);

    const canMine = inReach && isSolid && !isUnbreakable;
    const canPlace = inReach && !isSolid && !overlapsPlayer;

    // Update state snapshot
    this.state = {
      hoverTx: tx,
      hoverTy: ty,
      hoverTileId: tileId,
      distancePx,
      inReach,
      canMine,
      canPlace,
      activeBlockId: this.activeBlockId,
    };

    // 5. Execute Mining (Left Click / Hold)
    if (input.isMouseDown(MouseButton.LEFT) && canMine && this.mineCooldown <= 0) {
      this.world.setTile(tx, ty, TileId.AIR);
      this.particles.spawnTileBreak(tx * TILE_SIZE, ty * TILE_SIZE, tileDef.color, 10);
      this.mineCooldown = this.MINE_DELAY;
    }

    // 6. Execute Placement (Right Click - single press per block)
    if (input.isMouseJustPressed(MouseButton.RIGHT) && canPlace) {
      this.world.setTile(tx, ty, this.activeBlockId);
      const placedDef = getTileDef(this.activeBlockId);
      this.particles.spawnTileBreak(tx * TILE_SIZE, ty * TILE_SIZE, placedDef.color, 4);
    }
  }

  /**
   * Renders the interactive selection reticle and reach circle in world space.
   */
  public renderReticle(ctx: CanvasRenderingContext2D, player: Player): void {
    const { hoverTx, hoverTy, inReach, canMine, canPlace } = this.state;
    const tileX = hoverTx * TILE_SIZE;
    const tileY = hoverTy * TILE_SIZE;

    // 1. Draw subtle reach circle around the player
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(player.center.x, player.center.y, PLAYER_REACH_DISTANCE, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 2. Draw Tile Highlight Reticle with Contextual Color
    ctx.save();
    if (!inReach) {
      ctx.strokeStyle = '#ef4444'; // Red: Out of reach
      ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
    } else if (canMine) {
      ctx.strokeStyle = '#f59e0b'; // Amber: Destructible block in reach
      ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
    } else if (canPlace) {
      ctx.strokeStyle = '#22c55e'; // Green: Valid placement in reach
      ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
    } else {
      ctx.strokeStyle = '#64748b'; // Slate: Unactionable (e.g. bedrock or player body overlap)
      ctx.fillStyle = 'rgba(100, 116, 139, 0.15)';
    }

    ctx.lineWidth = 1.5;
    ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
    ctx.strokeRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
    ctx.restore();
  }

  /**
   * Renders the Hotbar overlay in Screen Space (bottom-center of display).
   */
  public renderHotbar(ctx: CanvasRenderingContext2D, canvasWidth: number, canvasHeight: number): void {
    const slotSize = 44;
    const gap = 8;
    const totalWidth = this.hotbarItems.length * slotSize + (this.hotbarItems.length - 1) * gap;
    const startX = Math.round((canvasWidth - totalWidth) / 2);
    const startY = canvasHeight - slotSize - 20;

    for (let i = 0; i < this.hotbarItems.length; i++) {
      const item = this.hotbarItems[i];
      const x = startX + i * (slotSize + gap);
      const y = startY;
      const isSelected = item.id === this.activeBlockId;

      // Slot background
      ctx.fillStyle = isSelected ? 'rgba(30, 41, 59, 0.95)' : 'rgba(15, 23, 42, 0.8)';
      ctx.fillRect(x, y, slotSize, slotSize);

      // Slot border
      ctx.strokeStyle = isSelected ? '#38bdf8' : '#334155';
      ctx.lineWidth = isSelected ? 2.5 : 1;
      ctx.strokeRect(x, y, slotSize, slotSize);

      // Item swatch preview
      ctx.fillStyle = item.color;
      const previewSize = 20;
      const px = x + (slotSize - previewSize) / 2;
      const py = y + (slotSize - previewSize) / 2 - 2;
      ctx.fillRect(px, py, previewSize, previewSize);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 1;
      ctx.strokeRect(px, py, previewSize, previewSize);

      // Slot shortcut key number
      ctx.fillStyle = isSelected ? '#38bdf8' : '#94a3b8';
      ctx.font = 'bold 11px monospace';
      ctx.fillText(item.key, x + 5, y + 13);
    }
  }
}
