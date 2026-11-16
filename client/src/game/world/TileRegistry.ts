/**
 * TerraForge - Tile Registry & Definitions
 * 
 * Defines block identifiers and their physical / visual properties.
 * Designed to be data-driven for easy expansion with ores, liquids, and flora.
 */

export const TileId = {
  AIR: 0,
  GRASS: 1,
  DIRT: 2,
  STONE: 3,
  WOOD_PLANK: 4,
  BRICK: 5,
  BEDROCK: 6,
} as const;

export type TileId = typeof TileId[keyof typeof TileId];

export interface TileDefinition {
  id: number;
  name: string;
  solid: boolean;
  hardness: number; // Breaking duration scale; -1 for unbreakable
  color: string;
  topColor?: string; // For grass tops
  borderColor?: string;
  transparent: boolean;
}

export const TILE_REGISTRY: Record<number, TileDefinition> = {
  [TileId.AIR]: {
    id: TileId.AIR,
    name: 'Air',
    solid: false,
    hardness: 0,
    color: 'transparent',
    transparent: true,
  },
  [TileId.GRASS]: {
    id: TileId.GRASS,
    name: 'Grass Block',
    solid: true,
    hardness: 1.0,
    color: '#865439', // Dirt body
    topColor: '#4ade80', // Lush grass top
    borderColor: '#22c55e',
    transparent: false,
  },
  [TileId.DIRT]: {
    id: TileId.DIRT,
    name: 'Dirt',
    solid: true,
    hardness: 1.0,
    color: '#865439',
    borderColor: '#6b3f27',
    transparent: false,
  },
  [TileId.STONE]: {
    id: TileId.STONE,
    name: 'Stone',
    solid: true,
    hardness: 2.5,
    color: '#64748b',
    borderColor: '#475569',
    transparent: false,
  },
  [TileId.WOOD_PLANK]: {
    id: TileId.WOOD_PLANK,
    name: 'Wood Planks',
    solid: true,
    hardness: 1.5,
    color: '#d97706',
    borderColor: '#b45309',
    transparent: false,
  },
  [TileId.BRICK]: {
    id: TileId.BRICK,
    name: 'Stone Bricks',
    solid: true,
    hardness: 3.0,
    color: '#94a3b8',
    borderColor: '#334155',
    transparent: false,
  },
  [TileId.BEDROCK]: {
    id: TileId.BEDROCK,
    name: 'Bedrock',
    solid: true,
    hardness: -1, // Unbreakable
    color: '#1e293b',
    borderColor: '#0f172a',
    transparent: false,
  },
};

/**
 * Helper to query whether a tile ID is solid.
 */
export function isTileSolid(tileId: number): boolean {
  const def = TILE_REGISTRY[tileId];
  return def ? def.solid : false;
}

/**
 * Helper to fetch tile metadata safely.
 */
export function getTileDef(tileId: number): TileDefinition {
  return TILE_REGISTRY[tileId] || TILE_REGISTRY[TileId.AIR];
}
