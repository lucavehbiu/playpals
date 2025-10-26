import express, { type Express } from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { vi } from 'vitest';

// Simple password comparison for tests (no bcrypt)
const comparePassword = async (password: string, hash: string) => {
  return hash === `hashed-${password}`;
};

const hashPassword = async (password: string) => {
  return `hashed-${password}`;
};

// Create mock storage
export const createMockStorage = () => {
  const users = new Map<number, any>();
  const events = new Map<number, any>();
  const teams = new Map<number, any>();
  const teamMembers = new Map<number, any>();
  const rsvps = new Map<number, any>();
  let userIdCounter = 1;
  let eventIdCounter = 1;
  let teamIdCounter = 1;
  let teamMemberIdCounter = 1;
  let rsvpIdCounter = 1;

  return {
    // User methods
    createUser: vi.fn(async (userData: any) => {
      const user = {
        id: userIdCounter++,
        ...userData,
        createdAt: new Date(),
      };
      users.set(user.id, user);
      return user;
    }),

    getUserByUsername: vi.fn(async (username: string) => {
      return Array.from(users.values()).find((u: any) => u.username === username) || null;
    }),

    getUser: vi.fn(async (id: number) => {
      return users.get(id) || null;
    }),

    // Event methods
    createEvent: vi.fn(async (eventData: any) => {
      const event = {
        id: eventIdCounter++,
        ...eventData,
        createdAt: new Date(),
        currentParticipants: 1,
      };
      events.set(event.id, event);
      return event;
    }),

    getEvent: vi.fn(async (id: number) => {
      const event = events.get(id);
      if (!event) return null;

      // Mock creator info
      const creator = users.get(event.creatorId);
      return {
        ...event,
        creator: creator
          ? {
              id: creator.id,
              username: creator.username,
              name: creator.name,
              email: creator.email,
              profileImage: creator.profileImage,
              bio: creator.bio,
              location: creator.location,
              headline: creator.headline,
              coverImage: creator.coverImage,
              createdAt: creator.createdAt,
            }
          : undefined,
      };
    }),

    getEvents: vi.fn(async () => {
      return Array.from(events.values());
    }),

    updateEvent: vi.fn(async (id: number, updates: any) => {
      const event = events.get(id);
      if (!event) return null;
      const updated = { ...event, ...updates };
      events.set(id, updated);
      return updated;
    }),

    deleteEvent: vi.fn(async (id: number) => {
      const event = events.get(id);
      if (!event) return false;
      events.delete(id);
      return true;
    }),

    // RSVP methods
    createRSVP: vi.fn(async (rsvpData: any) => {
      const rsvp = {
        id: rsvpIdCounter++,
        ...rsvpData,
        createdAt: new Date(),
      };
      rsvps.set(rsvp.id, rsvp);
      return rsvp;
    }),

    getRSVP: vi.fn(async (id: number) => {
      return rsvps.get(id) || null;
    }),

    getRSVPsByUser: vi.fn(async (userId: number) => {
      return Array.from(rsvps.values()).filter((r: any) => r.userId === userId);
    }),

    getRSVPsByEvent: vi.fn(async (eventId: number) => {
      return Array.from(rsvps.values()).filter((r: any) => r.eventId === eventId);
    }),

    updateRSVP: vi.fn(async (id: number, updates: any) => {
      const rsvp = rsvps.get(id);
      if (!rsvp) return null;
      const updated = { ...rsvp, ...updates };
      rsvps.set(id, updated);
      return updated;
    }),

    deleteRSVP: vi.fn(async (id: number) => {
      const rsvp = rsvps.get(id);
      if (!rsvp) return false;
      rsvps.delete(id);
      return true;
    }),

    // Team methods
    createTeam: vi.fn(async (teamData: any) => {
      const team = {
        id: teamIdCounter++,
        ...teamData,
        createdAt: new Date(),
        memberCount: 0, // Will be incremented when admin member is added
      };
      teams.set(team.id, team);
      return team;
    }),

    getTeam: vi.fn(async (id: number) => {
      const team = teams.get(id);
      if (!team) return null;

      // Mock admin info
      const admin = users.get(team.adminId);
      return {
        ...team,
        admin: admin
          ? {
              id: admin.id,
              username: admin.username,
              name: admin.name,
              profileImage: admin.profileImage,
            }
          : undefined,
      };
    }),

    getTeams: vi.fn(async () => {
      return Array.from(teams.values());
    }),

    getTeamsByUser: vi.fn(async (userId: number) => {
      return Array.from(teamMembers.values())
        .filter((tm: any) => tm.userId === userId)
        .map((tm: any) => teams.get(tm.teamId))
        .filter(Boolean);
    }),

    updateTeam: vi.fn(async (id: number, updates: any) => {
      const team = teams.get(id);
      if (!team) return null;
      const updated = { ...team, ...updates };
      teams.set(id, updated);
      return updated;
    }),

    deleteTeam: vi.fn(async (id: number) => {
      const team = teams.get(id);
      if (!team) return false;
      teams.delete(id);
      // Also delete team members
      Array.from(teamMembers.entries()).forEach(([key, tm]: [number, any]) => {
        if (tm.teamId === id) teamMembers.delete(key);
      });
      return true;
    }),

    // Team member methods
    createTeamMember: vi.fn(async (memberData: any) => {
      const member = {
        id: teamMemberIdCounter++,
        ...memberData,
        createdAt: new Date(),
      };
      teamMembers.set(member.id, member);

      // Update team member count
      const team = teams.get(memberData.teamId);
      if (team) {
        team.memberCount = (team.memberCount || 0) + 1;
      }

      return member;
    }),

    getTeamMembers: vi.fn(async (teamId: number) => {
      return Array.from(teamMembers.values())
        .filter((tm: any) => tm.teamId === teamId)
        .map((tm: any) => {
          const user = users.get(tm.userId);
          return {
            ...tm,
            user: user
              ? {
                  id: user.id,
                  username: user.username,
                  name: user.name,
                  profileImage: user.profileImage,
                }
              : undefined,
          };
        });
    }),

    getTeamMember: vi.fn(async (id: number) => {
      return teamMembers.get(id) || null;
    }),

    updateTeamMember: vi.fn(async (id: number, updates: any) => {
      const member = teamMembers.get(id);
      if (!member) return null;
      const updated = { ...member, ...updates };
      teamMembers.set(id, updated);
      return updated;
    }),

    deleteTeamMember: vi.fn(async (id: number) => {
      const member = teamMembers.get(id);
      if (!member) return false;
      teamMembers.delete(id);

      // Update team member count
      const team = teams.get(member.teamId);
      if (team && team.memberCount > 0) {
        team.memberCount = team.memberCount - 1;
      }

      return true;
    }),

    // Expose internal state for testing
    _users: users,
    _events: events,
    _teams: teams,
    _teamMembers: teamMembers,
    _rsvps: rsvps,

    // Reset for testing
    _reset: () => {
      users.clear();
      events.clear();
      teams.clear();
      teamMembers.clear();
      rsvps.clear();
      userIdCounter = 1;
      eventIdCounter = 1;
      teamIdCounter = 1;
      teamMemberIdCounter = 1;
      rsvpIdCounter = 1;
    },
  };
};

