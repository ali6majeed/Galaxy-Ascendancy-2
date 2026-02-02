export const RESOURCE_TYPES = {
  METAL: "metal",
  CRYSTAL: "crystal",
  OXYGEN: "oxygen",
  ENERGY: "energy",
} as const;

export type ResourceType = (typeof RESOURCE_TYPES)[keyof typeof RESOURCE_TYPES];

export const LAYER_TYPES = {
  ORBIT: "orbit",
  SURFACE: "surface",
  CORE: "core",
} as const;

export type LayerType = (typeof LAYER_TYPES)[keyof typeof LAYER_TYPES];

export const BUILDING_TYPES = {
  METAL_MINE: "metal_mine",
  CRYSTAL_REFINERY: "crystal_refinery",
  OXYGEN_PROCESSOR: "oxygen_processor",
  ENERGY_PLANT: "energy_plant",
  FLEET_DOCK: "fleet_dock",
  RESEARCH_LAB: "research_lab",
  COMMAND_CENTER: "command_center",
  SHIPYARD: "shipyard",
  DEFENSE_PLATFORM: "defense_platform",
  TRADE_HUB: "trade_hub",
} as const;

export const BUILDING_CATEGORIES = {
  RESOURCES: "resources",
  BUILDINGS: "buildings",
} as const;

export type BuildingCategory = (typeof BUILDING_CATEGORIES)[keyof typeof BUILDING_CATEGORIES];

export const RESOURCE_BUILDINGS: BuildingType[] = [
  BUILDING_TYPES.METAL_MINE,
  BUILDING_TYPES.CRYSTAL_REFINERY,
  BUILDING_TYPES.OXYGEN_PROCESSOR,
  BUILDING_TYPES.ENERGY_PLANT,
];

export const FACILITY_BUILDINGS: BuildingType[] = [
  BUILDING_TYPES.COMMAND_CENTER,
  BUILDING_TYPES.RESEARCH_LAB,
  BUILDING_TYPES.FLEET_DOCK,
  BUILDING_TYPES.SHIPYARD,
  BUILDING_TYPES.DEFENSE_PLATFORM,
  BUILDING_TYPES.TRADE_HUB,
];

export type BuildingType = (typeof BUILDING_TYPES)[keyof typeof BUILDING_TYPES];

export const BUILDING_MAX_SLOTS: Record<BuildingType, number> = {
  [BUILDING_TYPES.METAL_MINE]: 4,
  [BUILDING_TYPES.CRYSTAL_REFINERY]: 4,
  [BUILDING_TYPES.OXYGEN_PROCESSOR]: 6,
  [BUILDING_TYPES.ENERGY_PLANT]: 4,
  [BUILDING_TYPES.FLEET_DOCK]: 1,
  [BUILDING_TYPES.RESEARCH_LAB]: 1,
  [BUILDING_TYPES.COMMAND_CENTER]: 1,
  [BUILDING_TYPES.SHIPYARD]: 1,
  [BUILDING_TYPES.DEFENSE_PLATFORM]: 1,
  [BUILDING_TYPES.TRADE_HUB]: 1,
};

export interface BuildingSlot {
  buildingType: BuildingType;
  slotIndex: number;
  position: { angle: number; radius: number };
}

