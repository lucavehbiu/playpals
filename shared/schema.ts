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

// Team schedule response types
export const scheduleResponseTypes = ["attending", "not_attending", "maybe"] as const;

// Skill levels for sports
export const skillLevels = ["beginner", "intermediate", "advanced", "expert"] as const;

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  profileImage: text("profile_image"),
  coverImage: text("cover_image"),
  bio: text("bio"),
  headline: text("headline"),
  location: text("location"),
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

// User Sport Preferences table
export const userSportPreferences = pgTable("user_sport_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sportType: text("sport_type").notNull(),
  skillLevel: text("skill_level").notNull(),
  yearsExperience: integer("years_experience").default(0),
  isVisible: boolean("is_visible").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  // Ensure a user can only have one preference entry per sport
  uniqueSportPreference: unique().on(t.userId, t.sportType),
}));

// Player Ratings table
export const playerRatings = pgTable("player_ratings", {
  id: serial("id").primaryKey(),
  ratedUserId: integer("rated_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  raterUserId: integer("rater_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  eventId: integer("event_id").references(() => events.id, { onDelete: "cascade" }),
  sportType: text("sport_type").notNull(),
  rating: integer("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  // Ensure a user can only rate another user once per event
  uniqueEventRating: unique().on(t.ratedUserId, t.raterUserId, t.eventId),
}));

// Team Posts table
export const teamPosts = pgTable("team_posts", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  attachments: jsonb("attachments"),
  likes: integer("likes").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Team Post Comments table
export const teamPostComments = pgTable("team_post_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => teamPosts.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  likes: integer("likes").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Team Schedule Events table
export const teamSchedules = pgTable("team_schedules", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  creatorId: integer("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time").notNull(),
  isRequired: boolean("is_required").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Team Schedule Responses table
export const teamScheduleResponses = pgTable("team_schedule_responses", {
  id: serial("id").primaryKey(),
  scheduleId: integer("schedule_id").notNull().references(() => teamSchedules.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  response: text("response").notNull(), // "attending", "not_attending", "maybe"
  notes: text("notes"),
  maybeDeadline: timestamp("maybe_deadline"), // Only for "maybe" responses
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  // Ensure a user can only respond once per schedule event
  uniqueScheduleResponse: unique().on(t.scheduleId, t.userId),
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
  posts: many(teamPosts, { relationName: "team_posts" }),
  schedules: many(teamSchedules, { relationName: "team_schedules" }),
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
  teamPosts: many(teamPosts, { relationName: "user_team_posts" }),
  teamPostComments: many(teamPostComments, { relationName: "user_team_post_comments" }),
  teamSchedules: many(teamSchedules, { relationName: "user_team_schedules" }),
  teamScheduleResponses: many(teamScheduleResponses, { relationName: "user_team_schedule_responses" }),
  rsvps: many(rsvps, { relationName: "user_rsvps" }),
  sentFriendships: many(friendships, { relationName: "user_sent_friendships" }),
  receivedFriendships: many(friendships, { relationName: "user_received_friendships" }),
  sportPreferences: many(userSportPreferences, { relationName: "user_sport_preferences" }),
  givenRatings: many(playerRatings, { relationName: "ratings_given" }),
  receivedRatings: many(playerRatings, { relationName: "ratings_received" }),
}));

export const userSportPreferencesRelations = relations(userSportPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userSportPreferences.userId],
    references: [users.id],
    relationName: "user_sport_preferences",
  }),
}));

export const playerRatingsRelations = relations(playerRatings, ({ one }) => ({
  ratedUser: one(users, {
    fields: [playerRatings.ratedUserId],
    references: [users.id],
    relationName: "ratings_received",
  }),
  rater: one(users, {
    fields: [playerRatings.raterUserId],
    references: [users.id],
    relationName: "ratings_given",
  }),
  event: one(events, {
    fields: [playerRatings.eventId],
    references: [events.id],
    relationName: "event_ratings",
  }),
}));

// Team Posts relations
export const teamPostsRelations = relations(teamPosts, ({ one, many }) => ({
  team: one(teams, {
    fields: [teamPosts.teamId],
    references: [teams.id],
    relationName: "team_posts",
  }),
  user: one(users, {
    fields: [teamPosts.userId],
    references: [users.id],
    relationName: "user_team_posts",
  }),
  comments: many(teamPostComments, { relationName: "post_comments" }),
}));

