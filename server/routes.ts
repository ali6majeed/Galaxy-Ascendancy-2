import type { Express } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";
import {
  calculateResourceRates,
  updatePlanetResources,
  calculateUpgradeCost,
  calculateConstructionTime,
  getBuildingDefinition,
  initializeNewPlayer,
  processCompletedConstructions,
} from "./gameLogic";

const DEMO_USER_ID = "demo-user-id";
let demoInitialized = false;

async function ensureDemoPlayer() {
  if (demoInitialized) return;
  
  let user = await storage.getUserByUsername("demo");
  if (!user) {
    user = await storage.createUser({
      username: "demo",
      password: "demo123",
    });
  }

  let planet = await storage.getPlanetByUserId(user.id);
  if (!planet) {
    await initializeNewPlayer(user.id);
  }
  
  demoInitialized = true;
}

export async function registerRoutes(app: Express): Promise<Server> {
  await processCompletedConstructions();
  
  setInterval(async () => {
    try {
      await processCompletedConstructions();
    } catch (error) {
      console.error("Error processing constructions:", error);
    }
  }, 5000);

  app.get("/api/player/resources", async (req, res) => {
    try {
      await ensureDemoPlayer();
      
      const user = await storage.getUserByUsername("demo");
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const planet = await storage.getPlanetByUserId(user.id);
      if (!planet) {
        return res.status(404).json({ error: "Planet not found" });
      }

      const updatedPlanet = await updatePlanetResources(planet.id);
      const rates = await calculateResourceRates(planet.id);

      res.json({
        metal: Math.floor(updatedPlanet.metal),
        crystal: Math.floor(updatedPlanet.crystal),
        oxygen: Math.floor(updatedPlanet.oxygen),
        energyProduction: rates.energyProduction,
        energyConsumption: rates.energyConsumption,
        energyEfficiency: Math.round(rates.energyEfficiency * 100),
        metalRate: rates.effectiveMetalRate,
        crystalRate: rates.effectiveCrystalRate,
        oxygenRate: rates.effectiveOxygenRate,
        baseMetalRate: rates.metalRate,
        baseCrystalRate: rates.crystalRate,
        baseOxygenRate: rates.oxygenRate,
      });
    } catch (error) {
      console.error("Error fetching resources:", error);
      res.status(500).json({ error: "Failed to fetch resources" });
    }
  });

  app.get("/api/player/buildings", async (req, res) => {
    try {
      await ensureDemoPlayer();
      
      const user = await storage.getUserByUsername("demo");
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const planet = await storage.getPlanetByUserId(user.id);
      if (!planet) {
        return res.status(404).json({ error: "Planet not found" });
      }

      const buildings = await storage.getBuildings(planet.id);
      
      res.json(
        buildings.map((b) => ({
          id: b.id,
          buildingType: b.buildingType,
          level: b.level,
          isConstructing: b.isConstructing,
        }))
      );
    } catch (error) {
      console.error("Error fetching buildings:", error);
      res.status(500).json({ error: "Failed to fetch buildings" });
    }
  });

  app.get("/api/player/construction", async (req, res) => {
    try {
      await ensureDemoPlayer();
      
      const user = await storage.getUserByUsername("demo");
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const planet = await storage.getPlanetByUserId(user.id);
      if (!planet) {
        return res.status(404).json({ error: "Planet not found" });
      }

      const queue = await storage.getConstructionQueue(planet.id);
      
      res.json(
        queue.map((item) => {
          const def = getBuildingDefinition(item.buildingType);
          return {
            id: item.id,
            buildingType: item.buildingType,
            buildingName: def?.name || item.buildingType,
            targetLevel: item.targetLevel,
            completesAt: new Date(item.completesAt).getTime(),
          };
        })
      );
    } catch (error) {
      console.error("Error fetching construction queue:", error);
      res.status(500).json({ error: "Failed to fetch construction queue" });
    }
  });

  app.post("/api/buildings/upgrade", async (req, res) => {
    try {
      await ensureDemoPlayer();
      
      const { buildingType } = req.body;
      if (!buildingType) {
        return res.status(400).json({ error: "Building type required" });
      }

      const def = getBuildingDefinition(buildingType);
      if (!def) {
        return res.status(400).json({ error: "Invalid building type" });
      }

      const user = await storage.getUserByUsername("demo");
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const planet = await storage.getPlanetByUserId(user.id);
      if (!planet) {
        return res.status(404).json({ error: "Planet not found" });
      }

      await updatePlanetResources(planet.id);
      const updatedPlanet = await storage.getPlanet(planet.id);
      if (!updatedPlanet) {
        return res.status(404).json({ error: "Planet not found" });
      }

      let existingBuilding = await storage.getBuildingByType(planet.id, buildingType);
      const currentLevel = existingBuilding?.level || 0;
      const targetLevel = currentLevel + 1;

      const cost = calculateUpgradeCost(buildingType, targetLevel);
      
      if (
        updatedPlanet.metal < cost.metal ||
        updatedPlanet.crystal < cost.crystal ||
        updatedPlanet.oxygen < cost.oxygen
      ) {
        return res.status(400).json({ error: "Insufficient resources" });
      }

      await storage.updatePlanetResources(planet.id, {
        metal: updatedPlanet.metal - cost.metal,
        crystal: updatedPlanet.crystal - cost.crystal,
        oxygen: updatedPlanet.oxygen - cost.oxygen,
      });

      const constructionTime = calculateConstructionTime(buildingType, targetLevel);
      const completesAt = new Date(Date.now() + constructionTime * 1000);

      const queue = await storage.getConstructionQueue(planet.id);
      const position = queue.length;

      if (!existingBuilding) {
        existingBuilding = await storage.createBuilding({
          planetId: planet.id,
          buildingType,
          level: 0,
        });
      }

      await storage.updateBuilding(existingBuilding.id, { isConstructing: true });

      const queueItem = await storage.addToConstructionQueue({
        planetId: planet.id,
        buildingId: existingBuilding.id,
        buildingType,
        targetLevel,
        completesAt,
        position,
      });

      res.json({
        success: true,
        queueItem: {
          id: queueItem.id,
          buildingType,
          buildingName: def.name,
          targetLevel,
          completesAt: completesAt.getTime(),
        },
      });
    } catch (error) {
      console.error("Error upgrading building:", error);
      res.status(500).json({ error: "Failed to upgrade building" });
    }
  });

  app.get("/api/buildings/available", async (req, res) => {
    try {
      await ensureDemoPlayer();
      
      const user = await storage.getUserByUsername("demo");
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const planet = await storage.getPlanetByUserId(user.id);
      if (!planet) {
        return res.status(404).json({ error: "Planet not found" });
      }

      const existingBuildings = await storage.getBuildings(planet.id);
      const existingTypes = new Set(existingBuildings.map((b) => b.buildingType));

      const allTypes = [
        "metal_mine",
        "crystal_refinery",
        "oxygen_processor",
        "energy_plant",
        "fleet_dock",
        "research_lab",
      ];

      const available = allTypes.filter((type) => !existingTypes.has(type));

      res.json(
        available.map((type) => {
          const def = getBuildingDefinition(type);
          const cost = calculateUpgradeCost(type, 1);
          return {
            buildingType: type,
            name: def?.name || type,
            description: "",
            layer: def?.layer || "surface",
            cost,
          };
        })
      );
    } catch (error) {
      console.error("Error fetching available buildings:", error);
      res.status(500).json({ error: "Failed to fetch available buildings" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