export const PLANET_BUILDING_SLOTS: BuildingSlot[] = [
  { buildingType: BUILDING_TYPES.METAL_MINE, slotIndex: 0, position: { angle: 30, radius: 0.38 } },
  { buildingType: BUILDING_TYPES.METAL_MINE, slotIndex: 1, position: { angle: 60, radius: 0.42 } },
  { buildingType: BUILDING_TYPES.METAL_MINE, slotIndex: 2, position: { angle: 90, radius: 0.38 } },
  { buildingType: BUILDING_TYPES.METAL_MINE, slotIndex: 3, position: { angle: 120, radius: 0.42 } },
  
  { buildingType: BUILDING_TYPES.CRYSTAL_REFINERY, slotIndex: 0, position: { angle: 150, radius: 0.38 } },
  { buildingType: BUILDING_TYPES.CRYSTAL_REFINERY, slotIndex: 1, position: { angle: 180, radius: 0.42 } },
  { buildingType: BUILDING_TYPES.CRYSTAL_REFINERY, slotIndex: 2, position: { angle: 210, radius: 0.38 } },
  { buildingType: BUILDING_TYPES.CRYSTAL_REFINERY, slotIndex: 3, position: { angle: 240, radius: 0.42 } },
  
  { buildingType: BUILDING_TYPES.OXYGEN_PROCESSOR, slotIndex: 0, position: { angle: 270, radius: 0.35 } },
  { buildingType: BUILDING_TYPES.OXYGEN_PROCESSOR, slotIndex: 1, position: { angle: 290, radius: 0.40 } },
  { buildingType: BUILDING_TYPES.OXYGEN_PROCESSOR, slotIndex: 2, position: { angle: 310, radius: 0.35 } },
  { buildingType: BUILDING_TYPES.OXYGEN_PROCESSOR, slotIndex: 3, position: { angle: 330, radius: 0.40 } },
  { buildingType: BUILDING_TYPES.OXYGEN_PROCESSOR, slotIndex: 4, position: { angle: 350, radius: 0.35 } },
  { buildingType: BUILDING_TYPES.OXYGEN_PROCESSOR, slotIndex: 5, position: { angle: 10, radius: 0.40 } },
];

export interface BuildingDefinition {
  id: BuildingType;
  name: string;
  description: string;
  layer: LayerType;
  baseProductionRate: number;
  resourceType: ResourceType | null;
  baseCost: {
    metal: number;
    crystal: number;
    oxygen: number;
  };
  baseConstructionTime: number;
  energyConsumption: number;
}

