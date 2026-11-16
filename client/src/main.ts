import './style.css';
import { Engine } from './game/core/Engine.ts';
import { World } from './game/world/World.ts';
import { Camera } from './game/render/Camera.ts';
import { Renderer } from './game/render/Renderer.ts';
import { Player } from './game/entities/Player.ts';
import { worldToTile, tileToChunk } from './game/math/Coordinates.ts';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) {
  throw new Error('Root #app container not found in DOM');
}

// 1. Create and mount Canvas
const canvas = document.createElement('canvas');
canvas.id = 'game-canvas';
app.appendChild(canvas);

// 2. Initialize Core Engine
const engine = new Engine(canvas);

// 3. Initialize World and generate test terrain
const world = new World();
world.generateTestWorld(-6, 18, 0, 7);

// 4. Initialize Player Entity at Surface Spawn
// Surface starts at ~y=35 tiles = ~560px
const player = new Player(32, 450); // Spawns above surface to drop down naturally

// 5. Initialize Camera & Viewport Culling Renderer
const camera = new Camera(canvas.width, canvas.height);
camera.snapTo(player.center.x, player.center.y);
camera.follow(player.center);

const renderer = new Renderer(world, camera);

// Dynamic resize handler
engine.onResize = (width: number, height: number) => {
  camera.resize(width, height);
};

// 6. Fixed-Timestep 60Hz Physics & Entity Updates
engine.onUpdate = (dt: number) => {
  // Update Player physics, AABB collisions, jumping, and states
  player.update(dt, engine.input, world);

  // Update Camera tracking
  camera.follow(player.center);
  camera.update(dt);

  // Zoom control via mouse wheel
  if (engine.input.wheelDeltaY !== 0) {
    const zoomStep = engine.input.wheelDeltaY > 0 ? -0.2 : 0.2;
    camera.setZoom(camera.zoom + zoomStep);
  }

  // Toggle Grid with 'G' key
  if (engine.input.isKeyJustPressed('KeyG')) {
    renderer.showTileGrid = !renderer.showTileGrid;
  }

  // Toggle Chunk Borders with 'B' key
  if (engine.input.isKeyJustPressed('KeyB')) {
    renderer.showChunkBorders = !renderer.showChunkBorders;
  }
};

// 7. Variable-Timestep Render
engine.onRender = (ctx: CanvasRenderingContext2D, _alpha: number) => {
  // Render World terrain with viewport culling
  renderer.render(ctx);

  // Render Entities and World-Space Reticle
  camera.applyTransform(ctx);

  // Draw Player
  player.render(ctx);

  // Calculate Hovered Tile under Mouse in World Space
  const mouseScreen = engine.input.mouseScreenPos;
  const mouseWorldX = camera.position.x + (mouseScreen.x - canvas.width / 2) / camera.zoom;
  const mouseWorldY = camera.position.y + (mouseScreen.y - canvas.height / 2) / camera.zoom;
  const hoverTile = worldToTile(mouseWorldX, mouseWorldY);

  // Draw tile selection highlight box
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(hoverTile.tx * 16, hoverTile.ty * 16, 16, 16);

  camera.restoreTransform(ctx);

  // 8. Render Screen-Space Diagnostics & Player HUD
  const hoverChunk = tileToChunk(hoverTile.tx, hoverTile.ty);
  const playerTile = worldToTile(player.center.x, player.center.y);

  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.fillRect(10, 10, 380, 240);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1;
  ctx.strokeRect(10, 10, 380, 240);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('⚡ TerraForge Player & Physics Diagnostics', 20, 30);

  ctx.fillStyle = '#f8fafc';
  ctx.font = '12px monospace';
  ctx.fillText(`FPS: ${engine.diagnostics.fps} | Physics: ${engine.diagnostics.ticksPerSec} Hz`, 20, 52);
  ctx.fillText(`Player Pos: (${Math.round(player.position.x)}, ${Math.round(player.position.y)})`, 20, 70);
  ctx.fillText(`Player Tile: (${playerTile.tx}, ${playerTile.ty})`, 20, 88);
  ctx.fillText(`Velocity: (${player.velocity.x.toFixed(1)}, ${player.velocity.y.toFixed(1)})`, 20, 106);

  const stateColor = player.state === 'RUN' ? '#4ade80' : player.state === 'JUMP' ? '#facc15' : '#94a3b8';
  ctx.fillStyle = stateColor;
  ctx.fillText(`State: ${player.state}  |  Grounded: ${player.isGrounded ? 'YES' : 'NO'}`, 20, 124);

  ctx.fillStyle = '#38bdf8';
  ctx.fillText(`Visible Chunks: ${renderer.stats.renderedChunks} / ${world.loadedChunkCount} loaded`, 20, 144);
  ctx.fillText(`Visible Tiles: ${renderer.stats.renderedTiles}`, 20, 162);

  ctx.fillStyle = '#cbd5e1';
  ctx.fillText(`Hover Tile: (${hoverTile.tx}, ${hoverTile.ty}) in Chunk (${hoverChunk.cx}, ${hoverChunk.cy})`, 20, 180);

  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`[A / D] Move  |  [Space / W] Jump (Hold for high)`, 20, 202);
  ctx.fillText(`[G] Tile Grid  |  [B] Chunk Borders  |  [Wheel] Zoom`, 20, 220);
};

// Start Engine
engine.start();
console.log('TerraForge Player Physics and AABB Collision active.');
