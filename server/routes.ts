import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertEventSchema, 
  insertRSVPSchema,
  insertUserSportPreferenceSchema,
  insertPlayerRatingSchema,
  type User,
  type Event,
  type RSVP,
  type UserSportPreference,
  type PlayerRating,
  playerRatings
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
      res.json(events || []);
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
      res.json(events || []);
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
      
      const event = await storage.getEvent(eventId);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
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
      
      const updatedEvent = await storage.updateEvent(eventId, req.body);
      res.json(updatedEvent);
    } catch (error) {
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
      
      // Set user ID from authenticated user
      rsvpData.userId = authenticatedUser.id;
      
      // Check if event exists
      const event = await storage.getEvent(rsvpData.eventId);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      // Check if already RSVP'd
      const existingRSVP = await storage.getRSVP(rsvpData.eventId, authenticatedUser.id);
      
      if (existingRSVP) {
        return res.status(400).json({ message: "Already RSVP'd to this event" });
      }
      
      // Check if event is full (only if status is "approved")
      if (rsvpData.status === "approved" && event.currentParticipants >= event.maxParticipants) {
        return res.status(400).json({ message: "Event is full" });
      }
      
      const newRSVP = await storage.createRSVP(rsvpData);
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
      res.json(rsvps);
    } catch (error) {
      res.status(500).json({ message: "Error fetching RSVPs" });
    }
  });
  
  app.get('/api/rsvps/user/:userId', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const rsvps = await storage.getRSVPsByUser(userId);
      res.json(rsvps);
    } catch (error) {
      res.status(500).json({ message: "Error fetching RSVPs" });
    }
  });
  
  app.put('/api/rsvps/:id', authenticateUser, async (req: Request, res: Response) => {
    try {
      const rsvpId = parseInt(req.params.id);
      const authenticatedUser = (req as any).user as User;
      
      // Get the RSVP
      const rsvp = await storage.getRSVP(req.body.eventId, authenticatedUser.id);
      
      if (!rsvp) {
        return res.status(404).json({ message: "RSVP not found" });
      }
      
      // Ensure user is updating their own RSVP
      if (rsvp.userId !== authenticatedUser.id) {
        return res.status(403).json({ message: "Forbidden - You can only update your own RSVPs" });
      }
      
      const updatedRSVP = await storage.updateRSVP(rsvpId, req.body);
      res.json(updatedRSVP);
    } catch (error) {
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

  // Create and return the HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
