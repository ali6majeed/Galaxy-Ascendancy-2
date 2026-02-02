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

export async function calculateResourceRates(planetId: string): Promise<{
  metalRate: number;
  crystalRate: number;
  oxygenRate: number;
  energyRate: number;
  energyCapacity: number;
  totalEnergyConsumption: number;
}> {
  const buildings = await storage.getBuildings(planetId);
  
  let metalRate = 20;
  let crystalRate = 10;
  let oxygenRate = 5;
  let energyRate = 0;
  let energyCapacity = 100;
  let totalEnergyConsumption = 0;

  for (const building of buildings) {
    if (building.isConstructing) continue;
    
    const def = BUILDING_DEFINITIONS[building.buildingType];
    if (!def) continue;

    const production = calculateProductionRate(building.buildingType, building.level);
    const energyConsumption = calculateEnergyConsumption(building.buildingType, building.level);

    switch (def.resourceType) {
      case "metal":
        metalRate += production;
        break;
      case "crystal":
        crystalRate += production;
        break;
      case "oxygen":
        oxygenRate += production;
        break;
      case "energy":
        energyRate += production;
        energyCapacity += production * 2;
        break;
    }

    totalEnergyConsumption += energyConsumption;
  }

  return {
    metalRate,
    crystalRate,
    oxygenRate,
    energyRate,
    energyCapacity,
    totalEnergyConsumption,
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
  
  const energyAvailable = planet.energy;
  const energyEfficiency = rates.totalEnergyConsumption > 0 
    ? Math.min(1, energyAvailable / rates.totalEnergyConsumption) 
    : 1;

  const newMetal = planet.metal + rates.metalRate * hoursPassed * energyEfficiency;
  const newCrystal = planet.crystal + rates.crystalRate * hoursPassed * energyEfficiency;
  const newOxygen = planet.oxygen + rates.oxygenRate * hoursPassed * energyEfficiency;
  const newEnergy = Math.min(
    rates.energyCapacity,
    planet.energy + (rates.energyRate - rates.totalEnergyConsumption) * hoursPassed
  );

  return storage.updatePlanetResources(planetId, {
    metal: newMetal,
    crystal: newCrystal,
    oxygen: newOxygen,
    energy: Math.max(0, newEnergy),
    energyCapacity: rates.energyCapacity,
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
