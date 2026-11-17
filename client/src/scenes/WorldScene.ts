/**
 * TerraForge - Terraria-Style World Scene
 * 
 * Features:
 * - Parallax mountain silhouettes and drifting pixel clouds
 * - Background cave wall layer (caves have dark stone/dirt walls behind them)
 * - Procedural surface trees (Wood log trunks with bushy leaf canopies)
 * - Swinging pickaxe animation towards mouse cursor when mining
 * - Ambient cave darkness & player torch illumination
 * - Full multiplayer synchronization hooks
 */

import Phaser from 'phaser';
import { NetworkManager } from '../network/NetworkManager.ts';
import { TileId } from '../network/protocol.ts';

export class WorldScene extends Phaser.Scene {
  public network!: NetworkManager;

  // Entities
  public player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private pickaxeTool!: Phaser.GameObjects.Sprite;
  private isSwingingTool = false;
  private remotePlayers = new Map<string, Phaser.GameObjects.Sprite>();
  private npcSage!: Phaser.GameObjects.Sprite;

  // World & Tilemap
  private wallLayer!: Phaser.Tilemaps.TilemapLayer;
  private groundLayer!: Phaser.Tilemaps.TilemapLayer;
  private map!: Phaser.Tilemaps.Tilemap;
  public readonly MAP_WIDTH = 250; // 250 tiles wide
  public readonly MAP_HEIGHT = 120; // 120 tiles deep
  public readonly TILE_SIZE = 16;

  // Parallax Elements
  private clouds: Phaser.GameObjects.Image[] = [];

  // Interaction
  public activeMaterial: number = TileId.DIRT;
  private reticle!: Phaser.GameObjects.Graphics;
  private playerLight!: Phaser.GameObjects.Graphics;
  private keys!: Record<string, Phaser.Input.Keyboard.Key>;
  private networkTickTimer = 0;

  constructor() {
    super({ key: 'WorldScene' });
  }

  public init(): void {
    this.network = this.registry.get('network') as NetworkManager;
    if (!this.network) {
      this.network = new NetworkManager();
      this.registry.set('network', this.network);
      this.network.connect('Player');
    }
  }

  public create(): void {
    const worldPixelWidth = this.MAP_WIDTH * this.TILE_SIZE;
    const worldPixelHeight = this.MAP_HEIGHT * this.TILE_SIZE;
    this.physics.world.setBounds(0, 0, worldPixelWidth, worldPixelHeight);

    // 1. Terraria Azure Sky Background
    this.cameras.main.setBackgroundColor('#5cb8f6');

    // 2. Parallax Mountain Backdrop
    this.createParallaxBackdrop(worldPixelWidth);

    // 3. Build Terraria Multi-Layer World (Walls + Foreground Blocks + Trees)
    this.buildTerrariaWorld();

    // 4. Create Player & Pickaxe Tool
    const spawnX = 600;
    const spawnY = 480;
    this.player = this.physics.add.sprite(spawnX, spawnY, 'player_sprite');
    this.player.setCollideWorldBounds(true);
    this.player.setGravityY(980);
    this.player.setSize(12, 24);
    this.player.setOffset(1, 0);
    this.player.setDepth(20);

    // Pickaxe tool (swings when mining)
    this.pickaxeTool = this.add.sprite(spawnX, spawnY, 'copper_pickaxe');
    this.pickaxeTool.setOrigin(0.2, 0.8);
    this.pickaxeTool.setVisible(false);
    this.pickaxeTool.setDepth(25);

    // Collide with foreground terrain
    this.physics.add.collider(this.player, this.groundLayer);

    // 5. Guide NPC (Classic Terraria Guide)
    this.npcSage = this.add.sprite(spawnX + 64, spawnY + 20, 'guide_npc');
    this.physics.add.existing(this.npcSage);
    const npcBody = this.npcSage.body as Phaser.Physics.Arcade.Body;
    npcBody.setCollideWorldBounds(true);
    npcBody.setGravityY(980);
    this.physics.add.collider(this.npcSage, this.groundLayer);
    this.npcSage.setDepth(15);

    // 6. Camera Follow with Smooth Lerp
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    this.cameras.main.setZoom(2.2); // Closer Terraria retro perspective
    this.cameras.main.setBounds(0, 0, worldPixelWidth, worldPixelHeight);

    // 7. Terraria Reticle & Lighting Aura
    this.reticle = this.add.graphics();
    this.reticle.setDepth(100);

    this.playerLight = this.add.graphics();
    this.playerLight.setDepth(5);

    // 8. Register Controls & Network
    this.setupControls();
    this.setupNetworkHandlers();
  }

