import { storage } from "./storage";
import type { Planet, Building } from "@shared/schema";

interface BuildingDefinition {
  id: string;
  name: string;
  layer: string;
  baseProductionRate: number;
  resourceType: string | null;
  baseCost: { metal: number; crystal: number; oxygen: number };
  baseConstructionTime: number;
  energyConsumption: number;
}

const BUILDING_DEFINITIONS: Record<string, BuildingDefinition> = {
  metal_mine: {
    id: "metal_mine",
    name: "Metal Mine",
    layer: "surface",
    baseProductionRate: 30,
    resourceType: "metal",
    baseCost: { metal: 60, crystal: 15, oxygen: 0 },
    baseConstructionTime: 60,
    energyConsumption: 10,
  },
  crystal_refinery: {
    id: "crystal_refinery",
    name: "Crystal Refinery",
    layer: "surface",
    baseProductionRate: 20,
    resourceType: "crystal",
    baseCost: { metal: 48, crystal: 24, oxygen: 0 },
    baseConstructionTime: 90,
    energyConsumption: 15,
  },
  oxygen_processor: {
    id: "oxygen_processor",
    name: "Oxygen Processor",
    layer: "surface",
    baseProductionRate: 15,
    resourceType: "oxygen",
    baseCost: { metal: 225, crystal: 75, oxygen: 0 },
    baseConstructionTime: 120,
    energyConsumption: 20,
  },
  energy_plant: {
    id: "energy_plant",
    name: "Energy Plant",
    layer: "core",
    baseProductionRate: 50,
    resourceType: "energy",
    baseCost: { metal: 75, crystal: 30, oxygen: 0 },
    baseConstructionTime: 45,
    energyConsumption: 0,
  },
  fleet_dock: {
    id: "fleet_dock",
    name: "Fleet Dock",
    layer: "orbit",
    baseProductionRate: 0,
    resourceType: null,
    baseCost: { metal: 400, crystal: 200, oxygen: 100 },
    baseConstructionTime: 300,
    energyConsumption: 30,
  },
  research_lab: {
    id: "research_lab",
    name: "Research Lab",
    layer: "surface",
    baseProductionRate: 0,
    resourceType: null,
    baseCost: { metal: 200, crystal: 400, oxygen: 200 },
    baseConstructionTime: 240,
    energyConsumption: 25,
  },
  command_center: {
    id: "command_center",
    name: "Command Center",
    layer: "surface",
    baseProductionRate: 0,
    resourceType: null,
    baseCost: { metal: 100, crystal: 50, oxygen: 50 },
    baseConstructionTime: 120,
    energyConsumption: 15,
  },
  shipyard: {
    id: "shipyard",
    name: "Shipyard",
    layer: "orbit",
    baseProductionRate: 0,
    resourceType: null,
    baseCost: { metal: 500, crystal: 300, oxygen: 150 },
    baseConstructionTime: 360,
    energyConsumption: 40,
  },
  defense_platform: {
    id: "defense_platform",
    name: "Defense Platform",
    layer: "orbit",
    baseProductionRate: 0,
    resourceType: null,
    baseCost: { metal: 300, crystal: 150, oxygen: 100 },
    baseConstructionTime: 180,
    energyConsumption: 25,
  },
  trade_hub: {
    id: "trade_hub",
    name: "Trade Hub",
    layer: "orbit",
    baseProductionRate: 0,
    resourceType: null,
    baseCost: { metal: 250, crystal: 200, oxygen: 100 },
    baseConstructionTime: 200,
    energyConsumption: 20,
  },
};

export function calculateUpgradeCost(
  buildingType: string,
  level: number
): { metal: number; crystal: number; oxygen: number } {
  const building = BUILDING_DEFINITIONS[buildingType];
  if (!building) {
    return { metal: 0, crystal: 0, oxygen: 0 };
  }
  const multiplier = Math.pow(1.5, level - 1);
  return {
    metal: Math.floor(building.baseCost.metal * multiplier),
    crystal: Math.floor(building.baseCost.crystal * multiplier),
    oxygen: Math.floor(building.baseCost.oxygen * multiplier),
  };
}

