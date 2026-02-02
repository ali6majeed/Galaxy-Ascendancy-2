import {
  users,
  planets,
  buildings,
  constructionQueue,
  type User,
  type InsertUser,
  type Planet,
  type InsertPlanet,
  type Building,
  type InsertBuilding,
  type Construction,
  type InsertConstruction,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, asc, lte } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getPlanet(id: string): Promise<Planet | undefined>;
  getPlanetByUserId(userId: string): Promise<Planet | undefined>;
  createPlanet(planet: InsertPlanet): Promise<Planet>;
  updatePlanetResources(planetId: string, resources: Partial<Planet>): Promise<Planet>;
  
  getBuildings(planetId: string): Promise<Building[]>;
  getBuilding(id: string): Promise<Building | undefined>;
  getBuildingByType(planetId: string, buildingType: string): Promise<Building | undefined>;
  createBuilding(building: InsertBuilding): Promise<Building>;
  updateBuilding(id: string, updates: Partial<Building>): Promise<Building>;
  
  getConstructionQueue(planetId: string): Promise<Construction[]>;
  getCompletedConstructions(): Promise<Construction[]>;
  addToConstructionQueue(construction: InsertConstruction): Promise<Construction>;
  removeFromQueue(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getPlanet(id: string): Promise<Planet | undefined> {
    const [planet] = await db.select().from(planets).where(eq(planets.id, id));
    return planet || undefined;
  }

  async getPlanetByUserId(userId: string): Promise<Planet | undefined> {
    const [planet] = await db.select().from(planets).where(eq(planets.userId, userId));
    return planet || undefined;
  }

  async createPlanet(insertPlanet: InsertPlanet): Promise<Planet> {
    const [planet] = await db.insert(planets).values(insertPlanet).returning();
    return planet;
  }

  async updatePlanetResources(planetId: string, resources: Partial<Planet>): Promise<Planet> {
    const [planet] = await db
      .update(planets)
      .set(resources)
      .where(eq(planets.id, planetId))
      .returning();
    return planet;
  }

  async getBuildings(planetId: string): Promise<Building[]> {
    return db.select().from(buildings).where(eq(buildings.planetId, planetId));
  }

  async getBuilding(id: string): Promise<Building | undefined> {
    const [building] = await db.select().from(buildings).where(eq(buildings.id, id));
    return building || undefined;
  }

  async getBuildingByType(planetId: string, buildingType: string): Promise<Building | undefined> {
    const [building] = await db
      .select()
      .from(buildings)
      .where(and(eq(buildings.planetId, planetId), eq(buildings.buildingType, buildingType)));
    return building || undefined;
  }

  async createBuilding(insertBuilding: InsertBuilding): Promise<Building> {
    const [building] = await db.insert(buildings).values(insertBuilding).returning();
    return building;
  }

  async updateBuilding(id: string, updates: Partial<Building>): Promise<Building> {
    const [building] = await db
      .update(buildings)
      .set(updates)
      .where(eq(buildings.id, id))
      .returning();
    return building;
  }

  async getConstructionQueue(planetId: string): Promise<Construction[]> {
    return db
      .select()
      .from(constructionQueue)
      .where(eq(constructionQueue.planetId, planetId))
      .orderBy(asc(constructionQueue.position));
  }

  async getCompletedConstructions(): Promise<Construction[]> {
    return db
      .select()
      .from(constructionQueue)
      .where(lte(constructionQueue.completesAt, new Date()));
  }

  async addToConstructionQueue(construction: InsertConstruction): Promise<Construction> {
    const [item] = await db.insert(constructionQueue).values(construction).returning();
    return item;
  }

  async removeFromQueue(id: string): Promise<void> {
    await db.delete(constructionQueue).where(eq(constructionQueue.id, id));
  }
}

export const storage = new DatabaseStorage();
