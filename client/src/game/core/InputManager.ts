/**
 * TerraForge - Input Manager
 * 
 * Captures and processes keyboard, mouse, and scroll events.
 * Provides polled queries for keys (held, just pressed, just released),
 * mouse buttons, and normalized canvas-relative mouse coordinates.
 */

import { Vector2 } from '../math/Vector2.ts';

export const MouseButton = {
  LEFT: 0,
  MIDDLE: 1,
  RIGHT: 2,
} as const;
export type MouseButton = typeof MouseButton[keyof typeof MouseButton];

export class InputManager {
  private canvas: HTMLCanvasElement;

  // Keyboard States
  private keysDown = new Set<string>();
  private keysJustPressed = new Set<string>();
  private keysJustReleased = new Set<string>();

  // Mouse States
  private mouseButtonsDown = new Set<number>();
  private mouseButtonsJustPressed = new Set<number>();
  private mouseButtonsJustReleased = new Set<number>();
  
  // Mouse position in Canvas CSS pixels (Screen space)
  public mouseScreenPos: Vector2 = new Vector2(0, 0);
  public wheelDeltaY = 0;

  // Event handler references for clean removal
  private handleKeyDownBound: (e: KeyboardEvent) => void;
  private handleKeyUpBound: (e: KeyboardEvent) => void;
  private handleMouseDownBound: (e: MouseEvent) => void;
  private handleMouseUpBound: (e: MouseEvent) => void;
  private handleMouseMoveBound: (e: MouseEvent) => void;
  private handleWheelBound: (e: WheelEvent) => void;
  private handleContextMenuBound: (e: MouseEvent) => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    this.handleKeyDownBound = this.handleKeyDown.bind(this);
    this.handleKeyUpBound = this.handleKeyUp.bind(this);
    this.handleMouseDownBound = this.handleMouseDown.bind(this);
    this.handleMouseUpBound = this.handleMouseUp.bind(this);
    this.handleMouseMoveBound = this.handleMouseMove.bind(this);
    this.handleWheelBound = this.handleWheel.bind(this);
    this.handleContextMenuBound = this.handleContextMenu.bind(this);

    this.attach();
  }

  private attach(): void {
    window.addEventListener('keydown', this.handleKeyDownBound);
    window.addEventListener('keyup', this.handleKeyUpBound);

    this.canvas.addEventListener('mousedown', this.handleMouseDownBound);
    window.addEventListener('mouseup', this.handleMouseUpBound);
    this.canvas.addEventListener('mousemove', this.handleMouseMoveBound);
    this.canvas.addEventListener('wheel', this.handleWheelBound, { passive: false });
    this.canvas.addEventListener('contextmenu', this.handleContextMenuBound);
  }

  public destroy(): void {
    window.removeEventListener('keydown', this.handleKeyDownBound);
    window.removeEventListener('keyup', this.handleKeyUpBound);

    this.canvas.removeEventListener('mousedown', this.handleMouseDownBound);
    window.removeEventListener('mouseup', this.handleMouseUpBound);
    this.canvas.removeEventListener('mousemove', this.handleMouseMoveBound);
    this.canvas.removeEventListener('wheel', this.handleWheelBound);
    this.canvas.removeEventListener('contextmenu', this.handleContextMenuBound);

    this.clear();
  }

  // --- Keyboard Queries ---
  public isKeyDown(code: string): boolean {
    return this.keysDown.has(code);
  }

  public isKeyJustPressed(code: string): boolean {
    return this.keysJustPressed.has(code);
  }

  public isKeyJustReleased(code: string): boolean {
    return this.keysJustReleased.has(code);
  }

  // Common movement helper queries
  public get moveLeft(): boolean {
    return this.isKeyDown('KeyA') || this.isKeyDown('ArrowLeft');
  }

  public get moveRight(): boolean {
    return this.isKeyDown('KeyD') || this.isKeyDown('ArrowRight');
  }

  public get jump(): boolean {
    return (
      this.isKeyDown('Space') ||
      this.isKeyDown('KeyW') ||
      this.isKeyDown('ArrowUp')
    );
  }

  public get crouch(): boolean {
    return this.isKeyDown('KeyS') || this.isKeyDown('ArrowDown');
  }

  // --- Mouse Queries ---
  public isMouseDown(button: number): boolean {
    return this.mouseButtonsDown.has(button);
  }

  public isMouseJustPressed(button: number): boolean {
    return this.mouseButtonsJustPressed.has(button);
  }

  public isMouseJustReleased(button: number): boolean {
    return this.mouseButtonsJustReleased.has(button);
  }

  // --- Internal Event Listeners ---
  private handleKeyDown(e: KeyboardEvent): void {
    // Prevent default scrolling for Space / Arrow keys during gameplay
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault();
    }

    if (!this.keysDown.has(e.code)) {
      this.keysDown.add(e.code);
      this.keysJustPressed.add(e.code);
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    this.keysDown.delete(e.code);
    this.keysJustReleased.add(e.code);
  }

  private handleMouseDown(e: MouseEvent): void {
    this.updateMousePos(e);
    if (!this.mouseButtonsDown.has(e.button)) {
      this.mouseButtonsDown.add(e.button);
      this.mouseButtonsJustPressed.add(e.button);
    }
  }

  private handleMouseUp(e: MouseEvent): void {
    this.updateMousePos(e);
    this.mouseButtonsDown.delete(e.button);
    this.mouseButtonsJustReleased.add(e.button);
  }

  private handleMouseMove(e: MouseEvent): void {
    this.updateMousePos(e);
  }

  private handleWheel(e: WheelEvent): void {
    e.preventDefault();
    this.wheelDeltaY += e.deltaY;
  }

  private handleContextMenu(e: MouseEvent): void {
    // Suppress context menu so right-click is free for block placement
    e.preventDefault();
  }

  private updateMousePos(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    // Calculate position scaled to actual canvas coordinate buffer
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    this.mouseScreenPos.x = (e.clientX - rect.left) * scaleX;
    this.mouseScreenPos.y = (e.clientY - rect.top) * scaleY;
  }

  /**
   * Called at the end of each game frame to clear single-frame transitional states.
   */
  public endFrame(): void {
    this.keysJustPressed.clear();
    this.keysJustReleased.clear();
    this.mouseButtonsJustPressed.clear();
    this.mouseButtonsJustReleased.clear();
    this.wheelDeltaY = 0;
  }

  private clear(): void {
    this.keysDown.clear();
    this.keysJustPressed.clear();
    this.keysJustReleased.clear();
    this.mouseButtonsDown.clear();
    this.mouseButtonsJustPressed.clear();
    this.mouseButtonsJustReleased.clear();
    this.wheelDeltaY = 0;
  }
}
