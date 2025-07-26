import { pgTable, text, serial, integer, boolean, timestamp, jsonb, unique, varchar } from "drizzle-orm/pg-core";
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

// Activity frequency types
export const activityFrequencies = ["rarely", "occasionally", "regularly", "frequently"] as const;

// Sport experience levels (times per week)
export const sportExperienceLevels = [
  "never", // Never played
  "beginner", // 1-2 times per week
  "intermediate", // 3-4 times per week  
  "advanced", // 5-6 times per week
  "expert" // Daily (7+ times per week)
] as const;

// Team size preferences
export const teamSizePreferences = ["small", "medium", "large", "any"] as const;

// Team status options
export const teamStatusOptions = ["solo", "has_team", "looking_for_team"] as const;

// Sports group member roles
export const sportsGroupRoles = ["admin", "member"] as const;

// Poll response types
export const pollResponseTypes = ["available", "unavailable", "maybe"] as const;

// Skill matcher preferences
export const skillMatchModes = ["exact", "similar", "range", "any"] as const;

// Distance preferences for skill matching
export const distancePreferences = ["nearby", "city", "region", "anywhere"] as const;

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
  phoneNumber: text("phone_number"), // Hidden from other users, for verification only
  isPhoneVerified: boolean("is_phone_verified").default(false),
  hasNoProfessionalExperience: boolean("has_no_professional_experience").default(false),
  profileCompletionLevel: integer("profile_completion_level").default(0), // 0-100%
  // Privacy settings
  emailPrivacy: text("email_privacy").default("private"), // "public" or "private"
  phonePrivacy: text("phone_privacy").default("private"), // "public" or "private"
  locationPrivacy: text("location_privacy").default("public"), // "public" or "private"
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
  locationLatitude: text("location_latitude"), // Latitude for Google Maps
  locationLongitude: text("location_longitude"), // Longitude for Google Maps
  locationPlaceId: text("location_place_id"), // Google Places ID
  maxParticipants: integer("max_participants").notNull(),
  currentParticipants: integer("current_participants").default(1).notNull(),
  isPublic: boolean("is_public").default(true).notNull(),
  isFree: boolean("is_free").default(true).notNull(),
  cost: integer("cost").default(0),
  creatorId: integer("creator_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  eventImage: text("event_image"),
  // Public visibility settings for group events
  publicVisibility: text("public_visibility"), // null (private), "all" (public to all), "friends" (public to friends)
  // Removed teamId for now to match existing database schema
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// RSVPs table
export const rsvps = pgTable("rsvps", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status", { enum: ["approved", "denied", "maybe", "pending"] }).notNull(),
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
  experienceLevel: text("experience_level").notNull(), // How often they play per week
  yearsExperience: integer("years_experience").default(0),
  isVisible: boolean("is_visible").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  // Ensure a user can only have one preference entry per sport
  uniqueSportPreference: unique().on(t.userId, t.sportType),
}));

// User Onboarding Preferences table
export const userOnboardingPreferences = pgTable("user_onboarding_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  preferredSports: text("preferred_sports").array().notNull(), // Array of sport types
  playFrequency: text("play_frequency").notNull(), // How often they play
  teamSizePreference: text("team_size_preference").notNull(), // Size of teams they prefer
  teamStatus: text("team_status").notNull(), // Whether they have a team already or not
  additionalInfo: text("additional_info"), // Any other information they provide
  onboardingCompleted: boolean("onboarding_completed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  // Ensure a user can only have one onboarding preferences entry
  uniqueUserOnboarding: unique().on(t.userId),
}));

