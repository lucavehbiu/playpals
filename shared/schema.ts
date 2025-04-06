import { pgTable, text, serial, integer, boolean, timestamp, jsonb, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

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

// RSVP status types
export const rsvpStatusTypes = ["approved", "denied", "maybe"] as const;

// Team membership roles
export const teamMemberRoles = ["admin", "member", "captain"] as const;

// Users table
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

// Friendship table to manage user relationships
export const friendships = pgTable("friendships", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  friendId: integer("friend_id").notNull().references(() => users.id),
  status: text("status").notNull().default("pending"), // pending, accepted, rejected
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => {
  return {
    // Ensure unique friendships - can't friend someone twice
    uniqueFriendship: unique().on(table.userId, table.friendId),
  };
});

// Teams table
export const teams = pgTable("teams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  sportType: text("sport_type").notNull(),
  description: text("description"),
  logo: text("logo"),
  creatorId: integer("creator_id").notNull().references(() => users.id),
  isPublic: boolean("is_public").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Team members table
export const teamMembers = pgTable("team_members", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("member"),
  position: text("position"),
  stats: jsonb("stats"),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
}, (t) => ({
  // Ensure a user can only be added to a team once
  uniqueMember: unique().on(t.teamId, t.userId),
}));

// Events table without team reference for now
// We'll implement the team reference later with proper migrations
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
  // Removed teamId for now to match existing database schema
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// RSVPs table
export const rsvps = pgTable("rsvps", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  // Prevent duplicate RSVPs
  uniqueRsvp: unique().on(t.eventId, t.userId),
}));

// Define relations
export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, {
    fields: [teamMembers.teamId],
    references: [teams.id],
    relationName: "team_members",
  }),
  user: one(users, {
    fields: [teamMembers.userId],
    references: [users.id],
    relationName: "user_team_memberships",
  }),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  creator: one(users, {
    fields: [teams.creatorId],
    references: [users.id],
    relationName: "user_teams",
  }),
  members: many(teamMembers, { relationName: "team_members" }),
  // Temporarily remove events relation
  // events: many(events, { relationName: "team_events" }),
}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  creator: one(users, {
    fields: [events.creatorId],
    references: [users.id],
    relationName: "user_events",
  }),
  // Temporarily remove team relation until we add the column
  // team: one(teams, {
  //   fields: [events.teamId],
  //   references: [teams.id],
  //   relationName: "team_events",
  // }),
  rsvps: many(rsvps, { relationName: "event_rsvps" }),
}));

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

export const friendshipsRelations = relations(friendships, ({ one }) => ({
  user: one(users, {
    fields: [friendships.userId],
    references: [users.id],
    relationName: "user_sent_friendships",
  }),
  friend: one(users, {
    fields: [friendships.friendId],
    references: [users.id],
    relationName: "user_received_friendships",
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  events: many(events, { relationName: "user_events" }),
  teams: many(teams, { relationName: "user_teams" }),
  teamMemberships: many(teamMembers, { relationName: "user_team_memberships" }),
  rsvps: many(rsvps, { relationName: "user_rsvps" }),
  sentFriendships: many(friendships, { relationName: "user_sent_friendships" }),
  receivedFriendships: many(friendships, { relationName: "user_received_friendships" }),
}));

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertTeamSchema = createInsertSchema(teams).omit({
  id: true,
  createdAt: true,
});

export const insertTeamMemberSchema = createInsertSchema(teamMembers).omit({
  id: true,
  joinedAt: true,
});

export const insertEventSchema = createInsertSchema(events)
  .omit({
    id: true,
    currentParticipants: true,
    createdAt: true,
  })
  // Override type for date field with preprocess
  .extend({
    date: z.preprocess(
      (val) => (typeof val === 'string' ? new Date(val) : val),
      z.date()
    )
  });

export const insertRSVPSchema = createInsertSchema(rsvps).omit({
  id: true,
  createdAt: true,
});

export const insertFriendshipSchema = createInsertSchema(friendships).omit({
  id: true,
  createdAt: true,
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Friendship = typeof friendships.$inferSelect;
export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;

export type Team = typeof teams.$inferSelect;
export type InsertTeam = z.infer<typeof insertTeamSchema>;

export type TeamMember = typeof teamMembers.$inferSelect;
export type InsertTeamMember = z.infer<typeof insertTeamMemberSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type RSVP = typeof rsvps.$inferSelect;
export type InsertRSVP = z.infer<typeof insertRSVPSchema>;

export type SportType = typeof sportTypes[number];
export type RSVPStatus = typeof rsvpStatusTypes[number];
export type TeamMemberRole = typeof teamMemberRoles[number];