// Team Post Comments relations
export const teamPostCommentsRelations = relations(teamPostComments, ({ one }) => ({
  post: one(teamPosts, {
    fields: [teamPostComments.postId],
    references: [teamPosts.id],
    relationName: "post_comments",
  }),
  user: one(users, {
    fields: [teamPostComments.userId],
    references: [users.id],
    relationName: "user_team_post_comments",
  }),
}));

// Team Schedules relations
export const teamSchedulesRelations = relations(teamSchedules, ({ one, many }) => ({
  team: one(teams, {
    fields: [teamSchedules.teamId],
    references: [teams.id],
    relationName: "team_schedules",
  }),
  creator: one(users, {
    fields: [teamSchedules.creatorId],
    references: [users.id],
    relationName: "user_team_schedules",
  }),
  responses: many(teamScheduleResponses, { relationName: "schedule_responses" }),
}));

// Team Schedule Responses relations
export const teamScheduleResponsesRelations = relations(teamScheduleResponses, ({ one }) => ({
  schedule: one(teamSchedules, {
    fields: [teamScheduleResponses.scheduleId],
    references: [teamSchedules.id],
    relationName: "schedule_responses",
  }),
  user: one(users, {
    fields: [teamScheduleResponses.userId],
    references: [users.id],
    relationName: "user_team_schedule_responses",
  }),
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

export const insertUserSportPreferenceSchema = createInsertSchema(userSportPreferences).omit({
  id: true,
  createdAt: true,
});

export const insertPlayerRatingSchema = createInsertSchema(playerRatings).omit({
  id: true,
  createdAt: true,
});

export const insertTeamPostSchema = createInsertSchema(teamPosts).omit({
  id: true,
  createdAt: true,
  likes: true,
});

export const insertTeamPostCommentSchema = createInsertSchema(teamPostComments).omit({
  id: true,
  createdAt: true,
  likes: true,
});

export const insertTeamScheduleSchema = createInsertSchema(teamSchedules).omit({
  id: true,
  createdAt: true,
}).extend({
  startTime: z.preprocess(
    (val) => (typeof val === 'string' ? new Date(val) : val),
    z.date()
  ),
  endTime: z.preprocess(
    (val) => (typeof val === 'string' ? new Date(val) : val),
    z.date()
  ),
  isRequired: z.boolean().optional().default(false),
});

export const insertTeamScheduleResponseSchema = createInsertSchema(teamScheduleResponses).omit({
  id: true,
  createdAt: true,
}).extend({
  maybeDeadline: z.preprocess(
    (val) => (typeof val === 'string' ? new Date(val) : val),
    z.date().optional()
  ),
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

export type TeamPost = typeof teamPosts.$inferSelect;
export type InsertTeamPost = z.infer<typeof insertTeamPostSchema>;

export type TeamPostComment = typeof teamPostComments.$inferSelect;
export type InsertTeamPostComment = z.infer<typeof insertTeamPostCommentSchema>;

export type TeamSchedule = typeof teamSchedules.$inferSelect;
export type InsertTeamSchedule = z.infer<typeof insertTeamScheduleSchema>;

export type TeamScheduleResponse = typeof teamScheduleResponses.$inferSelect;
export type InsertTeamScheduleResponse = z.infer<typeof insertTeamScheduleResponseSchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type RSVP = typeof rsvps.$inferSelect;
export type InsertRSVP = z.infer<typeof insertRSVPSchema>;

export type UserSportPreference = typeof userSportPreferences.$inferSelect;
export type InsertUserSportPreference = z.infer<typeof insertUserSportPreferenceSchema>;

export type PlayerRating = typeof playerRatings.$inferSelect;
export type InsertPlayerRating = z.infer<typeof insertPlayerRatingSchema>;

export type SportType = typeof sportTypes[number];
export type RSVPStatus = typeof rsvpStatusTypes[number];
export type TeamMemberRole = typeof teamMemberRoles[number];
export type ScheduleResponseType = typeof scheduleResponseTypes[number];
export type SkillLevel = typeof skillLevels[number];
