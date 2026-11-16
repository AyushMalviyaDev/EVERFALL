import './style.css';
import { Engine } from './game/core/Engine.ts';
import { MouseButton } from './game/core/InputManager.ts';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) {
  throw new Error('Root #app container not found in DOM');
}

// Create and mount the Canvas
const canvas = document.createElement('canvas');
canvas.id = 'game-canvas';
app.appendChild(canvas);

// Initialize Engine
const engine = new Engine(canvas);

// Simple test entity to verify fixed-timestep updates and keyboard controls
let testBox = {
  x: window.innerWidth / 2,
  y: window.innerHeight / 2,
  size: 32,
  speed: 250,
  color: '#4ade80'
};

// Fixed-timestep 60Hz physics update callback
engine.onUpdate = (dt: number) => {
  // Move test box with WASD / Arrow keys
  if (engine.input.moveLeft) {
    testBox.x -= testBox.speed * dt;
  }
  if (engine.input.moveRight) {
    testBox.x += testBox.speed * dt;
  }
  if (engine.input.isKeyDown('KeyW') || engine.input.isKeyDown('ArrowUp')) {
    testBox.y -= testBox.speed * dt;
  }
  if (engine.input.crouch) {
    testBox.y += testBox.speed * dt;
  }

  // Change color on mouse click
  if (engine.input.isMouseDown(MouseButton.LEFT)) {
    testBox.color = '#f87171'; // Red
  } else if (engine.input.isMouseDown(MouseButton.RIGHT)) {
    testBox.color = '#60a5fa'; // Blue
  } else {
    testBox.color = '#4ade80'; // Green
  }
};

// Variable timestep render callback
engine.onRender = (ctx: CanvasRenderingContext2D, _alpha: number) => {
  const width = canvas.width;
  const height = canvas.height;

  // 1. Clear background
  ctx.fillStyle = '#0f172a'; // Deep slate
  ctx.fillRect(0, 0, width, height);

  // 2. Draw subtle background coordinate grid
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  const gridSize = 32;
  ctx.beginPath();
  for (let x = 0; x < width; x += gridSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  ctx.stroke();

  // 3. Draw test entity
  ctx.fillStyle = testBox.color;
  ctx.fillRect(
    Math.round(testBox.x - testBox.size / 2),
    Math.round(testBox.y - testBox.size / 2),
    testBox.size,
    testBox.size
  );
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.strokeRect(
    Math.round(testBox.x - testBox.size / 2),
    Math.round(testBox.y - testBox.size / 2),
    testBox.size,
    testBox.size
  );

  // 4. Draw mouse crosshair / reticle
  const mouse = engine.input.mouseScreenPos;
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(Math.round(mouse.x - 8), Math.round(mouse.y - 8), 16, 16);
  ctx.beginPath();
  ctx.moveTo(mouse.x, mouse.y - 12);
  ctx.lineTo(mouse.x, mouse.y + 12);
  ctx.moveTo(mouse.x - 12, mouse.y);
  ctx.lineTo(mouse.x + 12, mouse.y);
  ctx.stroke();

  // 5. Draw Diagnostics HUD
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(10, 10, 310, 140);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1;
  ctx.strokeRect(10, 10, 310, 140);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('⚡ TerraForge Engine Diagnostics', 20, 30);

  ctx.fillStyle = '#f8fafc';
  ctx.font = '12px monospace';
  ctx.fillText(`FPS: ${engine.diagnostics.fps} (Display Refresh)`, 20, 50);
  ctx.fillText(`Physics Tick: ${engine.diagnostics.ticksPerSec} Hz (Fixed 60Hz)`, 20, 68);
  ctx.fillText(`Frame Time: ${engine.diagnostics.frameTimeMs.toFixed(2)} ms`, 20, 86);
  ctx.fillText(`Mouse Pos: (${Math.round(mouse.x)}, ${Math.round(mouse.y)})`, 20, 104);
  
  const leftDown = engine.input.isMouseDown(MouseButton.LEFT) ? 'L-CLICK' : '';
  const rightDown = engine.input.isMouseDown(MouseButton.RIGHT) ? 'R-CLICK' : '';
  ctx.fillText(`Input: WASD | ${leftDown} ${rightDown}`, 20, 122);
};

// Start the game loop!
engine.start();
console.log('TerraForge Engine initialized and running at 60 Hz fixed timestep.');
