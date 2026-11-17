/**
 * TerraForge - Boot Scene (Terraria Aesthetic)
 * 
 * Generates rich, authentic Terraria-style pixel art:
 * - Autotiled blocks (Lush grass with fringes, earthy soil, jagged stone, ores with glints)
 * - Background cave walls (Dirt wall, stone wall)
 * - Trees (Wood trunks and bushy leaves)
 * - Animated tool/pickaxe for mining
 * - Health hearts, sky clouds, and mountain silhouettes
 */

import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  public create(): void {
    this.createTerrariaTileset();
    this.createBackgroundWalls();
    this.createPlayerAndTools();
    this.createTerrariaUIAssets();
    this.createEnvironmentAssets();

    console.log('[BootScene] Terraria-style pixel assets generated.');

    this.scene.start('WorldScene');
    this.scene.launch('UIScene');
  }

  /**
   * Generates a 224x16 horizontal strip of high-detail Terraria-style tiles:
   * 0: Air
   * 1: Grass (Vibrant green with root hanging fringe)
   * 2: Dirt (Rich organic soil with pebble specks)
   * 3: Stone (Chiseled slate with rock facets)
   * 4: Wood Planks (Beveled timber boards with nail studs)
   * 5: Stone Bricks (Mortared castle masonry)
   * 6: Bedrock (Deep dark cracked abyssal stone)
   * 7: Sand (Warm dunes with wind ripples)
   * 8: Leaves (Bushy multi-tone forest foliage)
   * 9: Wood Log (Tree trunk bark with vertical ridges)
   * 10: Coal Ore (Stone with jagged black anthracite nuggets)
   * 11: Iron Ore (Stone with sparkling copper-orange veins)
   * 12: Gold Ore (Stone with glistening bright yellow/gold crystals)
   * 13: Torch (Gleaming yellow/orange flame)
   */
  private createTerrariaTileset(): void {
    const totalTiles = 14;
    const g = this.make.graphics({ x: 0, y: 0 });

    // 1. Grass (Rich Terraria Green + Dirt Base)
    this.drawTile(g, 1, (ox) => {
      // Dirt body
      g.fillStyle(0x73482c, 1);
      g.fillRect(ox, 0, 16, 16);
      g.fillStyle(0x5a361e, 1); // Darker soil specks
      g.fillRect(ox + 3, 6, 2, 2);
      g.fillRect(ox + 10, 8, 3, 2);
      g.fillRect(ox + 5, 12, 2, 2);

      // Lush Grass Cap (3-4px)
      g.fillStyle(0x289e24, 1);
      g.fillRect(ox, 0, 16, 4);
      g.fillStyle(0x44cf36, 1); // Highlight top blades
      g.fillRect(ox, 0, 16, 2);

      // Grass root fringe hanging down
      g.fillStyle(0x289e24, 1);
      g.fillRect(ox + 1, 4, 2, 2);
      g.fillRect(ox + 5, 4, 3, 3);
      g.fillRect(ox + 10, 4, 2, 2);
      g.fillRect(ox + 13, 4, 2, 3);

      // Dark shadow under grass
      g.fillStyle(0x196316, 1);
      g.fillRect(ox + 1, 6, 1, 1);
      g.fillRect(ox + 6, 7, 1, 1);
      g.fillRect(ox + 14, 7, 1, 1);
    });

    // 2. Dirt (Warm Terraria Earth)
    this.drawTile(g, 2, (ox) => {
      g.fillStyle(0x73482c, 1);
      g.fillRect(ox, 0, 16, 16);
      g.fillStyle(0x8c5b3b, 1); // Light earth patches
      g.fillRect(ox + 1, 2, 5, 3);
      g.fillRect(ox + 9, 8, 5, 4);
      g.fillStyle(0x54321c, 1); // Dark pebbles
      g.fillRect(ox + 4, 8, 3, 2);
      g.fillRect(ox + 11, 3, 2, 2);
      g.fillRect(ox + 2, 12, 3, 2);
    });

    // 3. Stone (Terraria Chiseled Rock)
    this.drawTile(g, 3, (ox) => {
      g.fillStyle(0x6b7280, 1);
      g.fillRect(ox, 0, 16, 16);
      // Highlights (Top-left facets)
      g.fillStyle(0x9ca3af, 1);
      g.fillRect(ox + 1, 1, 6, 2);
      g.fillRect(ox + 9, 7, 5, 2);
      g.fillRect(ox + 2, 10, 4, 2);
      // Shadows (Rock fissures)
      g.fillStyle(0x4b5563, 1);
      g.fillRect(ox + 7, 3, 1, 8);
      g.fillRect(ox + 2, 8, 5, 1);
      g.fillRect(ox + 8, 12, 7, 1);
      g.fillStyle(0x374151, 1); // Deep cracks
      g.fillRect(ox + 7, 5, 1, 4);
    });

    // 4. Wood Planks
    this.drawTile(g, 4, (ox) => {
      g.fillStyle(0xb45309, 1);
      g.fillRect(ox, 0, 16, 16);
      g.fillStyle(0xd97706, 1); // Grain highlight
      g.fillRect(ox, 1, 16, 2);
      g.fillRect(ox, 9, 16, 2);
      g.fillStyle(0x78350f, 1); // Dark seams
      g.fillRect(ox, 7, 16, 1);
      g.fillRect(ox, 15, 16, 1);
      g.fillRect(ox + 8, 0, 1, 7);
      g.fillRect(ox + 4, 8, 1, 7);
      // Iron nails
      g.fillStyle(0x1f2937, 1);
      g.fillRect(ox + 2, 3, 1, 1);
      g.fillRect(ox + 14, 3, 1, 1);
      g.fillRect(ox + 10, 11, 1, 1);
    });

    // 5. Stone Bricks
    this.drawTile(g, 5, (ox) => {
      g.fillStyle(0x94a3b8, 1);
      g.fillRect(ox, 0, 16, 16);
      // Mortar seams
      g.fillStyle(0x334155, 1);
      g.fillRect(ox, 7, 16, 1);
      g.fillRect(ox, 15, 16, 1);
      g.fillRect(ox + 7, 0, 1, 7);
      g.fillRect(ox + 15, 8, 1, 7);
      // Brick bevel highlight
      g.fillStyle(0xcfd8dc, 0.6);
      g.fillRect(ox + 1, 1, 5, 1);
      g.fillRect(ox + 9, 9, 5, 1);
    });

    // 6. Bedrock
    this.drawTile(g, 6, (ox) => {
      g.fillStyle(0x111827, 1);
      g.fillRect(ox, 0, 16, 16);
      g.fillStyle(0x1f2937, 1);
      g.fillRect(ox + 2, 2, 5, 4);
      g.fillRect(ox + 9, 7, 5, 5);
      g.fillStyle(0x030712, 1); // Pitch black fractures
      g.fillRect(ox + 4, 6, 8, 2);
      g.fillRect(ox + 7, 3, 2, 9);
    });

    // 7. Sand
    this.drawTile(g, 7, (ox) => {
      g.fillStyle(0xfde047, 1);
      g.fillRect(ox, 0, 16, 16);
      g.fillStyle(0xfef08a, 1);
      g.fillRect(ox + 2, 3, 6, 2);
      g.fillRect(ox + 8, 10, 6, 2);
      g.fillStyle(0xca8a04, 1);
      g.fillRect(ox + 1, 7, 5, 1);
      g.fillRect(ox + 9, 13, 6, 1);
    });

    // 8. Leaves (Bushy Tree Canopy)
    this.drawTile(g, 8, (ox) => {
      g.fillStyle(0x15803d, 1);
      g.fillRect(ox, 0, 16, 16);
      // Bright foliage clusters
      g.fillStyle(0x22c55e, 1);
      g.fillRect(ox + 2, 2, 5, 4);
      g.fillRect(ox + 9, 3, 5, 4);
      g.fillRect(ox + 4, 8, 6, 5);
      // Deep shadow under foliage
      g.fillStyle(0x14532d, 1);
      g.fillRect(ox + 1, 13, 14, 3);
      g.fillRect(ox + 12, 9, 3, 4);
    });

    // 9. Wood Log (Tree Trunk)
    this.drawTile(g, 9, (ox) => {
      g.fillStyle(0x78350f, 1);
      g.fillRect(ox, 0, 16, 16);
      // Vertical bark ridges
      g.fillStyle(0x92400e, 1);
      g.fillRect(ox + 3, 0, 3, 16);
      g.fillRect(ox + 10, 0, 3, 16);
      g.fillStyle(0x451a03, 1);
      g.fillRect(ox + 1, 0, 1, 16);
      g.fillRect(ox + 7, 0, 1, 16);
      g.fillRect(ox + 14, 0, 1, 16);
    });

    // 10. Coal Ore
    this.drawTile(g, 10, (ox) => {
      g.fillStyle(0x6b7280, 1); // Stone base
      g.fillRect(ox, 0, 16, 16);
      // Black coal clusters with glossy shine
      g.fillStyle(0x18181b, 1);
      g.fillRect(ox + 3, 3, 4, 4);
      g.fillRect(ox + 9, 8, 5, 4);
      g.fillRect(ox + 2, 10, 3, 3);
      g.fillStyle(0x3f3f46, 1); // Gloss gleam
      g.fillRect(ox + 4, 4, 1, 1);
      g.fillRect(ox + 10, 9, 1, 1);
    });

    // 11. Iron Ore
    this.drawTile(g, 11, (ox) => {
      g.fillStyle(0x6b7280, 1); // Stone base
      g.fillRect(ox, 0, 16, 16);
      // Rust/copper metallic veins
      g.fillStyle(0xc2410c, 1);
      g.fillRect(ox + 2, 3, 4, 3);
      g.fillRect(ox + 8, 7, 5, 4);
      g.fillRect(ox + 4, 11, 4, 3);
      g.fillStyle(0xf97316, 1); // Shiny metallic glint
      g.fillRect(ox + 3, 4, 2, 1);
      g.fillRect(ox + 9, 8, 2, 1);
    });

    // 12. Gold Ore
    this.drawTile(g, 12, (ox) => {
      g.fillStyle(0x6b7280, 1); // Stone base
      g.fillRect(ox, 0, 16, 16);
      // Bright sparkling gold gems
      g.fillStyle(0xeab308, 1);
      g.fillRect(ox + 3, 2, 4, 4);
      g.fillRect(ox + 9, 8, 4, 4);
      g.fillRect(ox + 2, 9, 3, 3);
      g.fillStyle(0xfef08a, 1); // Dazzling gleam
      g.fillRect(ox + 4, 3, 1, 2);
      g.fillRect(ox + 10, 9, 1, 2);
      g.fillStyle(0xa16207, 1); // Shadowed gold
      g.fillRect(ox + 3, 5, 4, 1);
      g.fillRect(ox + 9, 11, 4, 1);
    });

    // 13. Torch (Wall/Floor placeable light source)
    this.drawTile(g, 13, (ox) => {
      // Wood stick
      g.fillStyle(0x78350f, 1);
      g.fillRect(ox + 7, 6, 2, 10);
      // Flame core
      g.fillStyle(0xea580c, 1);
      g.fillRect(ox + 6, 2, 4, 4);
      g.fillStyle(0xfde047, 1); // Yellow spark
      g.fillRect(ox + 7, 1, 2, 3);
    });

    g.generateTexture('world_tiles', totalTiles * 16, 16);
    g.destroy();
  }

  private drawTile(
    _g: Phaser.GameObjects.Graphics,
    id: number,
    drawFn: (offsetX: number) => void
  ): void {
    drawFn(id * 16);
  }

  /**
   * Generates subterranean background wall textures (Cave walls behind air).
   */
  private createBackgroundWalls(): void {
    const totalWalls = 3;
    const g = this.make.graphics({ x: 0, y: 0 });

    // Wall 1: Dirt Wall (Darker, recessed)
    g.fillStyle(0x3e2415, 1);
    g.fillRect(16, 0, 16, 16);
    g.fillStyle(0x2d190e, 1);
    g.fillRect(18, 3, 4, 3);
    g.fillRect(24, 9, 5, 4);

    // Wall 2: Stone Wall (Dark cavern stone)
    g.fillStyle(0x2d323c, 1);
    g.fillRect(32, 0, 16, 16);
    g.fillStyle(0x1e222a, 1);
    g.fillRect(34, 4, 5, 3);
    g.fillRect(42, 8, 4, 5);

    g.generateTexture('wall_tiles', totalWalls * 16, 16);
    g.destroy();
  }

  /**
   * Generates player, pickaxe tool, and characters.
   */
  private createPlayerAndTools(): void {
    // 1. Terraria-style Copper Pickaxe
    const pick = this.make.graphics({ x: 0, y: 0 });
    // Handle (slanted wood)
    pick.fillStyle(0x92400e, 1);
    pick.fillRect(2, 10, 3, 3);
    pick.fillRect(5, 7, 3, 3);
    pick.fillRect(8, 4, 3, 3);
    // Copper pick head (crescent)
    pick.fillStyle(0xd97706, 1);
    pick.fillRect(8, 1, 6, 3);
    pick.fillRect(12, 3, 3, 6);
    pick.fillStyle(0xfcd34d, 1); // Sharp metallic shine
    pick.fillRect(13, 1, 2, 2);
    pick.generateTexture('copper_pickaxe', 16, 16);
    pick.destroy();

    // 2. Terraria Player Sprite (Classic Adventurer)
    const p = this.make.graphics({ x: 0, y: 0 });
    // Hair (Spiky Brown Terraria Hair)
    p.fillStyle(0x593214, 1);
    p.fillRect(2, 0, 10, 5);
    p.fillRect(0, 2, 4, 4);
    p.fillRect(11, 2, 3, 3);
    // Face (Pale Skin)
    p.fillStyle(0xfbbf24, 1);
    p.fillRect(3, 4, 8, 6);
    // Big Pixel Eye
    p.fillStyle(0xffffff, 1);
    p.fillRect(7, 6, 3, 3);
    p.fillStyle(0x1e40af, 1); // Blue iris
    p.fillRect(8, 6, 2, 3);
    // Copper Breastplate / Crimson Shirt
    p.fillStyle(0xb91c1c, 1);
    p.fillRect(2, 10, 10, 7);
    // Gold Belt
    p.fillStyle(0xd97706, 1);
    p.fillRect(2, 17, 10, 2);
    p.fillStyle(0xfde047, 1);
    p.fillRect(5, 17, 3, 2);
    // Denim Trousers
    p.fillStyle(0x1d4ed8, 1);
    p.fillRect(3, 19, 3, 5);
    p.fillRect(8, 19, 3, 5);
    // Brown Boots
    p.fillStyle(0x451a03, 1);
    p.fillRect(2, 22, 4, 2);
    p.fillRect(8, 22, 4, 2);

    p.generateTexture('player_sprite', 14, 24);
    p.destroy();

    // 3. Guide NPC
    const guide = this.make.graphics({ x: 0, y: 0 });
    guide.fillStyle(0x3b82f6, 1); // Blue coat
    guide.fillRect(2, 10, 10, 8);
    guide.fillStyle(0xfde047, 1); // Face
    guide.fillRect(3, 4, 8, 6);
    guide.fillStyle(0x78350f, 1); // Hair
    guide.fillRect(2, 1, 10, 4);
    guide.fillStyle(0x1e293b, 1); // Pants
    guide.fillRect(3, 18, 3, 6);
    guide.fillRect(8, 18, 3, 6);
    guide.generateTexture('guide_npc', 14, 24);
    guide.destroy();
  }

  /**
   * Generates Terraria-style UI assets:
   * - Red vitality hearts
   * - Classic wooden beveled hotbar frames
   */
  private createTerrariaUIAssets(): void {
    // 1. Terraria Red Vitality Heart (12x12)
    const heart = this.make.graphics({ x: 0, y: 0 });
    heart.fillStyle(0xdc2626, 1); // Rich Red
    // Left lobe
    heart.fillRect(1, 2, 4, 4);
    // Right lobe
    heart.fillRect(7, 2, 4, 4);
    // Heart body
    heart.fillRect(1, 4, 10, 3);
    heart.fillRect(2, 7, 8, 2);
    heart.fillRect(4, 9, 4, 2);
    heart.fillRect(5, 11, 2, 1);
    // Golden border
    heart.lineStyle(1, 0x7f1d1d, 1);
    heart.strokeRect(0, 0, 12, 12);
    // Highlight glint
    heart.fillStyle(0xfecaca, 1);
    heart.fillRect(2, 2, 2, 2);

    heart.generateTexture('heart_icon', 12, 12);
    heart.destroy();

    // 2. Terraria Wooden Hotbar Slot Frame (40x40)
    const slot = this.make.graphics({ x: 0, y: 0 });
    // Outer wooden border
    slot.fillStyle(0x451a03, 1);
    slot.fillRect(0, 0, 40, 40);
    // Inner beveled shade
    slot.fillStyle(0x78350f, 1);
    slot.fillRect(2, 2, 36, 36);
    // Recessed slot background
    slot.fillStyle(0x271307, 0.95);
    slot.fillRect(4, 4, 32, 32);
    // Corner metallic studs
    slot.fillStyle(0xd97706, 1);
    slot.fillRect(2, 2, 2, 2);
    slot.fillRect(36, 2, 2, 2);
    slot.fillRect(2, 36, 2, 2);
    slot.fillRect(36, 36, 2, 2);

    slot.generateTexture('hotbar_slot', 40, 40);
    slot.destroy();

    // Active Selection Frame (Glowing Gold)
    const activeSlot = this.make.graphics({ x: 0, y: 0 });
    activeSlot.lineStyle(2, 0xfacc15, 1);
    activeSlot.strokeRect(1, 1, 38, 38);
    activeSlot.lineStyle(1, 0xfef08a, 0.8);
    activeSlot.strokeRect(3, 3, 34, 34);
    activeSlot.generateTexture('hotbar_active', 40, 40);
    activeSlot.destroy();
  }

  /**
   * Generates fluffy pixel clouds and parallax mountains.
   */
  private createEnvironmentAssets(): void {
    // 1. Pixel Cloud (48x20)
    const cloud = this.make.graphics({ x: 0, y: 0 });
    cloud.fillStyle(0xffffff, 0.85);
    cloud.fillRect(8, 4, 32, 12);
    cloud.fillRect(16, 0, 18, 6);
    cloud.fillRect(4, 8, 40, 8);
    cloud.fillRect(0, 11, 48, 5);
    cloud.fillStyle(0xe2e8f0, 0.8); // Cloud bottom shadow
    cloud.fillRect(4, 14, 40, 4);
    cloud.generateTexture('pixel_cloud', 48, 20);
    cloud.destroy();

    // 2. Parallax Mountain Ridge (128x64)
    const mtn = this.make.graphics({ x: 0, y: 0 });
    mtn.fillStyle(0x475569, 0.5);
    mtn.beginPath();
    mtn.moveTo(0, 64);
    mtn.lineTo(32, 16);
    mtn.lineTo(64, 40);
    mtn.lineTo(96, 8);
    mtn.lineTo(128, 64);
    mtn.closePath();
    mtn.fillPath();
    // Snow caps
    mtn.fillStyle(0xf1f5f9, 0.7);
    mtn.beginPath();
    mtn.moveTo(96, 8);
    mtn.lineTo(88, 22);
    mtn.lineTo(104, 22);
    mtn.closePath();
    mtn.fillPath();
    mtn.generateTexture('mountain_layer', 128, 64);
    mtn.destroy();
  }
}
