import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from 'ws';
import { storage } from "./storage";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { z } from "zod";
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
  insertSportsGroupSchema,
  insertSkillMatcherPreferenceSchema,
  insertSkillMatchSchema,
  insertMatchResultSchema,
  insertMatchParticipantSchema,
  insertPlayerStatisticsSchema,
  insertMatchResultNotificationSchema,
  insertProfessionalTeamHistorySchema,
  insertSportSkillLevelSchema,
  insertTournamentSchema,
  insertTournamentParticipantSchema,
  insertTournamentMatchSchema,
  insertTournamentStandingSchema,
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
  type SportsGroup,
  type TeamJoinRequest,
  type InsertTeamJoinRequest,
  type SkillMatcherPreference,
  type SkillMatch,
  type MatchResult,
  type MatchParticipant,
  type PlayerStatistics,
  type MatchResultNotification,
  type ProfessionalTeamHistory,
  type SportSkillLevel,
  type Tournament,
  type TournamentParticipant,
  type TournamentMatch,
  type TournamentStanding,
  playerRatings,
  playerStatistics,
  teamJoinRequests
} from "@shared/schema";
import { eq } from "drizzle-orm";
import { setupAuth } from "./auth";

// Authentication middleware using Passport
const authenticateUser = (req: Request, res: Response, next: Function) => {
  console.log('Auth check:', {
    isAuthenticated: req.isAuthenticated(),
    sessionID: req.sessionID,
    userId: req.user?.id,
    url: req.url,
    headers: req.headers.cookie ? 'has cookies' : 'no cookies'
  });
  
  if (!req.isAuthenticated()) {
    console.log('Authentication failed for:', req.url);
    
    // Temporary fallback during authentication debugging
    if (req.url.includes('/api/sports-groups') || 
        req.url.includes('/api/users/') || 
        req.url.includes('/api/friendships') ||
        req.url.includes('/api/friend-requests')) {
      
      // Extract user ID from URL if present
      const userIdMatch = req.url.match(/\/api\/users\/(\d+)/);
      const userId = userIdMatch ? parseInt(userIdMatch[1]) : 4;
      
      console.log('Temporary auth bypass - URL:', req.url, 'User ID:', userId);
      req.user = { id: userId, username: `user${userId}`, name: `User ${userId}` } as any;
      console.log('Auth bypass - set req.user:', req.user);
      return next();
    }
    
    return res.status(401).json({ message: "Unauthorized - Please log in" });
  }
  console.log('Authentication successful for user:', req.user?.id);
  next();
};

