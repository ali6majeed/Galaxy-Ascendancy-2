import { sql, relations } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  timestamp,
  boolean,
  real,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const planets = pgTable("planets", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),
  name: text("name").notNull().default("Home Planet"),
  metal: real("metal").notNull().default(500),
  crystal: real("crystal").notNull().default(300),
  oxygen: real("oxygen").notNull().default(200),
  energy: real("energy").notNull().default(0),
  energyCapacity: real("energy_capacity").notNull().default(100),
  lastResourceUpdate: timestamp("last_resource_update").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const buildings = pgTable("buildings", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  planetId: varchar("planet_id")
    .references(() => planets.id)
    .notNull(),
  buildingType: text("building_type").notNull(),
  slotIndex: integer("slot_index").notNull().default(0),
  level: integer("level").notNull().default(1),
  isConstructing: boolean("is_constructing").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const constructionQueue = pgTable("construction_queue", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  planetId: varchar("planet_id")
    .references(() => planets.id)
    .notNull(),
  buildingId: varchar("building_id")
    .references(() => buildings.id),
  buildingType: text("building_type").notNull(),
  targetLevel: integer("target_level").notNull(),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  completesAt: timestamp("completes_at").notNull(),
  position: integer("position").notNull().default(0),
});

export const usersRelations = relations(users, ({ many }) => ({
  planets: many(planets),
}));

export const planetsRelations = relations(planets, ({ one, many }) => ({
  user: one(users, {
    fields: [planets.userId],
    references: [users.id],
  }),
  buildings: many(buildings),
  constructionQueue: many(constructionQueue),
}));

export const buildingsRelations = relations(buildings, ({ one }) => ({
  planet: one(planets, {
    fields: [buildings.planetId],
    references: [planets.id],
  }),
}));

export const constructionQueueRelations = relations(constructionQueue, ({ one }) => ({
  planet: one(planets, {
    fields: [constructionQueue.planetId],
    references: [planets.id],
  }),
  building: one(buildings, {
    fields: [constructionQueue.buildingId],
    references: [buildings.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertPlanetSchema = createInsertSchema(planets).pick({
  userId: true,
  name: true,
});

export const insertBuildingSchema = createInsertSchema(buildings).pick({
  planetId: true,
  buildingType: true,
  slotIndex: true,
  level: true,
});

export const insertConstructionSchema = createInsertSchema(constructionQueue).pick({
  planetId: true,
  buildingId: true,
  buildingType: true,
  targetLevel: true,
  completesAt: true,
  position: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertPlanet = z.infer<typeof insertPlanetSchema>;
export type Planet = typeof planets.$inferSelect;
export type InsertBuilding = z.infer<typeof insertBuildingSchema>;
export type Building = typeof buildings.$inferSelect;
export type InsertConstruction = z.infer<typeof insertConstructionSchema>;
export type Construction = typeof constructionQueue.$inferSelect;