  /**
   * Creates distant parallax mountain ridges and drifting pixel clouds.
   */
  private createParallaxBackdrop(worldWidth: number): void {
    // Mountain ridges along the horizon (scrollFactor 0.15)
    for (let x = 0; x < worldWidth; x += 128) {
      const mtn = this.add.image(x, 460, 'mountain_layer');
      mtn.setOrigin(0, 1);
      mtn.setScrollFactor(0.15);
      mtn.setDepth(-10);
      mtn.setScale(1.5);
    }

    // Drifting sky clouds (scrollFactor 0.3)
    for (let i = 0; i < 15; i++) {
      const cloudX = Phaser.Math.Between(0, worldWidth);
      const cloudY = Phaser.Math.Between(80, 320);
      const cloud = this.add.image(cloudX, cloudY, 'pixel_cloud');
      cloud.setScrollFactor(0.3);
      cloud.setDepth(-5);
      cloud.setScale(Phaser.Math.FloatBetween(1.2, 2.0));
      this.clouds.push(cloud);
    }
  }

  /**
   * Builds the dual-layer Terraria tilemap:
   * Layer 1: Background Walls (dirt and stone behind caves)
   * Layer 2: Foreground solid blocks with trees and ores
   */
  private buildTerrariaWorld(): void {
    this.map = this.make.tilemap({
      tileWidth: this.TILE_SIZE,
      tileHeight: this.TILE_SIZE,
      width: this.MAP_WIDTH,
      height: this.MAP_HEIGHT,
    });

    // 1. Add Tilesets
    const worldTileset = this.map.addTilesetImage('world_tiles', 'world_tiles', 16, 16, 0, 0, 0)!;
    const wallTileset = this.map.addTilesetImage('wall_tiles', 'wall_tiles', 16, 16, 0, 0, 0)!;

    // Background Cave Wall Layer (renders behind open air in caves)
    this.wallLayer = this.map.createBlankLayer('walls', wallTileset, 0, 0)!;
    this.wallLayer.setDepth(0);

    // Foreground Solid Block Layer
    this.groundLayer = this.map.createBlankLayer('ground', worldTileset, 0, 0)!;
    this.groundLayer.setDepth(10);

    const surfaceBaseY = 38;

    // Track surface elevation per column for tree generation
    const surfaceHeights: number[] = new Array(this.MAP_WIDTH);

    // Phase 1: Generate Terrain, Caves & Walls
    for (let x = 0; x < this.MAP_WIDTH; x++) {
      const surfaceY = Math.round(
        surfaceBaseY +
        Math.sin(x * 0.06) * 6 +
        Math.cos(x * 0.02) * 4
      );
      surfaceHeights[x] = surfaceY;

      for (let y = 0; y < this.MAP_HEIGHT; y++) {
        if (y < surfaceY) {
          // Open Atmosphere: no walls, no foreground blocks
          continue;
        }

        // Subterranean: Always place background cave walls
        if (y >= surfaceY + 2 && y < surfaceY + 14) {
          this.wallLayer.putTileAt(1, x, y); // Dirt Wall
        } else if (y >= surfaceY + 14) {
          this.wallLayer.putTileAt(2, x, y); // Stone Wall
        }

        // Foreground Solid Blocks
        if (y === surfaceY) {
          this.groundLayer.putTileAt(TileId.GRASS, x, y);
        } else if (y > surfaceY && y <= surfaceY + 4) {
          this.groundLayer.putTileAt(TileId.DIRT, x, y);
        } else if (y >= this.MAP_HEIGHT - 3) {
          this.groundLayer.putTileAt(TileId.BEDROCK, x, y);
        } else {
          // Cave pockets carve out foreground blocks, revealing the dark cave wall behind!
          const caveNoise = Math.sin(x * 0.14) * Math.cos(y * 0.14);
          if (caveNoise > 0.55 && y > surfaceY + 6) {
            // Air cavity (cave wall remains visible behind)
            continue;
          }

          // Stratified Ore Deposits
          const oreRoll = Math.random();
          if (oreRoll < 0.025 && y > 75) {
            this.groundLayer.putTileAt(TileId.GOLD_ORE, x, y); // Deep Gold
          } else if (oreRoll < 0.05 && y > 50) {
            this.groundLayer.putTileAt(TileId.IRON_ORE, x, y); // Mid-depth Iron
          } else if (oreRoll < 0.08 && y > 40) {
            this.groundLayer.putTileAt(TileId.COAL_ORE, x, y); // Subsurface Coal
          } else {
            this.groundLayer.putTileAt(TileId.STONE, x, y);
          }
        }
      }
    }

    // Phase 2: Plant Terraria Surface Trees along grass hilltops
    for (let x = 8; x < this.MAP_WIDTH - 8; x += Phaser.Math.Between(7, 12)) {
      const surfaceY = surfaceHeights[x];
      // Only grow on fertile grass
      const groundTile = this.groundLayer.getTileAt(x, surfaceY);
      if (groundTile && groundTile.index === TileId.GRASS) {
        this.growTerrariaTree(x, surfaceY);
      }
    }

    // Set collision on foreground blocks
    this.groundLayer.setCollisionBetween(1, 13);
  }