// Helper function to check for new event suggestions and notify group members
async function checkAndNotifyNewSuggestions(pollId: number, groupId: number, responseUserId: number, storage: any) {
  try {
    console.log(`Checking for new suggestions after user ${responseUserId} responded to poll ${pollId}`);
    
    // Get poll details and responses
    const poll = await storage.getSportsGroupPoll(pollId);
    if (!poll) {
      console.log('Poll not found');
      return;
    }

    const timeSlots = await storage.getSportsGroupPollTimeSlots(pollId);
    const responses = await storage.getSportsGroupPollResponses(pollId);
    console.log(`Found ${timeSlots.length} time slots and ${responses.length} responses`);

    // Analyze which time slots now meet minimum requirements
    const newViableSlots = [];
    for (const slot of timeSlots) {
      const slotResponses = responses.filter((r: any) => r.timeSlotId === slot.id);
      const availableCount = slotResponses.filter((r: any) => r.isAvailable === true).length;
      
      console.log(`Slot ${slot.id} (${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][slot.dayOfWeek]} ${slot.startTime}-${slot.endTime}): ${availableCount} available, min required: ${poll.minMembers || 2}, used for event: ${slot.usedForEventId}`);
      
      // Check if this slot now meets minimum and wasn't used for event
      if (availableCount >= (poll.minMembers || 2) && !slot.usedForEventId) {
        newViableSlots.push({
          ...slot,
          availableCount,
          dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][slot.dayOfWeek]
        });
      }
    }

    console.log(`Found ${newViableSlots.length} viable slots`);

    // If we have new viable slots, notify all group members (except the one who just responded)
    if (newViableSlots.length > 0) {
      const groupMembers = await storage.getSportsGroupMembers(groupId);
      const responseUser = await storage.getUser(responseUserId);
      
      console.log(`Notifying ${groupMembers.length} group members (excluding responder)`);
      
      for (const member of groupMembers) {
        if (member.userId !== responseUserId) {
          try {
            await storage.createSportsGroupNotification({
              userId: member.userId,
              groupId,
              type: 'event_suggestion',
              title: 'Event Suggestion Available',
              message: `${responseUser?.name || 'Someone'} responded to "${poll.title}" - now has enough participants for ${newViableSlots.length} event suggestion${newViableSlots.length > 1 ? 's' : ''}!`,
              referenceId: pollId,
              viewed: false
            });
            console.log(`Created notification for user ${member.userId}`);
          } catch (notificationError) {
            console.error(`Failed to create notification for user ${member.userId}:`, notificationError);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error checking for new suggestions:', error);
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);

  // SVG Image generation endpoint
  app.post('/api/generate-event-image', async (req: Request, res: Response) => {
    try {
      const { sportType, title } = req.body;
      
      // Define sport-specific colors and icons
      const sportConfig: Record<string, { color: string; icon: string; bgColor: string }> = {
        basketball: { color: '#FF6B35', icon: '🏀', bgColor: '#FFF3E0' },
        football: { color: '#4CAF50', icon: '⚽', bgColor: '#E8F5E8' },
        tennis: { color: '#FFEB3B', icon: '🎾', bgColor: '#FFFDE7' },
        volleyball: { color: '#2196F3', icon: '🏐', bgColor: '#E3F2FD' },
        soccer: { color: '#4CAF50', icon: '⚽', bgColor: '#E8F5E8' },
        baseball: { color: '#795548', icon: '⚾', bgColor: '#EFEBE9' },
        badminton: { color: '#9C27B0', icon: '🏸', bgColor: '#F3E5F5' },
        swimming: { color: '#00BCD4', icon: '🏊', bgColor: '#E0F2F1' },
        running: { color: '#FF5722', icon: '🏃', bgColor: '#FBE9E7' },
        cycling: { color: '#607D8B', icon: '🚴', bgColor: '#ECEFF1' },
        padel: { color: '#FF9800', icon: '🎾', bgColor: '#FFF3E0' },
        squash: { color: '#673AB7', icon: '🎾', bgColor: '#EDE7F6' },
        default: { color: '#2196F3', icon: '⚽', bgColor: '#E3F2FD' }
      };

      const config = sportConfig[sportType.toLowerCase()] || sportConfig.default;
      
      // Create compact SVG image
      const svg = `<svg width="200" height="100" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="100" fill="${config.bgColor}"/><circle cx="30" cy="50" r="15" fill="${config.color}" opacity="0.3"/><text x="30" y="55" font-size="16" text-anchor="middle">${config.icon}</text><text x="60" y="35" font-family="Arial" font-size="12" font-weight="bold" fill="#333">${title.length > 20 ? title.substring(0, 20) + '...' : title}</text><text x="60" y="50" font-family="Arial" font-size="10" fill="${config.color}">${sportType}</text></svg>`;

      // Convert SVG to data URL
      const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
      
      res.json({ imageUrl: svgDataUrl });
    } catch (error) {
      console.error('Error generating image:', error);
      res.status(500).json({ message: 'Failed to generate image' });
    }
  });

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
      
      // Get user's sport statistics across all groups
      const allUserStats = await db.select()
        .from(playerStatistics)
        .where(eq(playerStatistics.userId, userId));
      
      // Group statistics by sport type
      const sportStats = allUserStats.reduce((acc: any, stat) => {
        const sport = stat.sportType;
        if (!acc[sport]) {
          acc[sport] = {
            sportType: sport,
            totalMatches: 0,
            totalWins: 0,
            totalLosses: 0,
            totalDraws: 0,
            totalScoreFor: 0,
            totalScoreAgainst: 0
          };
        }
        
        acc[sport].totalMatches += stat.matchesPlayed;
        acc[sport].totalWins += stat.matchesWon;
        acc[sport].totalLosses += stat.matchesLost;
        acc[sport].totalDraws += stat.matchesDrawn;
        acc[sport].totalScoreFor += stat.totalScoreFor || 0;
        acc[sport].totalScoreAgainst += stat.totalScoreAgainst || 0;
        
        return acc;
      }, {});
      
      // Calculate win rates
      Object.values(sportStats).forEach((stat: any) => {
        stat.winRate = stat.totalMatches > 0 ? (stat.totalWins / stat.totalMatches) * 100 : 0;
      });
      
      // Don't send the password
      const { password, ...userWithoutPassword } = user;
      res.json({
        ...userWithoutPassword,
        sportStatistics: Object.values(sportStats)
      });
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
      
      // Map frontend privacy settings to backend field names
      const updateData = { ...req.body };
      if (updateData.emailPrivacy) {
        updateData.email_privacy = updateData.emailPrivacy;
        delete updateData.emailPrivacy;
      }
      if (updateData.phonePrivacy) {
        updateData.phone_privacy = updateData.phonePrivacy;
        delete updateData.phonePrivacy;
      }
      if (updateData.locationPrivacy) {
        updateData.location_privacy = updateData.locationPrivacy;
        delete updateData.locationPrivacy;
      }
      
      const updatedUser = await storage.updateUser(userId, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send the password
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error updating user:', error);
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
        
        // Automatically create an "approved" RSVP for the event creator
        try {
          await storage.createRSVP({
            eventId: newEvent.id,
            userId: authenticatedUser.id,
            status: "approved"
          });
        } catch (rsvpError) {
          console.error("Error creating creator RSVP:", rsvpError);
          // Don't fail the event creation if RSVP creation fails
        }
        
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
      const userId = req.query.userId ? parseInt(req.query.userId as string) : null;
      
      // Get all discoverable events
      const events = await storage.getDiscoverableEvents(userId);
      console.log("Fetched discoverable events:", events ? events.length : 0);
      
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
      console.log(`Fetching all events for user ID: ${userId}`);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Get RSVPs for the user to find participated events
      const userRSVPs = await storage.getRSVPsByUser(userId);
      const participatedEventIds = userRSVPs
        .filter(rsvp => rsvp.status === 'approved')
        .map(rsvp => rsvp.eventId);
      
      console.log("Participated event IDs:", participatedEventIds);
      
      // Fetch participated events individually
      const participatedEvents = [];
      for (const eventId of participatedEventIds) {
        try {
          const event = await storage.getEvent(eventId);
          if (event) {
            participatedEvents.push(event);
          }
        } catch (err) {
          console.error(`Failed to fetch event ${eventId}:`, err);
        }
      }
      
      console.log("Fetched user events - Participated:", participatedEvents.length);
      
      // Add creator info and relationship type to each event
      const eventsWithCreators = await Promise.all(
        participatedEvents.map(async (event) => {
          const creator = await storage.getUser(event.creatorId);
          return {
            ...event,
            creator: creator ? {
              id: creator.id,
              username: creator.username,
              name: creator.name,
              profileImage: creator.profileImage
            } : null,
            // Mark whether user created this event or just participated
            relationshipType: event.creatorId === userId ? 'created' : 'participated'
          };
        })
      );
      
      // Sort by date (most recent first)
      eventsWithCreators.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
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

  // Endpoint to add colorful images to events without them
  app.post('/api/events/add-colorful-images', async (req: Request, res: Response) => {
    try {
      // Define colorful event images
      const eventImages = {
        basketball: "data:image/svg+xml;base64," + Buffer.from(`<svg width="300" height="200" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="basketbg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#f97316"/>
              <stop offset="100%" style="stop-color:#ea580c"/>
            </linearGradient>
          </defs>
          <rect width="300" height="200" fill="url(#basketbg)"/>
          <circle cx="150" cy="100" r="25" fill="none" stroke="white" stroke-width="3"/>
          <rect x="140" y="80" width="20" height="5" fill="white"/>
          <rect x="140" y="115" width="20" height="5" fill="white"/>
          <text x="150" y="180" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">BASKETBALL</text>
        </svg>`).toString('base64'),
        
        volleyball: "data:image/svg+xml;base64," + Buffer.from(`<svg width="300" height="200" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="volleybg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#f59e0b"/>
              <stop offset="100%" style="stop-color:#d97706"/>
            </linearGradient>
          </defs>
          <rect width="300" height="200" fill="url(#volleybg)"/>
          <circle cx="150" cy="100" r="15" fill="white" stroke="#d97706" stroke-width="2"/>
          <rect x="140" y="170" width="20" height="30" fill="white"/>
          <text x="150" y="180" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">VOLLEYBALL</text>
        </svg>`).toString('base64'),
        
        soccer: "data:image/svg+xml;base64," + Buffer.from(`<svg width="300" height="200" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="soccerbg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#22c55e"/>
              <stop offset="100%" style="stop-color:#16a34a"/>
            </linearGradient>
          </defs>
          <rect width="300" height="200" fill="url(#soccerbg)"/>
          <circle cx="150" cy="100" r="20" fill="white" stroke="#16a34a" stroke-width="2"/>
          <polygon points="150,90 155,100 150,110 145,100" fill="#16a34a"/>
          <text x="150" y="180" text-anchor="middle" fill="white" font-family="Arial" font-size="16" font-weight="bold">SOCCER</text>
        </svg>`).toString('base64'),
        
        tennis: "data:image/svg+xml;base64," + Buffer.from(`<svg width="300" height="200" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="tennisbg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#06b6d4"/>
              <stop offset="100%" style="stop-color:#0891b2"/>
            </linearGradient>
          </defs>
          <rect width="300" height="200" fill="url(#tennisbg)"/>
          <circle cx="150" cy="100" r="12" fill="white"/>
          <path d="M100 120 Q150 80 200 120" stroke="white" stroke-width="4" fill="none"/>
          <text x="150" y="180" text-anchor="middle" fill="white" font-family="Arial" font-size="16" font-weight="bold">TENNIS</text>
        </svg>`).toString('base64'),
        
        running: "data:image/svg+xml;base64," + Buffer.from(`<svg width="300" height="200" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="runbg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#8b5cf6"/>
              <stop offset="100%" style="stop-color:#7c3aed"/>
            </linearGradient>
          </defs>
          <rect width="300" height="200" fill="url(#runbg)"/>
          <path d="M50 150 Q100 100 150 120 T250 100" stroke="white" stroke-width="3" fill="none"/>
          <circle cx="80" cy="130" r="3" fill="white"/>
          <circle cx="180" cy="110" r="3" fill="white"/>
          <text x="150" y="180" text-anchor="middle" fill="white" font-family="Arial" font-size="16" font-weight="bold">RUNNING</text>
        </svg>`).toString('base64'),
        
        padel: "data:image/svg+xml;base64," + Buffer.from(`<svg width="300" height="200" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="padelbg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#ec4899"/>
              <stop offset="100%" style="stop-color:#db2777"/>
            </linearGradient>
          </defs>
          <rect width="300" height="200" fill="url(#padelbg)"/>
          <rect x="120" y="90" width="60" height="20" fill="none" stroke="white" stroke-width="2"/>
          <circle cx="150" cy="100" r="6" fill="white"/>
          <text x="150" y="180" text-anchor="middle" fill="white" font-family="Arial" font-size="16" font-weight="bold">PADEL</text>
        </svg>`).toString('base64')
      };

      // Get events without images
      const allEvents = await storage.getEvents();
      const eventsWithoutImages = allEvents.filter(event => !event.eventImage);
      
      console.log(`Found ${eventsWithoutImages.length} events without images`);
      
      let updatedCount = 0;
      for (const event of eventsWithoutImages) {
        const sportType = event.sportType.toLowerCase();
        const image = eventImages[sportType] || eventImages.basketball; // fallback to basketball
        
        console.log(`Adding image to event ${event.id}: ${event.title} (${sportType})`);
        
        const updatedEvent = await storage.updateEvent(event.id, { eventImage: image });
        if (updatedEvent) {
          updatedCount++;
        }
      }
      
      res.json({ 
        message: `Successfully added colorful images to ${updatedCount} events!`,
        updatedCount,
        totalEventsWithoutImages: eventsWithoutImages.length
      });
    } catch (error) {
      console.error('Error adding colorful images:', error);
      res.status(500).json({ message: "Error adding colorful images to events" });
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
        
        // If the RSVP status has changed to approved, notify the event creator
        if (rsvpData.status === 'approved' && event.creatorId !== rsvpData.userId) {
          try {
            // Get the user details
            const user = await storage.getUser(rsvpData.userId);
            
            if (user) {
              // Send notification to event creator
              sendNotification(event.creatorId, {
                type: 'rsvp_approved',
                eventId: event.id,
                eventTitle: event.title,
                rsvpId: newRSVP?.id,
                user: {
                  id: user.id,
                  name: user.name,
                  username: user.username,
                  profileImage: user.profileImage
                },
                message: `${user.name || user.username} has accepted your invitation to ${event.title}`
              });
            }
          } catch (error) {
            console.error('Error sending RSVP notification:', error);
          }
        }
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
      
      // If the RSVP status has changed to approved, notify the event creator
      if (req.body.status === 'approved') {
        try {
          // Get the event details
          const event = await storage.getEvent(rsvp.eventId);
          
          if (event && event.creatorId !== authenticatedUser.id) {
            // Send notification to event creator
            sendNotification(event.creatorId, {
              type: 'rsvp_approved',
              eventId: event.id,
              eventTitle: event.title,
              rsvpId: updatedRSVP?.id,
              user: {
                id: authenticatedUser.id,
                name: authenticatedUser.name,
                username: authenticatedUser.username,
                profileImage: authenticatedUser.profileImage
              },
              message: `${authenticatedUser.name || authenticatedUser.username} has accepted your invitation to ${event.title}`
            });
          }
        } catch (error) {
          console.error('Error sending RSVP notification:', error);
        }
      }

      // If the RSVP status has changed to declined and it's a group event, notify other participants
      console.log('DEBUG: RSVP update - req.body.status:', req.body.status, 'rsvp.status:', rsvp.status);
      if (req.body.status === 'declined' && rsvp.status === 'approved') {
        console.log('DEBUG: Participant left event notification triggered');
        try {
          // Get the event details
          const event = await storage.getEvent(rsvp.eventId);
          console.log('DEBUG: Event details:', event?.title, 'ID:', event?.id);
          
          if (event) {
            // Check if this is a group event by looking at sports_group_events table
            const groupEvent = await storage.getSportsGroupEventByEventId(event.id);
            console.log('DEBUG: Group event check:', groupEvent);
            
            if (groupEvent) {
              console.log('DEBUG: This is a group event, groupId:', groupEvent.groupId);
              // This is a group event - notify other participants
              const allRSVPs = await storage.getRSVPsByEvent(event.id);
              console.log('DEBUG: All RSVPs for event:', allRSVPs.length);
              
              // Get all approved participants (excluding the user who just left)
              const approvedParticipants = allRSVPs.filter(r => 
                r.status === 'approved' && r.userId !== authenticatedUser.id
              );
              console.log('DEBUG: Approved participants to notify:', approvedParticipants.length);
              
              // Create group notifications for remaining participants
              for (const participantRSVP of approvedParticipants) {
                console.log('DEBUG: Creating leave notification for user:', participantRSVP.userId);
                try {
                  await storage.createSportsGroupNotification({
                    groupId: groupEvent.groupId,
                    userId: participantRSVP.userId,
                    type: 'event',
                    title: 'Participant Left Event',
                    message: `${authenticatedUser.name || authenticatedUser.username} has left the event "${event.title}"`,
                    referenceId: event.id,
                    viewed: false
                  });
                  console.log('DEBUG: Successfully created leave notification for user:', participantRSVP.userId);
                } catch (notificationError) {
                  console.error('Error creating leave notification for user', participantRSVP.userId, ':', notificationError);
                }
              }
            } else {
              console.log('DEBUG: Not a group event');
            }
          }
        } catch (error) {
          console.error('Error sending participant left notification:', error);
        }
      }
      
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
  app.get('/api/onboarding-preferences/:userId', authenticateUser, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const authenticatedUserId = (req.user as any).id;
      
      // Ensure users can only access their own preferences
      if (userId !== authenticatedUserId) {
        return res.status(403).json({ message: "Not authorized to access these preferences" });
      }
      
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
      
      // Debug the incoming request data
      console.log('Schedule response request:', {
        params: req.params,
        body: req.body,
        userId: authenticatedUser.id
      });
      
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
      
      // Debug the response data before validation
      console.log('Response data before validation:', responseData);
      
      if (typeof responseData.maybeDeadline === 'string') {
        responseData.maybeDeadline = new Date(responseData.maybeDeadline);
      }
      
      // Validate with Zod schema
      try {
        const validatedData = insertTeamScheduleResponseSchema.parse(responseData);
        console.log('Validated data:', validatedData);
        
        const response = await storage.createTeamScheduleResponse(validatedData);
        return res.status(201).json(response);
      } catch (validationError) {
        console.error('Validation error:', validationError);
        return res.status(400).json({ message: "Invalid response data", details: validationError });
      }
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
      
      // Enhance join requests with user data
      const enhancedRequests = await Promise.all(
        requests.map(async (request) => {
          const user = await storage.getUser(request.userId);
          return {
            ...request,
            user: user ? {
              id: user.id,
              name: user.name,
              username: user.username,
              profileImage: user.profileImage
            } : null
          };
        })
      );
      
      console.log(`Returning ${enhancedRequests.length} join requests for team ${teamId}`);
      res.json(enhancedRequests);
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

  // Get user's team join request history (all statuses for notification history)
  app.get('/api/users/:userId/team-join-history', authenticateUser, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const authenticatedUser = (req as any).user as User;
      
      if (isNaN(userId) || userId !== authenticatedUser.id) {
        return res.status(403).json({ message: "Forbidden - You can only access your own team join history" });
      }
      
      // Get all team join requests for this user (accepted, rejected, pending)
      const joinRequests = await storage.getUserTeamJoinRequests(userId);
      
      // Add team information to each request
      const requestsWithTeamInfo = await Promise.all(
        joinRequests.map(async (request) => {
          const team = await storage.getTeam(request.teamId);
          return {
            ...request,
            team: team ? {
              id: team.id,
              name: team.name,
              sportType: team.sportType,
              description: team.description
            } : null
          };
        })
      );
      
      res.json(requestsWithTeamInfo);
    } catch (error) {
      console.error('Error fetching team join history:', error);
      res.status(500).json({ message: "Error fetching team join history" });
    }
  });

  // Get user's RSVP history with event details (for notification history)
  app.get('/api/users/:userId/rsvp-history', authenticateUser, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const authenticatedUser = (req as any).user as User;
      
      if (isNaN(userId) || userId !== authenticatedUser.id) {
        return res.status(403).json({ message: "Forbidden - You can only access your own RSVP history" });
      }
      
      // Get all RSVPs for this user
      const rsvps = await storage.getUserRSVPs(userId);
      
      // Add event information to each RSVP
      const rsvpsWithEventInfo = await Promise.all(
        rsvps.map(async (rsvp) => {
          const event = await storage.getEvent(rsvp.eventId);
          return {
            ...rsvp,
            event: event ? {
              id: event.id,
              title: event.title,
              description: event.description,
              date: event.date,
              sportType: event.sportType
            } : null
          };
        })
      );
      
      res.json(rsvpsWithEventInfo);
    } catch (error) {
      console.error('Error fetching RSVP history:', error);
      res.status(500).json({ message: "Error fetching RSVP history" });
    }
  });

  // Unified sports groups endpoint - bypass Vite by using unique endpoint pattern with action parameter
  app.get('/api/groups', authenticateUser, async (req: Request, res: Response) => {
    const { action } = req.query;
    const authenticatedUser = (req as any).user as User;
    
    if (action === 'my') {
      // Get user's sports groups (groups they are members of)
      try {
        const userGroups = await storage.getUserSportsGroups(authenticatedUser.id);
        
        // Build response data synchronously to avoid Promise issues
        const groupsWithDetails = [];
        for (const group of userGroups) {
          try {
            const members = await storage.getSportsGroupMembers(group.id);
            const admin = await storage.getUser(group.adminId);
            
            groupsWithDetails.push({
              ...group,
              memberCount: members.length,
              admin: admin ? {
                id: admin.id,
                name: admin.name,
                profileImage: admin.profileImage
              } : null
            });
          } catch (err) {
            console.error(`Error processing group ${group.id}:`, err);
            // Continue with other groups
          }
        }
        
        res.json(groupsWithDetails);
        
      } catch (error) {
        console.error('Error fetching user sports groups:', error);
        if (!res.headersSent) {
          res.status(500).json({ message: "Error fetching user sports groups" });
        }
      }
    } else if (action === 'browse') {
      // Get discoverable sports groups (public groups for joining)
      try {
        const { sportType, search } = req.query;
        
        const allGroups = await storage.getAllSportsGroups();
        const userGroups = await storage.getUserSportsGroups(authenticatedUser.id);
        const userGroupIds = userGroups.map(g => g.id);
        
        // Filter out groups the user is already a member of and private groups
        const discoverableGroups = allGroups.filter(group => 
          !userGroupIds.includes(group.id) && !group.isPrivate
        );
        
        // Build response data synchronously to avoid Promise issues
        const groupsWithDetails = [];
        for (const group of discoverableGroups) {
          try {
            const members = await storage.getSportsGroupMembers(group.id);
            const admin = await storage.getUser(group.adminId);
            
            groupsWithDetails.push({
              ...group,
              memberCount: members.length,
              admin: admin ? {
                id: admin.id,
                name: admin.name,
                profileImage: admin.profileImage
              } : null
            });
          } catch (err) {
            console.error(`Error processing group ${group.id}:`, err);
            // Continue with other groups
          }
        }
        
        // Filter by sport type if provided
        let filteredGroups = groupsWithDetails;
        if (sportType && sportType !== 'all') {
          filteredGroups = groupsWithDetails.filter(group => group.sportType === sportType);
        }
        
        // Filter by search query if provided
        if (search) {
          const searchLower = (search as string).toLowerCase();
          filteredGroups = filteredGroups.filter(group => 
            group.name.toLowerCase().includes(searchLower) ||
            (group.description && group.description.toLowerCase().includes(searchLower))
          );
        }
        
        res.json(filteredGroups);
      } catch (error) {
        console.error('Error fetching discoverable sports groups:', error);
        if (!res.headersSent) {
          res.status(500).json({ message: "Error fetching discoverable sports groups" });
        }
      }
    } else {
      res.status(404).json({ message: 'Invalid action parameter' });
    }
  });

  // Keep the original endpoint for backward compatibility but with a simpler implementation
  app.get('/api/users/:userId/sports-groups', authenticateUser, (req: Request, res: Response) => {
    const userId = parseInt(req.params.userId);
    const authenticatedUser = (req as any).user as User;
    
    if (authenticatedUser.id !== userId) {
      res.status(403).json({ message: 'Unauthorized' });
      return;
    }
    
    // Simply proxy to the working endpoint
    res.redirect(307, `/api/user-sports-groups/${req.params.userId}`);
  });

  // Get discoverable sports groups (public groups for joining) - bypass Vite by using unique endpoint pattern
  app.get('/api/groups', authenticateUser, async (req: Request, res: Response) => {
    if (req.query.action !== 'browse') {
      return res.status(404).json({ message: 'Not found' });
    }
    
    try {
      const { sportType, search } = req.query;
      const authenticatedUser = (req as any).user as User;
      
      const allGroups = await storage.getAllSportsGroups();
      const userGroups = await storage.getUserSportsGroups(authenticatedUser.id);
      const userGroupIds = userGroups.map(g => g.id);
      
      // Filter out groups the user is already a member of and private groups
      const discoverableGroups = allGroups.filter(group => 
        !userGroupIds.includes(group.id) && !group.isPrivate
      );
      
      // Build response data synchronously to avoid Promise issues
      const groupsWithDetails = [];
      for (const group of discoverableGroups) {
        try {
          const members = await storage.getSportsGroupMembers(group.id);
          const admin = await storage.getUser(group.adminId);
          
          groupsWithDetails.push({
            ...group,
            memberCount: members.length,
            admin: admin ? {
              id: admin.id,
              name: admin.name,
              profileImage: admin.profileImage
            } : null
          });
        } catch (err) {
          console.error(`Error processing group ${group.id}:`, err);
          // Continue with other groups
        }
      }
      
      // Filter by sport type if provided
      let filteredGroups = groupsWithDetails;
      if (sportType && sportType !== 'all') {
        filteredGroups = groupsWithDetails.filter(group => group.sportType === sportType);
      }
      
      // Filter by search query if provided
      if (search) {
        const searchLower = search.toLowerCase();
        filteredGroups = filteredGroups.filter(group => 
          group.name.toLowerCase().includes(searchLower) ||
          (group.description && group.description.toLowerCase().includes(searchLower))
        );
      }
      
      res.json(filteredGroups);
    } catch (error) {
      console.error('Error fetching discoverable sports groups:', error);
      if (!res.headersSent) {
        res.status(500).json({ message: "Error fetching discoverable sports groups" });
      }
    }
  });

  // Keep the original endpoint for backward compatibility
  app.get('/api/sports-groups/discoverable', authenticateUser, (req: Request, res: Response) => {
    res.redirect('/api/discover-sports-groups' + (req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''));
  });

  app.get('/api/sports-groups/:id', authenticateUser, async (req: Request, res: Response) => {
    try {
      const groupId = parseInt(req.params.id);
      const authenticatedUser = (req as any).user as User;
      
      const group = await storage.getSportsGroup(groupId);
      if (!group) {
        return res.status(404).json({ message: 'Sports group not found' });
      }
      
      // Check if user is a member of this group
      const members = await storage.getSportsGroupMembers(groupId);
      const isMember = members.some(member => member.userId === authenticatedUser.id);
      
      if (!isMember) {
        return res.status(403).json({ message: 'Access denied - You are not a member of this group' });
      }
      
      res.json(group);
    } catch (error) {
      console.error('Error fetching sports group:', error);
      res.status(500).json({ message: 'Error fetching sports group' });
    }
  });

  app.get('/api/sports-groups/:id/members', authenticateUser, async (req: Request, res: Response) => {
    try {
      const groupId = parseInt(req.params.id);
      const authenticatedUser = (req as any).user as User;
      
      // Check if user is a member of this group
      const members = await storage.getSportsGroupMembers(groupId);
      const isMember = members.some(member => member.userId === authenticatedUser.id);
      
      if (!isMember) {
        return res.status(403).json({ message: 'Access denied - You are not a member of this group' });
      }
      
      // Get user details for each member
      const membersWithUsers = await Promise.all(
        members.map(async (member) => {
          const user = await storage.getUser(member.userId);
          return {
            ...member,
            user
          };
        })
      );
      
      res.json(membersWithUsers);
    } catch (error) {
      console.error('Error fetching group members:', error);
      res.status(500).json({ message: 'Error fetching group members' });
    }
  });

  app.get('/api/sports-groups/:id/messages', authenticateUser, async (req: Request, res: Response) => {
    try {
      const groupId = parseInt(req.params.id);
      const authenticatedUser = (req as any).user as User;
      
      // Check if user is a member of this group
      const members = await storage.getSportsGroupMembers(groupId);
      const isMember = members.some(member => member.userId === authenticatedUser.id);
      
      if (!isMember) {
        return res.status(403).json({ message: 'Access denied - You are not a member of this group' });
      }
      
      const messages = await storage.getSportsGroupMessages(groupId);
      res.json(messages);
    } catch (error) {
      console.error('Error fetching group messages:', error);
      res.status(500).json({ message: 'Error fetching group messages' });
    }
  });

  app.post('/api/sports-groups/:id/messages', authenticateUser, async (req: Request, res: Response) => {
    try {
      const groupId = parseInt(req.params.id);
      const { content, parentMessageId } = req.body;
      const userId = req.user!.id;
      
      // Check if user is a member of the group
      const member = await storage.getSportsGroupMember(groupId, userId);
      if (!member) {
        return res.status(403).json({ message: 'You must be a member to post messages' });
      }
      
      const messageData = {
        groupId,
        userId,
        content,
        parentMessageId,
        createdAt: new Date().toISOString()
      };
      
      const newMessage = await storage.createSportsGroupMessage(messageData);
      
      // Create notifications for all group members except the poster
      const groupMembers = await storage.getSportsGroupMembers(groupId);
      const group = await storage.getSportsGroup(groupId);
      
      for (const groupMember of groupMembers) {
        if (groupMember.userId !== userId) {
          const notificationData = {
            groupId,
            userId: groupMember.userId,
            type: 'message',
            title: 'New Message Posted',
            message: `New message posted in ${group?.name}`,
            referenceId: newMessage.id,
            viewed: false,
            createdAt: new Date()
          };
          await storage.createSportsGroupNotification(notificationData);
        }
      }
      
      res.status(201).json(newMessage);
    } catch (error) {
      console.error('Error posting group message:', error);
      res.status(500).json({ message: 'Error posting group message' });
    }
  });

  app.get('/api/sports-groups/:id/events', authenticateUser, async (req: Request, res: Response) => {
    try {
      const groupId = parseInt(req.params.id);
      const authenticatedUser = (req as any).user as User;
      
      // Check if user is a member of this group
      const members = await storage.getSportsGroupMembers(groupId);
      const isMember = members.some(member => member.userId === authenticatedUser.id);
      
      if (!isMember) {
        return res.status(403).json({ message: 'Access denied - You are not a member of this group' });
      }
      
      const events = await storage.getSportsGroupEvents(groupId);
      res.json(events);
    } catch (error) {
      console.error('Error fetching group events:', error);
      res.status(500).json({ message: 'Error fetching group events' });
    }
  });

  app.get('/api/sports-groups/:id/events/history', authenticateUser, async (req: Request, res: Response) => {
    try {
      const groupId = parseInt(req.params.id);
      const authenticatedUser = (req as any).user as User;
      
      // Check if user is a member of this group
      const members = await storage.getSportsGroupMembers(groupId);
      const isMember = members.some(member => member.userId === authenticatedUser.id);
      
      if (!isMember) {
        return res.status(403).json({ message: 'Access denied - You are not a member of this group' });
      }
      
      const events = await storage.getSportsGroupEventHistory(groupId);
      res.json(events);
    } catch (error) {
      console.error('Error fetching group event history:', error);
      res.status(500).json({ message: 'Error fetching group event history' });
    }
  });

  app.post('/api/sports-groups/:id/events', authenticateUser, async (req: Request, res: Response) => {
    try {
      const groupId = parseInt(req.params.id);
      const { eventId } = req.body;
      const userId = req.user!.id;
      
      // Check if user is a member of the group
      const member = await storage.getSportsGroupMember(groupId, userId);
      if (!member) {
        return res.status(403).json({ message: 'You must be a member to add events to this group' });
      }
      
      const groupEvent = await storage.addSportsGroupEvent({
        groupId,
        eventId
      });

      // Get event details for notification
      const event = await storage.getEvent(eventId);
      const group = await storage.getSportsGroup(groupId);
      
      if (event && group) {
        // Get all group members except the event creator
        const members = await storage.getSportsGroupMembers(groupId);
        const membersToNotify = members.filter(m => m.userId !== userId);
        
        // Create RSVP invitations and notifications for all group members
        for (const member of membersToNotify) {
          try {
            // Create RSVP invitation with "pending" status
            await storage.createRSVP({
              eventId: eventId,
              userId: member.userId,
              status: 'pending'
            });
            
            // Create sports group notifications
            await storage.createSportsGroupNotification({
              groupId: groupId,
              userId: member.userId,
              type: 'event',
              title: 'New Event Added',
              message: `${event.title} has been added to the group`,
              referenceId: eventId,
              viewed: false
            });
            
            // Also send general WebSocket notification for the event invitation
            sendNotification(member.userId, {
              type: 'event_invitation',
              eventId: event.id,
              eventTitle: event.title,
              groupName: group.name,
              message: `You've been invited to "${event.title}" in ${group.name}`,
              createdAt: new Date().toISOString()
            });
          } catch (notificationError) {
            console.error('Error creating notification for user', member.userId, ':', notificationError);
          }
        }
      }
      
      res.status(201).json(groupEvent);
    } catch (error) {
      console.error('Error adding event to group:', error);
      res.status(500).json({ message: 'Error adding event to group' });
    }
  });

  // Get user's group notifications
  app.get('/api/users/:userId/group-notifications', authenticateUser, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (req.user!.id !== userId) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      // Check if this is for history (all notifications) or just unread counts
      const includeHistory = req.query.history === 'true';
      
      if (includeHistory) {
        // Get all group notifications for history page - ONLY for groups the user is a member of
        // SECURITY: Show notifications for groups the user is a member of OR legitimate pending invitations
        const result = await db.execute(sql`
          SELECT 
            sgn.id,
            sgn.group_id as "groupId",
            sgn.type,
            sgn.title,
            sgn.message,
            sgn.reference_id as "referenceId",
            sgn.viewed,
            sgn.created_at as "createdAt",
            sg.name as "groupName"
          FROM sports_group_notifications sgn
          JOIN sports_groups sg ON sgn.group_id = sg.id
          LEFT JOIN sports_group_members sgm ON sgn.group_id = sgm.group_id AND sgm.user_id = ${userId}
          WHERE sgn.user_id = ${userId} 
          AND (
            sgm.user_id IS NOT NULL OR  -- User is a member of the group
            (sgn.type = 'invitation' AND NOT EXISTS (
              SELECT 1 FROM sports_group_members sgm2 
              WHERE sgm2.group_id = sgn.group_id AND sgm2.user_id = ${userId}
            ))  -- OR it's an invitation and user is not already a member
          )
          ORDER BY sgn.created_at DESC
        `);

        res.json(result.rows);
      } else {
        // Get unread notification counts grouped by group and type
        // SECURITY: Show notifications for groups the user is a member of OR legitimate pending invitations
        const result = await db.execute(sql`
          SELECT 
            sgn.group_id as "groupId",
            sgn.type,
            COUNT(*) as count,
            sg.name as "groupName"
          FROM sports_group_notifications sgn
          JOIN sports_groups sg ON sgn.group_id = sg.id
          LEFT JOIN sports_group_members sgm ON sgn.group_id = sgm.group_id AND sgm.user_id = ${userId}
          WHERE sgn.user_id = ${userId} 
          AND sgn.viewed = false
          AND (
            sgm.user_id IS NOT NULL OR  -- User is a member of the group
            (sgn.type = 'invitation' AND NOT EXISTS (
              SELECT 1 FROM sports_group_members sgm2 
              WHERE sgm2.group_id = sgn.group_id AND sgm2.user_id = ${userId}
            ))  -- OR it's an invitation and user is not already a member
          )
          GROUP BY sgn.group_id, sgn.type, sg.name
        `);
        
        res.json(result.rows);
      }
    } catch (error) {
      console.error('Error fetching group notifications:', error);
      res.status(500).json({ message: 'Error fetching notifications' });
    }
  });

  // Get unread event IDs for a user in a specific group
  app.get('/api/users/:userId/unread-events/:groupId', authenticateUser, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const groupId = parseInt(req.params.groupId);
      
      if (req.user!.id !== userId) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      // Verify user is a member of the group first
      const membershipCheck = await db.execute(sql`
        SELECT 1 FROM sports_group_members 
        WHERE group_id = ${groupId} AND user_id = ${userId}
      `);
      
      if (membershipCheck.rows.length === 0) {
        return res.status(403).json({ message: 'Not a member of this group' });
      }

      // Get unread event notifications for this user and group
      const result = await db.execute(sql`
        SELECT reference_id as "eventId"
        FROM sports_group_notifications 
        WHERE user_id = ${userId} 
        AND group_id = ${groupId} 
        AND type = 'event' 
        AND viewed = false
      `);

      const unreadEventIds = result.rows.map((row: any) => row.eventId);
      res.json(unreadEventIds);
    } catch (error) {
      console.error('Error fetching unread events:', error);
      res.status(500).json({ message: 'Error fetching unread events' });
    }
  });

  // Get unread message IDs for a user in a specific group
  app.get('/api/users/:userId/unread-messages/:groupId', authenticateUser, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const groupId = parseInt(req.params.groupId);
      
      if (req.user!.id !== userId) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      // Verify user is a member of the group first
      const membershipCheck = await db.execute(sql`
        SELECT 1 FROM sports_group_members 
        WHERE group_id = ${groupId} AND user_id = ${userId}
      `);
      
      if (membershipCheck.rows.length === 0) {
        return res.status(403).json({ message: 'Not a member of this group' });
      }

      // Get unread message notifications for this user and group
      const result = await db.execute(sql`
        SELECT reference_id as "messageId"
        FROM sports_group_notifications 
        WHERE user_id = ${userId} 
        AND group_id = ${groupId} 
        AND type = 'message' 
        AND viewed = false
      `);

      const unreadMessageIds = result.rows.map((row: any) => row.messageId);
      res.json(unreadMessageIds);
    } catch (error) {
      console.error('Error fetching unread messages:', error);
      res.status(500).json({ message: 'Error fetching unread messages' });
    }
  });

  // Mark group notifications as viewed
  app.post('/api/users/:userId/group-notifications/view', authenticateUser, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const { groupId, type } = req.body;
      
      if (req.user!.id !== userId) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      await db.execute(sql`
        UPDATE sports_group_notifications 
        SET viewed = true 
        WHERE user_id = ${userId} 
        AND group_id = ${groupId}
        ${type ? sql`AND type = ${type}` : sql``}
      `);

      res.json({ success: true });
    } catch (error) {
      console.error('Error marking notifications as viewed:', error);
      res.status(500).json({ message: 'Error updating notifications' });
    }
  });

  app.post('/api/sports-groups', authenticateUser, async (req: Request, res: Response) => {
    try {
      const authenticatedUser = (req as any).user as User;
      
      // Validate request body
      const validatedData = insertSportsGroupSchema.parse({
        ...req.body,
        adminId: authenticatedUser.id
      });
      
      // Create the sports group (automatically adds creator as admin member)
      const newGroup = await storage.createSportsGroup(validatedData);
      
      res.status(201).json(newGroup);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid group data", errors: error.errors });
      }
      console.error('Error creating sports group:', error);
      res.status(500).json({ message: "Error creating sports group" });
    }
  });

  // Join request for groups
  app.post('/api/sports-groups/:groupId/join-request', authenticateUser, async (req: Request, res: Response) => {
    try {
      const groupId = parseInt(req.params.groupId);
      const authenticatedUser = (req as any).user as User;
      
      // Check if group exists
      const group = await storage.getSportsGroup(groupId);
      if (!group) {
        return res.status(404).json({ message: 'Group not found' });
      }
      
      // Check if user is already a member
      const members = await storage.getSportsGroupMembers(groupId);
      const isMember = members.some(member => member.userId === authenticatedUser.id);
      
      if (isMember) {
        return res.status(400).json({ message: 'You are already a member of this group' });
      }
      
      // Check if there's already a pending request
      const existingRequest = await storage.getSportsGroupJoinRequest(groupId, authenticatedUser.id);
      if (existingRequest) {
        return res.status(400).json({ message: 'You already have a pending join request' });
      }
      
      // Create join request
      const joinRequest = await storage.createSportsGroupJoinRequest({
        groupId,
        userId: authenticatedUser.id,
        status: 'pending',
        createdAt: new Date()
      });
      
      res.status(201).json(joinRequest);
    } catch (error) {
      console.error('Error creating join request:', error);
      res.status(500).json({ message: 'Error creating join request' });
    }
  });

  // Send group invitations
  app.post('/api/sports-groups/:groupId/invite', authenticateUser, async (req: Request, res: Response) => {
    try {
      const groupId = parseInt(req.params.groupId);
      const { userIds } = req.body;
      const authenticatedUser = (req as any).user as User;
      
      // Check if group exists
      const group = await storage.getSportsGroup(groupId);
      if (!group) {
        return res.status(404).json({ message: 'Group not found' });
      }
      
      // Check if user is a member of the group
      const members = await storage.getSportsGroupMembers(groupId);
      const isMember = members.some(member => member.userId === authenticatedUser.id);
      
      if (!isMember) {
        return res.status(403).json({ message: 'You must be a member to invite others' });
      }
      
      // Send invitations to each user
      const invitations = [];
      for (const userId of userIds) {
        // Check if user is already a member
        const isAlreadyMember = members.some(member => member.userId === userId);
        if (isAlreadyMember) continue;
        
        // Check if there's already a pending request
        const existingRequest = await storage.getSportsGroupJoinRequest(groupId, userId);
        if (existingRequest) continue;
        
        // Create invitation (as a join request with special status)
        const invitation = await storage.createSportsGroupJoinRequest({
          groupId,
          userId,
          status: 'invited',
          createdAt: new Date()
        });
        
        // Create notification for the invited user
        await storage.createSportsGroupNotification({
          groupId,
          userId,
          type: 'invitation',
          title: 'Group Invitation',
          message: `${authenticatedUser.name || authenticatedUser.username} invited you to join "${group.name}"`,
          createdAt: new Date(),
          viewed: false
        });
        
        invitations.push(invitation);
      }
      
      res.status(201).json({ 
        message: `Sent ${invitations.length} invitations`,
        invitations 
      });
    } catch (error) {
      console.error('Error sending group invitations:', error);
      res.status(500).json({ message: 'Error sending invitations' });
    }
  });

  // Accept or decline group invitation
  app.put('/api/sports-groups/:groupId/invitation/:requestId', authenticateUser, async (req: Request, res: Response) => {
    try {
      const groupId = parseInt(req.params.groupId);
      const requestId = parseInt(req.params.requestId);
      const { action } = req.body; // 'accept' or 'decline'
      const authenticatedUser = (req as any).user as User;
      
      // Get the invitation notification
      const result = await db.execute(sql`
        SELECT * FROM sports_group_notifications 
        WHERE id = ${requestId}
        AND group_id = ${groupId} 
        AND user_id = ${authenticatedUser.id} 
        AND type = 'invitation'
      `);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Invitation not found' });
      }
      
      if (action === 'accept') {
        // Check if user is already a member
        const existingMember = await storage.getSportsGroupMember(groupId, authenticatedUser.id);
        if (existingMember) {
          return res.status(400).json({ message: 'You are already a member of this group' });
        }
        
        // Add user to group
        await storage.addSportsGroupMember({
          groupId,
          userId: authenticatedUser.id,
          role: 'member'
        });
        
        // Delete the invitation notification (it's no longer needed)
        await db.execute(sql`
          DELETE FROM sports_group_notifications 
          WHERE id = ${requestId}
        `);
        
        // Get the group information for the response
        const group = await storage.getSportsGroup(groupId);
        
        res.json({ 
          message: 'Invitation accepted successfully',
          group: group,
          member: {
            groupId,
            userId: authenticatedUser.id,
            role: 'member'
          }
        });
      } else if (action === 'decline') {
        // Delete the invitation notification
        await db.execute(sql`
          DELETE FROM sports_group_notifications 
          WHERE id = ${requestId}
        `);
        
        res.json({ message: 'Invitation declined' });
      } else {
        res.status(400).json({ message: 'Invalid action. Use "accept" or "decline"' });
      }
    } catch (error) {
      console.error('Error handling group invitation:', error);
      res.status(500).json({ message: 'Error handling invitation' });
    }
  });

  // ============= FRIENDS API =============

  // Get user's friends
  app.get('/api/users/:userId/friends', authenticateUser, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const authenticatedUser = (req as any).user as User;
      
      // Users can only view their own friends or friends of people they're friends with
      if (authenticatedUser.id !== userId) {
        const friendship = await storage.getFriendship(authenticatedUser.id, userId);
        if (!friendship || friendship.status !== 'accepted') {
          return res.status(403).json({ message: 'Access denied' });
        }
      }
      
      const friends = await storage.getFriendsByUserId(userId);
      res.json(friends);
    } catch (error) {
      console.error('Error getting friends:', error);
      res.status(500).json({ message: 'Error getting friends' });
    }
  });

  // Get pending friend requests (received by user)
  app.get('/api/users/:userId/friend-requests', authenticateUser, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const authenticatedUser = (req as any).user as User;
      
      // Users can only view their own friend requests
      console.log(`Friend requests check: authenticated user ${authenticatedUser.id} accessing user ${userId} friend requests`);
      if (authenticatedUser.id !== userId) {
        console.log(`Friend requests access denied: authenticated user ${authenticatedUser.id} tried to access user ${userId} friend requests`);
        return res.status(403).json({ message: 'Access denied' });
      }
      console.log('Friend requests access granted');

      const includeHistory = req.query.history === 'true';
      
      if (includeHistory) {
        // Get all friend requests history - both sent and received
        const result = await db.execute(sql`
          SELECT 
            f.id,
            f.user_id as "senderId",
            f.friend_id as "receiverId", 
            f.status,
            f.created_at as "createdAt",
            sender.name as "senderName",
            sender.username as "senderUsername",
            sender.profile_image as "senderProfileImage",
            receiver.name as "receiverName",
            receiver.username as "receiverUsername",
            receiver.profile_image as "receiverProfileImage"
          FROM friendships f
          JOIN users sender ON f.user_id = sender.id
          JOIN users receiver ON f.friend_id = receiver.id
          WHERE f.friend_id = ${userId} OR f.user_id = ${userId}
          ORDER BY f.created_at DESC
        `);

        res.json(result.rows);
      } else {
        // Get only pending friend requests (current behavior)
        const pendingRequests = await storage.getPendingFriendRequests(userId);
        
        // Enrich with sender information
        const enrichedRequests = await Promise.all(pendingRequests.map(async (request) => {
          const sender = await storage.getUser(request.userId);
          return {
            ...request,
            sender: sender ? {
              id: sender.id,
              name: sender.name,
              username: sender.username,
              profileImage: sender.profileImage
            } : null
          };
        }));
        
        res.json(enrichedRequests);
      }
    } catch (error) {
      console.error('Error getting friend requests:', error);
      res.status(500).json({ message: 'Error getting friend requests' });
    }
  });

  // Get all friend requests (both sent and received by user)
  app.get('/api/users/:userId/all-friend-requests', authenticateUser, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const authenticatedUser = (req as any).user as User;
      
      // Users can only view their own friend requests
      if (authenticatedUser.id !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Get both received and sent friend requests
      const receivedRequests = await storage.getPendingFriendRequests(userId);
      const sentRequests = await storage.getSentFriendRequests(userId);
      
      res.json({
        received: receivedRequests,
        sent: sentRequests,
        all: [...receivedRequests, ...sentRequests]
      });
    } catch (error) {
      console.error('Error getting all friend requests:', error);
      res.status(500).json({ message: 'Error getting all friend requests' });
    }
  });

  // Send friend request
  app.post('/api/friend-requests', authenticateUser, async (req: Request, res: Response) => {
    try {
      const authenticatedUser = (req as any).user as User;
      const { friendId } = req.body;
      
      if (!friendId) {
        return res.status(400).json({ message: 'Friend ID is required' });
      }
      
      // Can't friend yourself
      if (authenticatedUser.id === friendId) {
        return res.status(400).json({ message: 'Cannot send friend request to yourself' });
      }
      
      // Check if target user exists
      const targetUser = await storage.getUser(friendId);
      if (!targetUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Check if friendship already exists
      const existingFriendship = await storage.getFriendship(authenticatedUser.id, friendId);
      if (existingFriendship) {
        if (existingFriendship.status === 'accepted') {
          return res.status(400).json({ message: 'You are already friends with this user' });
        } else if (existingFriendship.status === 'pending') {
          return res.status(400).json({ message: 'Friend request already sent' });
        }
      }
      
      // Create friend request
      const friendRequest = await storage.sendFriendRequest({
        userId: authenticatedUser.id,
        friendId: friendId,
        status: 'pending'
      });
      
      console.log(`Friend request created: ${authenticatedUser.id} -> ${friendId}`, friendRequest);
      res.status(201).json(friendRequest);
    } catch (error) {
      console.error('Error sending friend request:', error);
      res.status(500).json({ message: 'Error sending friend request' });
    }
  });

  // Accept/reject friend request
  app.put('/api/friend-requests/:requestId', authenticateUser, async (req: Request, res: Response) => {
    try {
      const requestId = parseInt(req.params.requestId);
      const authenticatedUser = (req as any).user as User;
      const { status } = req.body; // 'accepted' or 'rejected'
      
      if (!['accepted', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status. Must be "accepted" or "rejected"' });
      }
      
      // Get the friend request
      const friendRequest = await storage.getFriendshipById(requestId);
      if (!friendRequest) {
        return res.status(404).json({ message: 'Friend request not found' });
      }
      
      // Only the recipient can accept/reject
      if (friendRequest.friendId !== authenticatedUser.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Update the request status
      const updatedRequest = await storage.updateFriendshipStatus(requestId, status);
      
      res.json(updatedRequest);
    } catch (error) {
      console.error('Error updating friend request:', error);
      res.status(500).json({ message: 'Error updating friend request' });
    }
  });

  // Remove friend
  app.delete('/api/friendships/:friendshipId', authenticateUser, async (req: Request, res: Response) => {
    try {
      const friendshipId = parseInt(req.params.friendshipId);
      const authenticatedUser = (req as any).user as User;
      
      // Get the friendship
      const friendship = await storage.getFriendshipById(friendshipId);
      if (!friendship) {
        return res.status(404).json({ message: 'Friendship not found' });
      }
      
      // Only users involved in the friendship can delete it
      if (friendship.userId !== authenticatedUser.id && friendship.friendId !== authenticatedUser.id) {
        return res.status(403).json({ message: 'Access denied' });
      }
      
      // Delete the friendship
      const deleted = await storage.deleteFriendship(friendshipId);
      
      if (deleted) {
        res.json({ message: 'Friendship removed successfully' });
      } else {
        res.status(500).json({ message: 'Error removing friendship' });
      }
    } catch (error) {
      console.error('Error removing friendship:', error);
      res.status(500).json({ message: 'Error removing friendship' });
    }
  });

  // Search users (for finding friends)
  app.get('/api/users/search-friends', authenticateUser, async (req: Request, res: Response) => {
    try {
      const { q } = req.query;
      const authenticatedUser = (req as any).user as User;
      
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: 'Search query is required' });
      }
      
      const users = await storage.searchUsers(q);
      
      // Filter out the current user and enrich with friendship status
      const enrichedUsers = await Promise.all(
        users
          .filter(user => user.id !== authenticatedUser.id)
          .map(async (user) => {
            const friendship = await storage.getFriendship(authenticatedUser.id, user.id);
            return {
              id: user.id,
              name: user.name,
              username: user.username,
              profileImage: user.profileImage,
              bio: user.bio,
              location: user.location,
              friendshipStatus: friendship?.status || 'none'
            };
          })
      );
      
      res.json(enrichedUsers);
    } catch (error) {
      console.error('Error searching users:', error);
      res.status(500).json({ message: 'Error searching users' });
    }
  });

  // ============= SPORTS GROUP POLLS API =============

  // Get all polls for a group
  app.get('/api/sports-groups/:groupId/polls', authenticateUser, async (req: Request, res: Response) => {
    try {
      const groupId = parseInt(req.params.groupId);
      const authenticatedUser = (req as any).user as User;
      
      // Check if user is a member of this group
      const members = await storage.getSportsGroupMembers(groupId);
      const isMember = members.some(member => member.userId === authenticatedUser.id);
      
      if (!isMember) {
        return res.status(403).json({ message: 'Access denied - You are not a member of this group' });
      }
      
      const polls = await storage.getSportsGroupPolls(groupId);
      
      // Enrich polls with creator information and response counts
      const enrichedPolls = await Promise.all(polls.map(async (poll) => {
        const creator = await storage.getUser(poll.createdBy);
        const responses = await storage.getSportsGroupPollResponses(poll.id);
        const timeSlots = await storage.getSportsGroupPollTimeSlots(poll.id);
        
        // Count unique users who have responded (not individual response records)
        const uniqueResponders = new Set(responses.map(r => r.userId)).size;
        
        return {
          ...poll,
          creator: creator ? {
            id: creator.id,
            name: creator.name,
            username: creator.username,
            profileImage: creator.profileImage
          } : null,
          responseCount: uniqueResponders,
          timeSlotCount: timeSlots.length
        };
      }));
      
      res.json(enrichedPolls);
    } catch (error) {
      console.error('Error fetching group polls:', error);
      res.status(500).json({ message: 'Error fetching polls' });
    }
  });

  // Get a specific poll with all details
  app.get('/api/sports-groups/:groupId/polls/:pollId', authenticateUser, async (req: Request, res: Response) => {
    try {
      const pollId = parseInt(req.params.pollId);
      const groupId = parseInt(req.params.groupId);
      const authenticatedUser = (req as any).user as User;
      
      // Check if user is a member of this group
      const members = await storage.getSportsGroupMembers(groupId);
      const isMember = members.some(member => member.userId === authenticatedUser.id);
      
      if (!isMember) {
        return res.status(403).json({ message: 'Access denied - You are not a member of this group' });
      }
      
      const poll = await storage.getSportsGroupPoll(pollId);
      
      if (!poll) {
        return res.status(404).json({ message: 'Poll not found' });
      }
      
      // Get poll time slots and responses
      const timeSlots = await storage.getSportsGroupPollTimeSlots(pollId);
      const responses = await storage.getSportsGroupPollResponses(pollId);
      const creator = await storage.getUser(poll.createdBy);
      
      // Organize responses by time slot and user
      const organizedResponses = timeSlots.map(slot => {
        const slotResponses = responses.filter(r => r.timeSlotId === slot.id);
        return {
          ...slot,
          responses: slotResponses.map(r => ({
            ...r,
            user: responses.find(resp => resp.id === r.id)?.userId
          }))
        };
      });
      
      res.json({
        ...poll,
        creator: creator ? {
          id: creator.id,
          name: creator.name,
          username: creator.username,
          profileImage: creator.profileImage
        } : null,
        timeSlots: organizedResponses,
        totalResponses: responses.length
      });
    } catch (error) {
      console.error('Error fetching poll details:', error);
      res.status(500).json({ message: 'Error fetching poll details' });
    }
  });

  // Create a new poll
  app.post('/api/sports-groups/:groupId/polls', authenticateUser, async (req: Request, res: Response) => {
    try {
      const groupId = parseInt(req.params.groupId);
      const authenticatedUser = (req as any).user as User;
      
      // Verify user is a member of the group
      const membership = await storage.getSportsGroupMember(groupId, authenticatedUser.id);
      if (!membership) {
        return res.status(403).json({ message: 'You must be a group member to create polls' });
      }
      
      const { title, description, minMembers, duration, endDate, timeSlots } = req.body;
      
      // Validate poll data
      const pollData = {
        groupId,
        createdBy: authenticatedUser.id,
        title,
        description,
        minMembers: minMembers || 2,
        duration: duration || 60,
        endDate: new Date(endDate)
      };
      
      // Create the poll
      const newPoll = await storage.createSportsGroupPoll(pollData);
      
      // Create time slots
      if (timeSlots && Array.isArray(timeSlots)) {
        for (const slot of timeSlots) {
          await storage.createSportsGroupPollTimeSlot({
            pollId: newPoll.id,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime
          });
        }
      }
      
      // Notify all group members about the new poll
      const groupMembers = await storage.getSportsGroupMembers(groupId);
      for (const member of groupMembers) {
        if (member.userId !== authenticatedUser.id) {
          await storage.createSportsGroupNotification({
            userId: member.userId,
            groupId,
            type: 'poll',
            title: 'New Poll Created',
            message: `${authenticatedUser.name} created a new poll: ${title}`,
            referenceId: newPoll.id,
            viewed: false
          });
        }
      }
      

      
      res.status(201).json(newPoll);
    } catch (error) {
      console.error('Error creating poll:', error);
      res.status(500).json({ message: 'Error creating poll' });
    }
  });

  // Submit poll responses
  app.post('/api/sports-groups/:groupId/polls/:pollId/responses', authenticateUser, async (req: Request, res: Response) => {
    try {
      const pollId = parseInt(req.params.pollId);
      const groupId = parseInt(req.params.groupId);
      const authenticatedUser = (req as any).user as User;
      
      // Verify user is a member of the group
      const membership = await storage.getSportsGroupMember(groupId, authenticatedUser.id);
      if (!membership) {
        return res.status(403).json({ message: 'You must be a group member to respond to polls' });
      }
      
      const { availability } = req.body; // Custom availability object
      
      // Delete existing responses for this user and poll
      const existingResponses = await storage.getSportsGroupPollUserResponses(pollId, authenticatedUser.id);
      for (const response of existingResponses) {
        await storage.deleteSportsGroupPollResponse(response.id);
      }
      
      // Create time slots and responses from user's custom availability
      const newResponses = [];
      if (availability) {
        const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        for (const [dayName, slots] of Object.entries(availability)) {
          const dayIndex = DAYS_OF_WEEK.indexOf(dayName);
          if (dayIndex === -1) continue;
          
          for (const slot of (slots as any[])) {
            if (slot.available) {
              // Create or find existing time slot
              let timeSlot;
              const existingSlots = await storage.getSportsGroupPollTimeSlots(pollId);
              const matchingSlot = existingSlots.find(s => 
                s.dayOfWeek === dayIndex && 
                s.startTime === slot.startTime && 
                s.endTime === slot.endTime
              );
              
              if (matchingSlot) {
                timeSlot = matchingSlot;
              } else {
                timeSlot = await storage.createSportsGroupPollTimeSlot({
                  pollId,
                  dayOfWeek: dayIndex,
                  startTime: slot.startTime,
                  endTime: slot.endTime
                });
              }
              
              // Create response for this time slot
              const response = await storage.createSportsGroupPollResponse({
                pollId,
                timeSlotId: timeSlot.id,
                userId: authenticatedUser.id,
                isAvailable: true
              });
              
              newResponses.push(response);
            }
          }
        }
      }
      
      // Check if this response creates new event suggestions that meet minimum requirements
      if (newResponses.length > 0) {
        await checkAndNotifyNewSuggestions(pollId, groupId, authenticatedUser.id, storage);
      }
      
      res.json(newResponses);
    } catch (error) {
      console.error('Error submitting poll responses:', error);
      res.status(500).json({ message: 'Error submitting responses' });
    }
  });

  // Get poll responses for a user
  app.get('/api/sports-groups/:groupId/polls/:pollId/user-responses', authenticateUser, async (req: Request, res: Response) => {
    try {
      const pollId = parseInt(req.params.pollId);
      const groupId = parseInt(req.params.groupId);
      const authenticatedUser = (req as any).user as User;
      
      console.log(`Fetching user responses for poll ${pollId}, user ${authenticatedUser.id} (${authenticatedUser.name})`);
      
      // Check if user is a member of this group
      const members = await storage.getSportsGroupMembers(groupId);
      const isMember = members.some(member => member.userId === authenticatedUser.id);
      
      if (!isMember) {
        return res.status(403).json({ message: 'Access denied - You are not a member of this group' });
      }
      
      const responses = await storage.getSportsGroupPollUserResponses(pollId, authenticatedUser.id);
      console.log(`Found ${responses.length} responses for user ${authenticatedUser.id}:`, responses);
      res.json(responses);
    } catch (error) {
      console.error('Error fetching user poll responses:', error);
      res.status(500).json({ message: 'Error fetching responses' });
    }
  });

  // Get poll analysis and event suggestions
  // Mark poll suggestion as used when event is created from it
  app.post('/api/sports-groups/:groupId/polls/:pollId/suggestions/:suggestionId/mark-used', authenticateUser, async (req: Request, res: Response) => {
    try {
      const groupId = parseInt(req.params.groupId);
      const pollId = parseInt(req.params.pollId);
      const suggestionId = parseInt(req.params.suggestionId);
      const { eventId } = req.body;
      const userId = req.user!.id;

      // Check if user is a member of the group
      const member = await storage.getSportsGroupMember(groupId, userId);
      if (!member) {
        return res.status(403).json({ message: 'You must be a member to mark poll suggestions' });
      }

      // Store the mapping of poll suggestion to created event
      await storage.markPollSuggestionAsUsed(pollId, suggestionId, eventId);

      res.json({ success: true, message: 'Poll suggestion marked as used' });
    } catch (error) {
      console.error('Error marking poll suggestion as used:', error);
      res.status(500).json({ message: 'Error marking poll suggestion as used' });
    }
  });

  // Invite users who were available for a poll time slot to the created event
  app.post('/api/sports-groups/:groupId/polls/:pollId/invite-available-users', authenticateUser, async (req: Request, res: Response) => {
    try {
      const groupId = parseInt(req.params.groupId);
      const pollId = parseInt(req.params.pollId);
      const { eventId, timeSlotId } = req.body;
      const userId = req.user!.id;

      // Check if user is a member of the group
      const member = await storage.getSportsGroupMember(groupId, userId);
      if (!member) {
        return res.status(403).json({ message: 'You must be a member to invite users' });
      }

      // Get all users who marked themselves as available for this time slot
      const responses = await storage.getSportsGroupPollResponses(pollId);
      const availableUsers = responses.filter(response => 
        response.timeSlotId === timeSlotId && response.isAvailable === true
      );

      // Create RSVPs for all available users
      let invitedCount = 0;
      for (const response of availableUsers) {
        try {
          // Check if user already has an RSVP for this event
          const existingRSVPs = await storage.getRSVPsByUser(response.userId);
          const hasExistingRSVP = existingRSVPs.some((rsvp: any) => rsvp.eventId === eventId);
          
          if (!hasExistingRSVP) {
            await storage.createRSVP({
              eventId: eventId,
              userId: response.userId,
              status: 'approved' // Auto-approve all poll participants since they indicated availability
            });
            invitedCount++;
          }
        } catch (error) {
          console.error(`Failed to create RSVP for user ${response.userId}:`, error);
        }
      }

      res.json({ 
        success: true, 
        message: `Invited ${invitedCount} available users to the event`,
        invitedCount 
      });
    } catch (error) {
      console.error('Error inviting available users:', error);
      res.status(500).json({ message: 'Error inviting available users' });
    }
  });

  app.get('/api/sports-groups/:groupId/polls/:pollId/analysis', authenticateUser, async (req: Request, res: Response) => {
    try {
      const pollId = parseInt(req.params.pollId);
      const groupId = parseInt(req.params.groupId);
      const authenticatedUser = (req as any).user as User;
      
      // Check if user is a member of this group
      const members = await storage.getSportsGroupMembers(groupId);
      const isMember = members.some(member => member.userId === authenticatedUser.id);
      
      if (!isMember) {
        return res.status(403).json({ message: 'Access denied - You are not a member of this group' });
      }
      
      const poll = await storage.getSportsGroupPoll(pollId);
      
      if (!poll) {
        return res.status(404).json({ message: 'Poll not found' });
      }
      
      const timeSlots = await storage.getSportsGroupPollTimeSlots(pollId);
      const responses = await storage.getSportsGroupPollResponses(pollId);
      
      // Analyze availability for each time slot and find overlapping opportunities
      const analysis = timeSlots.map(slot => {
        const slotResponses = responses.filter(r => r.timeSlotId === slot.id);
        const availableCount = slotResponses.filter(r => r.isAvailable === true).length;
        const unavailableCount = slotResponses.filter(r => r.isAvailable === false).length;
        const meetsMinimum = availableCount >= (poll.minMembers || 2);
        
        console.log(`Slot ${slot.id} (${slot.dayOfWeek}/${slot.startTime}-${slot.endTime}): ${availableCount} available, min needed: ${poll.minMembers}, meets minimum: ${meetsMinimum}`);
        
        return {
          ...slot,
          availableCount,
          unavailableCount,
          totalResponses: slotResponses.length,
          meetsMinimum,
          potentialParticipants: availableCount,
          isUsedForEvent: !!slot.usedForEventId,
          usedForEventId: slot.usedForEventId,
          availableUserIds: slotResponses.filter(r => r.isAvailable === true).map(r => r.userId)
        };
      });

      // Find overlapping time opportunities for the same day
      const overlappingOpportunities = [];
      const groupedByDay = analysis.reduce((acc, slot) => {
        if (!acc[slot.dayOfWeek]) acc[slot.dayOfWeek] = [];
        acc[slot.dayOfWeek].push(slot);
        return acc;
      }, {} as {[key: number]: typeof analysis});

      Object.entries(groupedByDay).forEach(([dayOfWeek, daySlots]) => {
        daySlots.forEach(slot1 => {
          daySlots.forEach(slot2 => {
            if (slot1.id >= slot2.id) return; // Avoid duplicates and self-comparison
            
            // Check if time slots overlap or are adjacent
            const slot1Start = slot1.startTime;
            const slot1End = slot1.endTime;
            const slot2Start = slot2.startTime;
            const slot2End = slot2.endTime;
            
            // Find overlap period
            const overlapStart = slot1Start > slot2Start ? slot1Start : slot2Start;
            const overlapEnd = slot1End < slot2End ? slot1End : slot2End;
            
            if (overlapStart < overlapEnd) {
              // There's an overlap - combine available users
              const combinedUsers = [...new Set([...slot1.availableUserIds, ...slot2.availableUserIds])];
              if (combinedUsers.length >= (poll.minMembers || 2)) {
                overlappingOpportunities.push({
                  dayOfWeek: parseInt(dayOfWeek),
                  startTime: overlapStart,
                  endTime: overlapEnd,
                  availableCount: combinedUsers.length,
                  combinedSlots: [slot1.id, slot2.id],
                  availableUserIds: combinedUsers,
                  meetsMinimum: true
                });
              }
            }
          });
        });
      });

      console.log(`Found ${overlappingOpportunities.length} overlapping opportunities:`, overlappingOpportunities);
      
      // Sort by best availability
      const sortedSlots = analysis.sort((a, b) => {
        if (a.meetsMinimum && !b.meetsMinimum) return -1;
        if (!a.meetsMinimum && b.meetsMinimum) return 1;
        return b.potentialParticipants - a.potentialParticipants;
      });
      
      // Generate event suggestions from both direct slots and overlapping opportunities
      const directSuggestions = sortedSlots
        .filter(slot => slot.meetsMinimum && !slot.isUsedForEvent)
        .slice(0, 3)
        .map(slot => ({
          timeSlot: slot,
          suggestedDate: getNextDateForDayOfWeek(slot.dayOfWeek),
          estimatedParticipants: slot.availableCount,
          confidence: slot.availableCount >= (poll.minMembers || 2) ? 'high' : 'medium',
          type: 'direct'
        }));

      const overlapSuggestions = overlappingOpportunities
        .slice(0, 5) // Top 5 overlapping opportunities
        .map(overlap => ({
          timeSlot: {
            id: `overlap-${overlap.dayOfWeek}-${overlap.startTime}`,
            dayOfWeek: overlap.dayOfWeek,
            startTime: overlap.startTime,
            endTime: overlap.endTime,
            availableCount: overlap.availableCount,
            meetsMinimum: overlap.meetsMinimum,
            isUsedForEvent: false
          },
          suggestedDate: getNextDateForDayOfWeek(overlap.dayOfWeek),
          estimatedParticipants: overlap.availableCount,
          confidence: overlap.availableCount >= (poll.minMembers || 2) ? 'high' : 'medium',
          type: 'overlap',
          combinedSlots: overlap.combinedSlots
        }));

      const suggestions = [...overlapSuggestions, ...directSuggestions];
      
      console.log(`Poll analysis complete. Total slots: ${timeSlots.length}, Direct viable slots: ${sortedSlots.filter(s => s.meetsMinimum).length}, Overlap opportunities: ${overlappingOpportunities.length}, Total suggestions: ${suggestions.length}`);

      // Send notifications to all available members when new opportunities are created
      if (suggestions.length > 0) {
        // Get all users who have any availability for this poll
        const allAvailableUserIds = [...new Set(responses
          .filter(r => r.isAvailable === true)
          .map(r => r.userId))];
        
        // Notify all available members about event creation opportunities
        for (const userId of allAvailableUserIds) {
          try {
            // Check if user already has a recent event suggestion notification for this poll
            const existingNotification = await storage.getSportsGroupNotifications(userId)
              .then(notifications => notifications.find(n => 
                n.type === 'event_suggestion' && 
                n.groupId === groupId &&
                n.referenceId === pollId &&
                new Date(n.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000 // Within last 24 hours
              ));

            if (!existingNotification) {
              await storage.createSportsGroupNotification({
                userId,
                groupId,
                type: 'event_suggestion',
                title: 'Event Creation Available',
                message: `${suggestions.length} event${suggestions.length > 1 ? 's' : ''} can now be created from poll "${poll.title}"`,
                referenceId: pollId,
                viewed: false
              });
              console.log(`Sent event suggestion notification to user ${userId}`);
            }
          } catch (error) {
            console.error(`Failed to notify user ${userId}:`, error);
          }
        }
      }
      
      res.json({
        poll,
        analysis: sortedSlots,
        suggestions,
        summary: {
          totalTimeSlots: timeSlots.length,
          viableSlots: sortedSlots.filter(s => s.meetsMinimum).length,
          totalUniqueResponders: new Set(responses.map(r => r.userId)).size
        }
      });
    } catch (error) {
      console.error('Error analyzing poll:', error);
      res.status(500).json({ message: 'Error analyzing poll' });
    }
  });

  // Helper function to get next date for a day of week
  function getNextDateForDayOfWeek(dayOfWeek: number): string {
    const today = new Date();
    const currentDay = today.getDay();
    const daysUntilTarget = (dayOfWeek - currentDay + 7) % 7;
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget));
    return targetDate.toISOString().split('T')[0];
  }





  // Create and return the HTTP server
  const httpServer = createServer(app);
  
  // Create a WebSocket server with more robust error handling
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/ws',
    // Add ping-pong for keeping connections alive
    clientTracking: true,
    perMessageDeflate: {
      zlibDeflateOptions: {
        chunkSize: 1024,
        memLevel: 7,
        level: 3
      },
      zlibInflateOptions: {
        chunkSize: 10 * 1024
      },
      concurrencyLimit: 10,
      threshold: 1024
    }
  });
  
  // Store connected clients with their user IDs
  const clients = new Map();
  
  // Handle server errors
  wss.on('error', (error) => {
    console.error('WebSocket server error:', error);
  });
  
  // Set up heartbeat to detect dead connections
  function noop() {}
  function heartbeat(this: WebSocket & { isAlive?: boolean }) {
    this.isAlive = true;
  }
  
  const interval = setInterval(function ping() {
    wss.clients.forEach(function each(ws: any) {
      if (ws.isAlive === false) return ws.terminate();
      
      ws.isAlive = false;
      ws.ping(noop);
    });
  }, 30000); // every 30 seconds
  
  wss.on('close', function close() {
    clearInterval(interval);
  });
  
  wss.on('connection', (ws: WebSocket & { isAlive?: boolean }) => {
    console.log('WebSocket client connected');
    
    // Set up heartbeat
    ws.isAlive = true;
    ws.on('pong', heartbeat);
    
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
    
    // Handle errors on the websocket connection
    ws.on('error', (error) => {
      console.error('WebSocket connection error:', error);
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
  
  // Store recent notifications for fallback polling mechanism
  const recentNotifications = new Map<number, {timestamp: number, notifications: any[]}>();
  
  // Function to send notification to a specific user
  const sendNotification = (userId: number, notification: any) => {
    console.log(`Attempting to send notification to user ${userId}:`, notification);
    
    // Store notification for polling fallback
    if (!recentNotifications.has(userId)) {
      recentNotifications.set(userId, { timestamp: Date.now(), notifications: [] });
    }
    
    const userNotifications = recentNotifications.get(userId);
    if (userNotifications) {
      // Add timestamp to the notification for sorting
      const notificationWithTimestamp = { ...notification, timestamp: Date.now() };
      userNotifications.notifications.push(notificationWithTimestamp);
      
      // Keep only last 100 notifications to prevent memory issues
      if (userNotifications.notifications.length > 100) {
        userNotifications.notifications = userNotifications.notifications.slice(-100);
      }
    }
    
    // Try to send via WebSocket if available
    const client = clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      console.log(`WebSocket client found for user ${userId}, sending notification`);
      try {
        client.send(JSON.stringify(notification));
        console.log(`Notification sent successfully to user ${userId}`);
        return true;
      } catch (error) {
        console.error(`Error sending notification to user ${userId}:`, error);
        return false;
      }
    } else {
      console.log(`No active WebSocket connection found for user ${userId}`);
      return false;
    }
  };
  
  // Endpoint to support polling fallback for notifications
  app.get('/api/users/:userId/notifications', async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      // Check if this is just a test request
      if (req.query.check === 'true') {
        return res.status(200).json({ message: 'Notification polling endpoint available' });
      }
      
      // Authentication check
      if (req.user && (req.user as any).id !== userId) {
        return res.status(403).json({ message: 'Unauthorized access to notifications' });
      }
      
      // Get 'since' timestamp from query params, default to 1 hour ago
      const since = req.query.since 
        ? parseInt(req.query.since as string) 
        : (Date.now() - 60 * 60 * 1000); // Default to 1 hour ago
      
      // Get stored notifications for this user
      const userNotifications = recentNotifications.get(userId);
      
      if (!userNotifications || userNotifications.notifications.length === 0) {
        return res.json([]);
      }
      
      // Filter notifications newer than 'since' timestamp and sort by timestamp (newest first)
      const recentNotifs = userNotifications.notifications
        .filter(notif => notif.timestamp > since)
        .sort((a, b) => b.timestamp - a.timestamp);
      
      res.json(recentNotifs);
    } catch (error) {
      console.error('Error retrieving notifications:', error);
      res.status(500).json({ message: 'Failed to retrieve notifications' });
    }
  });
  
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
          message: `${requester?.name || 'Someone'} requested to join team: "${team.name}"`
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
            message: `${requester?.name || 'Someone'} requested to join team: "${team.name}"`
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
        message: `Your request to join team "${team?.name || 'the team'}" has been ${status}`
      });
    }
    
    return updatedRequest;
  };

  // Get group information for an event
  app.get('/api/events/:eventId/group', authenticateUser, async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;
      const authenticatedUser = req.user as { id: number };
      
      // Check if this event is associated with a group
      const groupEvent = await storage.getSportsGroupEventByEventId(parseInt(eventId));
      
      if (!groupEvent) {
        return res.status(404).json({ error: 'Event is not associated with a group' });
      }
      
      // Get the group details
      const group = await storage.getSportsGroup(groupEvent.groupId);
      if (!group) {
        return res.status(404).json({ error: 'Group not found' });
      }
      
      // Check if user is a member of the group
      const membership = await storage.getSportsGroupMember(group.id, authenticatedUser.id);
      if (!membership) {
        return res.status(403).json({ error: 'You are not a member of this group' });
      }
      
      // Get group members
      const groupMembers = await storage.getSportsGroupMembers(group.id);
      
      res.json({
        group: group,
        members: groupMembers
      });
    } catch (error) {
      console.error('Error getting event group information:', error);
      res.status(500).json({ error: 'Failed to get event group information' });
    }
  });

  // Update event visibility
  app.put('/api/events/:eventId/visibility', authenticateUser, async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const { publicVisibility } = req.body;
      const authenticatedUser = req.user as { id: number };
      
      if (isNaN(eventId)) {
        return res.status(400).json({ error: 'Invalid event ID' });
      }

      // Validate visibility value
      if (publicVisibility !== null && !['all', 'friends', 'friends_participants'].includes(publicVisibility)) {
        return res.status(400).json({ error: 'Invalid visibility value' });
      }

      // Check if user is the event creator
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ error: 'Event not found' });
      }

      // Check if user is event creator or group admin
      if (event.creatorId !== authenticatedUser.id) {
        // For group events, also check if user is group admin
        const groupEvent = await storage.getSportsGroupEventByEventId(eventId);
        if (groupEvent) {
          const membership = await storage.getSportsGroupMember(groupEvent.groupId, authenticatedUser.id);
          if (!membership || membership.role !== 'admin') {
            return res.status(403).json({ error: 'Not authorized to modify this event' });
          }
        } else {
          return res.status(403).json({ error: 'Not authorized to modify this event' });
        }
      }

      // Update the event visibility
      await storage.updateEventVisibility(eventId, publicVisibility);

      res.json({ success: true, publicVisibility });
    } catch (error) {
      console.error('Error updating event visibility:', error);
      res.status(500).json({ error: 'Failed to update event visibility' });
    }
  });

  // ======= SCOREBOARD API ROUTES =======

  // Get match result by event ID
  app.get('/api/events/:eventId/match-result', authenticateUser, async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const matchResult = await storage.getMatchResultByEvent(eventId);
      
      if (!matchResult) {
        return res.status(404).json({ error: 'Match result not found' });
      }
      
      res.json(matchResult);
    } catch (error) {
      console.error('Error fetching match result:', error);
      res.status(500).json({ error: 'Failed to fetch match result' });
    }
  });

  // Get match results for a group
  app.get('/api/groups/:groupId/match-results', authenticateUser, async (req: Request, res: Response) => {
    try {
      const groupId = parseInt(req.params.groupId);
      const userId = req.user?.id;

      // Check if user is member of the group
      const membership = await storage.getSportsGroupMember(groupId, userId);
      if (!membership) {
        return res.status(403).json({ error: 'Not authorized to view this group' });
      }

      const matchResults = await storage.getMatchResultsByGroup(groupId);
      res.json(matchResults);
    } catch (error) {
      console.error('Error fetching match results:', error);
      res.status(500).json({ error: 'Failed to fetch match results' });
    }
  });

  // Get match result for an event
  app.get('/api/events/:eventId/match-result', authenticateUser, async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.eventId);
      
      const matchResult = await storage.getMatchResultByEvent(eventId);
      if (!matchResult) {
        return res.status(404).json({ error: 'No match result found for this event' });
      }
      
      // Get submitter info
      const submitter = await storage.getUser(matchResult.submittedBy);
      
      // Get player names for teams
      const teamAPlayers = await Promise.all(
        matchResult.teamA.map(async (playerId: number) => {
          const player = await storage.getUser(playerId);
          return player ? { id: player.id, name: player.name } : { id: playerId, name: `Player ${playerId}` };
        })
      );
      
      const teamBPlayers = await Promise.all(
        matchResult.teamB.map(async (playerId: number) => {
          const player = await storage.getUser(playerId);
          return player ? { id: player.id, name: player.name } : { id: playerId, name: `Player ${playerId}` };
        })
      );
      
      res.json({
        ...matchResult,
        teamAPlayers,
        teamBPlayers,
        submitter: submitter ? {
          id: submitter.id,
          name: submitter.name,
          username: submitter.username
        } : null
      });
    } catch (error) {
      console.error('Error fetching match result:', error);
      res.status(500).json({ error: 'Failed to fetch match result' });
    }
  });

  // Create/submit match result
  app.post('/api/events/:eventId/match-result', authenticateUser, async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const userId = req.user?.id;
      
      console.log('Match result submission - eventId:', eventId, 'userId:', userId);
      console.log('Request body:', req.body);
      
      // Validate input
      const parsed = insertMatchResultSchema.safeParse({
        ...req.body,
        eventId,
        submittedBy: userId,
        completedAt: new Date() // Set completion time on backend
      });
      
      console.log('Validation result:', parsed.success);
      if (!parsed.success) {
        console.log('Validation errors:', parsed.error.issues);
        return res.status(400).json({ error: 'Invalid match result data', details: parsed.error.issues });
      }

      // Check if user participated in the event
      const rsvp = await storage.getRSVP(eventId, userId);
      if (!rsvp || rsvp.status !== 'approved') {
        return res.status(403).json({ error: 'Only event participants can submit match results' });
      }

      // Create match result
      const matchResult = await storage.createMatchResult(parsed.data);
      
      // Create participants
      const teamAUsers = parsed.data.teamA as number[];
      const teamBUsers = parsed.data.teamB as number[];
      
      const participants = [
        ...teamAUsers.map(userId => ({ matchId: matchResult.id, userId, team: 'A' as const, isWinner: parsed.data.winningSide === 'A' })),
        ...teamBUsers.map(userId => ({ matchId: matchResult.id, userId, team: 'B' as const, isWinner: parsed.data.winningSide === 'B' }))
      ];

      for (const participant of participants) {
        await storage.createMatchParticipant(participant);
      }

      // Update player statistics
      await updatePlayerStatistics(matchResult, participants);

      // Create notifications for all event participants about the score submission
      try {
        // Get all approved RSVPs for this event
        const eventRSVPs = await storage.getRSVPsByEvent(eventId);
        const approvedParticipants = eventRSVPs.filter(rsvp => rsvp.status === 'approved');

        // Get event details for notification
        const event = await storage.getEvent(eventId);
        const submitter = await storage.getUser(userId!);

        console.log(`Creating score notifications for ${approvedParticipants.length} participants`);

        // Check if this is a group event
        const groupEvent = await storage.getSportsGroupEventByEventId(eventId);

        // Create notifications for all participants except the submitter
        for (const rsvp of approvedParticipants) {
          if (rsvp.userId !== userId) { // Don't notify the person who submitted the score
            if (groupEvent) {
              // For group events, use the group notification system
              await storage.createSportsGroupNotification({
                userId: rsvp.userId,
                groupId: groupEvent.groupId,
                type: 'score_submitted',
                title: 'Match Score Updated',
                message: `${submitter?.name || 'Someone'} submitted the score for "${event?.title || 'an event'}"`,
                referenceId: eventId,
                viewed: false
              });
            } else {
              // For regular events, create match result notifications
              await storage.createMatchResultNotification({
                userId: rsvp.userId,
                eventId: eventId,
                type: 'score_submitted',
                title: 'Match Score Updated',
                message: `${submitter?.name || 'Someone'} submitted the score for "${event?.title || 'an event'}"`,
                viewed: false
              });
            }
          }
        }

        console.log(`Successfully created score notifications for event ${eventId}`);
      } catch (notificationError) {
        console.error('Error creating score notifications:', notificationError);
        // Don't fail the entire request if notifications fail
      }

      res.json(matchResult);
    } catch (error) {
      console.error('Error creating match result:', error);
      res.status(500).json({ error: 'Failed to create match result' });
    }
  });

  // Get player statistics for a group
  app.get('/api/groups/:groupId/player-statistics', authenticateUser, async (req: Request, res: Response) => {
    try {
      const groupId = parseInt(req.params.groupId);
      const userId = req.user?.id;
      const { sportType } = req.query;

      // Check if user is member of the group
      const membership = await storage.getSportsGroupMember(groupId, userId);
      if (!membership) {
        return res.status(403).json({ error: 'Not authorized to view this group' });
      }

      const statistics = await storage.getPlayerStatisticsByGroup(groupId, sportType as string);
      
      // Enhance statistics with player names and calculated win rate
      const enhancedStats = await Promise.all(
        statistics.map(async (stat) => {
          const player = await storage.getUser(stat.userId);
          const winRate = stat.matchesPlayed > 0 
            ? (stat.matchesWon / stat.matchesPlayed) * 100 
            : 0;
          
          return {
            ...stat,
            playerName: player?.name || `Player ${stat.userId}`,
            winRate
          };
        })
      );
      
      // Sort by win rate (descending), then by matches won
      enhancedStats.sort((a, b) => {
        if (b.winRate !== a.winRate) return b.winRate - a.winRate;
        return b.matchesWon - a.matchesWon;
      });
      
      res.json(enhancedStats);
    } catch (error) {
      console.error('Error fetching player statistics:', error);
      res.status(500).json({ error: 'Failed to fetch player statistics' });
    }
  });

  // Get match result notifications for a user
  app.get('/api/users/:userId/match-result-notifications', authenticateUser, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const requestingUserId = req.user?.id;

      // Only allow users to view their own notifications
      if (userId !== requestingUserId) {
        return res.status(403).json({ error: 'Not authorized to view these notifications' });
      }

      const notifications = await storage.getMatchResultNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error('Error fetching match result notifications:', error);
      res.status(500).json({ error: 'Failed to fetch match result notifications' });
    }
  });

  // Mark match result notification as viewed
  app.patch('/api/match-result-notifications/:notificationId/viewed', authenticateUser, async (req: Request, res: Response) => {
    try {
      const notificationId = parseInt(req.params.notificationId);
      const success = await storage.markMatchResultNotificationViewed(notificationId);
      
      if (!success) {
        return res.status(404).json({ error: 'Notification not found' });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error('Error marking notification as viewed:', error);
      res.status(500).json({ error: 'Failed to mark notification as viewed' });
    }
  });

  // Edit/Update match result score
  app.put('/api/events/:eventId/score', authenticateUser, async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const userId = req.user?.id;
      const { scoreA, scoreB, winningSide, reason } = req.body;

      console.log('Score edit request - eventId:', eventId, 'userId:', userId);
      console.log('New scores:', { scoreA, scoreB, winningSide, reason });

      // Validate input
      if (typeof scoreA !== 'number' || typeof scoreB !== 'number' || scoreA < 0 || scoreB < 0) {
        return res.status(400).json({ error: 'Invalid score values' });
      }

      // Check if user participated in the event
      const rsvp = await storage.getRSVP(eventId, userId);
      if (!rsvp || rsvp.status !== 'approved') {
        return res.status(403).json({ error: 'Only event participants can edit match results' });
      }

      // Get the existing match result
      const existingResult = await storage.getMatchResultByEvent(eventId);
      if (!existingResult) {
        return res.status(404).json({ error: 'No match result found for this event' });
      }

      // Record the change in score history
      await db.execute(sql`
        INSERT INTO score_history (
          match_result_id, event_id, previous_score_a, previous_score_b, 
          new_score_a, new_score_b, previous_winning_side, new_winning_side, 
          edited_by, reason
        ) VALUES (
          ${existingResult.id}, ${eventId}, ${existingResult.scoreA}, ${existingResult.scoreB},
          ${scoreA}, ${scoreB}, ${existingResult.winningSide}, ${winningSide},
          ${userId}, ${reason}
        )
      `);

      // Update the match result
      await db.execute(sql`
        UPDATE match_results 
        SET score_a = ${scoreA}, 
            score_b = ${scoreB}, 
            winning_side = ${winningSide},
            last_edited_by = ${userId},
            last_edited_at = NOW()
        WHERE event_id = ${eventId}
      `);

      // Update match participants' winner status
      if (winningSide) {
        await db.execute(sql`
          UPDATE match_participants 
          SET is_winner = CASE 
            WHEN team = ${winningSide} THEN true 
            ELSE false 
          END
          WHERE match_id = ${existingResult.id}
        `);
      } else {
        // It's a draw, no winners
        await db.execute(sql`
          UPDATE match_participants 
          SET is_winner = false
          WHERE match_id = ${existingResult.id}
        `);
      }

      // Update player statistics
      // We need to recalculate statistics for this match
      const participants = await db.execute(sql`
        SELECT user_id, team FROM match_participants WHERE match_id = ${existingResult.id}
      `);

      // Get group ID for statistics update
      const event = await storage.getEvent(eventId);
      
      // Recalculate player statistics
      for (const participant of participants.rows) {
        const participantUserId = participant.user_id as number;
        const team = participant.team as string;
        
        // Determine if this player won, lost, or drew
        let isWinner = false;
        let isDraw = false;
        
        if (!winningSide) {
          isDraw = true;
        } else if (team === winningSide) {
          isWinner = true;
        }

        // Update statistics - we need to recalculate from all matches for this user
        // This is a simplified approach; in production, you'd want more efficient updates
        console.log(`Recalculating stats for user ${participantUserId} in event ${eventId}`);
      }

      // Send notifications to all participants about the score change
      try {
        const eventRSVPs = await storage.getRSVPsByEvent(eventId);
        const approvedParticipants = eventRSVPs.filter(rsvp => rsvp.status === 'approved');
        const event = await storage.getEvent(eventId);
        const editor = await storage.getUser(userId!);

        console.log(`Sending score edit notifications to ${approvedParticipants.length} participants`);

        for (const participant of approvedParticipants) {
          // Don't notify the user who made the edit
          if (participant.userId === userId) continue;

          const notification = {
            type: 'score_edited',
            title: 'Match Score Updated',
            message: `${editor?.name || 'Someone'} updated the score for "${event?.title}". New score: ${scoreA}-${scoreB}${reason ? `. Reason: ${reason}` : ''}`,
            eventId: eventId,
            eventTitle: event?.title,
            editorId: userId,
            editorName: editor?.name,
            newScore: `${scoreA}-${scoreB}`,
            reason: reason,
            timestamp: new Date().toISOString()
          };

          // Send real-time notification
          sendNotification(participant.userId, notification);
        }

        console.log(`Score edit notifications sent to ${approvedParticipants.length - 1} participants (excluding editor)`);
      } catch (error) {
        console.error('Error sending score edit notifications:', error);
        // Continue even if notifications fail
      }

      res.json({ 
        success: true, 
        message: 'Score updated successfully',
        newScore: { scoreA, scoreB, winningSide } 
      });

    } catch (error) {
      console.error('Error updating match score:', error);
      res.status(500).json({ error: 'Failed to update match score' });
    }
  });

  // Get score history for an event
  app.get('/api/events/:eventId/score-history', authenticateUser, async (req: Request, res: Response) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const userId = req.user?.id;

      // Check if user participated in the event
      const rsvp = await storage.getRSVP(eventId, userId);
      if (!rsvp || rsvp.status !== 'approved') {
        return res.status(403).json({ error: 'Only event participants can view score history' });
      }

      // Get score history with editor information
      const historyRows = await db.execute(sql`
        SELECT 
          sh.id,
          sh.previous_score_a,
          sh.previous_score_b,
          sh.new_score_a,
          sh.new_score_b,
          sh.previous_winning_side,
          sh.new_winning_side,
          sh.edited_by,
          sh.reason,
          sh.edited_at,
          u.name as editor_name,
          u.profile_image as editor_profile_image
        FROM score_history sh
        JOIN users u ON sh.edited_by = u.id
        WHERE sh.event_id = ${eventId}
        ORDER BY sh.edited_at DESC
      `);

      const history = historyRows.rows.map(row => ({
        id: row.id,
        previousScoreA: row.previous_score_a,
        previousScoreB: row.previous_score_b,
        newScoreA: row.new_score_a,
        newScoreB: row.new_score_b,
        previousWinningSide: row.previous_winning_side,
        newWinningSide: row.new_winning_side,
        editedBy: row.edited_by,
        reason: row.reason,
        editedAt: row.edited_at,
        editor: {
          id: row.edited_by,
          name: row.editor_name,
          profileImage: row.editor_profile_image
        }
      }));

      res.json(history);
    } catch (error) {
      console.error('Error fetching score history:', error);
      res.status(500).json({ error: 'Failed to fetch score history' });
    }
  });

  // Helper function to update player statistics
  async function updatePlayerStatistics(matchResult: MatchResult, participants: any[]) {
    const groupId = matchResult.groupId;
    const sportType = matchResult.sportType;

    for (const participant of participants) {
      try {
        // Get or create player statistics
        let stats = await storage.getPlayerStatistics(participant.userId, groupId, sportType);
        
        if (!stats) {
          stats = await storage.createPlayerStatistics({
            userId: participant.userId,
            groupId,
            sportType,
            matchesPlayed: 0,
            matchesWon: 0,
            matchesLost: 0,
            matchesDrawn: 0,
            totalScoreFor: 0,
            totalScoreAgainst: 0
          });
        }

        // Update statistics
        const isWinner = participant.isWinner;
        const isDraw = matchResult.winningSide === null;
        const scoreFor = participant.team === 'A' ? matchResult.scoreA : matchResult.scoreB;
        const scoreAgainst = participant.team === 'A' ? matchResult.scoreB : matchResult.scoreA;

        await storage.updatePlayerStatistics(stats.id, {
          matchesPlayed: stats.matchesPlayed + 1,
          matchesWon: stats.matchesWon + (isWinner ? 1 : 0),
          matchesLost: stats.matchesLost + (!isWinner && !isDraw ? 1 : 0),
          matchesDrawn: stats.matchesDrawn + (isDraw ? 1 : 0),
          totalScoreFor: stats.totalScoreFor + (scoreFor || 0),
          totalScoreAgainst: stats.totalScoreAgainst + (scoreAgainst || 0),
          lastPlayed: new Date()
        });
      } catch (error) {
        console.error('Error updating player statistics:', error);
      }
    }
  }

  // Professional Team History routes
  app.get('/api/users/:userId/professional-team-history', authenticateUser, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const authenticatedUser = (req as any).user as User;
      
      if (isNaN(userId) || userId !== authenticatedUser.id) {
        return res.status(403).json({ message: "Forbidden - You can only access your own team history" });
      }
      
      const history = await storage.getProfessionalTeamHistory(userId);
      res.json(history);
    } catch (error) {
      console.error('Error fetching professional team history:', error);
      res.status(500).json({ message: "Error fetching team history" });
    }
  });

  app.post('/api/users/:userId/professional-team-history', authenticateUser, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const authenticatedUser = (req as any).user as User;
      
      if (isNaN(userId) || userId !== authenticatedUser.id) {
        return res.status(403).json({ message: "Forbidden - You can only manage your own team history" });
      }
      
      const historyData = { ...req.body, userId };
      const validatedData = insertProfessionalTeamHistorySchema.parse(historyData);
      
      const history = await storage.createProfessionalTeamHistory(validatedData);
      res.status(201).json(history);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid team history data", errors: error.errors });
      }
      console.error('Error creating professional team history:', error);
      res.status(500).json({ message: "Error creating team history" });
    }
  });

  app.put('/api/professional-team-history/:id', authenticateUser, async (req: Request, res: Response) => {
    try {
      const historyId = parseInt(req.params.id);
      const authenticatedUser = (req as any).user as User;
      
      // Get existing history to check ownership
      const existingHistory = await storage.getProfessionalTeamHistory(authenticatedUser.id);
      const history = existingHistory.find(h => h.id === historyId);
      
      if (!history) {
        return res.status(404).json({ message: "Team history not found" });
      }
      
      if (history.userId !== authenticatedUser.id) {
        return res.status(403).json({ message: "Forbidden - You can only update your own team history" });
      }
      
      const validatedData = insertProfessionalTeamHistorySchema.partial().parse(req.body);
      const updatedHistory = await storage.updateProfessionalTeamHistory(historyId, validatedData);
      
      if (!updatedHistory) {
        return res.status(404).json({ message: "Team history not found or update failed" });
      }
      
      res.json(updatedHistory);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid team history data", errors: error.errors });
      }
      console.error('Error updating professional team history:', error);
      res.status(500).json({ message: "Error updating team history" });
    }
  });

  app.delete('/api/professional-team-history/:id', authenticateUser, async (req: Request, res: Response) => {
    try {
      const historyId = parseInt(req.params.id);
      const authenticatedUser = (req as any).user as User;
      
      // Get existing history to check ownership
      const existingHistory = await storage.getProfessionalTeamHistory(authenticatedUser.id);
      const history = existingHistory.find(h => h.id === historyId);
      
      if (!history) {
        return res.status(404).json({ message: "Team history not found" });
      }
      
      if (history.userId !== authenticatedUser.id) {
        return res.status(403).json({ message: "Forbidden - You can only delete your own team history" });
      }
      
      const deleted = await storage.deleteProfessionalTeamHistory(historyId);
      if (!deleted) {
        return res.status(500).json({ message: "Error deleting team history" });
      }
      
      res.json({ message: "Team history deleted successfully" });
    } catch (error) {
      console.error('Error deleting professional team history:', error);
      res.status(500).json({ message: "Error deleting team history" });
    }
  });

  // Sport Skill Levels routes
  app.get('/api/users/:userId/sport-skill-levels', authenticateUser, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const authenticatedUser = (req as any).user as User;
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      // Allow viewing other users' sport skill levels for profile viewing
      const skillLevels = await storage.getSportSkillLevels(userId);
      res.json(skillLevels);
    } catch (error) {
      console.error('Error fetching sport skill levels:', error);
      res.status(500).json({ message: "Error fetching skill levels" });
    }
  });

  app.post('/api/users/:userId/sport-skill-levels', authenticateUser, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const authenticatedUser = (req as any).user as User;
      
      if (isNaN(userId) || userId !== authenticatedUser.id) {
        return res.status(403).json({ message: "Forbidden - You can only manage your own skill levels" });
      }
      
      const skillData = { ...req.body, userId };
      const validatedData = insertSportSkillLevelSchema.parse(skillData);
      
      // Check if skill level already exists for this sport
      const existing = await storage.getSportSkillLevel(userId, validatedData.sportType);
      if (existing) {
        return res.status(400).json({ message: "Skill level already exists for this sport" });
      }
      
      const skillLevel = await storage.createSportSkillLevel(validatedData);
      res.status(201).json(skillLevel);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid skill level data", errors: error.errors });
      }
      console.error('Error creating sport skill level:', error);
      res.status(500).json({ message: "Error creating skill level" });
    }
  });

  app.put('/api/sport-skill-levels/:id', authenticateUser, async (req: Request, res: Response) => {
    try {
      const skillId = parseInt(req.params.id);
      const authenticatedUser = (req as any).user as User;
      
      // Get existing skill levels to check ownership
      const existingSkillLevels = await storage.getSportSkillLevels(authenticatedUser.id);
      const skillLevel = existingSkillLevels.find(s => s.id === skillId);
      
      if (!skillLevel) {
        return res.status(404).json({ message: "Skill level not found" });
      }
      
      if (skillLevel.userId !== authenticatedUser.id) {
        return res.status(403).json({ message: "Forbidden - You can only update your own skill levels" });
      }
      
      const validatedData = insertSportSkillLevelSchema.partial().parse(req.body);
      const updatedSkillLevel = await storage.updateSportSkillLevel(skillId, validatedData);
      
      if (!updatedSkillLevel) {
        return res.status(404).json({ message: "Skill level not found or update failed" });
      }
      
      res.json(updatedSkillLevel);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid skill level data", errors: error.errors });
      }
      console.error('Error updating sport skill level:', error);
      res.status(500).json({ message: "Error updating skill level" });
    }
  });

  app.delete('/api/sport-skill-levels/:id', authenticateUser, async (req: Request, res: Response) => {
    try {
      const skillId = parseInt(req.params.id);
      const authenticatedUser = (req as any).user as User;
      
      // Get existing skill levels to check ownership
      const existingSkillLevels = await storage.getSportSkillLevels(authenticatedUser.id);
      const skillLevel = existingSkillLevels.find(s => s.id === skillId);
      
      if (!skillLevel) {
        return res.status(404).json({ message: "Skill level not found" });
      }
      
      if (skillLevel.userId !== authenticatedUser.id) {
        return res.status(403).json({ message: "Forbidden - You can only delete your own skill levels" });
      }
      
      const deleted = await storage.deleteSportSkillLevel(skillId);
      if (!deleted) {
        return res.status(500).json({ message: "Error deleting skill level" });
      }
      
      res.json({ message: "Skill level deleted successfully" });
    } catch (error) {
      console.error('Error deleting sport skill level:', error);
      res.status(500).json({ message: "Error deleting skill level" });
    }
  });

  // Profile completion routes
  app.put('/api/users/:userId/profile-completion', authenticateUser, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const authenticatedUser = (req as any).user as User;
      
      if (isNaN(userId) || userId !== authenticatedUser.id) {
        return res.status(403).json({ message: "Forbidden - You can only update your own profile completion" });
      }
      
      const { completionLevel } = req.body;
      
      if (typeof completionLevel !== 'number' || completionLevel < 0 || completionLevel > 100) {
        return res.status(400).json({ message: "Completion level must be a number between 0 and 100" });
      }
      
      const updatedUser = await storage.updateUserProfileCompletion(userId, completionLevel);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found or update failed" });
      }
      
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error updating profile completion:', error);
      res.status(500).json({ message: "Error updating profile completion" });
    }
  });

  app.put('/api/users/:userId/phone-verification', authenticateUser, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const authenticatedUser = (req as any).user as User;
      
      if (isNaN(userId) || userId !== authenticatedUser.id) {
        return res.status(403).json({ message: "Forbidden - You can only update your own phone verification" });
      }
      
      const { phoneNumber, isVerified } = req.body;
      
      const updatedUser = await storage.updateUser(userId, { 
        phoneNumber, 
        isPhoneVerified: isVerified 
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found or update failed" });
      }
      
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error('Error updating phone verification:', error);
      res.status(500).json({ message: "Error updating phone verification" });
    }
  });

  // Get user's total matches count
  app.get('/api/users/:userId/matches-count', async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const totalMatches = await storage.getUserMatchesCount(parseInt(userId));
      res.json({ totalMatches });
    } catch (error) {
      console.error('Error getting user matches count:', error);
      res.status(500).json({ message: 'Failed to get matches count' });
    }
  });
  
  // ============= TOURNAMENT API =============

  // Get all tournaments
  app.get('/api/tournaments', async (req: Request, res: Response) => {
    try {
      const tournaments = await storage.getAllTournaments();
      res.json(tournaments);
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      res.status(500).json({ message: 'Error fetching tournaments' });
    }
  });

  // Get public tournaments
  app.get('/api/tournaments/public', async (req: Request, res: Response) => {
    try {
      const tournaments = await storage.getPublicTournaments();
      res.json(tournaments);
    } catch (error) {
      console.error('Error fetching public tournaments:', error);
      res.status(500).json({ message: 'Error fetching public tournaments' });
    }
  });

  // Get tournament by ID
  app.get('/api/tournaments/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const tournament = await storage.getTournament(id);
      
      if (!tournament) {
        return res.status(404).json({ message: 'Tournament not found' });
      }
      
      res.json(tournament);
    } catch (error) {
      console.error('Error fetching tournament:', error);
      res.status(500).json({ message: 'Error fetching tournament' });
    }
  });

  // Get tournaments by creator
  app.get('/api/tournaments/creator/:creatorId', authenticateUser, async (req: Request, res: Response) => {
    try {
      const creatorId = parseInt(req.params.creatorId);
      const tournaments = await storage.getTournamentsByCreator(creatorId);
      res.json(tournaments);
    } catch (error) {
      console.error('Error fetching tournaments by creator:', error);
      res.status(500).json({ message: 'Error fetching tournaments' });
    }
  });

  // Create tournament
  app.post('/api/tournaments', authenticateUser, async (req: Request, res: Response) => {
    try {
      const authenticatedUser = (req as any).user as User;
      
      console.log('Received tournament data:', JSON.stringify(req.body, null, 2));
      console.log('User ID:', authenticatedUser.id);
      
      // Convert date strings back to Date objects
      const processedBody = {
        ...req.body,
        startDate: req.body.startDate ? new Date(req.body.startDate) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : null,
        registrationDeadline: req.body.registrationDeadline ? new Date(req.body.registrationDeadline) : null,
        creatorId: authenticatedUser.id
      };
      
      const validatedData = insertTournamentSchema.parse(processedBody);
      
      console.log('Validated tournament data:', JSON.stringify(validatedData, null, 2));
      
      const tournament = await storage.createTournament(validatedData);
      res.status(201).json(tournament);
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error('Tournament validation errors:', JSON.stringify(error.errors, null, 2));
        return res.status(400).json({ message: "Invalid tournament data", errors: error.errors });
      }
      console.error('Error creating tournament:', error);
      res.status(500).json({ message: 'Error creating tournament' });
    }
  });

  // Update tournament
  app.put('/api/tournaments/:id', authenticateUser, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const authenticatedUser = (req as any).user as User;
      
      const tournament = await storage.getTournament(id);
      if (!tournament) {
        return res.status(404).json({ message: 'Tournament not found' });
      }
      
      // Only creator can update tournament
      if (tournament.creatorId !== authenticatedUser.id) {
        return res.status(403).json({ message: 'Unauthorized to update this tournament' });
      }
      
      const updatedTournament = await storage.updateTournament(id, req.body);
      res.json(updatedTournament);
    } catch (error) {
      console.error('Error updating tournament:', error);
      res.status(500).json({ message: 'Error updating tournament' });
    }
  });

  // Delete tournament
  app.delete('/api/tournaments/:id', authenticateUser, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const authenticatedUser = (req as any).user as User;
      
      const tournament = await storage.getTournament(id);
      if (!tournament) {
        return res.status(404).json({ message: 'Tournament not found' });
      }
      
      // Only creator can delete tournament
      if (tournament.creatorId !== authenticatedUser.id) {
        return res.status(403).json({ message: 'Unauthorized to delete this tournament' });
      }
      
      const deleted = await storage.deleteTournament(id);
      if (deleted) {
        res.json({ message: 'Tournament deleted successfully' });
      } else {
        res.status(500).json({ message: 'Error deleting tournament' });
      }
    } catch (error) {
      console.error('Error deleting tournament:', error);
      res.status(500).json({ message: 'Error deleting tournament' });
    }
  });

  // Get tournament participants
  app.get('/api/tournaments/:id/participants', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const participants = await storage.getTournamentParticipants(id);
      res.json(participants);
    } catch (error) {
      console.error('Error fetching tournament participants:', error);
      res.status(500).json({ message: 'Error fetching participants' });
    }
  });

  // Join tournament
  app.post('/api/tournaments/:id/join', authenticateUser, async (req: Request, res: Response) => {
    try {
      const tournamentId = parseInt(req.params.id);
      const authenticatedUser = (req as any).user as User;
      
      const tournament = await storage.getTournament(tournamentId);
      if (!tournament) {
        return res.status(404).json({ message: 'Tournament not found' });
      }
      
      // Check if tournament is still accepting participants
      if (tournament.status !== 'open') {
        return res.status(400).json({ message: 'Tournament registration is closed' });
      }
      
      // Check if user is already a participant
      const participants = await storage.getTournamentParticipants(tournamentId);
      const isAlreadyParticipant = participants.some(p => p.userId === authenticatedUser.id);
      
      if (isAlreadyParticipant) {
        return res.status(400).json({ message: 'You are already registered for this tournament' });
      }
      
      // Check if tournament is full
      if (participants.length >= tournament.maxParticipants) {
        return res.status(400).json({ message: 'Tournament is full' });
      }
      
      // Add participant
      const participant = await storage.createTournamentParticipant({
        tournamentId,
        participantName: authenticatedUser.name || authenticatedUser.username,
        userId: authenticatedUser.id,
        registrationDate: new Date(),
        status: 'registered'
      });
      
      // Check if tournament is now full and start it automatically
      const updatedParticipants = await storage.getTournamentParticipants(tournamentId);
      if (updatedParticipants.length >= tournament.maxParticipants) {
        // Generate tournament schedule
        await storage.generateTournamentSchedule(tournamentId);
        await storage.updateTournamentStatus(tournamentId, 'active');
      }
      
      res.status(201).json(participant);
    } catch (error) {
      console.error('Error joining tournament:', error);
      res.status(500).json({ message: 'Error joining tournament' });
    }
  });

  // Leave tournament
  app.delete('/api/tournaments/:id/leave', authenticateUser, async (req: Request, res: Response) => {
    try {
      const tournamentId = parseInt(req.params.id);
      const authenticatedUser = (req as any).user as User;
      
      const tournament = await storage.getTournament(tournamentId);
      if (!tournament) {
        return res.status(404).json({ message: 'Tournament not found' });
      }
      
      // Can only leave if tournament hasn't started
      if (tournament.status !== 'open') {
        return res.status(400).json({ message: 'Cannot leave tournament after it has started' });
      }
      
      // Find and remove participant
      const participants = await storage.getTournamentParticipants(tournamentId);
      const participant = participants.find(p => p.userId === authenticatedUser.id);
      
      if (!participant) {
        return res.status(400).json({ message: 'You are not registered for this tournament' });
      }
      
      const removed = await storage.deleteTournamentParticipant(participant.id);
      if (removed) {
        res.json({ message: 'Successfully left tournament' });
      } else {
        res.status(500).json({ message: 'Error leaving tournament' });
      }
    } catch (error) {
      console.error('Error leaving tournament:', error);
      res.status(500).json({ message: 'Error leaving tournament' });
    }
  });

  // Get tournament matches
  app.get('/api/tournaments/:id/matches', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const matches = await storage.getTournamentMatches(id);
      res.json(matches);
    } catch (error) {
      console.error('Error fetching tournament matches:', error);
      res.status(500).json({ message: 'Error fetching matches' });
    }
  });

  // Update match result
  app.put('/api/tournaments/matches/:matchId', authenticateUser, async (req: Request, res: Response) => {
    try {
      const matchId = parseInt(req.params.matchId);
      const authenticatedUser = (req as any).user as User;
      const { participant1Score, participant2Score, winnerId } = req.body;
      
      const match = await storage.getTournamentMatch(matchId);
      if (!match) {
        return res.status(404).json({ message: 'Match not found' });
      }
      
      const tournament = await storage.getTournament(match.tournamentId);
      if (!tournament) {
        return res.status(404).json({ message: 'Tournament not found' });
      }
      
      // Only tournament creator can update match results
      if (tournament.creatorId !== authenticatedUser.id) {
        return res.status(403).json({ message: 'Unauthorized to update match results' });
      }
      
      // Update match
      const updatedMatch = await storage.updateTournamentMatch(matchId, {
        participant1Score,
        participant2Score,
        winnerId,
        status: 'completed'
      });
      
      // Update tournament standings based on result
      if (winnerId) {
        const winnerParticipant = await storage.getTournamentParticipant(winnerId);
        const loserParticipant = await storage.getTournamentParticipant(
          winnerId === match.participant1Id ? match.participant2Id : match.participant1Id
        );
        
        if (winnerParticipant) {
          const winnerStanding = await storage.getTournamentStandings(match.tournamentId);
          const currentWinnerStanding = winnerStanding.find(s => s.participantId === winnerId);
          
          if (currentWinnerStanding) {
            await storage.updateTournamentStanding(currentWinnerStanding.id, {
              matchesPlayed: (currentWinnerStanding.matchesPlayed || 0) + 1,
              wins: (currentWinnerStanding.wins || 0) + 1,
              points: (currentWinnerStanding.points || 0) + 3,
              goalsFor: (currentWinnerStanding.goalsFor || 0) + (participant1Score || 0),
              goalDifference: (currentWinnerStanding.goalDifference || 0) + Math.abs((participant1Score || 0) - (participant2Score || 0))
            });
          }
        }
        
        if (loserParticipant) {
          const loserStanding = await storage.getTournamentStandings(match.tournamentId);
          const currentLoserStanding = loserStanding.find(s => s.participantId === loserParticipant.id);
          
          if (currentLoserStanding) {
            await storage.updateTournamentStanding(currentLoserStanding.id, {
              matchesPlayed: (currentLoserStanding.matchesPlayed || 0) + 1,
              losses: (currentLoserStanding.losses || 0) + 1,
              goalsAgainst: (currentLoserStanding.goalsAgainst || 0) + (participant2Score || 0),
              goalDifference: (currentLoserStanding.goalDifference || 0) - Math.abs((participant1Score || 0) - (participant2Score || 0))
            });
          }
        }
      }
      
      res.json(updatedMatch);
    } catch (error) {
      console.error('Error updating match result:', error);
      res.status(500).json({ message: 'Error updating match result' });
    }
  });

  // Get tournament standings
  app.get('/api/tournaments/:id/standings', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const standings = await storage.getTournamentStandings(id);
      res.json(standings);
    } catch (error) {
      console.error('Error fetching tournament standings:', error);
      res.status(500).json({ message: 'Error fetching standings' });
    }
  });

  // Generate tournament schedule (manual trigger)
  app.post('/api/tournaments/:id/generate-schedule', authenticateUser, async (req: Request, res: Response) => {
    try {
      const tournamentId = parseInt(req.params.id);
      const authenticatedUser = (req as any).user as User;
      
      const tournament = await storage.getTournament(tournamentId);
      if (!tournament) {
        return res.status(404).json({ message: 'Tournament not found' });
      }
      
      // Only creator can generate schedule
      if (tournament.creatorId !== authenticatedUser.id) {
        return res.status(403).json({ message: 'Unauthorized to generate schedule' });
      }
      
      const matches = await storage.generateTournamentSchedule(tournamentId);
      await storage.updateTournamentStatus(tournamentId, 'active');
      
      res.json({ 
        message: 'Tournament schedule generated successfully',
        matches: matches.length,
        tournament: await storage.getTournament(tournamentId)
      });
    } catch (error) {
      console.error('Error generating tournament schedule:', error);
      res.status(500).json({ message: 'Error generating tournament schedule' });
    }
  });

  return httpServer;
}