export const BUILDING_DEFINITIONS: Record<BuildingType, BuildingDefinition> = {
  [BUILDING_TYPES.METAL_MINE]: {
    id: BUILDING_TYPES.METAL_MINE,
    name: "Metal Mine",
    description: "Extracts metal ore from the planet surface. Foundation of your economy.",
    layer: LAYER_TYPES.SURFACE,
    baseProductionRate: 30,
    resourceType: RESOURCE_TYPES.METAL,
    baseCost: { metal: 60, crystal: 15, oxygen: 0 },
    baseConstructionTime: 60,
    energyConsumption: 10,
  },
  [BUILDING_TYPES.CRYSTAL_REFINERY]: {
    id: BUILDING_TYPES.CRYSTAL_REFINERY,
    name: "Crystal Refinery",
    description: "Processes raw crystals for advanced technology. Essential for research.",
    layer: LAYER_TYPES.SURFACE,
    baseProductionRate: 20,
    resourceType: RESOURCE_TYPES.CRYSTAL,
    baseCost: { metal: 48, crystal: 24, oxygen: 0 },
    baseConstructionTime: 90,
    energyConsumption: 15,
  },
  [BUILDING_TYPES.OXYGEN_PROCESSOR]: {
    id: BUILDING_TYPES.OXYGEN_PROCESSOR,
    name: "Oxygen Processor",
    description: "Generates oxygen for population and fleet operations.",
    layer: LAYER_TYPES.SURFACE,
    baseProductionRate: 15,
    resourceType: RESOURCE_TYPES.OXYGEN,
    baseCost: { metal: 225, crystal: 75, oxygen: 0 },
    baseConstructionTime: 120,
    energyConsumption: 20,
  },
  [BUILDING_TYPES.ENERGY_PLANT]: {
    id: BUILDING_TYPES.ENERGY_PLANT,
    name: "Energy Plant",
    description: "Powers all structures on your planet. Without energy, buildings fail.",
    layer: LAYER_TYPES.CORE,
    baseProductionRate: 50,
    resourceType: RESOURCE_TYPES.ENERGY,
    baseCost: { metal: 75, crystal: 30, oxygen: 0 },
    baseConstructionTime: 45,
    energyConsumption: 0,
  },
  [BUILDING_TYPES.FLEET_DOCK]: {
    id: BUILDING_TYPES.FLEET_DOCK,
    name: "Fleet Dock",
    description: "Constructs and maintains your spacecraft fleet.",
    layer: LAYER_TYPES.ORBIT,
    baseProductionRate: 0,
    resourceType: null,
    baseCost: { metal: 400, crystal: 200, oxygen: 100 },
    baseConstructionTime: 300,
    energyConsumption: 30,
  },
  [BUILDING_TYPES.RESEARCH_LAB]: {
    id: BUILDING_TYPES.RESEARCH_LAB,
    name: "Research Lab",
    description: "Unlocks new technologies and upgrades for your empire.",
    layer: LAYER_TYPES.SURFACE,
    baseProductionRate: 0,
    resourceType: null,
    baseCost: { metal: 200, crystal: 400, oxygen: 200 },
    baseConstructionTime: 240,
    energyConsumption: 25,
  },
  [BUILDING_TYPES.COMMAND_CENTER]: {
    id: BUILDING_TYPES.COMMAND_CENTER,
    name: "Command Center",
    description: "The heart of your colony. Required to unlock other city buildings.",
    layer: LAYER_TYPES.SURFACE,
    baseProductionRate: 0,
    resourceType: null,
    baseCost: { metal: 100, crystal: 50, oxygen: 50 },
    baseConstructionTime: 120,
    energyConsumption: 15,
  },
  [BUILDING_TYPES.SHIPYARD]: {
    id: BUILDING_TYPES.SHIPYARD,
    name: "Shipyard",
    description: "Constructs and assembles spacecraft for your fleet.",
    layer: LAYER_TYPES.ORBIT,
    baseProductionRate: 0,
    resourceType: null,
    baseCost: { metal: 500, crystal: 300, oxygen: 150 },
    baseConstructionTime: 360,
    energyConsumption: 40,
  },
  [BUILDING_TYPES.DEFENSE_PLATFORM]: {
    id: BUILDING_TYPES.DEFENSE_PLATFORM,
    name: "Defense Platform",
    description: "Orbital defenses that protect your planet from enemy attacks.",
    layer: LAYER_TYPES.ORBIT,
    baseProductionRate: 0,
    resourceType: null,
    baseCost: { metal: 350, crystal: 150, oxygen: 100 },
    baseConstructionTime: 300,
    energyConsumption: 35,
  },
  [BUILDING_TYPES.TRADE_HUB]: {
    id: BUILDING_TYPES.TRADE_HUB,
    name: "Trade Hub",
    description: "Buy and sell resources with other players and NPC markets.",
    layer: LAYER_TYPES.SURFACE,
    baseProductionRate: 0,
    resourceType: null,
    baseCost: { metal: 300, crystal: 200, oxygen: 100 },
    baseConstructionTime: 240,
    energyConsumption: 20,
  },
};

export function calculateUpgradeCost(
  building: BuildingDefinition,
  level: number
): { metal: number; crystal: number; oxygen: number } {
  const multiplier = Math.pow(1.5, level - 1);
  return {
    metal: Math.floor(building.baseCost.metal * multiplier),
    crystal: Math.floor(building.baseCost.crystal * multiplier),
    oxygen: Math.floor(building.baseCost.oxygen * multiplier),
  };
}

export function calculateProductionRate(
  building: BuildingDefinition,
  level: number
): number {
  if (building.baseProductionRate === 0) return 0;
  return Math.floor(building.baseProductionRate * level * Math.pow(1.1, level - 1));
}

export function calculateConstructionTime(
  building: BuildingDefinition,
  level: number
): number {
  return Math.floor(building.baseConstructionTime * Math.pow(1.2, level - 1));
}

export function calculateEnergyConsumption(
  building: BuildingDefinition,
  level: number
): number {
  return Math.floor(building.energyConsumption * level);
}

export function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  }
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}
