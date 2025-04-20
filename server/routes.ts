import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from 'ws';
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertEventSchema, 
  insertRSVPSchema,
  insertUserSportPreferenceSchema,
  insertUserOnboardingPreferenceSchema,
  insertPlayerRatingSchema,
  insertTeamSchema,
  insertTeamMemberSchema,
  insertTeamPostSchema,
  insertTeamPostCommentSchema,
  insertTeamScheduleSchema,
  insertTeamScheduleResponseSchema,
  insertTeamJoinRequestSchema,
  type User,
  type Event,
  type RSVP,
  type UserSportPreference,
  type UserOnboardingPreference,
  type PlayerRating,
  type Team,
  type TeamMember,
  type TeamPost,
  type TeamPostComment,
  type TeamSchedule,
  type TeamScheduleResponse,
  type TeamJoinRequest,
  type InsertTeamJoinRequest,
  playerRatings,
  teamJoinRequests
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { setupAuth } from "./auth";

// Authentication middleware using Passport
const authenticateUser = (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized - Please log in" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);
  // User routes
  app.post('/api/users', async (req: Request, res: Response) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userData.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already taken" });
      }
      
      const newUser = await storage.createUser(userData);
      
      // Don't send the password back
      const { password, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid user data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });
  
  // Add user search endpoint for finding friends
  // Note: This must come BEFORE the specific user id route to avoid conflicts
  app.get('/api/users/all', async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      
      // Don't return password hashes in the API
      const sanitizedUsers = users.map(({ password, ...userData }: { password: string, [key: string]: any }) => userData);
      
      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Error fetching all users:", error);
      res.status(500).json({ message: "Error fetching all users" });
    }
  });

  app.get('/api/users/search', async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      
      if (!query || query.length < 2) {
        return res.status(400).json({ message: "Search query must be at least 2 characters" });
      }
      
      const users = await storage.searchUsers(query);
      
      // Don't return password hashes in the API
      const sanitizedUsers = users.map(({ password, ...userData }: { password: string, [key: string]: any }) => userData);
      
      res.json(sanitizedUsers);
    } catch (error) {
      console.error("Error searching users:", error);
      res.status(500).json({ message: "Error searching users" });
    }
  });
  
  app.get('/api/users/:id', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send the password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user" });
    }
  });
  
  app.put('/api/users/:id', authenticateUser, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.id);
      const authenticatedUser = (req as any).user as User;
      
      // Ensure users can only update their own profile
      if (authenticatedUser.id !== userId) {
        return res.status(403).json({ message: "Forbidden - Cannot update another user's profile" });
      }
      
      const updatedUser = await storage.updateUser(userId, req.body);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send the password
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Error updating user" });
    }
  });
  
  // Event routes
  app.post('/api/events', authenticateUser, async (req: Request, res: Response) => {
    try {
      console.log("Event create body:", JSON.stringify(req.body, null, 2));
      
      // Get authenticated user
      const authenticatedUser = (req as any).user as User;
      if (!authenticatedUser || !authenticatedUser.id) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      console.log("Authenticated user:", JSON.stringify({
        id: authenticatedUser.id,
        username: authenticatedUser.username,
      }));
      
      // Prepare data for validation
      const eventData = {
        ...req.body,
        creatorId: authenticatedUser.id
      };
      
      // Date conversion - convert string to Date object explicitly
      if (typeof eventData.date === 'string') {
        try {
          eventData.date = new Date(eventData.date);
        } catch (e) {
          console.error("Date conversion error:", e);
          return res.status(400).json({ message: "Invalid date format" });
        }
      }
      
      // Try to validate the data
      try {
        const validatedData = insertEventSchema.parse(eventData);
        console.log("Validated event data:", JSON.stringify(validatedData, null, 2));
        
        const newEvent = await storage.createEvent(validatedData);
        return res.status(201).json(newEvent);
      } catch (validationError) {
        if (validationError instanceof z.ZodError) {
          console.log("Zod validation error:", JSON.stringify(validationError.errors, null, 2));
          return res.status(400).json({ 
            message: "Invalid event data", 
            errors: validationError.errors,
            details: validationError.format()
          });
        }
        console.error("Event creation error:", validationError);
        return res.status(500).json({ message: "Failed to create event" });
      }
    } catch (error) {
      console.error("Event creation error:", error);
      return res.status(500).json({ message: "Failed to create event" });
    }
  });
  
  app.get('/api/events', async (req: Request, res: Response) => {
    try {
      // Get all public events (for discovery)
      const events = await storage.getPublicEvents();
      console.log("Fetched public events:", events ? events.length : 0);
      
      // Add creator info to each event
      const eventsWithCreators = await Promise.all(
        events.map(async (event) => {
          const creator = await storage.getUser(event.creatorId);
          return {
            ...event,
            creator: creator ? {
              id: creator.id,
              username: creator.username,
              name: creator.name,
              profileImage: creator.profileImage
            } : null
          };
        })
      );
      
      res.json(eventsWithCreators || []);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Error fetching events" });
    }
  });
  
  // Routes with path parameters should come BEFORE more generic routes
  // Pattern-specific routes like '/api/events/user/:userId' should come BEFORE '/api/events/:id'
  app.get('/api/events/user/:userId', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      console.log(`Fetching events for user ID: ${userId}`);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const events = await storage.getEventsByCreator(userId);
      console.log("Fetched user events:", events ? events.length : 0);
      
      // Add creator info to each event
      const eventsWithCreators = await Promise.all(
        events.map(async (event) => {
          const creator = await storage.getUser(event.creatorId);
          return {
            ...event,
            creator: creator ? {
              id: creator.id,
              username: creator.username,
              name: creator.name,
              profileImage: creator.profileImage
            } : null
          };
        })
      );
      
      res.json(eventsWithCreators || []);
    } catch (error) {
      console.error("Error fetching user events:", error);
      res.status(500).json({ message: "Error fetching user events" });
    }
  });
  
  app.get('/api/events/:id([0-9]+)', async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      console.log(`Fetching event ID: ${eventId}`);
      
      if (isNaN(eventId)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }
      
      // Use the improved getEvent method which already includes creator info
      const event = await storage.getEvent(eventId);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      console.log("Found event with creator info:", 
        event.title, 
        "Creator:", event.creator?.name || "Not found");
      
      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ message: "Error fetching event" });
    }
  });
  
  app.put('/api/events/:id', authenticateUser, async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      const authenticatedUser = (req as any).user as User;
      
      // Get the event
      const event = await storage.getEvent(eventId);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Ensure user is the creator of the event
      if (event.creatorId !== authenticatedUser.id) {
        return res.status(403).json({ message: "Forbidden - You can only update events you created" });
      }
      
      // Validate the update data
      try {
        // We're accepting partial data, so we don't validate against the full schema
        // Make sure to properly handle the date field if it's present
        const processedData = { ...req.body };
        if (processedData.date && typeof processedData.date === 'string') {
          // If date is a string, ensure it's a valid ISO string
          try {
            // Verify it can be parsed as a valid date and convert to ISO string
            processedData.date = new Date(processedData.date).toISOString();
          } catch (error) {
            console.error("Date parsing error:", error);
            return res.status(400).json({ message: "Invalid date format" });
          }
        }
        
        // Ensure creatorId doesn't change
        const updatedEventData = {
          ...processedData,
          creatorId: event.creatorId
        };
        
        console.log("Updating event with data:", updatedEventData);
        const updatedEvent = await storage.updateEvent(eventId, updatedEventData);
        
        if (!updatedEvent) {
          return res.status(404).json({ message: "Failed to update event" });
        }
        
        return res.json(updatedEvent);
      } catch (validationError) {
        console.error("Validation error:", validationError);
        return res.status(400).json({ message: "Invalid event data", error: validationError });
      }
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(500).json({ message: "Error updating event" });
    }
  });
  
  app.delete('/api/events/:id', authenticateUser, async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      const authenticatedUser = (req as any).user as User;
      
      // Get the event
      const event = await storage.getEvent(eventId);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Ensure user is the creator of the event
      if (event.creatorId !== authenticatedUser.id) {
        return res.status(403).json({ message: "Forbidden - You can only delete events you created" });
      }
      
      const success = await storage.deleteEvent(eventId);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to delete event" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting event" });
    }
  });
  
  // RSVP routes
  app.post('/api/rsvps', authenticateUser, async (req: Request, res: Response) => {
    try {
      const rsvpData = insertRSVPSchema.parse(req.body);
      const authenticatedUser = (req as any).user as User;
      
      // Check if the RSVP is for the current user or an invitation to another user
      const isInvitation = rsvpData.userId && rsvpData.userId !== authenticatedUser.id;
      
      // If this is not an invitation, set userId to the authenticated user
      if (!isInvitation) {
        rsvpData.userId = authenticatedUser.id;
      }
      
      // Check if event exists
      const event = await storage.getEvent(rsvpData.eventId);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Only the event creator can send invitations to other users
      if (isInvitation && event.creatorId !== authenticatedUser.id) {
        return res.status(403).json({ message: "Only the event creator can send invitations" });
      }
      
      // Check if userId is valid
      if (isInvitation) {
        const invitedUser = await storage.getUser(rsvpData.userId);
        if (!invitedUser) {
          return res.status(404).json({ message: "User to invite not found" });
        }
      }
      
      // Check if already RSVP'd - for self-RSVP or for invited user
      const existingRSVP = await storage.getRSVP(rsvpData.eventId, rsvpData.userId);
      
      // Check if event is full (only if status is "approved")
      if (rsvpData.status === "approved" && event.currentParticipants >= event.maxParticipants) {
        return res.status(400).json({ message: "Event is full" });
      }
      
      let newRSVP;
      
      if (existingRSVP) {
        // Update the existing RSVP instead of creating a new one
        newRSVP = await storage.updateRSVP(existingRSVP.id, { status: rsvpData.status });
      } else {
        // Create a new RSVP if none exists
        newRSVP = await storage.createRSVP(rsvpData);
      }
      res.status(201).json(newRSVP);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid RSVP data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create RSVP" });
    }
  });
  
  app.get('/api/rsvps/event/:eventId', async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const rsvps = await storage.getRSVPsByEvent(eventId);
      
      // Get user data for each RSVP
      const rsvpsWithUserData = await Promise.all(
        rsvps.map(async (rsvp) => {
          const user = await storage.getUser(rsvp.userId);
          return {
            ...rsvp,
            user: user ? {
              id: user.id,
              username: user.username,
              name: user.name,
              profileImage: user.profileImage
            } : null
          };
        })
      );
      
      res.json(rsvpsWithUserData);
    } catch (error) {
      console.error('Error fetching event RSVPs:', error);
      res.status(500).json({ message: "Error fetching RSVPs" });
    }
  });
  
  app.get('/api/rsvps/user/:userId', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const rsvps = await storage.getRSVPsByUser(userId);
      
      // Fetch events for each RSVP
      const rsvpsWithEvents = await Promise.all(
        rsvps.map(async (rsvp) => {
          const event = await storage.getEvent(rsvp.eventId);
          return {
            ...rsvp,
            event
          };
        })
      );
      
      res.json(rsvpsWithEvents);
    } catch (error) {
      console.error('Error fetching RSVPs:', error);
      res.status(500).json({ message: "Error fetching RSVPs" });
    }
  });
  
  app.put('/api/rsvps/:id', authenticateUser, async (req: Request, res: Response) => {
    try {
      const rsvpId = parseInt(req.params.id);
      const authenticatedUser = (req as any).user as User;
      
      // Get the RSVP by ID to check ownership
      const rsvp = await storage.getRSVPById(rsvpId);
      
      if (!rsvp) {
        console.error(`RSVP with id ${rsvpId} not found`);
        return res.status(404).json({ message: "RSVP not found" });
      }
      
      // Ensure user is updating their own RSVP
      if (rsvp.userId !== authenticatedUser.id) {
        return res.status(403).json({ message: "Forbidden - You can only update your own RSVPs" });
      }
      
      // We now have verified the RSVP exists and belongs to the user, so update it
      const updatedRSVP = await storage.updateRSVP(rsvpId, req.body);
      res.json(updatedRSVP);
    } catch (error) {
      console.error("Error updating RSVP:", error);
      res.status(500).json({ message: "Error updating RSVP" });
    }
  });
  
  app.delete('/api/rsvps/:id', authenticateUser, async (req: Request, res: Response) => {
    try {
      const rsvpId = parseInt(req.params.id);
      const authenticatedUser = (req as any).user as User;
      
      // Get the RSVP
      const rsvps = await storage.getRSVPsByUser(authenticatedUser.id);
      const rsvp = rsvps.find(r => r.id === rsvpId);
      
      if (!rsvp) {
        return res.status(404).json({ message: "RSVP not found" });
      }
      
      // Ensure user is deleting their own RSVP
      if (rsvp.userId !== authenticatedUser.id) {
        return res.status(403).json({ message: "Forbidden - You can only delete your own RSVPs" });
      }
      
      const success = await storage.deleteRSVP(rsvpId);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to delete RSVP" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting RSVP" });
    }
  });
  
  // Sport Preferences API Routes
  app.get('/api/sport-preferences/user/:userId', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const preferences = await storage.getUserSportPreferences(userId);
      res.status(200).json(preferences);
    } catch (error) {
      console.error('Error fetching sport preferences:', error);
      res.status(500).json({ message: "Error fetching sport preferences" });
    }
  });
  
  app.post('/api/sport-preferences', authenticateUser, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const preferenceData = { ...req.body, userId };
      
      // Validate with Zod schema
      const validatedData = insertUserSportPreferenceSchema.parse(preferenceData);
      
      // Check if preference already exists
      const existing = await storage.getUserSportPreference(userId, preferenceData.sportType);
      if (existing) {
        return res.status(400).json({ message: "You already have a preference for this sport" });
      }
      
      const preference = await storage.createUserSportPreference(validatedData);
      res.status(201).json(preference);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid preference data", errors: error.errors });
      }
      console.error('Error creating sport preference:', error);
      res.status(500).json({ message: "Error creating sport preference" });
    }
  });
  
  app.put('/api/sport-preferences/:id', authenticateUser, async (req: Request, res: Response) => {
    try {
      const preferenceId = parseInt(req.params.id);
      const userId = (req.user as any).id;
      
      // Get the preference to check ownership
      const preferences = await storage.getUserSportPreferences(userId);
      const preference = preferences.find(p => p.id === preferenceId);
      
      if (!preference) {
        return res.status(404).json({ message: "Sport preference not found" });
      }
      
      if (preference.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this preference" });
      }
      
      const updated = await storage.updateUserSportPreference(preferenceId, req.body);
      res.status(200).json(updated);
    } catch (error) {
      console.error('Error updating sport preference:', error);
      res.status(500).json({ message: "Error updating sport preference" });
    }
  });
  
  app.delete('/api/sport-preferences/:id', authenticateUser, async (req: Request, res: Response) => {
    try {
      const preferenceId = parseInt(req.params.id);
      const userId = (req.user as any).id;
      
      // Get the preference to check ownership
      const preferences = await storage.getUserSportPreferences(userId);
      const preference = preferences.find(p => p.id === preferenceId);
      
      if (!preference) {
        return res.status(404).json({ message: "Sport preference not found" });
      }
      
      if (preference.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to delete this preference" });
      }
      
      const deleted = await storage.deleteUserSportPreference(preferenceId);
      if (deleted) {
        res.status(200).json({ message: "Sport preference deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete sport preference" });
      }
    } catch (error) {
      console.error('Error deleting sport preference:', error);
      res.status(500).json({ message: "Error deleting sport preference" });
    }
  });
  
  // User onboarding preferences routes
  app.get('/api/onboarding-preferences/:userId', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const preference = await storage.getUserOnboardingPreference(userId);
      
      if (!preference) {
        return res.status(404).json({ message: "Onboarding preferences not found" });
      }
      
      res.status(200).json(preference);
    } catch (error) {
      console.error('Error fetching onboarding preferences:', error);
      res.status(500).json({ message: "Error fetching onboarding preferences" });
    }
  });
  
  app.post('/api/onboarding-preferences', authenticateUser, async (req: Request, res: Response) => {
    try {
      const userId = (req.user as any).id;
      const preferenceData = { ...req.body, userId };
      
      // Validate with Zod schema
      const validatedData = insertUserOnboardingPreferenceSchema.parse(preferenceData);
      
      // Check if preference already exists
      const existing = await storage.getUserOnboardingPreference(userId);
      if (existing) {
        return res.status(400).json({ message: "You already have onboarding preferences set" });
      }
      
      const preference = await storage.createUserOnboardingPreference(validatedData);
      res.status(201).json(preference);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid onboarding data", errors: error.errors });
      }
      console.error('Error creating onboarding preferences:', error);
      res.status(500).json({ message: "Error creating onboarding preferences" });
    }
  });
  
  app.put('/api/onboarding-preferences/:userId', authenticateUser, async (req: Request, res: Response) => {
    try {
      const userIdParam = parseInt(req.params.userId);
      const authenticatedUserId = (req.user as any).id;
      
      // Ensure users can only update their own preferences
      if (userIdParam !== authenticatedUserId) {
        return res.status(403).json({ message: "Not authorized to update these preferences" });
      }
      
      // Get the existing preference
      const existingPreference = await storage.getUserOnboardingPreference(userIdParam);
      if (!existingPreference) {
        return res.status(404).json({ message: "Onboarding preferences not found" });
      }
      
      const updated = await storage.updateUserOnboardingPreference(userIdParam, req.body);
      res.status(200).json(updated);
    } catch (error) {
      console.error('Error updating onboarding preferences:', error);
      res.status(500).json({ message: "Error updating onboarding preferences" });
    }
  });
  
  app.post('/api/onboarding-preferences/:userId/complete', authenticateUser, async (req: Request, res: Response) => {
    try {
      const userIdParam = parseInt(req.params.userId);
      const authenticatedUserId = (req.user as any).id;
      
      // Ensure users can only complete their own onboarding
      if (userIdParam !== authenticatedUserId) {
        return res.status(403).json({ message: "Not authorized to complete this onboarding" });
      }
      
      // Get the existing preference
      const existingPreference = await storage.getUserOnboardingPreference(userIdParam);
      if (!existingPreference) {
        return res.status(404).json({ message: "Onboarding preferences not found" });
      }
      
      const completed = await storage.completeUserOnboarding(userIdParam);
      res.status(200).json(completed);
    } catch (error) {
      console.error('Error completing onboarding:', error);
      res.status(500).json({ message: "Error completing onboarding" });
    }
  });
  
  // Player Ratings API Routes
  app.get('/api/player-ratings/user/:userId', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const ratings = await storage.getPlayerRatings(userId);
      res.status(200).json(ratings);
    } catch (error) {
      console.error('Error fetching player ratings:', error);
      res.status(500).json({ message: "Error fetching player ratings" });
    }
  });
  
  app.get('/api/player-ratings/event/:eventId', async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const ratings = await storage.getPlayerRatingsByEvent(eventId);
      res.status(200).json(ratings);
    } catch (error) {
      console.error('Error fetching event ratings:', error);
      res.status(500).json({ message: "Error fetching event ratings" });
    }
  });
  
  app.get('/api/player-ratings/average/:userId', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const sportType = req.query.sportType as string | undefined;
      const average = await storage.getAveragePlayerRating(userId, sportType);
      res.status(200).json({ average });
    } catch (error) {
      console.error('Error fetching average rating:', error);
      res.status(500).json({ message: "Error fetching average rating" });
    }
  });
  
  app.post('/api/player-ratings', authenticateUser, async (req: Request, res: Response) => {
    try {
      const raterUserId = (req.user as any).id;
      const ratingData = { ...req.body, raterUserId };
      
      // Validate with Zod schema
      const validatedData = insertPlayerRatingSchema.parse(ratingData);
      
      // Check if user is rating themselves
      if (raterUserId === validatedData.ratedUserId) {
        return res.status(400).json({ message: "You cannot rate yourself" });
      }
      
      // Validate the rating value
      if (validatedData.rating < 1 || validatedData.rating > 5) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }
      
      const rating = await storage.createPlayerRating(validatedData);
      res.status(201).json(rating);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid rating data", errors: error.errors });
      }
      console.error('Error creating player rating:', error);
      res.status(500).json({ message: "Error creating player rating" });
    }
  });
  
  app.put('/api/player-ratings/:id', authenticateUser, async (req: Request, res: Response) => {
    try {
      const ratingId = parseInt(req.params.id);
      const userId = (req.user as any).id;
      
      // Get all ratings by this user
      const allRatings = await storage.getPlayerRatings(req.body.ratedUserId);
      const rating = allRatings.find(r => r.id === ratingId && r.raterUserId === userId);
      
      if (!rating) {
        return res.status(404).json({ message: "Rating not found or not created by you" });
      }
      
      // Validate the rating value if it's being updated
      if (req.body.rating && (req.body.rating < 1 || req.body.rating > 5)) {
        return res.status(400).json({ message: "Rating must be between 1 and 5" });
      }
      
      const updated = await storage.updatePlayerRating(ratingId, req.body);
      res.status(200).json(updated);
    } catch (error) {
      console.error('Error updating player rating:', error);
      res.status(500).json({ message: "Error updating player rating" });
    }
  });
  
  app.delete('/api/player-ratings/:id', authenticateUser, async (req: Request, res: Response) => {
    try {
      const ratingId = parseInt(req.params.id);
      const userId = (req.user as any).id;
      
      // Get all ratings from storage instead of direct DB access
      const allRatingsByUser = await storage.getPlayerRatings(userId);
      const rating = allRatingsByUser.find((r: PlayerRating) => r.id === ratingId);
      
      if (!rating) {
        return res.status(404).json({ message: "Rating not found or not created by you" });
      }
      
      const deleted = await storage.deletePlayerRating(ratingId);
      if (deleted) {
        res.status(200).json({ message: "Rating deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete rating" });
      }
    } catch (error) {
      console.error('Error deleting player rating:', error);
      res.status(500).json({ message: "Error deleting player rating" });
    }
  });

  // Team Routes
  app.post('/api/teams', authenticateUser, async (req: Request, res: Response) => {
    try {
      const authenticatedUser = (req as any).user as User;
      
      // Set creatorId from authenticated user
      const teamData = {
        ...req.body,
        creatorId: authenticatedUser.id
      };
      
      // Validate with Zod schema
      const validatedData = insertTeamSchema.parse(teamData);
      
      const team = await storage.createTeam(validatedData);
      res.status(201).json(team);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid team data", errors: error.errors });
      }
      console.error('Error creating team:', error);
      res.status(500).json({ message: "Error creating team" });
    }
  });
  
  app.get('/api/teams', async (req: Request, res: Response) => {
    try {
      // Get query parameters
      const nameQuery = req.query.name as string | undefined;
      
      // Fetch all teams with optional name filter
      const teams = await storage.getAllTeams(nameQuery);
      
      // Get creator info for each team
      const teamsWithCreatorInfo = await Promise.all(teams.map(async (team) => {
        const creator = await storage.getUser(team.creatorId);
        return {
          ...team,
          creator: creator ? {
            id: creator.id,
            username: creator.username,
            name: creator.name,
            profileImage: creator.profileImage
          } : null
        };
      }));
      
      res.json(teamsWithCreatorInfo);
    } catch (error) {
      console.error('Error fetching teams:', error);
      res.status(500).json({ message: "Error fetching teams" });
    }
  });
  
  app.get('/api/teams/user/:userId', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const teams = await storage.getTeamsByUser(userId);
      res.json(teams);
    } catch (error) {
      console.error('Error fetching user teams:', error);
      res.status(500).json({ message: "Error fetching user teams" });
    }
  });
  
  app.get('/api/teams/:id', async (req: Request, res: Response) => {
    try {
      const teamId = parseInt(req.params.id);
      
      if (isNaN(teamId)) {
        return res.status(400).json({ message: "Invalid team ID" });
      }
      
      const team = await storage.getTeam(teamId);
      
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      res.json(team);
    } catch (error) {
      console.error('Error fetching team:', error);
      res.status(500).json({ message: "Error fetching team" });
    }
  });
  
  app.put('/api/teams/:id', authenticateUser, async (req: Request, res: Response) => {
    try {
      const teamId = parseInt(req.params.id);
      const authenticatedUser = (req as any).user as User;
      
      if (isNaN(teamId)) {
        return res.status(400).json({ message: "Invalid team ID" });
      }
      
      const team = await storage.getTeam(teamId);
      
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      // Get team member to check user's role
      const member = await storage.getTeamMember(teamId, authenticatedUser.id);
      
      // Only admins and the creator can update the team
      if (team.creatorId !== authenticatedUser.id && (!member || member.role !== "admin")) {
        return res.status(403).json({ message: "Forbidden - You don't have permission to update this team" });
      }
      
      const updatedTeam = await storage.updateTeam(teamId, req.body);
      res.json(updatedTeam);
    } catch (error) {
      console.error('Error updating team:', error);
      res.status(500).json({ message: "Error updating team" });
    }
  });
  
  app.delete('/api/teams/:id', authenticateUser, async (req: Request, res: Response) => {
    try {
      const teamId = parseInt(req.params.id);
      const authenticatedUser = (req as any).user as User;
      
      if (isNaN(teamId)) {
        return res.status(400).json({ message: "Invalid team ID" });
      }
      
      const team = await storage.getTeam(teamId);
      
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      // Only the creator can delete the team
      if (team.creatorId !== authenticatedUser.id) {
        return res.status(403).json({ message: "Forbidden - Only the team creator can delete the team" });
      }
      
      const success = await storage.deleteTeam(teamId);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to delete team" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting team:', error);
      res.status(500).json({ message: "Error deleting team" });
    }
  });
  
  // Team membership routes
  app.post('/api/teams/:teamId/members', authenticateUser, async (req: Request, res: Response) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const authenticatedUser = (req as any).user as User;
      
      if (isNaN(teamId)) {
        return res.status(400).json({ message: "Invalid team ID" });
      }
      
      const team = await storage.getTeam(teamId);
      
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      // Get team member to check user's role
      const adminMember = await storage.getTeamMember(teamId, authenticatedUser.id);
      
      // Only admins and the creator can add members
      if (team.creatorId !== authenticatedUser.id && (!adminMember || adminMember.role !== "admin")) {
        return res.status(403).json({ message: "Forbidden - You don't have permission to add members to this team" });
      }
      
      // Prepare member data
      const memberData = {
        ...req.body,
        teamId,
      };
      
      // Make sure the user doesn't already exist in the team
      const existingMember = await storage.getTeamMember(teamId, memberData.userId);
      
      if (existingMember) {
        return res.status(400).json({ message: "User is already a member of this team" });
      }
      
      // Validate with Zod schema
      const validatedData = insertTeamMemberSchema.parse(memberData);
      
      const newMember = await storage.createTeamMember(validatedData);
      res.status(201).json(newMember);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid member data", errors: error.errors });
      }
      console.error('Error adding team member:', error);
      res.status(500).json({ message: "Error adding team member" });
    }
  });
  
  app.get('/api/teams/:teamId/members', async (req: Request, res: Response) => {
    try {
      const teamId = parseInt(req.params.teamId);
      
      if (isNaN(teamId)) {
        return res.status(400).json({ message: "Invalid team ID" });
      }
      
      const team = await storage.getTeam(teamId);
      
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      const members = await storage.getTeamMembers(teamId);
      res.json(members);
    } catch (error) {
      console.error('Error fetching team members:', error);
      res.status(500).json({ message: "Error fetching team members" });
    }
  });
  
  app.put('/api/teams/:teamId/members/:memberId', authenticateUser, async (req: Request, res: Response) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const memberId = parseInt(req.params.memberId);
      const authenticatedUser = (req as any).user as User;
      
      if (isNaN(teamId) || isNaN(memberId)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const team = await storage.getTeam(teamId);
      
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      const member = await storage.getTeamMemberById(memberId);
      
      if (!member || member.teamId !== teamId) {
        return res.status(404).json({ message: "Team member not found" });
      }
      
      // Get the authenticated user's team membership
      const authMember = await storage.getTeamMember(teamId, authenticatedUser.id);
      
      // Only admins, captains and the creator can update members
      const isAdmin = team.creatorId === authenticatedUser.id || (authMember && authMember.role === "admin");
      const isCaptain = authMember && authMember.role === "captain";
      const isSelf = member.userId === authenticatedUser.id;
      
      if (!isAdmin && !isCaptain && !isSelf) {
        return res.status(403).json({ message: "Forbidden - You don't have permission to update this team member" });
      }
      
      // If not admin/creator, restrict updatable fields for captains and self
      if (!isAdmin) {
        // Create a new object with only allowed properties
        const allowedUpdate: Partial<TeamMember> = {};
        
        if (isCaptain) {
          // Captains can update positions and stats, but not roles
          if (req.body.position !== undefined) allowedUpdate.position = req.body.position;
          if (req.body.stats !== undefined) allowedUpdate.stats = req.body.stats;
        }
        
        if (isSelf) {
          // Members can only update their own position
          if (req.body.position !== undefined) allowedUpdate.position = req.body.position;
        }
        
        const updatedMember = await storage.updateTeamMember(memberId, allowedUpdate);
        return res.json(updatedMember);
      }
      
      // Admins/creators can update everything
      const updatedMember = await storage.updateTeamMember(memberId, req.body);
      res.json(updatedMember);
    } catch (error) {
      console.error('Error updating team member:', error);
      res.status(500).json({ message: "Error updating team member" });
    }
  });
  
  app.delete('/api/teams/:teamId/members/:memberId', authenticateUser, async (req: Request, res: Response) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const memberId = parseInt(req.params.memberId);
      const authenticatedUser = (req as any).user as User;
      
      if (isNaN(teamId) || isNaN(memberId)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const team = await storage.getTeam(teamId);
      
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      const member = await storage.getTeamMemberById(memberId);
      
      if (!member || member.teamId !== teamId) {
        return res.status(404).json({ message: "Team member not found" });
      }
      
      // Check if the authenticated user is the team creator or an admin
      const authMember = await storage.getTeamMember(teamId, authenticatedUser.id);
      const isAdmin = team.creatorId === authenticatedUser.id || (authMember && authMember.role === "admin");
      const isSelf = member.userId === authenticatedUser.id;
      
      if (!isAdmin && !isSelf) {
        return res.status(403).json({ message: "Forbidden - You don't have permission to remove this team member" });
      }
      
      // Don't allow removing the creator
      if (member.userId === team.creatorId) {
        return res.status(403).json({ message: "Forbidden - Cannot remove the team creator" });
      }
      
      const success = await storage.deleteTeamMember(memberId);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to remove team member" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error removing team member:', error);
      res.status(500).json({ message: "Error removing team member" });
    }
  });
  
  // Team posts routes
  app.post('/api/teams/:teamId/posts', authenticateUser, async (req: Request, res: Response) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const authenticatedUser = (req as any).user as User;
      
      if (isNaN(teamId)) {
        return res.status(400).json({ message: "Invalid team ID" });
      }
      
      const team = await storage.getTeam(teamId);
      
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      // Check if user is a team member
      const member = await storage.getTeamMember(teamId, authenticatedUser.id);
      
      if (!member) {
        return res.status(403).json({ message: "Forbidden - You must be a team member to create posts" });
      }
      
      // Only admins, captains, and the creator can create posts
      if (member.role !== "admin" && member.role !== "captain" && team.creatorId !== authenticatedUser.id) {
        return res.status(403).json({ message: "Forbidden - You don't have permission to create posts in this team" });
      }
      
      // Prepare post data
      const postData = {
        ...req.body,
        teamId,
        userId: authenticatedUser.id
      };
      
      // Validate with Zod schema
      const validatedData = insertTeamPostSchema.parse(postData);
      
      const post = await storage.createTeamPost(validatedData);
      res.status(201).json(post);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid post data", errors: error.errors });
      }
      console.error('Error creating team post:', error);
      res.status(500).json({ message: "Error creating team post" });
    }
  });
  
  app.get('/api/teams/:teamId/posts', async (req: Request, res: Response) => {
    try {
      const teamId = parseInt(req.params.teamId);
      
      if (isNaN(teamId)) {
        return res.status(400).json({ message: "Invalid team ID" });
      }
      
      const team = await storage.getTeam(teamId);
      
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      const posts = await storage.getTeamPosts(teamId);
      res.json(posts);
    } catch (error) {
      console.error('Error fetching team posts:', error);
      res.status(500).json({ message: "Error fetching team posts" });
    }
  });
  
  app.put('/api/teams/:teamId/posts/:postId', authenticateUser, async (req: Request, res: Response) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const postId = parseInt(req.params.postId);
      const authenticatedUser = (req as any).user as User;
      
      if (isNaN(teamId) || isNaN(postId)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const post = await storage.getTeamPost(postId);
      
      if (!post || post.teamId !== teamId) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Only the post creator can update it
      if (post.userId !== authenticatedUser.id) {
        return res.status(403).json({ message: "Forbidden - You can only update your own posts" });
      }
      
      const updatedPost = await storage.updateTeamPost(postId, req.body);
      res.json(updatedPost);
    } catch (error) {
      console.error('Error updating team post:', error);
      res.status(500).json({ message: "Error updating team post" });
    }
  });
  
  app.delete('/api/teams/:teamId/posts/:postId', authenticateUser, async (req: Request, res: Response) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const postId = parseInt(req.params.postId);
      const authenticatedUser = (req as any).user as User;
      
      if (isNaN(teamId) || isNaN(postId)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const post = await storage.getTeamPost(postId);
      
      if (!post || post.teamId !== teamId) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      const team = await storage.getTeam(teamId);
      const member = await storage.getTeamMember(teamId, authenticatedUser.id);
      
      // Post can be deleted by the post creator, team creator, or team admin
      const isCreator = post.userId === authenticatedUser.id;
      const isTeamAdmin = team && team.creatorId === authenticatedUser.id;
      const isTeamMemberAdmin = member && member.role === "admin";
      
      if (!isCreator && !isTeamAdmin && !isTeamMemberAdmin) {
        return res.status(403).json({ message: "Forbidden - You don't have permission to delete this post" });
      }
      
      const success = await storage.deleteTeamPost(postId);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to delete post" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting team post:', error);
      res.status(500).json({ message: "Error deleting team post" });
    }
  });
  
  // Post comments routes
  app.post('/api/teams/:teamId/posts/:postId/comments', authenticateUser, async (req: Request, res: Response) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const postId = parseInt(req.params.postId);
      const authenticatedUser = (req as any).user as User;
      
      if (isNaN(teamId) || isNaN(postId)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const post = await storage.getTeamPost(postId);
      
      if (!post || post.teamId !== teamId) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Check if user is a team member
      const member = await storage.getTeamMember(teamId, authenticatedUser.id);
      
      if (!member) {
        return res.status(403).json({ message: "Forbidden - You must be a team member to comment on posts" });
      }
      
      // Prepare comment data
      const commentData = {
        ...req.body,
        postId,
        userId: authenticatedUser.id
      };
      
      // Validate with Zod schema
      const validatedData = insertTeamPostCommentSchema.parse(commentData);
      
      const comment = await storage.createTeamPostComment(validatedData);
      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid comment data", errors: error.errors });
      }
      console.error('Error creating comment:', error);
      res.status(500).json({ message: "Error creating comment" });
    }
  });
  
  app.get('/api/teams/:teamId/posts/:postId/comments', async (req: Request, res: Response) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const postId = parseInt(req.params.postId);
      
      if (isNaN(teamId) || isNaN(postId)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const post = await storage.getTeamPost(postId);
      
      if (!post || post.teamId !== teamId) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      const comments = await storage.getTeamPostComments(postId);
      res.json(comments);
    } catch (error) {
      console.error('Error fetching comments:', error);
      res.status(500).json({ message: "Error fetching comments" });
    }
  });
  
  // Team schedule routes
  app.post('/api/teams/:teamId/schedules', authenticateUser, async (req: Request, res: Response) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const authenticatedUser = (req as any).user as User;
      
      if (isNaN(teamId)) {
        return res.status(400).json({ message: "Invalid team ID" });
      }
      
      const team = await storage.getTeam(teamId);
      
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      // Check if user is a team member with appropriate permissions
      const member = await storage.getTeamMember(teamId, authenticatedUser.id);
      
      if (!member) {
        return res.status(403).json({ message: "Forbidden - You must be a team member to create schedules" });
      }
      
      // Only admins, captains, and the creator can create schedules
      if (member.role !== "admin" && member.role !== "captain" && team.creatorId !== authenticatedUser.id) {
        return res.status(403).json({ message: "Forbidden - You don't have permission to create schedules in this team" });
      }
      
      // Date conversion for startTime and endTime
      const scheduleData = {
        ...req.body,
        teamId,
        creatorId: authenticatedUser.id
      };
      
      if (typeof scheduleData.startTime === 'string') {
        scheduleData.startTime = new Date(scheduleData.startTime);
      }
      
      if (typeof scheduleData.endTime === 'string') {
        scheduleData.endTime = new Date(scheduleData.endTime);
      }
      
      // Validate with Zod schema
      const validatedData = insertTeamScheduleSchema.parse(scheduleData);
      
      const schedule = await storage.createTeamSchedule(validatedData);
      res.status(201).json(schedule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid schedule data", errors: error.errors });
      }
      console.error('Error creating team schedule:', error);
      res.status(500).json({ message: "Error creating team schedule" });
    }
  });
  
  app.get('/api/teams/:teamId/schedules', async (req: Request, res: Response) => {
    try {
      const teamId = parseInt(req.params.teamId);
      
      if (isNaN(teamId)) {
        return res.status(400).json({ message: "Invalid team ID" });
      }
      
      const team = await storage.getTeam(teamId);
      
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      const schedules = await storage.getTeamSchedules(teamId);
      res.json(schedules);
    } catch (error) {
      console.error('Error fetching team schedules:', error);
      res.status(500).json({ message: "Error fetching team schedules" });
    }
  });
  
  // Schedule responses routes  
  app.post('/api/schedules/:scheduleId/responses', authenticateUser, async (req: Request, res: Response) => {
    try {
      const scheduleId = parseInt(req.params.scheduleId);
      const authenticatedUser = (req as any).user as User;
      
      if (isNaN(scheduleId)) {
        return res.status(400).json({ message: "Invalid schedule ID" });
      }
      
      const schedule = await storage.getTeamSchedule(scheduleId);
      
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      
      // Check if user is a team member
      const member = await storage.getTeamMember(schedule.teamId, authenticatedUser.id);
      
      if (!member) {
        return res.status(403).json({ message: "Forbidden - You must be a team member to respond to schedules" });
      }
      
      // Check if response already exists
      const existingResponse = await storage.getTeamScheduleResponse(scheduleId, authenticatedUser.id);
      
      if (existingResponse) {
        return res.status(400).json({ message: "You have already responded to this schedule" });
      }
      
      // Date conversion for maybeDeadline
      const responseData = {
        ...req.body,
        scheduleId,
        userId: authenticatedUser.id
      };
      
      if (typeof responseData.maybeDeadline === 'string') {
        responseData.maybeDeadline = new Date(responseData.maybeDeadline);
      }
      
      // Validate with Zod schema
      const validatedData = insertTeamScheduleResponseSchema.parse(responseData);
      
      const response = await storage.createTeamScheduleResponse(validatedData);
      res.status(201).json(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid response data", errors: error.errors });
      }
      console.error('Error creating schedule response:', error);
      res.status(500).json({ message: "Error creating schedule response" });
    }
  });
  
  app.get('/api/schedules/:scheduleId/responses', async (req: Request, res: Response) => {
    try {
      const scheduleId = parseInt(req.params.scheduleId);
      
      if (isNaN(scheduleId)) {
        return res.status(400).json({ message: "Invalid schedule ID" });
      }
      
      const schedule = await storage.getTeamSchedule(scheduleId);
      
      if (!schedule) {
        return res.status(404).json({ message: "Schedule not found" });
      }
      
      const responses = await storage.getTeamScheduleResponses(scheduleId);
      res.json(responses);
    } catch (error) {
      console.error('Error fetching schedule responses:', error);
      res.status(500).json({ message: "Error fetching schedule responses" });
    }
  });
  
  app.put('/api/schedules/:scheduleId/responses/:responseId', authenticateUser, async (req: Request, res: Response) => {
    try {
      const scheduleId = parseInt(req.params.scheduleId);
      const responseId = parseInt(req.params.responseId);
      const authenticatedUser = (req as any).user as User;
      
      if (isNaN(scheduleId) || isNaN(responseId)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const response = await storage.getTeamScheduleResponseById(responseId);
      
      if (!response || response.scheduleId !== scheduleId) {
        return res.status(404).json({ message: "Response not found" });
      }
      
      // Users can only update their own responses
      if (response.userId !== authenticatedUser.id) {
        return res.status(403).json({ message: "Forbidden - You can only update your own responses" });
      }
      
      // Date conversion for maybeDeadline
      const responseData = { ...req.body };
      
      if (typeof responseData.maybeDeadline === 'string') {
        responseData.maybeDeadline = new Date(responseData.maybeDeadline);
      }
      
      const updatedResponse = await storage.updateTeamScheduleResponse(responseId, responseData);
      res.json(updatedResponse);
    } catch (error) {
      console.error('Error updating schedule response:', error);
      res.status(500).json({ message: "Error updating schedule response" });
    }
  });

  // Team join request routes
  app.post('/api/teams/:teamId/join-request', authenticateUser, async (req: Request, res: Response) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const authenticatedUser = (req as any).user as User;
      
      if (isNaN(teamId)) {
        return res.status(400).json({ message: "Invalid team ID" });
      }
      
      const team = await storage.getTeam(teamId);
      
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      // Check if user is already a member
      const existingMember = await storage.getTeamMember(teamId, authenticatedUser.id);
      if (existingMember) {
        return res.status(400).json({ message: "You are already a member of this team" });
      }
      
      // Check if user already has a pending request
      const existingRequest = await storage.getTeamJoinRequest(teamId, authenticatedUser.id);
      if (existingRequest) {
        return res.status(400).json({ message: "You already have a pending join request for this team" });
      }
      
      // Create the join request
      const joinRequest = await storage.createTeamJoinRequest({
        teamId,
        userId: authenticatedUser.id,
        status: "pending"
      });
      
      res.status(201).json(joinRequest);
    } catch (error) {
      console.error('Error creating team join request:', error);
      res.status(500).json({ message: "Error creating team join request" });
    }
  });
  
  // Check user join request status
  app.get('/api/teams/:teamId/join-request-status', authenticateUser, async (req: Request, res: Response) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const userId = parseInt(req.query.userId as string);
      const authenticatedUser = (req as any).user as User;
      
      if (isNaN(teamId) || isNaN(userId)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      // Verify user is checking their own request
      if (authenticatedUser.id !== userId) {
        return res.status(403).json({ message: "Not authorized to check this user's join request" });
      }
      
      // Check if user has a pending request for this team
      const joinRequest = await storage.getTeamJoinRequest(teamId, userId);
      
      if (!joinRequest) {
        return res.status(404).json({ message: "No join request found" });
      }
      
      res.json(joinRequest);
    } catch (error) {
      console.error('Error checking join request status:', error);
      res.status(500).json({ message: "Error checking join request status" });
    }
  });
  
  app.get('/api/teams/:teamId/join-requests', authenticateUser, async (req: Request, res: Response) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const authenticatedUser = (req as any).user as User;
      
      if (isNaN(teamId)) {
        return res.status(400).json({ message: "Invalid team ID" });
      }
      
      const team = await storage.getTeam(teamId);
      
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      // Check if user is admin
      if (team.creatorId !== authenticatedUser.id) {
        const member = await storage.getTeamMember(teamId, authenticatedUser.id);
        if (!member || member.role !== "admin") {
          return res.status(403).json({ message: "Forbidden - Only team admins can view join requests" });
        }
      }
      
      const requests = await storage.getTeamJoinRequests(teamId);
      res.json(requests);
    } catch (error) {
      console.error('Error fetching team join requests:', error);
      res.status(500).json({ message: "Error fetching team join requests" });
    }
  });
  
  app.put('/api/teams/:teamId/join-requests/:requestId', authenticateUser, async (req: Request, res: Response) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const requestId = parseInt(req.params.requestId);
      const { status } = req.body;
      const authenticatedUser = (req as any).user as User;
      
      if (isNaN(teamId) || isNaN(requestId)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      if (!status || !["accepted", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status. Must be 'accepted' or 'rejected'" });
      }
      
      const team = await storage.getTeam(teamId);
      
      if (!team) {
        return res.status(404).json({ message: "Team not found" });
      }
      
      // Check if user is admin
      if (team.creatorId !== authenticatedUser.id) {
        const member = await storage.getTeamMember(teamId, authenticatedUser.id);
        if (!member || member.role !== "admin") {
          return res.status(403).json({ message: "Forbidden - Only team admins can process join requests" });
        }
      }
      
      const updatedRequest = await storage.updateTeamJoinRequest(requestId, status);
      
      if (!updatedRequest) {
        return res.status(404).json({ message: "Join request not found" });
      }
      
      // If request is accepted, add the user as a team member
      if (status === "accepted") {
        await storage.createTeamMember({
          teamId,
          userId: updatedRequest.userId,
          role: "member"
        });
      }
      
      res.json(updatedRequest);
    } catch (error) {
      console.error('Error updating team join request:', error);
      res.status(500).json({ message: "Error updating team join request" });
    }
  });
  
  // Get team join notifications for a user (e.g., accepted requests)
  app.get('/api/teams/join-notifications/:userId', authenticateUser, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const authenticatedUser = (req as any).user as User;
      
      // Verify the user is requesting their own notifications
      if (isNaN(userId) || userId !== authenticatedUser.id) {
        return res.status(403).json({ message: "Forbidden - You can only access your own notifications" });
      }
      
      // Get accepted join requests that haven't been viewed yet
      const notifications = await storage.getAcceptedTeamJoinRequests(userId);
      
      // Add team information to each notification
      const notificationsWithTeamInfo = await Promise.all(
        notifications.map(async (notification) => {
          const team = await storage.getTeam(notification.teamId);
          return {
            ...notification,
            team: team ? {
              id: team.id,
              name: team.name,
              sportType: team.sportType,
              description: team.description
            } : null
          };
        })
      );
      
      res.json(notificationsWithTeamInfo);
    } catch (error) {
      console.error('Error fetching join notifications:', error);
      res.status(500).json({ message: "Error fetching join notifications" });
    }
  });
  
  // Mark join notification as viewed
  app.post('/api/teams/join-notifications/:notificationId/viewed', authenticateUser, async (req: Request, res: Response) => {
    try {
      const notificationId = parseInt(req.params.notificationId);
      const authenticatedUser = (req as any).user as User;
      
      if (isNaN(notificationId)) {
        return res.status(400).json({ message: "Invalid notification ID" });
      }
      
      // Verify the notification belongs to the authenticated user
      const notification = await storage.getTeamJoinRequestById(notificationId);
      
      if (!notification) {
        return res.status(404).json({ message: "Notification not found" });
      }
      
      if (notification.userId !== authenticatedUser.id) {
        return res.status(403).json({ message: "Forbidden - This notification doesn't belong to you" });
      }
      
      // Mark notification as viewed
      const updatedNotification = await storage.markTeamJoinRequestAsViewed(notificationId);
      
      res.json(updatedNotification);
    } catch (error) {
      console.error('Error marking notification as viewed:', error);
      res.status(500).json({ message: "Error marking notification as viewed" });
    }
  });

  // Create and return the HTTP server
  const httpServer = createServer(app);
  
  // Create a WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store connected clients with their user IDs
  const clients = new Map();
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    // Handle authentication message to associate the connection with a user
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'auth' && data.userId) {
          // Store the connection with the user ID
          clients.set(data.userId, ws);
          console.log(`WebSocket authenticated for user ${data.userId}`);
          
          // Send confirmation
          ws.send(JSON.stringify({ 
            type: 'auth_success',
            message: 'Connection authenticated' 
          }));
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });
    
    // Handle disconnection
    ws.on('close', () => {
      // Remove the client from the clients map
      for (const [userId, client] of clients.entries()) {
        if (client === ws) {
          clients.delete(userId);
          console.log(`WebSocket disconnected for user ${userId}`);
          break;
        }
      }
    });
  });
  
  // Function to send notification to a specific user
  const sendNotification = (userId: number, notification: any) => {
    const client = clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(notification));
      return true;
    }
    return false;
  };
  
  // Modify the team join request endpoint to send WebSocket notification
  const originalCreateTeamJoinRequest = storage.createTeamJoinRequest;
  storage.createTeamJoinRequest = async (data) => {
    const joinRequest = await originalCreateTeamJoinRequest(data);
    
    if (joinRequest) {
      // Get the team to find admin users
      const team = await storage.getTeam(joinRequest.teamId);
      if (team) {
        // Get the requester's info
        const requester = await storage.getUser(joinRequest.userId);
        
        // Notify the team creator about the join request
        sendNotification(team.creatorId, {
          type: 'join_request',
          teamId: team.id,
          teamName: team.name,
          requestId: joinRequest.id,
          requester: requester ? {
            id: requester.id,
            name: requester.name,
            username: requester.username,
            profileImage: requester.profileImage
          } : null,
          message: `${requester?.name || 'Someone'} requested to join your team ${team.name}`
        });
        
        // Also notify team admins
        const teamMembers = await storage.getTeamMembers(team.id);
        const adminMembers = teamMembers.filter(member => member.role === 'admin' && member.userId !== team.creatorId);
        
        adminMembers.forEach(admin => {
          sendNotification(admin.userId, {
            type: 'join_request',
            teamId: team.id,
            teamName: team.name,
            requestId: joinRequest.id,
            requester: requester ? {
              id: requester.id,
              name: requester.name,
              username: requester.username,
              profileImage: requester.profileImage
            } : null,
            message: `${requester?.name || 'Someone'} requested to join your team ${team.name}`
          });
        });
      }
    }
    
    return joinRequest;
  };
  
  // Modify the update team join request endpoint to send WebSocket notification when request is accepted/rejected
  const originalUpdateTeamJoinRequest = storage.updateTeamJoinRequest;
  storage.updateTeamJoinRequest = async (requestId, status) => {
    const updatedRequest = await originalUpdateTeamJoinRequest(requestId, status);
    
    if (updatedRequest && (status === 'accepted' || status === 'rejected')) {
      // Get team information
      const team = await storage.getTeam(updatedRequest.teamId);
      
      // Notify the user who requested to join
      sendNotification(updatedRequest.userId, {
        type: 'join_request_update',
        requestId: updatedRequest.id,
        teamId: updatedRequest.teamId,
        teamName: team?.name || 'the team',
        status: status,
        message: `Your request to join ${team?.name || 'the team'} has been ${status}`
      });
    }
    
    return updatedRequest;
  };
  
  return httpServer;
}
