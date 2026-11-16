/**
 * TerraForge - Global Game Engine Constants
 */

// Tile Dimensions
export const TILE_SIZE = 16; // 16x16 pixels per tile

// Chunk Dimensions (Voxel Partitioning)
export const CHUNK_WIDTH = 16; // 16 tiles wide
export const CHUNK_HEIGHT = 16; // 16 tiles high
export const CHUNK_SIZE = 16; // Square chunk dimension
export const CHUNK_TOTAL_TILES = CHUNK_WIDTH * CHUNK_HEIGHT; // 256 tiles per chunk
export const CHUNK_PIXEL_WIDTH = CHUNK_WIDTH * TILE_SIZE; // 256 pixels
export const CHUNK_PIXEL_HEIGHT = CHUNK_HEIGHT * TILE_SIZE; // 256 pixels

// Physics & Game Loop Timing (Fixed-Timestep Accumulator)
export const PHYSICS_TICK_RATE = 60; // 60 updates per second
export const FIXED_DELTA_TIME = 1 / PHYSICS_TICK_RATE; // ~0.016667 seconds per physics tick
export const MAX_FRAME_ACCUMULATOR = 0.25; // Clamp delta time to avoid spiral-of-death on lag

// Dynamics & Forces (Pixels / Second units)
export const GRAVITY = 980; // Downward acceleration in px/s^2
export const TERMINAL_VELOCITY = 750; // Max falling speed in px/s
export const PLAYER_WALK_SPEED = 140; // Max horizontal movement speed in px/s
export const PLAYER_ACCELERATION = 900; // Ground acceleration in px/s^2
export const PLAYER_AIR_ACCELERATION = 450; // Air control acceleration in px/s^2
export const GROUND_FRICTION = 0.82; // Damping factor applied when not pressing move keys
export const AIR_FRICTION = 0.94; // Air resistance damping factor
export const JUMP_VELOCITY = -320; // Instantaneous upward impulse in px/s

// Interaction
export const PLAYER_REACH_DISTANCE = 5 * TILE_SIZE; // 80 pixels max reach for mining/placing

// Camera & Viewport
export const DEFAULT_CAMERA_ZOOM = 2.0; // 2x pixel scale for retro visual aesthetics
export const MIN_CAMERA_ZOOM = 1.0;
export const MAX_CAMERA_ZOOM = 4.0;
export const CAMERA_LERP_FACTOR = 0.1; // Smooth dampening factor for camera tracking