// Professional Team History table
export const professionalTeamHistory = pgTable("professional_team_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  teamName: text("team_name").notNull(),
  sportType: text("sport_type").notNull(),
  teamType: text("team_type").notNull(), // "professional", "youth", "college", "amateur"
  position: text("position"),
  yearFrom: integer("year_from"),
  yearTo: integer("year_to"),
  isCurrentTeam: boolean("is_current_team").default(false),
  achievements: text("achievements"), // Any notable achievements or titles
  isVisible: boolean("is_visible").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Sport Skill Levels table (detailed breakdown for each sport)
export const sportSkillLevels = pgTable("sport_skill_levels", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sportType: text("sport_type").notNull(),
  experienceLevel: text("experience_level").notNull(), // never, beginner, intermediate, advanced, expert
  timesPerWeek: integer("times_per_week").default(0), // How many times per week they play
  yearsPlaying: integer("years_playing").default(0),
  competitiveLevel: text("competitive_level"), // "recreational", "competitive", "professional"
  preferredPosition: text("preferred_position"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  // Ensure a user can only have one skill level entry per sport
  uniqueUserSportSkill: unique().on(t.userId, t.sportType),
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

// Skill Matcher Preferences table
export const skillMatcherPreferences = pgTable("skill_matcher_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sportType: text("sport_type").notNull(),
  skillMatchMode: text("skill_match_mode", { enum: skillMatchModes }).default("similar").notNull(),
  preferredSkillLevels: text("preferred_skill_levels").array().notNull(), // Array of skill levels they want to match with
  maxDistance: integer("max_distance").default(25), // Distance in miles/km
  distancePreference: text("distance_preference", { enum: distancePreferences }).default("city").notNull(),
  ageRangeMin: integer("age_range_min").default(18),
  ageRangeMax: integer("age_range_max").default(65),
  genderPreference: text("gender_preference"), // 'male', 'female', 'any'
  availabilityDays: text("availability_days").array().notNull(), // Array of days like ['monday', 'tuesday']
  availabilityTimes: text("availability_times").array().notNull(), // Array of time slots like ['morning', 'evening']
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => ({
  // Ensure a user can only have one matcher preference per sport
  uniqueMatcherPreference: unique().on(t.userId, t.sportType),
}));

// Skill Matches table to store generated matches
export const skillMatches = pgTable("skill_matches", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  matchedUserId: integer("matched_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sportType: text("sport_type").notNull(),
  compatibilityScore: integer("compatibility_score").notNull(), // 0-100 score
  skillLevelDifference: integer("skill_level_difference").notNull(), // Absolute difference in skill levels
  distance: integer("distance"), // Distance between users in miles/km
  matchReason: text("match_reason").notNull(), // Explanation of why they were matched
  isViewed: boolean("is_viewed").default(false).notNull(),
  isLiked: boolean("is_liked").default(false).notNull(),
  isMutualMatch: boolean("is_mutual_match").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  // Prevent duplicate matches
  uniqueMatch: unique().on(t.userId, t.matchedUserId, t.sportType),
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

// Team Join Requests table
export const teamJoinRequests = pgTable("team_join_requests", {
  id: serial("id").primaryKey(),
  teamId: integer("team_id").notNull().references(() => teams.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"), // pending, accepted, rejected
  viewed: boolean("viewed").default(false).notNull(), // For notification purposes
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  // Ensure a user can only have one active request per team
  uniqueJoinRequest: unique().on(t.teamId, t.userId),
}));

// Sports Groups table
export const sportsGroups = pgTable("sports_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  sportType: text("sport_type").notNull(),
  adminId: integer("admin_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  maxMembers: integer("max_members").default(20),
  isPrivate: boolean("is_private").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Sports Group Members table
export const sportsGroupMembers = pgTable("sports_group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => sportsGroups.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull().default("member"), // "admin", "member"
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
}, (t) => ({
  groupUserUnique: unique().on(t.groupId, t.userId),
}));

// Sports Group Chat Messages table
export const sportsGroupMessages: any = pgTable("sports_group_messages", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => sportsGroups.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  parentMessageId: integer("parent_message_id").references(() => sportsGroupMessages.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Sports Group Events table
export const sportsGroupEvents = pgTable("sports_group_events", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => sportsGroups.id, { onDelete: "cascade" }),
  eventId: integer("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  groupEventUnique: unique().on(t.groupId, t.eventId),
}));

// Sports Group Polls table
export const sportsGroupPolls = pgTable("sports_group_polls", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => sportsGroups.id, { onDelete: "cascade" }),
  createdBy: integer("created_by").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  minMembers: integer("min_members").default(2),
  duration: integer("duration").default(60), // in minutes
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Sports Group Poll Time Slots table
export const sportsGroupPollTimeSlots = pgTable("sports_group_poll_time_slots", {
  id: serial("id").primaryKey(),
  pollId: integer("poll_id").notNull().references(() => sportsGroupPolls.id, { onDelete: "cascade" }),
  dayOfWeek: integer("day_of_week").notNull(), // 0 = Sunday, 1 = Monday, etc.
  startTime: text("start_time").notNull(), // "09:00"
  endTime: text("end_time").notNull(), // "11:00"
  usedForEventId: integer("used_for_event_id").references(() => events.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Sports Group Poll Responses table
export const sportsGroupPollResponses = pgTable("sports_group_poll_responses", {
  id: serial("id").primaryKey(),
  pollId: integer("poll_id").notNull().references(() => sportsGroupPolls.id, { onDelete: "cascade" }),
  timeSlotId: integer("time_slot_id").notNull().references(() => sportsGroupPollTimeSlots.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  isAvailable: boolean("is_available").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  pollUserTimeSlotUnique: unique().on(t.pollId, t.timeSlotId, t.userId),
}));

// Sports Group Join Requests table
export const sportsGroupJoinRequests = pgTable("sports_group_join_requests", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => sportsGroups.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("pending"), // "pending", "accepted", "rejected"
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  groupUserUnique: unique().on(t.groupId, t.userId),
}));

// Sports Group Notifications table
export const sportsGroupNotifications = pgTable("sports_group_notifications", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull().references(() => sportsGroups.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'event', 'message', 'poll'
  title: text("title").notNull(),
  message: text("message"),
  referenceId: integer("reference_id"), // ID of the event/message/poll that triggered the notification
  viewed: boolean("viewed").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => ({
  groupUserTypeRefUnique: unique().on(t.groupId, t.userId, t.type, t.referenceId),
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
  joinRequests: many(teamJoinRequests, { relationName: "team_join_requests" }),
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
  onboardingPreferences: many(userOnboardingPreferences, { relationName: "user_onboarding_preferences" }),
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

// User Onboarding Preferences relations
export const userOnboardingPreferencesRelations = relations(userOnboardingPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userOnboardingPreferences.userId],
    references: [users.id],
    relationName: "user_onboarding_preferences",
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

// Skill Matcher Preferences relations
export const skillMatcherPreferencesRelations = relations(skillMatcherPreferences, ({ one }) => ({
  user: one(users, {
    fields: [skillMatcherPreferences.userId],
    references: [users.id],
    relationName: "skill_matcher_preferences",
  }),
}));

// Skill Matches relations
export const skillMatchesRelations = relations(skillMatches, ({ one }) => ({
  user: one(users, {
    fields: [skillMatches.userId],
    references: [users.id],
    relationName: "user_skill_matches",
  }),
  matchedUser: one(users, {
    fields: [skillMatches.matchedUserId],
    references: [users.id],
    relationName: "matched_user_skill_matches",
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

// Sports Groups relations
export const sportsGroupsRelations = relations(sportsGroups, ({ one, many }) => ({
  admin: one(users, {
    fields: [sportsGroups.adminId],
    references: [users.id],
    relationName: "sports_group_admin",
  }),
  members: many(sportsGroupMembers, { relationName: "sports_group_members" }),
  messages: many(sportsGroupMessages, { relationName: "sports_group_messages" }),
  events: many(sportsGroupEvents, { relationName: "sports_group_events" }),
  polls: many(sportsGroupPolls, { relationName: "sports_group_polls" }),
  joinRequests: many(sportsGroupJoinRequests, { relationName: "sports_group_join_requests" }),
  notifications: many(sportsGroupNotifications, { relationName: "sports_group_notifications" }),
}));

export const sportsGroupMembersRelations = relations(sportsGroupMembers, ({ one }) => ({
  group: one(sportsGroups, {
    fields: [sportsGroupMembers.groupId],
    references: [sportsGroups.id],
    relationName: "sports_group_members",
  }),
  user: one(users, {
    fields: [sportsGroupMembers.userId],
    references: [users.id],
    relationName: "user_sports_group_memberships",
  }),
}));

export const sportsGroupMessagesRelations = relations(sportsGroupMessages, ({ one }) => ({
  group: one(sportsGroups, {
    fields: [sportsGroupMessages.groupId],
    references: [sportsGroups.id],
    relationName: "sports_group_messages",
  }),
  user: one(users, {
    fields: [sportsGroupMessages.userId],
    references: [users.id],
    relationName: "user_sports_group_messages",
  }),
}));

export const sportsGroupEventsRelations = relations(sportsGroupEvents, ({ one }) => ({
  group: one(sportsGroups, {
    fields: [sportsGroupEvents.groupId],
    references: [sportsGroups.id],
    relationName: "sports_group_events",
  }),
  event: one(events, {
    fields: [sportsGroupEvents.eventId],
    references: [events.id],
    relationName: "sports_group_event_link",
  }),
}));

export const sportsGroupPollsRelations = relations(sportsGroupPolls, ({ one, many }) => ({
  group: one(sportsGroups, {
    fields: [sportsGroupPolls.groupId],
    references: [sportsGroups.id],
    relationName: "sports_group_polls",
  }),
  creator: one(users, {
    fields: [sportsGroupPolls.createdBy],
    references: [users.id],
    relationName: "user_sports_group_polls",
  }),
  timeSlots: many(sportsGroupPollTimeSlots, { relationName: "poll_time_slots" }),
  responses: many(sportsGroupPollResponses, { relationName: "poll_responses" }),
}));

export const sportsGroupPollTimeSlotsRelations = relations(sportsGroupPollTimeSlots, ({ one, many }) => ({
  poll: one(sportsGroupPolls, {
    fields: [sportsGroupPollTimeSlots.pollId],
    references: [sportsGroupPolls.id],
    relationName: "poll_time_slots",
  }),
  responses: many(sportsGroupPollResponses, { relationName: "time_slot_responses" }),
}));

export const sportsGroupPollResponsesRelations = relations(sportsGroupPollResponses, ({ one }) => ({
  poll: one(sportsGroupPolls, {
    fields: [sportsGroupPollResponses.pollId],
    references: [sportsGroupPolls.id],
    relationName: "poll_responses",
  }),
  timeSlot: one(sportsGroupPollTimeSlots, {
    fields: [sportsGroupPollResponses.timeSlotId],
    references: [sportsGroupPollTimeSlots.id],
    relationName: "time_slot_responses",
  }),
  user: one(users, {
    fields: [sportsGroupPollResponses.userId],
    references: [users.id],
    relationName: "user_poll_responses",
  }),
}));

export const sportsGroupJoinRequestsRelations = relations(sportsGroupJoinRequests, ({ one }) => ({
  group: one(sportsGroups, {
    fields: [sportsGroupJoinRequests.groupId],
    references: [sportsGroups.id],
    relationName: "sports_group_join_requests",
  }),
  user: one(users, {
    fields: [sportsGroupJoinRequests.userId],
    references: [users.id],
    relationName: "user_sports_group_join_requests",
  }),
}));

export const sportsGroupNotificationsRelations = relations(sportsGroupNotifications, ({ one }) => ({
  group: one(sportsGroups, {
    fields: [sportsGroupNotifications.groupId],
    references: [sportsGroups.id],
    relationName: "sports_group_notifications",
  }),
  user: one(users, {
    fields: [sportsGroupNotifications.userId],
    references: [users.id],
    relationName: "user_sports_group_notifications",
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

export const insertUserOnboardingPreferenceSchema = createInsertSchema(userOnboardingPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  onboardingCompleted: true,
});

export const insertPlayerRatingSchema = createInsertSchema(playerRatings).omit({
  id: true,
  createdAt: true,
});

export const insertSkillMatcherPreferenceSchema = createInsertSchema(skillMatcherPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSkillMatchSchema = createInsertSchema(skillMatches).omit({
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

export const insertTeamJoinRequestSchema = createInsertSchema(teamJoinRequests).omit({
  id: true,
  createdAt: true,
});

// Sports Groups insert schemas
export const insertSportsGroupSchema = createInsertSchema(sportsGroups).omit({
  id: true,
  createdAt: true,
});

export const insertSportsGroupMemberSchema = createInsertSchema(sportsGroupMembers).omit({
  id: true,
  joinedAt: true,
});

export const insertSportsGroupMessageSchema = createInsertSchema(sportsGroupMessages).omit({
  id: true,
  createdAt: true,
});

export const insertSportsGroupEventSchema = createInsertSchema(sportsGroupEvents).omit({
  id: true,
  createdAt: true,
});

export const insertSportsGroupPollSchema = createInsertSchema(sportsGroupPolls).omit({
  id: true,
  createdAt: true,
}).extend({
  endDate: z.preprocess(
    (val) => (typeof val === 'string' ? new Date(val) : val),
    z.date()
  ),
});

export const insertSportsGroupPollTimeSlotSchema = createInsertSchema(sportsGroupPollTimeSlots).omit({
  id: true,
  createdAt: true,
});

export const insertSportsGroupPollResponseSchema = createInsertSchema(sportsGroupPollResponses).omit({
  id: true,
  createdAt: true,
});

export const insertSportsGroupJoinRequestSchema = createInsertSchema(sportsGroupJoinRequests).omit({
  id: true,
  createdAt: true,
});

// New schemas for profile completion features
export const insertProfessionalTeamHistorySchema = createInsertSchema(professionalTeamHistory).omit({
  id: true,
  createdAt: true,
});

export const insertSportSkillLevelSchema = createInsertSchema(sportSkillLevels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

export type TeamJoinRequest = typeof teamJoinRequests.$inferSelect;
export type InsertTeamJoinRequest = z.infer<typeof insertTeamJoinRequestSchema>;

// Define the basic Event interface from Drizzle
export type EventBase = typeof events.$inferSelect;

// Extended Event interface that includes the creator information
export interface Event extends EventBase {
  creator?: {
    id: number;
    username: string;
    name: string;
    email: string;
    profileImage: string | null;
    bio: string | null;
    location: string | null;
    headline: string | null;
    coverImage: string | null;
    createdAt: Date;
  }
}

export type InsertEvent = z.infer<typeof insertEventSchema>;

export type RSVP = typeof rsvps.$inferSelect;
export type InsertRSVP = z.infer<typeof insertRSVPSchema>;

export type UserSportPreference = typeof userSportPreferences.$inferSelect;
export type InsertUserSportPreference = z.infer<typeof insertUserSportPreferenceSchema>;

export type PlayerRating = typeof playerRatings.$inferSelect;
export type InsertPlayerRating = z.infer<typeof insertPlayerRatingSchema>;

export type UserOnboardingPreference = typeof userOnboardingPreferences.$inferSelect;
export type InsertUserOnboardingPreference = z.infer<typeof insertUserOnboardingPreferenceSchema>;

// Sports Groups types
export type SportsGroup = typeof sportsGroups.$inferSelect;
export type InsertSportsGroup = z.infer<typeof insertSportsGroupSchema>;

export type SportsGroupMember = typeof sportsGroupMembers.$inferSelect;
export type InsertSportsGroupMember = z.infer<typeof insertSportsGroupMemberSchema>;

export type SportsGroupMessage = typeof sportsGroupMessages.$inferSelect;
export type InsertSportsGroupMessage = z.infer<typeof insertSportsGroupMessageSchema>;

export type SportsGroupEvent = typeof sportsGroupEvents.$inferSelect;
export type InsertSportsGroupEvent = z.infer<typeof insertSportsGroupEventSchema>;

export type SportsGroupPoll = typeof sportsGroupPolls.$inferSelect;
export type InsertSportsGroupPoll = z.infer<typeof insertSportsGroupPollSchema>;

export type SportsGroupPollTimeSlot = typeof sportsGroupPollTimeSlots.$inferSelect;
export type InsertSportsGroupPollTimeSlot = z.infer<typeof insertSportsGroupPollTimeSlotSchema>;

export type SportsGroupPollResponse = typeof sportsGroupPollResponses.$inferSelect;
export type InsertSportsGroupPollResponse = z.infer<typeof insertSportsGroupPollResponseSchema>;

export type SportsGroupJoinRequest = typeof sportsGroupJoinRequests.$inferSelect;
export type InsertSportsGroupJoinRequest = z.infer<typeof insertSportsGroupJoinRequestSchema>;

// New types for profile completion features
export type ProfessionalTeamHistory = typeof professionalTeamHistory.$inferSelect;
export type InsertProfessionalTeamHistory = z.infer<typeof insertProfessionalTeamHistorySchema>;

export type SportSkillLevel = typeof sportSkillLevels.$inferSelect;
export type InsertSportSkillLevel = z.infer<typeof insertSportSkillLevelSchema>;

export type SportType = typeof sportTypes[number];
export type RSVPStatus = typeof rsvpStatusTypes[number];
export type TeamMemberRole = typeof teamMemberRoles[number];
export type ScheduleResponseType = typeof scheduleResponseTypes[number];
export type SkillLevel = typeof skillLevels[number];
export type ActivityFrequency = typeof activityFrequencies[number];
export type TeamSizePreference = typeof teamSizePreferences[number];
export type TeamStatus = typeof teamStatusOptions[number];
export type SportsGroupRole = typeof sportsGroupRoles[number];
export type PollResponseType = typeof pollResponseTypes[number];

// Skill Matcher types
export type SkillMatcherPreference = typeof skillMatcherPreferences.$inferSelect;
export type InsertSkillMatcherPreference = z.infer<typeof insertSkillMatcherPreferenceSchema>;

export type SkillMatch = typeof skillMatches.$inferSelect;
export type InsertSkillMatch = z.infer<typeof insertSkillMatchSchema>;

export type SkillMatchMode = typeof skillMatchModes[number];
export type DistancePreference = typeof distancePreferences[number];

// Sport-specific scoring systems and match types
export const matchResultStatuses = ["pending", "completed", "disputed"] as const;
export const sportScoringTypes = {
  football: "goals", // 2-1, 3-0, etc.
  soccer: "goals",   // Same as football
  tennis: "sets",    // 6-4, 6-2 (games per set)
  padel: "sets",     // Same as tennis
  basketball: "points", // 82-75, etc.
  volleyball: "sets", // 3-1 (sets won)
  baseball: "runs",   // 7-3, etc.
  other: "points"     // Generic points system
} as const;

// Match Results table - stores the outcome of completed events
export const matchResults = pgTable("match_results", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  groupId: integer("group_id").notNull(),
  sportType: varchar("sport_type", { length: 50 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  // Store the score and team composition as JSON for flexibility
  teamA: jsonb("team_a").notNull(), // Array of user IDs
  teamB: jsonb("team_b").notNull(), // Array of user IDs  
  scoreA: integer("score_a").default(0),
  scoreB: integer("score_b").default(0),
  // For sports with more complex scoring (tennis sets, etc.)
  detailedScore: jsonb("detailed_score"), // Sport-specific scoring details
  winningSide: varchar("winning_side", { length: 1 }), // 'A', 'B', or null for draw
  completedAt: timestamp("completed_at"),
  submittedBy: integer("submitted_by").notNull(), // User who submitted the result
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Match Participants table - tracks individual performance per match
export const matchParticipants = pgTable("match_participants", {
  id: serial("id").primaryKey(),
  matchId: integer("match_id").notNull(),
  userId: integer("user_id").notNull(),
  team: varchar("team", { length: 1 }).notNull(), // 'A' or 'B'
  isWinner: boolean("is_winner").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueMatchUser: unique().on(table.matchId, table.userId),
}));

// Player Statistics table - aggregated stats per sport per group
export const playerStatistics = pgTable("player_statistics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  groupId: integer("group_id").notNull(),
  sportType: varchar("sport_type", { length: 50 }).notNull(),
  matchesPlayed: integer("matches_played").default(0),
  matchesWon: integer("matches_won").default(0),
  matchesLost: integer("matches_lost").default(0),
  matchesDrawn: integer("matches_drawn").default(0),
  totalScoreFor: integer("total_score_for").default(0),
  totalScoreAgainst: integer("total_score_against").default(0),
  lastPlayed: timestamp("last_played"),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserGroupSport: unique().on(table.userId, table.groupId, table.sportType),
}));

// Match Result Notifications table - for notifying players to submit scores
export const matchResultNotifications = pgTable("match_result_notifications", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  groupId: integer("group_id").notNull(),
  userId: integer("user_id").notNull(),
  notificationType: varchar("notification_type", { length: 50 }).notNull(), // "submit_score", "score_submitted"
  viewed: boolean("viewed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Schema definitions for scoreboard tables
export const insertMatchResultSchema = createInsertSchema(matchResults).omit({
  id: true,
  createdAt: true,
});

export const insertMatchParticipantSchema = createInsertSchema(matchParticipants).omit({
  id: true,
  createdAt: true,
});

export const insertPlayerStatisticsSchema = createInsertSchema(playerStatistics).omit({
  id: true,
  updatedAt: true,
});

export const insertMatchResultNotificationSchema = createInsertSchema(matchResultNotifications).omit({
  id: true,
  createdAt: true,
});

// Types for scoreboard system
export type MatchResult = typeof matchResults.$inferSelect;
export type InsertMatchResult = z.infer<typeof insertMatchResultSchema>;

export type MatchParticipant = typeof matchParticipants.$inferSelect;
export type InsertMatchParticipant = z.infer<typeof insertMatchParticipantSchema>;

export type PlayerStatistics = typeof playerStatistics.$inferSelect;
export type InsertPlayerStatistics = z.infer<typeof insertPlayerStatisticsSchema>;

export type MatchResultNotification = typeof matchResultNotifications.$inferSelect;
export type InsertMatchResultNotification = z.infer<typeof insertMatchResultNotificationSchema>;

export type MatchResultStatus = typeof matchResultStatuses[number];
export type SportScoringType = keyof typeof sportScoringTypes;

// Tournament system
export const tournamentTypes = [
  'round_robin',
  'single_elimination', 
  'double_elimination',
  'americano',
  'box_league',
  'swiss_system',
  'ladder',
  'king_of_court',
  'fast4',
  'friendly_cup'
] as const;

export const tournaments = pgTable('tournaments', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  sportType: text('sport_type', { enum: sportTypes }).notNull(),
  tournamentType: text('tournament_type', { enum: tournamentTypes }).notNull(),
  location: text('location').notNull(),
  locationLatitude: text('location_latitude'),
  locationLongitude: text('location_longitude'),
  locationPlaceId: text('location_place_id'),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  maxParticipants: integer('max_participants').notNull(),
  participantType: text('participant_type', { enum: ['individual', 'team'] }).default('individual'),
  winPoints: integer('win_points').default(3),
  drawPoints: integer('draw_points').default(1),
  lossPoints: integer('loss_points').default(0),
  matchDuration: integer('match_duration').default(90), // minutes
  status: text('status', { enum: ['draft', 'open', 'full', 'active', 'completed', 'cancelled'] }).default('draft'),
  creatorId: integer('creator_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  tournamentImage: text('tournament_image'),
  registrationDeadline: timestamp('registration_deadline'),
  isPublic: boolean('is_public').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const tournamentParticipants = pgTable('tournament_participants', {
  id: serial('id').primaryKey(),
  tournamentId: integer('tournament_id').references(() => tournaments.id, { onDelete: 'cascade' }).notNull(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }),
  teamName: text('team_name'), // For team tournaments
  participantName: text('participant_name').notNull(), // Display name
  registrationDate: timestamp('registration_date').defaultNow(),
  status: text('status', { enum: ['registered', 'confirmed', 'withdrawn'] }).default('registered'),
  seedPosition: integer('seed_position'), // For seeded tournaments
  createdAt: timestamp('created_at').defaultNow(),
});

export const tournamentMatches = pgTable('tournament_matches', {
  id: serial('id').primaryKey(),
  tournamentId: integer('tournament_id').references(() => tournaments.id, { onDelete: 'cascade' }).notNull(),
  participant1Id: integer('participant1_id').references(() => tournamentParticipants.id, { onDelete: 'cascade' }).notNull(),
  participant2Id: integer('participant2_id').references(() => tournamentParticipants.id, { onDelete: 'cascade' }),
  roundNumber: integer('round_number').notNull(),
  matchNumber: integer('match_number').notNull(),
  scheduledDate: timestamp('scheduled_date'),
  actualDate: timestamp('actual_date'),
  status: text('status', { enum: ['scheduled', 'in_progress', 'completed', 'cancelled'] }).default('scheduled'),
  participant1Score: integer('participant1_score'),
  participant2Score: integer('participant2_score'),
  winnerId: integer('winner_id').references(() => tournamentParticipants.id),
  notes: text('notes'),
  bracketPosition: text('bracket_position'), // For elimination tournaments
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const tournamentStandings = pgTable('tournament_standings', {
  id: serial('id').primaryKey(),
  tournamentId: integer('tournament_id').references(() => tournaments.id, { onDelete: 'cascade' }).notNull(),
  participantId: integer('participant_id').references(() => tournamentParticipants.id, { onDelete: 'cascade' }).notNull(),
  matchesPlayed: integer('matches_played').default(0),
  wins: integer('wins').default(0),
  draws: integer('draws').default(0),
  losses: integer('losses').default(0),
  points: integer('points').default(0),
  goalsFor: integer('goals_for').default(0), // Or points scored
  goalsAgainst: integer('goals_against').default(0), // Or points conceded
  goalDifference: integer('goal_difference').default(0),
  position: integer('position'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Tournament relations
export const tournamentsRelations = relations(tournaments, ({ one, many }) => ({
  creator: one(users, {
    fields: [tournaments.creatorId],
    references: [users.id],
    relationName: "tournament_creator",
  }),
  participants: many(tournamentParticipants, { relationName: "tournament_participants" }),
  matches: many(tournamentMatches, { relationName: "tournament_matches" }),
  standings: many(tournamentStandings, { relationName: "tournament_standings" }),
}));

export const tournamentParticipantsRelations = relations(tournamentParticipants, ({ one, many }) => ({
  tournament: one(tournaments, {
    fields: [tournamentParticipants.tournamentId],
    references: [tournaments.id],
    relationName: "tournament_participants",
  }),
  user: one(users, {
    fields: [tournamentParticipants.userId],
    references: [users.id],
    relationName: "user_tournament_participations",
  }),
  matchesAsParticipant1: many(tournamentMatches, { relationName: "participant1_matches" }),
  matchesAsParticipant2: many(tournamentMatches, { relationName: "participant2_matches" }),
  standings: many(tournamentStandings, { relationName: "participant_standings" }),
}));

export const tournamentMatchesRelations = relations(tournamentMatches, ({ one }) => ({
  tournament: one(tournaments, {
    fields: [tournamentMatches.tournamentId],
    references: [tournaments.id],
    relationName: "tournament_matches",
  }),
  participant1: one(tournamentParticipants, {
    fields: [tournamentMatches.participant1Id],
    references: [tournamentParticipants.id],
    relationName: "participant1_matches",
  }),
  participant2: one(tournamentParticipants, {
    fields: [tournamentMatches.participant2Id],
    references: [tournamentParticipants.id],
    relationName: "participant2_matches",
  }),
  winner: one(tournamentParticipants, {
    fields: [tournamentMatches.winnerId],
    references: [tournamentParticipants.id],
    relationName: "won_matches",
  }),
}));

export const tournamentStandingsRelations = relations(tournamentStandings, ({ one }) => ({
  tournament: one(tournaments, {
    fields: [tournamentStandings.tournamentId],
    references: [tournaments.id],
    relationName: "tournament_standings",
  }),
  participant: one(tournamentParticipants, {
    fields: [tournamentStandings.participantId],
    references: [tournamentParticipants.id],
    relationName: "participant_standings",
  }),
}));

// Tournament insert schemas
export const insertTournamentSchema = createInsertSchema(tournaments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTournamentParticipantSchema = createInsertSchema(tournamentParticipants).omit({
  id: true,
  createdAt: true,
});

export const insertTournamentMatchSchema = createInsertSchema(tournamentMatches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTournamentStandingSchema = createInsertSchema(tournamentStandings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Tournament types
export type Tournament = typeof tournaments.$inferSelect;
export type InsertTournament = z.infer<typeof insertTournamentSchema>;

export type TournamentParticipant = typeof tournamentParticipants.$inferSelect;
export type InsertTournamentParticipant = z.infer<typeof insertTournamentParticipantSchema>;

export type TournamentMatch = typeof tournamentMatches.$inferSelect;
export type InsertTournamentMatch = z.infer<typeof insertTournamentMatchSchema>;

export type TournamentStanding = typeof tournamentStandings.$inferSelect;
export type InsertTournamentStanding = z.infer<typeof insertTournamentStandingSchema>;

export type TournamentType = typeof tournamentTypes[number];
