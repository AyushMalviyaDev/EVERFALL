/**
 * TerraForge - Terraria UI Scene
 * 
 * Implements the authentic Terraria HUD layout:
 * - Top-Left: Wooden Hotbar Slots with glowing active selection
 * - Top-Right: Red Vitality Hearts (HP 100/100)
 * - Bottom-Left: GenAI Command Terminal & Multiplayer Chat
 */

import Phaser from 'phaser';
import { NetworkManager } from '../network/NetworkManager.ts';
import { WorldScene } from './WorldScene.ts';
import { TileId } from '../network/protocol.ts';

export class UIScene extends Phaser.Scene {
  private network!: NetworkManager;
  private worldScene!: WorldScene;

  // UI Elements
  private activeSlotHighlight!: Phaser.GameObjects.Image;
  private netStatsText!: Phaser.GameObjects.Text;
  private chatContainer!: Phaser.GameObjects.Container;
  private chatTextObjects: Phaser.GameObjects.Text[] = [];

  private chatMessages: string[] = [
    'System: Welcome to TerraForge (Terraria Edition)!',
    'Guide NPC: "Build a shelter with wood and torches before nightfall."',
    'GenAI Architect: Type "/build castle" or "/talk [message]".'
  ];

  public readonly hotbarItems = [
    { key: '1', name: 'Dirt', tileId: TileId.DIRT, color: 0x865439 },
    { key: '2', name: 'Stone', tileId: TileId.STONE, color: 0x64748b },
    { key: '3', name: 'Wood', tileId: TileId.WOOD, color: 0xd97706 },
    { key: '4', name: 'Brick', tileId: TileId.BRICK, color: 0x94a3b8 },
    { key: '5', name: 'Torch', tileId: TileId.TORCH, color: 0xea580c },
  ];

  constructor() {
    super({ key: 'UIScene' });
  }

  public create(): void {
    this.network = this.registry.get('network') as NetworkManager;
    this.worldScene = this.scene.get('WorldScene') as WorldScene;

    // 1. Top-Left Terraria Wooden Hotbar
    this.createTerrariaHotbar();

    // 2. Top-Right Health Hearts
    this.createHealthDisplay();

    // 3. Compact Diagnostics Badge
    this.createDiagnosticsBadge();

    // 4. Bottom-Left GenAI Command Terminal
    this.createChatTerminal();

    // 5. Network Event Listeners
    if (this.network) {
      this.network.onChat = (pkt) => {
        const prefix = pkt.isAi ? '🤖 [AI] ' : `${pkt.sender}: `;
        this.addChatMessage(prefix + pkt.content);
      };

      this.network.onAiStatus = (pkt) => {
        this.addChatMessage(`⚡ [GenAI Architect] ${pkt.message}`);
      };
    }
  }

  /**
   * Classic Terraria wooden hotbar across top-left.
   */
  private createTerrariaHotbar(): void {
    const slotSize = 40;
    const gap = 4;
    const startX = 16;
    const startY = 16;

    for (let i = 0; i < this.hotbarItems.length; i++) {
      const item = this.hotbarItems[i];
      const x = startX + i * (slotSize + gap);
      const y = startY;

      // Wooden Frame
      this.add.image(x + slotSize / 2, y + slotSize / 2, 'hotbar_slot');

      // Material Icon / Preview
      const preview = this.add.graphics();
      preview.fillStyle(item.color, 1);
      preview.fillRect(x + 11, y + 11, 18, 18);
      preview.lineStyle(1, 0x000000, 0.4);
      preview.strokeRect(x + 11, y + 11, 18, 18);

      // Slot Key Number
      this.add.text(x + 5, y + 4, item.key, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#fde047',
        fontStyle: 'bold',
      });
    }

    // Glowing Active Selection Indicator
    this.activeSlotHighlight = this.add.image(startX + slotSize / 2, startY + slotSize / 2, 'hotbar_active');
    this.activeSlotHighlight.setDepth(50);
  }

  /**
   * Classic Terraria red hearts in top-right.
   */
  private createHealthDisplay(): void {
    const startX = this.scale.width - 150;
    const startY = 20;

    // "Life 100/100" Header
    this.add.text(startX, startY - 4, 'Life: 100/100', {
      fontFamily: 'monospace',
      fontSize: '13px',
      color: '#f87171',
      fontStyle: 'bold',
    });

    // 5 Vitality Hearts (20 HP each)
    for (let i = 0; i < 5; i++) {
      const heart = this.add.image(startX + i * 20 + 8, startY + 22, 'heart_icon');
      heart.setScale(1.3);
    }
  }

  /**
   * Compact network diagnostics under hotbar.
   */
  private createDiagnosticsBadge(): void {
    this.netStatsText = this.add.text(18, 66, '', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#94a3b8',
      lineSpacing: 3,
    });
  }

  /**
   * Terraria-style chat and AI command log.
   */
  private createChatTerminal(): void {
    const chatWidth = 420;
    const chatHeight = 110;
    const chatX = 16;
    const chatY = this.scale.height - chatHeight - 20;

    this.chatContainer = this.add.container(chatX, chatY);

    const bg = this.add.graphics();
    bg.fillStyle(0x0a0f1d, 0.85);
    bg.fillRoundedRect(0, 0, chatWidth, chatHeight, 4);
    bg.lineStyle(1, 0x1e293b, 0.8);
    bg.strokeRoundedRect(0, 0, chatWidth, chatHeight, 4);
    this.chatContainer.add(bg);

    const title = this.add.text(10, 6, '💬 Terraria Chat & GenAI Terminal', {
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#38bdf8',
      fontStyle: 'bold',
    });
    this.chatContainer.add(title);

    this.updateChatDisplay();
  }

  private updateChatDisplay(): void {
    for (const obj of this.chatTextObjects) {
      obj.destroy();
    }
    this.chatTextObjects = [];

    const recent = this.chatMessages.slice(-3);
    recent.forEach((msg, idx) => {
      const isAi = msg.includes('[AI]') || msg.includes('Architect');
      const isGuide = msg.includes('Guide');
      const color = isAi ? '#facc15' : isGuide ? '#4ade80' : '#cbd5e1';

      const text = this.add.text(10, 26 + idx * 22, msg, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color,
        wordWrap: { width: 400 },
      });
      this.chatContainer.add(text);
      this.chatTextObjects.push(text);
    });
  }

  public addChatMessage(msg: string): void {
    this.chatMessages.push(msg);
    this.updateChatDisplay();
  }

  public override update(): void {
    const fps = Math.round(this.game.loop.actualFps);
    const netState = this.network.isConnected ? '🟢 ONLINE' : '🟡 STANDALONE';
    const ping = this.network.isConnected ? `${this.network.latencyMs}ms` : 'Local';
    const px = Math.round(this.worldScene?.player?.x ?? 0);
    const py = Math.round(this.worldScene?.player?.y ?? 0);

    // Update Diagnostics
    this.netStatsText.setText(
      `FPS: ${fps} | Ping: ${ping} | ${netState} | Pos: (${px}, ${py})\n[A/D] Run | [Space] Jump | [L-Click] Mine | [R-Click] Place | [1-5] Pick Tool`
    );

    // Update Active Hotbar Slot Highlight Position
    const activeId = this.worldScene?.activeMaterial ?? TileId.DIRT;
    const activeIndex = this.hotbarItems.findIndex((it) => it.tileId === activeId);
    if (activeIndex !== -1) {
      const slotSize = 40;
      const gap = 4;
      const startX = 16;
      this.activeSlotHighlight.setX(startX + activeIndex * (slotSize + gap) + slotSize / 2);
    }
  }
}