  /**
   * Grows a Terraria-style tree: vertical wood log trunk with bushy foliage canopy.
   */
  private growTerrariaTree(rootX: number, rootY: number): void {
    const trunkHeight = Phaser.Math.Between(4, 7);
    const topY = rootY - trunkHeight;

    // Wood Trunk
    for (let h = 1; h <= trunkHeight; h++) {
      this.groundLayer.putTileAt(TileId.WOOD_LOG, rootX, rootY - h);
    }

    // Bushy Foliage Canopy (5x4 block cluster of leaves around the top)
    for (let ox = -2; ox <= 2; ox++) {
      for (let oy = -3; oy <= 0; oy++) {
        // Skip corners for rounded organic tree crown
        if ((Math.abs(ox) === 2 && oy === -3) || (Math.abs(ox) === 2 && oy === 0)) {
          continue;
        }
        const tx = rootX + ox;
        const ty = topY + oy;
        if (!this.groundLayer.getTileAt(tx, ty)) {
          this.groundLayer.putTileAt(TileId.LEAVES, tx, ty);
        }
      }
    }
  }

  /**
   * Sets up mouse clicks, pickaxe swing animation, and WASD keys.
   */
  private setupControls(): void {
    if (!this.input.keyboard) return;

    this.keys = this.input.keyboard.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      SPACE: Phaser.Input.Keyboard.KeyCodes.SPACE,
      ONE: Phaser.Input.Keyboard.KeyCodes.ONE,
      TWO: Phaser.Input.Keyboard.KeyCodes.TWO,
      THREE: Phaser.Input.Keyboard.KeyCodes.THREE,
      FOUR: Phaser.Input.Keyboard.KeyCodes.FOUR,
      FIVE: Phaser.Input.Keyboard.KeyCodes.FIVE,
    }) as Record<string, Phaser.Input.Keyboard.Key>;

    this.input.mouse?.disableContextMenu();

    // Mouse Actions: Mining and Placing
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const tx = Math.floor(worldPoint.x / this.TILE_SIZE);
      const ty = Math.floor(worldPoint.y / this.TILE_SIZE);

      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);
      if (dist > 85) return;

      if (pointer.leftButtonDown()) {
        // Trigger Tool Swing Animation
        this.triggerPickaxeSwing(worldPoint.x, worldPoint.y);

        // Break Block
        const tile = this.groundLayer.getTileAt(tx, ty);
        if (tile && tile.index !== TileId.BEDROCK && tile.index !== 0) {
          const brokenId = tile.index;
          this.groundLayer.removeTileAt(tx, ty);
          this.emitDebrisAndDrop(tx * this.TILE_SIZE + 8, ty * this.TILE_SIZE + 8, brokenId);

          this.network.send({
            type: 'BLOCK_MINE',
            tx,
            ty,
          });
        }
      } else if (pointer.rightButtonDown()) {
        // Place Block
        const tile = this.groundLayer.getTileAt(tx, ty);
        const tileBounds = new Phaser.Geom.Rectangle(tx * this.TILE_SIZE, ty * this.TILE_SIZE, 16, 16);
        const playerBounds = this.player.getBounds();

        if (!tile && !Phaser.Geom.Intersects.RectangleToRectangle(tileBounds, playerBounds)) {
          this.groundLayer.putTileAt(this.activeMaterial, tx, ty);
          this.emitDebrisAndDrop(tx * this.TILE_SIZE + 8, ty * this.TILE_SIZE + 8, this.activeMaterial);

          this.network.send({
            type: 'BLOCK_PLACE',
            tx,
            ty,
            tileId: this.activeMaterial,
          });
        }
      }
    });

    // Zoom via Wheel
    this.input.on('wheel', (_p: unknown, _g: unknown, _dx: number, dy: number) => {
      const step = dy > 0 ? -0.2 : 0.2;
      const newZoom = Phaser.Math.Clamp(this.cameras.main.zoom + step, 1.2, 3.5);
      this.cameras.main.setZoom(newZoom);
    });
  }

  /**
   * Terraria-style pickaxe swing animation angled towards the cursor.
   */
  private triggerPickaxeSwing(targetX: number, targetY: number): void {
    if (this.isSwingingTool) return;
    this.isSwingingTool = true;

    this.pickaxeTool.setVisible(true);
    const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, targetX, targetY);
    const startAngle = Phaser.Math.RadToDeg(angle) - 45;
    const endAngle = startAngle + 90;

    this.pickaxeTool.setAngle(startAngle);

    this.tweens.add({
      targets: this.pickaxeTool,
      angle: endAngle,
      duration: 140,
      ease: 'Power2',
      onComplete: () => {
        this.pickaxeTool.setVisible(false);
        this.isSwingingTool = false;
      },
    });
  }

  /**
   * Spawns particle bursts matching the block material.
   */
  private emitDebrisAndDrop(x: number, y: number, tileId: number): void {
    let tint = 0x865439; // Dirt
    if (tileId === TileId.GRASS) tint = 0x22c55e;
    else if (tileId === TileId.STONE) tint = 0x64748b;
    else if (tileId === TileId.WOOD || tileId === TileId.WOOD_LOG) tint = 0xd97706;
    else if (tileId === TileId.GOLD_ORE) tint = 0xfacc15;
    else if (tileId === TileId.IRON_ORE) tint = 0xf97316;
    else if (tileId === TileId.LEAVES) tint = 0x16a34a;

    const emitter = this.add.particles(x, y, 'dust_particle', {
      speed: { min: 40, max: 120 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.2, end: 0 },
      lifespan: 350,
      gravityY: 500,
      quantity: 8,
      tint,
      emitting: false,
    });
    emitter.explode(8, x, y);
  }

  /**
   * Listens for multiplayer block updates and snapshots.
   */
  private setupNetworkHandlers(): void {
    this.network.onBlockUpdate = (pkt) => {
      if (pkt.tileId === 0) {
        this.groundLayer.removeTileAt(pkt.tx, pkt.ty);
      } else {
        this.groundLayer.putTileAt(pkt.tileId, pkt.tx, pkt.ty);
      }
      this.emitDebrisAndDrop(pkt.tx * this.TILE_SIZE + 8, pkt.ty * this.TILE_SIZE + 8, pkt.tileId);
    };

    this.network.onSnapshot = (snapshot) => {
      const activeIds = new Set<string>();

      for (const remote of snapshot.players) {
        if (remote.id === this.network.playerId) continue;
        activeIds.add(remote.id);

        let sprite = this.remotePlayers.get(remote.id);
        if (!sprite) {
          sprite = this.add.sprite(remote.x, remote.y, 'player_sprite');
          sprite.setTint(0x38bdf8);
          this.remotePlayers.set(remote.id, sprite);
        }

        sprite.x = Phaser.Math.Linear(sprite.x, remote.x, 0.3);
        sprite.y = Phaser.Math.Linear(sprite.y, remote.y, 0.3);
        sprite.setFlipX(remote.facing === 'left');
      }

      for (const [id, sprite] of this.remotePlayers) {
        if (!activeIds.has(id)) {
          sprite.destroy();
          this.remotePlayers.delete(id);
        }
      }
    };
  }

  public override update(_time: number, delta: number): void {
    const dt = delta / 1000;

    // 1. Hotbar Keys
    if (this.keys.ONE?.isDown) this.activeMaterial = TileId.DIRT;
    if (this.keys.TWO?.isDown) this.activeMaterial = TileId.STONE;
    if (this.keys.THREE?.isDown) this.activeMaterial = TileId.WOOD;
    if (this.keys.FOUR?.isDown) this.activeMaterial = TileId.BRICK;
    if (this.keys.FIVE?.isDown) this.activeMaterial = TileId.TORCH;

    // 2. Player Movement
    const walkSpeed = 160;
    if (this.keys.A?.isDown) {
      this.player.setVelocityX(-walkSpeed);
      this.player.setFlipX(true);
    } else if (this.keys.D?.isDown) {
      this.player.setVelocityX(walkSpeed);
      this.player.setFlipX(false);
    } else {
      this.player.setVelocityX(0);
    }

    // Jump
    const isGrounded = this.player.body.blocked.down;
    if ((this.keys.W?.isDown || this.keys.SPACE?.isDown) && isGrounded) {
      this.player.setVelocityY(-350);
    }

    // Update Pickaxe Position
    this.pickaxeTool.setPosition(this.player.x, this.player.y + 2);

    // 3. Slowly drift parallax clouds across the sky
    for (const cloud of this.clouds) {
      cloud.x += 10 * dt;
      if (cloud.x > this.MAP_WIDTH * this.TILE_SIZE + 100) {
        cloud.x = -100;
      }
    }

    // 4. Reticle in World Space
    const pointer = this.input.activePointer;
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const tx = Math.floor(worldPoint.x / this.TILE_SIZE);
    const ty = Math.floor(worldPoint.y / this.TILE_SIZE);
    const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, worldPoint.x, worldPoint.y);

    this.reticle.clear();
    if (dist <= 85) {
      this.reticle.lineStyle(1.5, 0x4ade80, 0.9); // Vibrant Green
      this.reticle.fillStyle(0x4ade80, 0.15);
    } else {
      this.reticle.lineStyle(1.5, 0xef4444, 0.9); // Red out of reach
      this.reticle.fillStyle(0xef4444, 0.15);
    }
    this.reticle.strokeRect(tx * this.TILE_SIZE, ty * this.TILE_SIZE, 16, 16);
    this.reticle.fillRect(tx * this.TILE_SIZE, ty * this.TILE_SIZE, 16, 16);

    // 5. Ambient Cave Darkness Check: Smoothly darken sky as player dives deep underground
    const undergroundDepth = Math.max(0, (this.player.y - 650) / 400);
    const clampedDarkness = Math.min(0.85, undergroundDepth);
    this.cameras.main.setBackgroundColor(
      Phaser.Display.Color.Interpolate.ColorWithColor(
        Phaser.Display.Color.ValueToColor(0x5cb8f6), // Sky Blue
        Phaser.Display.Color.ValueToColor(0x090c10), // Cavern Deep Slate
        100,
        Math.round(clampedDarkness * 100)
      )
    );

    // 6. Network Tick (20Hz)
    this.networkTickTimer += dt;
    if (this.networkTickTimer >= 0.05) {
      this.networkTickTimer = 0;
      this.network.send({
        type: 'PLAYER_INPUT',
        tick: Math.round(_time),
        x: this.player.x,
        y: this.player.y,
        vx: this.player.body.velocity.x,
        vy: this.player.body.velocity.y,
        facing: this.player.flipX ? 'left' : 'right',
        state: !isGrounded ? 'jump' : Math.abs(this.player.body.velocity.x) > 10 ? 'run' : 'idle',
      });
    }
  }
}