export function calculateProductionRate(buildingType: string, level: number): number {
  const building = BUILDING_DEFINITIONS[buildingType];
  if (!building || building.baseProductionRate === 0) return 0;
  return Math.floor(building.baseProductionRate * level * Math.pow(1.1, level - 1));
}

export function calculateConstructionTime(buildingType: string, level: number): number {
  const building = BUILDING_DEFINITIONS[buildingType];
  if (!building) return 60;
  return Math.floor(building.baseConstructionTime * Math.pow(1.2, level - 1));
}

export function calculateEnergyConsumption(buildingType: string, level: number): number {
  const building = BUILDING_DEFINITIONS[buildingType];
  if (!building) return 0;
  return Math.floor(building.energyConsumption * level);
}

export function getBuildingDefinition(buildingType: string): BuildingDefinition | undefined {
  return BUILDING_DEFINITIONS[buildingType];
}

export function getAllBuildingTypes(): string[] {
  return Object.keys(BUILDING_DEFINITIONS);
}

interface ShipDefinition {
  id: string;
  name: string;
  description: string;
  attack: number;
  defense: number;
  speed: number;
  cargo: number;
  baseCost: { metal: number; crystal: number; oxygen: number };
  buildTime: number;
  requiredShipyardLevel: number;
}

const SHIP_DEFINITIONS: Record<string, ShipDefinition> = {
  fighter: {
    id: "fighter",
    name: "Fighter",
    description: "Fast and agile combat craft.",
    attack: 50,
    defense: 20,
    speed: 150,
    cargo: 10,
    baseCost: { metal: 300, crystal: 100, oxygen: 50 },
    buildTime: 120,
    requiredShipyardLevel: 1,
  },
  bomber: {
    id: "bomber",
    name: "Bomber",
    description: "Heavy ordnance delivery craft.",
    attack: 100,
    defense: 30,
    speed: 80,
    cargo: 20,
    baseCost: { metal: 500, crystal: 200, oxygen: 100 },
    buildTime: 180,
    requiredShipyardLevel: 2,
  },
  cruiser: {
    id: "cruiser",
    name: "Cruiser",
    description: "Balanced warship with good firepower and armor.",
    attack: 150,
    defense: 100,
    speed: 100,
    cargo: 50,
    baseCost: { metal: 1000, crystal: 500, oxygen: 250 },
    buildTime: 300,
    requiredShipyardLevel: 3,
  },
  battleship: {
    id: "battleship",
    name: "Battleship",
    description: "Massive capital ship with devastating firepower.",
    attack: 400,
    defense: 300,
    speed: 50,
    cargo: 100,
    baseCost: { metal: 3000, crystal: 1500, oxygen: 750 },
    buildTime: 600,
    requiredShipyardLevel: 5,
  },
  carrier: {
    id: "carrier",
    name: "Carrier",
    description: "Mobile base for fighters and bombers.",
    attack: 50,
    defense: 400,
    speed: 40,
    cargo: 500,
    baseCost: { metal: 4000, crystal: 2000, oxygen: 1000 },
    buildTime: 900,
    requiredShipyardLevel: 6,
  },
  transport: {
    id: "transport",
    name: "Transport",
    description: "Cargo vessel for resource hauling.",
    attack: 5,
    defense: 50,
    speed: 70,
    cargo: 1000,
    baseCost: { metal: 600, crystal: 200, oxygen: 300 },
    buildTime: 150,
    requiredShipyardLevel: 1,
  },
};

export function getShipDefinition(shipType: string): ShipDefinition | undefined {
  return SHIP_DEFINITIONS[shipType];
}

export function getAllShipTypes(): string[] {
  return Object.keys(SHIP_DEFINITIONS);
}