// Create test Express app with full auth setup
export const createTestApp = (mockStorage: ReturnType<typeof createMockStorage>): Express => {
  const app = express();

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Session setup
  app.use(
    session({
      secret: 'test-secret-key',
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false },
    })
  );

  // Passport setup
  app.use(passport.initialize());
  app.use(passport.session());

  // Configure local strategy
  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await mockStorage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: 'Invalid username or password' });
        }

        const isValid = await comparePassword(password, user.password);
        if (!isValid) {
          return done(null, false, { message: 'Invalid username or password' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    })
  );

  // Serialize/deserialize
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await mockStorage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Auth routes
  app.post('/api/register', async (req, res, next) => {
    try {
      const existing = await mockStorage.getUserByUsername(req.body.username);
      if (existing) {
        return res.status(400).json({ message: 'Username already exists' });
      }

      const hashedPassword = await hashPassword(req.body.password);
      const user = await mockStorage.createUser({
        ...req.body,
        password: hashedPassword,
      });

      req.login(user, (err) => {
        if (err) return next(err);
        const { password, ...userWithoutPassword } = user;
        return res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/login', (req, res, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) return next(err);
      if (!user) {
        return res.status(400).json({ message: info?.message || 'Invalid credentials' });
      }

      req.login(user, (loginErr: any) => {
        if (loginErr) return next(loginErr);
        const { password, ...userWithoutPassword } = user;
        return res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post('/api/logout', (req, res, next) => {
    req.logout((err: any) => {
      if (err) return next(err);
      res.status(200).json({ message: 'Logged out successfully' });
    });
  });

  app.get('/api/user', async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    const { password, ...userWithoutPassword } = req.user as any;
    res.json(userWithoutPassword);
  });

  // Event routes
  const authenticateUser = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: 'Unauthorized - Please log in' });
    }
    next();
  };

  app.post('/api/events', authenticateUser, async (req, res, next) => {
    try {
      const eventData = {
        ...req.body,
        creatorId: (req.user as any).id,
        eventImage: req.body.eventImage || null,
      };
      const event = await mockStorage.createEvent(eventData);
      res.status(201).json(event);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/events/:id', async (req, res, next) => {
    try {
      const event = await mockStorage.getEvent(parseInt(req.params.id));
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
      res.json(event);
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/events/:id/image', authenticateUser, async (req, res, next) => {
    try {
      const eventId = parseInt(req.params.id);
      const event = await mockStorage.getEvent(eventId);

      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }

      // Mock GCS upload - return fake URL
      const mockImageUrl = `https://storage.googleapis.com/playpals/events/event-${eventId}-${Date.now()}`;

      // Update event with image URL
      await mockStorage.updateEvent(eventId, { eventImage: mockImageUrl });

      res.json({ imageUrl: mockImageUrl });
    } catch (error) {
      next(error);
    }
  });

  app.delete('/api/events/:id', authenticateUser, async (req, res, next) => {
    try {
      const eventId = parseInt(req.params.id);
      const event = await mockStorage.getEvent(eventId);

      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }

      if (event.creatorId !== (req.user as any).id) {
        return res.status(403).json({ message: 'Not authorized to delete this event' });
      }

      await mockStorage.deleteEvent(eventId);
      res.json({ message: 'Event deleted successfully' });
    } catch (error) {
      next(error);
    }
  });

  // Team routes
  app.post('/api/teams', authenticateUser, async (req, res, next) => {
    try {
      const teamData = {
        ...req.body,
        adminId: (req.user as any).id,
      };
      const team = await mockStorage.createTeam(teamData);

      // Auto-add creator as admin member
      await mockStorage.createTeamMember({
        teamId: team.id,
        userId: (req.user as any).id,
        role: 'admin',
      });

      res.status(201).json(team);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/teams', async (req, res, next) => {
    try {
      const teams = await mockStorage.getTeams();
      res.json(teams);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/teams/user/:userId', async (req, res, next) => {
    try {
      const userId = parseInt(req.params.userId);
      const teams = await mockStorage.getTeamsByUser(userId);
      res.json(teams);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/teams/:id', async (req, res, next) => {
    try {
      const team = await mockStorage.getTeam(parseInt(req.params.id));
      if (!team) {
        return res.status(404).json({ message: 'Team not found' });
      }
      res.json(team);
    } catch (error) {
      next(error);
    }
  });

  app.put('/api/teams/:id', authenticateUser, async (req, res, next) => {
    try {
      const teamId = parseInt(req.params.id);
      const team = await mockStorage.getTeam(teamId);

      if (!team) {
        return res.status(404).json({ message: 'Team not found' });
      }

      if (team.adminId !== (req.user as any).id) {
        return res.status(403).json({ message: 'Not authorized to update this team' });
      }

      const updated = await mockStorage.updateTeam(teamId, req.body);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  app.delete('/api/teams/:id', authenticateUser, async (req, res, next) => {
    try {
      const teamId = parseInt(req.params.id);
      const team = await mockStorage.getTeam(teamId);

      if (!team) {
        return res.status(404).json({ message: 'Team not found' });
      }

      if (team.adminId !== (req.user as any).id) {
        return res.status(403).json({ message: 'Not authorized to delete this team' });
      }

      await mockStorage.deleteTeam(teamId);
      res.json({ message: 'Team deleted successfully' });
    } catch (error) {
      next(error);
    }
  });

  // Team member routes
  app.post('/api/teams/:teamId/members', authenticateUser, async (req, res, next) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const team = await mockStorage.getTeam(teamId);

      if (!team) {
        return res.status(404).json({ message: 'Team not found' });
      }

      const memberData = {
        ...req.body,
        teamId,
      };
      const member = await mockStorage.createTeamMember(memberData);
      res.status(201).json(member);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/teams/:teamId/members', async (req, res, next) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const members = await mockStorage.getTeamMembers(teamId);
      res.json(members);
    } catch (error) {
      next(error);
    }
  });

  app.put('/api/teams/:teamId/members/:memberId', authenticateUser, async (req, res, next) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const memberId = parseInt(req.params.memberId);
      const team = await mockStorage.getTeam(teamId);

      if (!team) {
        return res.status(404).json({ message: 'Team not found' });
      }

      if (team.adminId !== (req.user as any).id) {
        return res.status(403).json({ message: 'Not authorized to update team members' });
      }

      const updated = await mockStorage.updateTeamMember(memberId, req.body);
      if (!updated) {
        return res.status(404).json({ message: 'Member not found' });
      }
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  app.delete('/api/teams/:teamId/members/:memberId', authenticateUser, async (req, res, next) => {
    try {
      const teamId = parseInt(req.params.teamId);
      const memberId = parseInt(req.params.memberId);
      const team = await mockStorage.getTeam(teamId);

      if (!team) {
        return res.status(404).json({ message: 'Team not found' });
      }

      const member = await mockStorage.getTeamMember(memberId);
      if (!member) {
        return res.status(404).json({ message: 'Member not found' });
      }

      // Allow admin or the member themselves to remove
      if (team.adminId !== (req.user as any).id && member.userId !== (req.user as any).id) {
        return res.status(403).json({ message: 'Not authorized to remove this member' });
      }

      await mockStorage.deleteTeamMember(memberId);
      res.json({ message: 'Member removed successfully' });
    } catch (error) {
      next(error);
    }
  });

  // RSVP routes
  app.post('/api/rsvps', authenticateUser, async (req, res, next) => {
    try {
      const rsvpData = {
        ...req.body,
        userId: (req.user as any).id,
      };

      // Check if event exists
      const event = await mockStorage.getEvent(rsvpData.eventId);
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }

      const rsvp = await mockStorage.createRSVP(rsvpData);
      res.status(201).json(rsvp);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/rsvps/event/:eventId', async (req, res, next) => {
    try {
      const eventId = parseInt(req.params.eventId);
      const rsvps = await mockStorage.getRSVPsByEvent(eventId);
      res.json(rsvps);
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/rsvps/user/:userId', async (req, res, next) => {
    try {
      const userId = parseInt(req.params.userId);
      const rsvps = await mockStorage.getRSVPsByUser(userId);
      res.json(rsvps);
    } catch (error) {
      next(error);
    }
  });

  app.put('/api/rsvps/:id', authenticateUser, async (req, res, next) => {
    try {
      const rsvpId = parseInt(req.params.id);
      const rsvp = await mockStorage.getRSVP(rsvpId);

      if (!rsvp) {
        return res.status(404).json({ message: 'RSVP not found' });
      }

      // Check if event exists
      const event = await mockStorage.getEvent(rsvp.eventId);
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }

      // Allow event creator or RSVP owner to update
      if (event.creatorId !== (req.user as any).id && rsvp.userId !== (req.user as any).id) {
        return res.status(403).json({ message: 'Not authorized to update this RSVP' });
      }

      const updated = await mockStorage.updateRSVP(rsvpId, req.body);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  app.delete('/api/rsvps/:id', authenticateUser, async (req, res, next) => {
    try {
      const rsvpId = parseInt(req.params.id);
      const rsvp = await mockStorage.getRSVP(rsvpId);

      if (!rsvp) {
        return res.status(404).json({ message: 'RSVP not found' });
      }

      // Allow RSVP owner to delete
      if (rsvp.userId !== (req.user as any).id) {
        return res.status(403).json({ message: 'Not authorized to delete this RSVP' });
      }

      await mockStorage.deleteRSVP(rsvpId);
      res.json({ message: 'RSVP deleted successfully' });
    } catch (error) {
      next(error);
    }
  });

  return app;
};
