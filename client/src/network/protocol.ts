/**
 * TerraForge - Network Protocol & Packet Specifications
 * 
 * Strict type definitions for real-time WebSocket communication
 * between the Phaser client and the FastAPI backend.
 */

// Terraria-Style Tile Identifiers
export const TileId = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  WOOD: 4,        // Wood Planks
  BRICK: 5,
  BEDROCK: 6,
  SAND: 7,
  LEAVES: 8,       // Tree Leaves
  WOOD_LOG: 9,     // Tree Trunk
  COAL_ORE: 10,
  IRON_ORE: 11,
  GOLD_ORE: 12,
  TORCH: 13,
} as const;

export type TileId = typeof TileId[keyof typeof TileId];

// --- Client -> Server Packets ---

export interface ClientJoinPacket {
  type: 'PLAYER_JOIN';
  username: string;
  token?: string;
}

export interface ClientInputPacket {
  type: 'PLAYER_INPUT';
  tick: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 'left' | 'right';
  state: 'idle' | 'run' | 'jump' | 'fall';
}

export interface ClientBlockMinePacket {
  type: 'BLOCK_MINE';
  tx: number;
  ty: number;
}

export interface ClientBlockPlacePacket {
  type: 'BLOCK_PLACE';
  tx: number;
  ty: number;
  tileId: number;
}

export interface ClientChatPacket {
  type: 'CHAT_MESSAGE';
  content: string;
}

export interface ClientAiCommandPacket {
  type: 'AI_COMMAND';
  command: string;
}

export type ClientPacket =
  | ClientJoinPacket
  | ClientInputPacket
  | ClientBlockMinePacket
  | ClientBlockPlacePacket
  | ClientChatPacket
  | ClientAiCommandPacket;

// --- Server -> Client Packets ---

export interface PlayerNetState {
  id: string;
  username: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 'left' | 'right';
  state: 'idle' | 'run' | 'jump' | 'fall';
}

export interface NpcNetState {
  id: string;
  name: string;
  role: string;
  x: number;
  y: number;
  facing: 'left' | 'right';
  currentDialogue?: string;
}

export interface ServerInitAckPacket {
  type: 'INIT_ACK';
  playerId: string;
  worldSeed: number;
  spawnX: number;
  spawnY: number;
  serverTick: number;
}

export interface ServerSnapshotPacket {
  type: 'WORLD_SNAPSHOT';
  tick: number;
  players: PlayerNetState[];
  npcs: NpcNetState[];
}

export interface ServerBlockUpdatePacket {
  type: 'BLOCK_UPDATE';
  tx: number;
  ty: number;
  tileId: number;
  initiatorId?: string;
}

export interface ServerChatBroadcastPacket {
  type: 'CHAT_BROADCAST';
  sender: string;
  content: string;
  isAi?: boolean;
  timestamp: number;
}

export interface ServerAiStatusPacket {
  type: 'AI_STATUS';
  status: 'thinking' | 'building' | 'complete' | 'error';
  message: string;
  affectedBlocksCount?: number;
}

export type ServerPacket =
  | ServerInitAckPacket
  | ServerSnapshotPacket
  | ServerBlockUpdatePacket
  | ServerChatBroadcastPacket
  | ServerAiStatusPacket;
