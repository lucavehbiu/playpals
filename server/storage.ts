import { 
  users, type User, type InsertUser, 
  events, type Event, type InsertEvent,
  rsvps, type RSVP, type InsertRSVP
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

// Storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  
  // Event methods
  getEvent(id: number): Promise<Event | undefined>;
  getEventsByCreator(creatorId: number): Promise<Event[]>;
  getPublicEvents(): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, eventData: Partial<Event>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;
  
  // RSVP methods
  getRSVP(eventId: number, userId: number): Promise<RSVP | undefined>;
  getRSVPsByEvent(eventId: number): Promise<RSVP[]>;
  getRSVPsByUser(userId: number): Promise<RSVP[]>;
  createRSVP(rsvp: InsertRSVP): Promise<RSVP>;
  updateRSVP(id: number, rsvpData: Partial<RSVP>): Promise<RSVP | undefined>;
  deleteRSVP(id: number): Promise<boolean>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private events: Map<number, Event>;
  private rsvps: Map<number, RSVP>;
  private userIdCounter: number;
  private eventIdCounter: number;
  private rsvpIdCounter: number;

  constructor() {
    this.users = new Map();
    this.events = new Map();
    this.rsvps = new Map();
    this.userIdCounter = 1;
    this.eventIdCounter = 1;
    this.rsvpIdCounter = 1;
    
    // Initialize with sample data for development
    this.initSampleData();
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const now = new Date();
    const user: User = { ...insertUser, id, createdAt: now };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Event methods
  async getEvent(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async getEventsByCreator(creatorId: number): Promise<Event[]> {
    return Array.from(this.events.values()).filter(
      (event) => event.creatorId === creatorId
    );
  }

  async getPublicEvents(): Promise<Event[]> {
    return Array.from(this.events.values()).filter(
      (event) => event.isPublic
    );
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = this.eventIdCounter++;
    const now = new Date();
    const event: Event = { 
      ...insertEvent, 
      id, 
      createdAt: now,
      currentParticipants: 1 // Creator is automatically a participant
    };
    this.events.set(id, event);
    return event;
  }

  async updateEvent(id: number, eventData: Partial<Event>): Promise<Event | undefined> {
    const event = this.events.get(id);
    if (!event) return undefined;
    
    const updatedEvent = { ...event, ...eventData };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }

  async deleteEvent(id: number): Promise<boolean> {
    return this.events.delete(id);
  }

  // RSVP methods
  async getRSVP(eventId: number, userId: number): Promise<RSVP | undefined> {
    return Array.from(this.rsvps.values()).find(
      (rsvp) => rsvp.eventId === eventId && rsvp.userId === userId
    );
  }

  async getRSVPsByEvent(eventId: number): Promise<RSVP[]> {
    return Array.from(this.rsvps.values()).filter(
      (rsvp) => rsvp.eventId === eventId
    );
  }

  async getRSVPsByUser(userId: number): Promise<RSVP[]> {
    return Array.from(this.rsvps.values()).filter(
      (rsvp) => rsvp.userId === userId
    );
  }

  async createRSVP(insertRSVP: InsertRSVP): Promise<RSVP> {
    const id = this.rsvpIdCounter++;
    const now = new Date();
    const rsvp: RSVP = { ...insertRSVP, id, createdAt: now };
    this.rsvps.set(id, rsvp);
    
    // If approved, update event participant count
    if (insertRSVP.status === "approved") {
      const event = await this.getEvent(insertRSVP.eventId);
      if (event) {
        await this.updateEvent(event.id, {
          currentParticipants: event.currentParticipants + 1
        });
      }
    }
    
    return rsvp;
  }

  async updateRSVP(id: number, rsvpData: Partial<RSVP>): Promise<RSVP | undefined> {
    const rsvp = this.rsvps.get(id);
    if (!rsvp) return undefined;
    
    const updatedRSVP = { ...rsvp, ...rsvpData };
    this.rsvps.set(id, updatedRSVP);
    
    // Handle participant count update if status changed
    if (rsvpData.status) {
      const event = await this.getEvent(rsvp.eventId);
      if (event) {
        if (rsvp.status !== "approved" && rsvpData.status === "approved") {
          // New approval, increment count
          await this.updateEvent(event.id, {
            currentParticipants: event.currentParticipants + 1
          });
        } else if (rsvp.status === "approved" && rsvpData.status !== "approved") {
          // Removed approval, decrement count
          await this.updateEvent(event.id, {
            currentParticipants: Math.max(1, event.currentParticipants - 1)
          });
        }
      }
    }
    
    return updatedRSVP;
  }

  async deleteRSVP(id: number): Promise<boolean> {
    const rsvp = this.rsvps.get(id);
    if (rsvp && rsvp.status === "approved") {
      // Update participant count if removing an approved RSVP
      const event = await this.getEvent(rsvp.eventId);
      if (event) {
        await this.updateEvent(event.id, {
          currentParticipants: Math.max(1, event.currentParticipants - 1)
        });
      }
    }
    
    return this.rsvps.delete(id);
  }

  // Initialize with sample data
  private initSampleData() {
    // Create sample user
    const sampleUser: InsertUser = {
      username: "alexsmith",
      password: "password123", // In a real app, this would be hashed
      name: "Alex Smith",
      email: "alex@example.com",
      profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      bio: "Sports enthusiast and community organizer"
    };
    this.createUser(sampleUser).then(user => {
      // Create sample events for this user
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      const nextDay = new Date();
      nextDay.setDate(nextDay.getDate() + 1);
      
      const basketballEvent: InsertEvent = {
        title: "Weekend Basketball Pickup Game",
        description: "Join us for a casual basketball game at the park. All skill levels welcome!",
        sportType: "basketball",
        date: nextWeek,
        location: "Central Park Basketball Court",
        maxParticipants: 12,
        isPublic: true,
        isFree: true,
        creatorId: user.id,
        eventImage: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
      };
      
      const soccerEvent: InsertEvent = {
        title: "Thursday Evening Soccer Match",
        description: "Weekly soccer match at Riverside fields. Bring water and appropriate footwear.",
        sportType: "soccer",
        date: nextDay,
        location: "Riverside Soccer Fields",
        maxParticipants: 22,
        isPublic: true,
        isFree: true,
        creatorId: user.id,
        eventImage: "https://images.unsplash.com/photo-1529551739587-e242c564f727?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
      };
      
      const tennisEvent: InsertEvent = {
        title: "Sunday Tennis Club",
        description: "Regular Sunday morning tennis session. Singles and doubles play.",
        sportType: "tennis",
        date: nextWeek,
        location: "City Tennis Center",
        maxParticipants: 8,
        isPublic: true,
        isFree: true,
        creatorId: user.id,
        eventImage: "https://images.unsplash.com/photo-1530549387789-4c1017266635?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
      };
      
      this.createEvent(basketballEvent);
      this.createEvent(soccerEvent);
      this.createEvent(tennisEvent);
      
      // Create some discoverable events from other users
      const secondUser: InsertUser = {
        username: "sarahjohnson",
        password: "password123",
        name: "Sarah Johnson",
        email: "sarah@example.com",
        profileImage: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&h=256&q=80",
        bio: "Volleyball enthusiast"
      };
      
      this.createUser(secondUser).then(user2 => {
        const volleyballEvent: InsertEvent = {
          title: "Beach Volleyball Meetup",
          description: "Casual beach volleyball games every Saturday afternoon.",
          sportType: "volleyball",
          date: nextWeek,
          location: "Ocean Beach Volleyball Courts",
          maxParticipants: 12,
          isPublic: true,
          isFree: true,
          creatorId: user2.id,
          eventImage: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
        };
        
        this.createEvent(volleyballEvent);
      });
      
      const thirdUser: InsertUser = {
        username: "markwilson",
        password: "password123",
        name: "Mark Wilson",
        email: "mark@example.com",
        profileImage: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&h=256&q=80",
        bio: "Cycling enthusiast"
      };
      
      this.createUser(thirdUser).then(user3 => {
        const cyclingEvent: InsertEvent = {
          title: "City Park Morning Ride",
          description: "Early morning cycling through scenic routes in the city park.",
          sportType: "cycling",
          date: nextDay,
          location: "City Park East Entrance",
          maxParticipants: 20,
          isPublic: true,
          isFree: true,
          creatorId: user3.id,
          eventImage: "https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
        };
        
        this.createEvent(cyclingEvent);
      });
      
      const fourthUser: InsertUser = {
        username: "emmadavis",
        password: "password123",
        name: "Emma Davis",
        email: "emma@example.com",
        profileImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&h=256&q=80",
        bio: "Yoga instructor"
      };
      
      this.createUser(fourthUser).then(user4 => {
        const yogaEvent: InsertEvent = {
          title: "Sunset Yoga at the Park",
          description: "Evening yoga session at the park, suitable for all levels.",
          sportType: "yoga",
          date: nextDay,
          location: "Lakeside Park Lawn",
          maxParticipants: 15,
          isPublic: true,
          isFree: false,
          cost: 500, // $5.00 (stored in cents)
          creatorId: user4.id,
          eventImage: "https://images.unsplash.com/photo-1517649763962-0c623066013b?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
        };
        
        this.createEvent(yogaEvent);
      });
      
      // Add some participants to events
      const participantIds = [2, 3, 4]; // IDs of our sample users
      participantIds.forEach(userId => {
        const rsvp: InsertRSVP = {
          eventId: 1, // Basketball event
          userId,
          status: "approved"
        };
        this.createRSVP(rsvp);
      });
      
      // Add some participants to soccer event
      [2, 3].forEach(userId => {
        const rsvp: InsertRSVP = {
          eventId: 2, // Soccer event
          userId,
          status: "approved"
        };
        this.createRSVP(rsvp);
      });
      
      // Add some participants to tennis event
      [2, 3].forEach(userId => {
        const rsvp: InsertRSVP = {
          eventId: 3, // Tennis event
          userId,
          status: "approved"
        };
        this.createRSVP(rsvp);
      });
    });
  }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Ensure null values for optional fields
    const userWithNulls = {
      ...insertUser,
      profileImage: insertUser.profileImage ?? null,
      bio: insertUser.bio ?? null
    };
    
    const [user] = await db
      .insert(users)
      .values(userWithNulls)
      .returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }

  // Event methods
  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event || undefined;
  }

  async getEventsByCreator(creatorId: number): Promise<Event[]> {
    return db
      .select()
      .from(events)
      .where(eq(events.creatorId, creatorId))
      .orderBy(desc(events.date));
  }

  async getPublicEvents(): Promise<Event[]> {
    return db
      .select()
      .from(events)
      .where(eq(events.isPublic, true))
      .orderBy(desc(events.date));
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    // Ensure null values for optional fields
    const eventWithNulls = {
      ...insertEvent,
      description: insertEvent.description ?? null,
      locationCoordinates: insertEvent.locationCoordinates ?? null,
      cost: insertEvent.cost ?? null,
      eventImage: insertEvent.eventImage ?? null,
      currentParticipants: 1 // Creator is automatically a participant
    };
    
    const [event] = await db
      .insert(events)
      .values(eventWithNulls)
      .returning();
    return event;
  }

  async updateEvent(id: number, eventData: Partial<Event>): Promise<Event | undefined> {
    const [updatedEvent] = await db
      .update(events)
      .set(eventData)
      .where(eq(events.id, id))
      .returning();
    return updatedEvent || undefined;
  }

  async deleteEvent(id: number): Promise<boolean> {
    const result = await db
      .delete(events)
      .where(eq(events.id, id))
      .returning({ id: events.id });
    return result.length > 0;
  }

  // RSVP methods
  async getRSVP(eventId: number, userId: number): Promise<RSVP | undefined> {
    const [rsvp] = await db
      .select()
      .from(rsvps)
      .where(and(
        eq(rsvps.eventId, eventId),
        eq(rsvps.userId, userId)
      ));
    return rsvp || undefined;
  }

  async getRSVPsByEvent(eventId: number): Promise<RSVP[]> {
    return db
      .select()
      .from(rsvps)
      .where(eq(rsvps.eventId, eventId));
  }

  async getRSVPsByUser(userId: number): Promise<RSVP[]> {
    return db
      .select()
      .from(rsvps)
      .where(eq(rsvps.userId, userId));
  }

  async createRSVP(insertRSVP: InsertRSVP): Promise<RSVP> {
    const [rsvp] = await db
      .insert(rsvps)
      .values(insertRSVP)
      .returning();
    
    // If approved, update event participant count
    if (insertRSVP.status === "approved") {
      const event = await this.getEvent(insertRSVP.eventId);
      if (event) {
        await this.updateEvent(event.id, {
          currentParticipants: event.currentParticipants + 1
        });
      }
    }
    
    return rsvp;
  }

  async updateRSVP(id: number, rsvpData: Partial<RSVP>): Promise<RSVP | undefined> {
    // Get the current RSVP to check status
    const currentRsvp = await db
      .select()
      .from(rsvps)
      .where(eq(rsvps.id, id))
      .then(rows => rows[0]);
    
    if (!currentRsvp) return undefined;
    
    // Update the RSVP
    const [updatedRSVP] = await db
      .update(rsvps)
      .set(rsvpData)
      .where(eq(rsvps.id, id))
      .returning();
    
    // Handle participant count update if status changed
    if (rsvpData.status && currentRsvp.status !== rsvpData.status) {
      const event = await this.getEvent(currentRsvp.eventId);
      if (event) {
        if (currentRsvp.status !== "approved" && rsvpData.status === "approved") {
          // New approval, increment count
          await this.updateEvent(event.id, {
            currentParticipants: event.currentParticipants + 1
          });
        } else if (currentRsvp.status === "approved" && rsvpData.status !== "approved") {
          // Removed approval, decrement count
          await this.updateEvent(event.id, {
            currentParticipants: Math.max(1, event.currentParticipants - 1)
          });
        }
      }
    }
    
    return updatedRSVP || undefined;
  }

  async deleteRSVP(id: number): Promise<boolean> {
    // Get the RSVP first to check status
    const [rsvp] = await db
      .select()
      .from(rsvps)
      .where(eq(rsvps.id, id));
    
    if (rsvp && rsvp.status === "approved") {
      // Update participant count if removing an approved RSVP
      const event = await this.getEvent(rsvp.eventId);
      if (event) {
        await this.updateEvent(event.id, {
          currentParticipants: Math.max(1, event.currentParticipants - 1)
        });
      }
    }
    
    const result = await db
      .delete(rsvps)
      .where(eq(rsvps.id, id))
      .returning({ id: rsvps.id });
    
    return result.length > 0;
  }

  // Initialize database with sample data
  async initSampleData() {
    // Check if we already have users
    const userCount = await db.select({ count: users.id }).from(users).then(rows => rows.length);
    
    if (userCount > 0) {
      console.log("Database already has data, skipping initialization");
      return;
    }
    
    // Create sample user
    const sampleUser: InsertUser = {
      username: "alexsmith",
      password: "password123", // In a real app, this would be hashed
      name: "Alex Smith",
      email: "alex@example.com",
      profileImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      bio: "Sports enthusiast and community organizer"
    };
    
    const user = await this.createUser(sampleUser);
    
    // Create sample events
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const nextDay = new Date();
    nextDay.setDate(nextDay.getDate() + 1);
    
    const basketballEvent: InsertEvent = {
      title: "Weekend Basketball Pickup Game",
      description: "Join us for a casual basketball game at the park. All skill levels welcome!",
      sportType: "basketball",
      date: nextWeek,
      location: "Central Park Basketball Court",
      maxParticipants: 12,
      isPublic: true,
      isFree: true,
      creatorId: user.id,
      eventImage: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
    };
    
    const soccerEvent: InsertEvent = {
      title: "Thursday Evening Soccer Match",
      description: "Weekly soccer match at Riverside fields. Bring water and appropriate footwear.",
      sportType: "soccer",
      date: nextDay,
      location: "Riverside Soccer Fields",
      maxParticipants: 22,
      isPublic: true,
      isFree: true,
      creatorId: user.id,
      eventImage: "https://images.unsplash.com/photo-1529551739587-e242c564f727?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
    };
    
    const tennisEvent: InsertEvent = {
      title: "Sunday Tennis Club",
      description: "Regular Sunday morning tennis session. Singles and doubles play.",
      sportType: "tennis",
      date: nextWeek,
      location: "City Tennis Center",
      maxParticipants: 8,
      isPublic: true,
      isFree: true,
      creatorId: user.id,
      eventImage: "https://images.unsplash.com/photo-1530549387789-4c1017266635?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
    };
    
    const basketballEventData = await this.createEvent(basketballEvent);
    const soccerEventData = await this.createEvent(soccerEvent);
    const tennisEventData = await this.createEvent(tennisEvent);
    
    // Create more users
    const secondUser: InsertUser = {
      username: "sarahjohnson",
      password: "password123",
      name: "Sarah Johnson",
      email: "sarah@example.com",
      profileImage: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&h=256&q=80",
      bio: "Volleyball enthusiast"
    };
    
    const user2 = await this.createUser(secondUser);
    
    const volleyballEvent: InsertEvent = {
      title: "Beach Volleyball Meetup",
      description: "Casual beach volleyball games every Saturday afternoon.",
      sportType: "volleyball",
      date: nextWeek,
      location: "Ocean Beach Volleyball Courts",
      maxParticipants: 12,
      isPublic: true,
      isFree: true,
      creatorId: user2.id,
      eventImage: "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
    };
    
    await this.createEvent(volleyballEvent);
    
    const thirdUser: InsertUser = {
      username: "markwilson",
      password: "password123",
      name: "Mark Wilson",
      email: "mark@example.com",
      profileImage: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&h=256&q=80",
      bio: "Cycling enthusiast"
    };
    
    const user3 = await this.createUser(thirdUser);
    
    const cyclingEvent: InsertEvent = {
      title: "City Park Morning Ride",
      description: "Early morning cycling through scenic routes in the city park.",
      sportType: "cycling",
      date: nextDay,
      location: "City Park East Entrance",
      maxParticipants: 20,
      isPublic: true,
      isFree: true,
      creatorId: user3.id,
      eventImage: "https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
    };
    
    await this.createEvent(cyclingEvent);
    
    const fourthUser: InsertUser = {
      username: "emmadavis",
      password: "password123",
      name: "Emma Davis",
      email: "emma@example.com",
      profileImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&h=256&q=80",
      bio: "Yoga instructor"
    };
    
    const user4 = await this.createUser(fourthUser);
    
    const yogaEvent: InsertEvent = {
      title: "Sunset Yoga at the Park",
      description: "Evening yoga session at the park, suitable for all levels.",
      sportType: "yoga",
      date: nextDay,
      location: "Lakeside Park Lawn",
      maxParticipants: 15,
      isPublic: true,
      isFree: false,
      cost: 500, // $5.00 (stored in cents)
      creatorId: user4.id,
      eventImage: "https://images.unsplash.com/photo-1517649763962-0c623066013b?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=800&q=80"
    };
    
    await this.createEvent(yogaEvent);
    
    // Add some participants to events
    const participantIds = [user2.id, user3.id, user4.id];
    for (const userId of participantIds) {
      const rsvp: InsertRSVP = {
        eventId: basketballEventData.id,
        userId,
        status: "approved"
      };
      await this.createRSVP(rsvp);
    }
    
    // Add some participants to soccer event
    for (const userId of [user2.id, user3.id]) {
      const rsvp: InsertRSVP = {
        eventId: soccerEventData.id,
        userId,
        status: "approved"
      };
      await this.createRSVP(rsvp);
    }
    
    // Add some participants to tennis event
    for (const userId of [user2.id, user3.id]) {
      const rsvp: InsertRSVP = {
        eventId: tennisEventData.id,
        userId,
        status: "approved"
      };
      await this.createRSVP(rsvp);
    }
  }
}

// Initialize storage
export const storage = new DatabaseStorage();

// Seed the database with sample data
storage.initSampleData().catch(error => {
  console.error('Failed to initialize sample data:', error);
});
