import express, { type Express } from 'express';
import session from 'express-session';
import { vi } from 'vitest';

// Mock storage for testing
export const createMockStorage = () => {
  const users = new Map();
  const events = new Map();
  let userId = 1;
  let eventId = 1;

  return {
    // User methods
    createUser: vi.fn(async (userData: any) => {
      const user = {
        id: userId++,
        ...userData,
        createdAt: new Date(),
        password: 'hashed-' + userData.password, // Mock hashed password
      };
      users.set(user.id, user);
      return user;
    }),

    getUserByUsername: vi.fn(async (username: string) => {
      return Array.from(users.values()).find((u: any) => u.username === username);
    }),

    getUser: vi.fn(async (id: number) => {
      return users.get(id);
    }),

    // Event methods
    createEvent: vi.fn(async (eventData: any) => {
      const event = {
        id: eventId++,
        ...eventData,
        createdAt: new Date(),
        currentParticipants: 1,
      };
      events.set(event.id, event);
      return event;
    }),

    getEvent: vi.fn(async (id: number) => {
      return events.get(id);
    }),

    getEvents: vi.fn(async () => {
      return Array.from(events.values());
    }),

    updateEvent: vi.fn(async (id: number, updates: any) => {
      const event = events.get(id);
      if (!event) return undefined;
      const updated = { ...event, ...updates };
      events.set(id, updated);
      return updated;
    }),

    deleteEvent: vi.fn(async (id: number) => {
      const event = events.get(id);
      events.delete(id);
      return event;
    }),

    // RSVP methods
    createRSVP: vi.fn(async (rsvpData: any) => {
      return {
        id: 1,
        ...rsvpData,
        createdAt: new Date(),
      };
    }),

    getRSVPsByUser: vi.fn(async () => []),
    getRSVPsByEvent: vi.fn(async () => []),

    // Reset for testing
    _reset: () => {
      users.clear();
      events.clear();
      userId = 1;
      eventId = 1;
    },
  };
};

// Create test Express app with minimal setup
export const createTestApp = (mockStorage: any): Express => {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Session configuration for tests
  app.use(
    session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false }, // Not HTTPS in tests
    })
  );

  // Mock passport initialization
  app.use((req: any, res, next) => {
    req.isAuthenticated = () => !!req.session.userId;
    req.user = req.session.userId ? { id: req.session.userId, username: 'testuser' } : undefined;
    next();
  });

  return app;
};

// Helper to create authenticated session
export const createAuthSession = (app: Express, userId: number) => {
  return (req: any, res: any, next: any) => {
    req.session.userId = userId;
    next();
  };
};