export async function calculateResourceRates(planetId: string): Promise<{
  metalRate: number;
  crystalRate: number;
  oxygenRate: number;
  energyProduction: number;
  energyConsumption: number;
  energyEfficiency: number;
  effectiveMetalRate: number;
  effectiveCrystalRate: number;
  effectiveOxygenRate: number;
}> {
  const buildings = await storage.getBuildings(planetId);
  
  let baseMetalRate = 20;
  let baseCrystalRate = 10;
  let baseOxygenRate = 5;
  let energyProduction = 0;
  let totalEnergyConsumption = 0;

  for (const building of buildings) {
    if (building.isConstructing) continue;
    
    const def = BUILDING_DEFINITIONS[building.buildingType];
    if (!def) continue;

    const production = calculateProductionRate(building.buildingType, building.level);
    const energyConsumption = calculateEnergyConsumption(building.buildingType, building.level);

    switch (def.resourceType) {
      case "metal":
        baseMetalRate += production;
        break;
      case "crystal":
        baseCrystalRate += production;
        break;
      case "oxygen":
        baseOxygenRate += production;
        break;
      case "energy":
        energyProduction += production;
        break;
    }

    totalEnergyConsumption += energyConsumption;
  }

  const energyEfficiency = totalEnergyConsumption > 0 
    ? Math.min(1, energyProduction / totalEnergyConsumption)
    : 1;

  return {
    metalRate: baseMetalRate,
    crystalRate: baseCrystalRate,
    oxygenRate: baseOxygenRate,
    energyProduction,
    energyConsumption: totalEnergyConsumption,
    energyEfficiency,
    effectiveMetalRate: Math.floor(baseMetalRate * energyEfficiency),
    effectiveCrystalRate: Math.floor(baseCrystalRate * energyEfficiency),
    effectiveOxygenRate: Math.floor(baseOxygenRate * energyEfficiency),
  };
}

export async function updatePlanetResources(planetId: string): Promise<Planet> {
  const planet = await storage.getPlanet(planetId);
  if (!planet) {
    throw new Error("Planet not found");
  }

  const now = new Date();
  const lastUpdate = new Date(planet.lastResourceUpdate);
  const hoursPassed = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);

  if (hoursPassed < 0.001) {
    return planet;
  }

  const rates = await calculateResourceRates(planetId);
  
  const newMetal = planet.metal + rates.effectiveMetalRate * hoursPassed;
  const newCrystal = planet.crystal + rates.effectiveCrystalRate * hoursPassed;
  const newOxygen = planet.oxygen + rates.effectiveOxygenRate * hoursPassed;

  return storage.updatePlanetResources(planetId, {
    metal: newMetal,
    crystal: newCrystal,
    oxygen: newOxygen,
    energy: rates.energyProduction,
    energyCapacity: rates.energyConsumption,
    lastResourceUpdate: now,
  });
}

export async function processCompletedConstructions(): Promise<void> {
  const completed = await storage.getCompletedConstructions();
  
  for (const construction of completed) {
    if (construction.buildingId) {
      await storage.updateBuilding(construction.buildingId, {
        level: construction.targetLevel,
        isConstructing: false,
      });
    } else {
      await storage.createBuilding({
        planetId: construction.planetId,
        buildingType: construction.buildingType,
        level: construction.targetLevel,
      });
    }
    
    await storage.removeFromQueue(construction.id);
  }

  const completedShips = await storage.getCompletedShipBuilds();
  
  for (const shipBuild of completedShips) {
    const existingShip = await storage.getShipByType(shipBuild.planetId, shipBuild.shipType);
    
    if (existingShip) {
      await storage.updateShipQuantity(existingShip.id, existingShip.quantity + shipBuild.quantity);
    } else {
      await storage.createShip({
        planetId: shipBuild.planetId,
        shipType: shipBuild.shipType,
        quantity: shipBuild.quantity,
      });
    }
    
    await storage.removeFromShipQueue(shipBuild.id);
  }
}

export async function initializeNewPlayer(userId: string): Promise<{
  planet: Planet;
  buildings: Building[];
}> {
  const planet = await storage.createPlanet({
    userId,
    name: "Home Planet",
  });

  const starterBuildings = [
    { type: "metal_mine", level: 1 },
    { type: "crystal_refinery", level: 1 },
    { type: "energy_plant", level: 1 },
  ];

  const buildings: Building[] = [];
  for (const b of starterBuildings) {
    const building = await storage.createBuilding({
      planetId: planet.id,
      buildingType: b.type,
      level: b.level,
    });
    buildings.push(building);
  }

  return { planet, buildings };
}
