import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertEventSchema, 
  insertRSVPSchema,
  type User,
  type Event,
  type RSVP
} from "@shared/schema";
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
      
      const eventData = insertEventSchema.parse(req.body);
      const authenticatedUser = (req as any).user as User;
      
      // Set creator ID from authenticated user
      eventData.creatorId = authenticatedUser.id;
      
      console.log("Validated event data:", JSON.stringify(eventData, null, 2));
      
      const newEvent = await storage.createEvent(eventData);
      res.status(201).json(newEvent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.log("Zod validation error:", JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ 
          message: "Invalid event data", 
          errors: error.errors,
          details: error.format()
        });
      }
      console.error("Event creation error:", error);
      res.status(500).json({ message: "Failed to create event" });
    }
  });
  
  app.get('/api/events', async (req: Request, res: Response) => {
    try {
      // Get all public events (for discovery)
      const events = await storage.getPublicEvents();
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Error fetching events" });
    }
  });
  
  app.get('/api/events/:id', async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.id);
      const event = await storage.getEvent(eventId);
      
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json(event);
    } catch (error) {
      res.status(500).json({ message: "Error fetching event" });
    }
  });
  
  app.get('/api/events/user/:userId', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const events = await storage.getEventsByCreator(userId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: "Error fetching user events" });
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

  // Create and return the HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
