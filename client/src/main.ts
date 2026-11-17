import './style.css';
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.ts';
import { WorldScene } from './scenes/WorldScene.ts';
import { UIScene } from './scenes/UIScene.ts';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: window.innerWidth,
  height: window.innerHeight,
  parent: 'app',
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, WorldScene, UIScene],
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

// Initialize Phaser 3/4 Game Instance
new Phaser.Game(config);
console.log('⚡ TerraForge Phaser Client active and ready for Python Backend integration.');
