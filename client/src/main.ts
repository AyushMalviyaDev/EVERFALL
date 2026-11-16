import './style.css';
import { Engine } from './game/core/Engine.ts';
import { World } from './game/world/World.ts';
import { Camera } from './game/render/Camera.ts';
import { Renderer } from './game/render/Renderer.ts';
import { Vector2 } from './game/math/Vector2.ts';
import { worldToTile, tileToChunk } from './game/math/Coordinates.ts';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) {
  throw new Error('Root #app container not found in DOM');
}

// 1. Create and mount Canvas
const canvas = document.createElement('canvas');
canvas.id = 'game-canvas';
app.appendChild(canvas);

// 2. Initialize Engine
const engine = new Engine(canvas);

// 3. Initialize World and generate test landscape
const world = new World();
world.generateTestWorld(-4, 14, 0, 7);

// 4. Initialize Camera & Viewport Culling Renderer
const camera = new Camera(canvas.width, canvas.height);
// Focus camera at surface level spawn
const spawnPos = new Vector2(0, 520);
camera.snapTo(spawnPos.x, spawnPos.y);
camera.follow(spawnPos);

const renderer = new Renderer(world, camera);

// Keep camera viewport synced with canvas resize
engine.onResize = (width: number, height: number) => {
  camera.resize(width, height);
};

// 5. Fixed-Timestep 60Hz Physics & Camera Update
engine.onUpdate = (dt: number) => {
  const moveSpeed = 300;

  // Move camera target with WASD or Arrow Keys for test exploration
  if (engine.input.moveLeft) {
    spawnPos.x -= moveSpeed * dt;
  }
  if (engine.input.moveRight) {
    spawnPos.x += moveSpeed * dt;
  }
  if (engine.input.isKeyDown('KeyW') || engine.input.isKeyDown('ArrowUp')) {
    spawnPos.y -= moveSpeed * dt;
  }
  if (engine.input.crouch) {
    spawnPos.y += moveSpeed * dt;
  }

  // Handle Zoom via Mouse Wheel
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

  // Update Camera lerp
  camera.update(dt);
};

// 6. Variable-Timestep Render
engine.onRender = (ctx: CanvasRenderingContext2D, _alpha: number) => {
  // Render World and atmospheric sky with Viewport Culling
  renderer.render(ctx);

  // Render Reticle on Target Tile under Mouse
  const mouseScreen = engine.input.mouseScreenPos;
  // Convert mouse screen to world position
  const mouseWorldX = camera.position.x + (mouseScreen.x - canvas.width / 2) / camera.zoom;
  const mouseWorldY = camera.position.y + (mouseScreen.y - canvas.height / 2) / camera.zoom;
  const hoverTile = worldToTile(mouseWorldX, mouseWorldY);
  const hoverChunk = tileToChunk(hoverTile.tx, hoverTile.ty);

  // Draw tile selection highlight in world space
  camera.applyTransform(ctx);
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(hoverTile.tx * 16, hoverTile.ty * 16, 16, 16);
  camera.restoreTransform(ctx);

  // 7. Render Screen-Space Diagnostics & Controls HUD
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.fillRect(10, 10, 360, 215);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1;
  ctx.strokeRect(10, 10, 360, 215);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 13px monospace';
  ctx.fillText('⚡ TerraForge Viewport & Engine Diagnostics', 20, 30);

  ctx.fillStyle = '#f8fafc';
  ctx.font = '12px monospace';
  ctx.fillText(`FPS: ${engine.diagnostics.fps} | Physics: ${engine.diagnostics.ticksPerSec} Hz`, 20, 52);
  ctx.fillText(`Frame Time: ${engine.diagnostics.frameTimeMs.toFixed(2)} ms`, 20, 70);
  ctx.fillText(`Camera Pos: (${Math.round(camera.position.x)}, ${Math.round(camera.position.y)})`, 20, 88);
  ctx.fillText(`Zoom: ${camera.zoom.toFixed(1)}x (Scroll Wheel to Zoom)`, 20, 106);

  ctx.fillStyle = '#4ade80';
  ctx.fillText(
    `Visible Chunks: ${renderer.stats.renderedChunks} / ${world.loadedChunkCount} loaded`,
    20,
    124
  );
  ctx.fillText(`Visible Tiles: ${renderer.stats.renderedTiles}`, 20, 142);

  ctx.fillStyle = '#cbd5e1';
  ctx.fillText(`Hover Tile: (${hoverTile.tx}, ${hoverTile.ty}) in Chunk (${hoverChunk.cx}, ${hoverChunk.cy})`, 20, 160);

  ctx.fillStyle = '#94a3b8';
  ctx.fillText(`[WASD / Arrows] Pan Camera`, 20, 182);
  ctx.fillText(`[G] Toggle Tile Grid  |  [B] Toggle Chunk Borders`, 20, 200);
};

// Start Engine
engine.start();
console.log('TerraForge World & Viewport Culling active.');
