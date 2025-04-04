import { pgTable, text, serial, integer, boolean, timestamp, jsonb, primaryKey } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  profileImage: text("profile_image"),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Sport/Activity types
export const sportTypes = [
  "basketball",
  "soccer",
  "tennis",
  "volleyball",
  "cycling",
  "yoga",
  "running",
  "swimming",
  "football",
  "baseball",
  "hiking",
  "golf",
  "other",
] as const;

// Events table
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  sportType: text("sport_type").notNull(),
  date: timestamp("date").notNull(),
  location: text("location").notNull(),
  locationCoordinates: jsonb("location_coordinates"),
  maxParticipants: integer("max_participants").notNull(),
  currentParticipants: integer("current_participants").default(1).notNull(),
  isPublic: boolean("is_public").default(true).notNull(),
  isFree: boolean("is_free").default(true).notNull(),
  cost: integer("cost").default(0),
  creatorId: integer("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  eventImage: text("event_image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Define event relations
export const eventsRelations = relations(events, ({ one, many }) => ({
  creator: one(users, {
    fields: [events.creatorId],
    references: [users.id],
    relationName: "user_events",
  }),
  rsvps: many(rsvps, { relationName: "event_rsvps" }),
}));

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  currentParticipants: true,
  createdAt: true,
});

// RSVP types
export const rsvpStatusTypes = ["approved", "denied", "maybe"] as const;

// RSVPs table
export const rsvps = pgTable("rsvps", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Added a unique constraint to prevent duplicate RSVPs
export const rsvpsRelations = relations(rsvps, ({ one }) => ({
  event: one(events, {
    fields: [rsvps.eventId],
    references: [events.id],
    relationName: "event_rsvps",
  }),
  user: one(users, {
    fields: [rsvps.userId],
    references: [users.id],
    relationName: "user_rsvps",
  }),
}));

export const insertRSVPSchema = createInsertSchema(rsvps).omit({
  id: true,
  createdAt: true,
});

// Define user relations after all tables are defined
export const usersRelations = relations(users, ({ many }) => ({
  events: many(events, { relationName: "user_events" }),
  rsvps: many(rsvps, { relationName: "user_rsvps" }),
}));

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type RSVP = typeof rsvps.$inferSelect;
export type InsertRSVP = z.infer<typeof insertRSVPSchema>;

export type SportType = typeof sportTypes[number];
export type RSVPStatus = typeof rsvpStatusTypes[number];
