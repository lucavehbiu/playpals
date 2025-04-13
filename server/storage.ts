import { 
  users, type User, type InsertUser, 
  events, type Event, type InsertEvent,
  rsvps, type RSVP, type InsertRSVP,
  friendships, type Friendship, type InsertFriendship,
  userSportPreferences, type UserSportPreference, type InsertUserSportPreference,
  playerRatings, type PlayerRating, type InsertPlayerRating,
  teams, type Team, type InsertTeam,
  teamMembers, type TeamMember, type InsertTeamMember,
  teamPosts, type TeamPost, type InsertTeamPost,
  teamPostComments, type TeamPostComment, type InsertTeamPostComment,
  teamSchedules, type TeamSchedule, type InsertTeamSchedule,
  teamScheduleResponses, type TeamScheduleResponse, type InsertTeamScheduleResponse,
  teamJoinRequests, type TeamJoinRequest, type InsertTeamJoinRequest
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, or, like, avg, sql } from "drizzle-orm";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import createMemoryStore from "memorystore";
import { pool } from "./db";

const PostgresSessionStore = connectPgSimple(session);
const MemoryStore = createMemoryStore(session);

// Storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  searchUsers(query: string): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  
  // Friendship methods
  getFriendship(userId: number, friendId: number): Promise<Friendship | undefined>;
  getFriendshipById(id: number): Promise<Friendship | undefined>;
  getFriendsByUserId(userId: number): Promise<User[]>;
  getPendingFriendRequests(userId: number): Promise<Friendship[]>;
  sendFriendRequest(friendship: InsertFriendship): Promise<Friendship>;
  updateFriendshipStatus(id: number, status: string): Promise<Friendship | undefined>;
  deleteFriendship(id: number): Promise<boolean>;
  
  // Team methods
  getTeam(id: number): Promise<Team | undefined>;
  getTeamsByUser(userId: number): Promise<Team[]>;
  getAllTeams(nameQuery?: string): Promise<Team[]>;
  createTeam(team: InsertTeam): Promise<Team>;
  updateTeam(id: number, teamData: Partial<Team>): Promise<Team | undefined>;
  deleteTeam(id: number): Promise<boolean>;
  
  // Team membership methods
  getTeamMember(teamId: number, userId: number): Promise<TeamMember | undefined>;
  getTeamMemberById(id: number): Promise<TeamMember | undefined>;
  getTeamMembers(teamId: number): Promise<TeamMember[]>;
  createTeamMember(member: InsertTeamMember): Promise<TeamMember>;
  updateTeamMember(id: number, memberData: Partial<TeamMember>): Promise<TeamMember | undefined>;
  deleteTeamMember(id: number): Promise<boolean>;
  
  // Team post methods
  getTeamPost(id: number): Promise<TeamPost | undefined>;
  getTeamPosts(teamId: number): Promise<TeamPost[]>;
  createTeamPost(post: InsertTeamPost): Promise<TeamPost>;
  updateTeamPost(id: number, postData: Partial<TeamPost>): Promise<TeamPost | undefined>;
  deleteTeamPost(id: number): Promise<boolean>;
  
  // Team post comment methods
  getTeamPostComment(id: number): Promise<TeamPostComment | undefined>;
  getTeamPostComments(postId: number): Promise<TeamPostComment[]>;
  createTeamPostComment(comment: InsertTeamPostComment): Promise<TeamPostComment>;
  updateTeamPostComment(id: number, commentData: Partial<TeamPostComment>): Promise<TeamPostComment | undefined>;
  deleteTeamPostComment(id: number): Promise<boolean>;
  
  // Team schedule methods
  getTeamSchedule(id: number): Promise<TeamSchedule | undefined>;
  getTeamSchedules(teamId: number): Promise<TeamSchedule[]>;
  createTeamSchedule(schedule: InsertTeamSchedule): Promise<TeamSchedule>;
  updateTeamSchedule(id: number, scheduleData: Partial<TeamSchedule>): Promise<TeamSchedule | undefined>;
  deleteTeamSchedule(id: number): Promise<boolean>;
  
  // Team schedule response methods
  getTeamScheduleResponse(scheduleId: number, userId: number): Promise<TeamScheduleResponse | undefined>;
  getTeamScheduleResponseById(id: number): Promise<TeamScheduleResponse | undefined>;
  getTeamScheduleResponses(scheduleId: number): Promise<TeamScheduleResponse[]>;
  createTeamScheduleResponse(response: InsertTeamScheduleResponse): Promise<TeamScheduleResponse>;
  updateTeamScheduleResponse(id: number, responseData: Partial<TeamScheduleResponse>): Promise<TeamScheduleResponse | undefined>;
  deleteTeamScheduleResponse(id: number): Promise<boolean>;
  
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
  
  // Sport preferences methods
  getUserSportPreferences(userId: number): Promise<UserSportPreference[]>;
  getUserSportPreference(userId: number, sportType: string): Promise<UserSportPreference | undefined>;
  createUserSportPreference(preference: InsertUserSportPreference): Promise<UserSportPreference>;
  updateUserSportPreference(id: number, preferenceData: Partial<UserSportPreference>): Promise<UserSportPreference | undefined>;
  deleteUserSportPreference(id: number): Promise<boolean>;
  
  // Player ratings methods
  getPlayerRatings(userId: number): Promise<PlayerRating[]>;
  getPlayerRatingsByEvent(eventId: number): Promise<PlayerRating[]>;
  createPlayerRating(rating: InsertPlayerRating): Promise<PlayerRating>;
  updatePlayerRating(id: number, ratingData: Partial<PlayerRating>): Promise<PlayerRating | undefined>;
  deletePlayerRating(id: number): Promise<boolean>;
  getAveragePlayerRating(userId: number, sportType?: string): Promise<number>;

  // Session store
  sessionStore: session.Store;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private events: Map<number, Event>;
  private rsvps: Map<number, RSVP>;
  private friendships: Map<number, Friendship>;
  private userSportPreferences: Map<number, UserSportPreference>;
  private playerRatings: Map<number, PlayerRating>;
  private teams: Map<number, Team>;
  private teamMembers: Map<number, TeamMember>;
  private teamPosts: Map<number, TeamPost>;
  private teamPostComments: Map<number, TeamPostComment>;
  private teamSchedules: Map<number, TeamSchedule>;
  private teamScheduleResponses: Map<number, TeamScheduleResponse>;
  private userIdCounter: number;
  private eventIdCounter: number;
  private rsvpIdCounter: number;
  private friendshipIdCounter: number;
  private sportPreferenceIdCounter: number;
  private playerRatingIdCounter: number;
  private teamIdCounter: number;
  private teamMemberIdCounter: number;
  private teamPostIdCounter: number;
  private teamPostCommentIdCounter: number;
  private teamScheduleIdCounter: number;
  private teamScheduleResponseIdCounter: number;
  
  // Session store for authentication
  public sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.events = new Map();
    this.rsvps = new Map();
    this.friendships = new Map();
    this.userSportPreferences = new Map();
    this.playerRatings = new Map();
    this.teams = new Map();
    this.teamMembers = new Map();
    this.teamPosts = new Map();
    this.teamPostComments = new Map();
    this.teamSchedules = new Map();
    this.teamScheduleResponses = new Map();
    this.userIdCounter = 1;
    this.eventIdCounter = 1;
    this.rsvpIdCounter = 1;
    this.friendshipIdCounter = 1;
    this.sportPreferenceIdCounter = 1;
    this.playerRatingIdCounter = 1;
    this.teamIdCounter = 1;
    this.teamMemberIdCounter = 1;
    this.teamPostIdCounter = 1;
    this.teamPostCommentIdCounter = 1;
    this.teamScheduleIdCounter = 1;
    this.teamScheduleResponseIdCounter = 1;
    
    // Initialize session store
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
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
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: now,
      profileImage: insertUser.profileImage ?? null,
      coverImage: insertUser.coverImage ?? null,
      bio: insertUser.bio ?? null,
      headline: insertUser.headline ?? null,
      location: insertUser.location ?? null
    };
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
  
  async searchUsers(query: string): Promise<User[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.users.values()).filter(user => 
      user.username.toLowerCase().includes(lowerQuery) || 
      user.name.toLowerCase().includes(lowerQuery) ||
      user.email.toLowerCase().includes(lowerQuery)
    );
  }
  
  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  // Friendship methods
  async getFriendship(userId: number, friendId: number): Promise<Friendship | undefined> {
    return Array.from(this.friendships.values()).find(
      friendship => 
        (friendship.userId === userId && friendship.friendId === friendId) ||
        (friendship.userId === friendId && friendship.friendId === userId)
    );
  }
  
  async getFriendshipById(id: number): Promise<Friendship | undefined> {
    return this.friendships.get(id);
  }
  
  async getFriendsByUserId(userId: number): Promise<User[]> {
    // Get accepted friendships where user is either the sender or receiver
    const relevantFriendships = Array.from(this.friendships.values()).filter(
      friendship => 
        friendship.status === "accepted" &&
        (friendship.userId === userId || friendship.friendId === userId)
    );
    
    // Get the other user's ID from each friendship
    const friendIds = relevantFriendships.map(friendship => 
      friendship.userId === userId ? friendship.friendId : friendship.userId
    );
    
    // Get the user objects for each friend
    return friendIds.map(id => this.users.get(id)).filter(user => user !== undefined) as User[];
  }
  
  async getPendingFriendRequests(userId: number): Promise<Friendship[]> {
    // Get pending friend requests received by the user
    return Array.from(this.friendships.values()).filter(
      friendship => 
        friendship.status === "pending" &&
        friendship.friendId === userId
    );
  }
  
  async sendFriendRequest(friendship: InsertFriendship): Promise<Friendship> {
    const id = this.friendshipIdCounter++;
    const now = new Date();
    const newFriendship: Friendship = { 
      ...friendship, 
      id, 
      createdAt: now,
      status: friendship.status || 'pending' // Ensure status is always set
    };
    this.friendships.set(id, newFriendship);
    return newFriendship;
  }
  
  async updateFriendshipStatus(id: number, status: string): Promise<Friendship | undefined> {
    const friendship = this.friendships.get(id);
    if (!friendship) return undefined;
    
    const updatedFriendship = { ...friendship, status };
    this.friendships.set(id, updatedFriendship);
    return updatedFriendship;
  }
  
  async deleteFriendship(id: number): Promise<boolean> {
    return this.friendships.delete(id);
  }

  // Team methods
  async getTeam(id: number): Promise<Team | undefined> {
    return this.teams.get(id);
  }

  async getTeamsByUser(userId: number): Promise<Team[]> {
    // Get teams where the user is a member
    const memberTeamIds = Array.from(this.teamMembers.values())
      .filter(member => member.userId === userId)
      .map(member => member.teamId);
    
    // Get teams created by the user
    const createdTeams = Array.from(this.teams.values())
      .filter(team => team.creatorId === userId);
    
    // Get teams where the user is a member but not the creator
    const memberTeams = Array.from(this.teams.values())
      .filter(team => 
        memberTeamIds.includes(team.id) && 
        team.creatorId !== userId
      );
    
    return [...createdTeams, ...memberTeams];
  }
  
  async getAllTeams(nameQuery?: string): Promise<Team[]> {
    let teams = Array.from(this.teams.values());
    
    // If name query is provided, filter teams by name
    if (nameQuery) {
      const lowerQuery = nameQuery.toLowerCase();
      teams = teams.filter(team => 
        team.name.toLowerCase().includes(lowerQuery)
      );
    }
    
    // Return all teams, sorted by creation date (newest first)
    return teams.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createTeam(team: InsertTeam): Promise<Team> {
    const id = this.teamIdCounter++;
    const now = new Date();
    const newTeam: Team = {
      ...team,
      id,
      createdAt: now,
      description: team.description ?? null,
      logo: team.logo ?? null,
      isPublic: team.isPublic === undefined ? true : team.isPublic
    };
    this.teams.set(id, newTeam);
    
    // Automatically add creator as team member with admin role
    this.createTeamMember({
      teamId: id,
      userId: team.creatorId,
      role: "admin",
    });
    
    return newTeam;
  }

  async updateTeam(id: number, teamData: Partial<Team>): Promise<Team | undefined> {
    const team = this.teams.get(id);
    if (!team) return undefined;
    
    const updatedTeam = { ...team, ...teamData };
    this.teams.set(id, updatedTeam);
    return updatedTeam;
  }

  async deleteTeam(id: number): Promise<boolean> {
    // Delete team members
    for (const [memberId, member] of this.teamMembers.entries()) {
      if (member.teamId === id) {
        this.teamMembers.delete(memberId);
      }
    }
    
    // Delete team posts and comments
    for (const [postId, post] of this.teamPosts.entries()) {
      if (post.teamId === id) {
        // Delete comments for this post
        for (const [commentId, comment] of this.teamPostComments.entries()) {
          if (comment.postId === postId) {
            this.teamPostComments.delete(commentId);
          }
        }
        this.teamPosts.delete(postId);
      }
    }
    
    // Delete team schedules and responses
    for (const [scheduleId, schedule] of this.teamSchedules.entries()) {
      if (schedule.teamId === id) {
        // Delete responses for this schedule
        for (const [responseId, response] of this.teamScheduleResponses.entries()) {
          if (response.scheduleId === scheduleId) {
            this.teamScheduleResponses.delete(responseId);
          }
        }
        this.teamSchedules.delete(scheduleId);
      }
    }
    
    return this.teams.delete(id);
  }
  
  // Team membership methods
  async getTeamMember(teamId: number, userId: number): Promise<TeamMember | undefined> {
    return Array.from(this.teamMembers.values()).find(
      member => member.teamId === teamId && member.userId === userId
    );
  }
  
  async getTeamMemberById(id: number): Promise<TeamMember | undefined> {
    return this.teamMembers.get(id);
  }
  
  async getTeamMembers(teamId: number): Promise<TeamMember[]> {
    return Array.from(this.teamMembers.values()).filter(
      member => member.teamId === teamId
    );
  }
  
  async createTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    const id = this.teamMemberIdCounter++;
    const now = new Date();
    const newMember: TeamMember = {
      ...member,
      id,
      joinedAt: now,
      position: member.position ?? null,
      stats: member.stats ?? null,
      role: member.role ?? "member"
    };
    this.teamMembers.set(id, newMember);
    return newMember;
  }
  
  async updateTeamMember(id: number, memberData: Partial<TeamMember>): Promise<TeamMember | undefined> {
    const member = this.teamMembers.get(id);
    if (!member) return undefined;
    
    const updatedMember = { ...member, ...memberData };
    this.teamMembers.set(id, updatedMember);
    return updatedMember;
  }
  
  async deleteTeamMember(id: number): Promise<boolean> {
    return this.teamMembers.delete(id);
  }
  
  // Team post methods
  async getTeamPost(id: number): Promise<TeamPost | undefined> {
    return this.teamPosts.get(id);
  }
  
  async getTeamPosts(teamId: number): Promise<TeamPost[]> {
    return Array.from(this.teamPosts.values())
      .filter(post => post.teamId === teamId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Newest first
  }
  
  async createTeamPost(post: InsertTeamPost): Promise<TeamPost> {
    const id = this.teamPostIdCounter++;
    const now = new Date();
    const newPost: TeamPost = {
      ...post,
      id,
      createdAt: now,
      likes: 0,
      attachments: post.attachments ?? null
    };
    this.teamPosts.set(id, newPost);
    return newPost;
  }
  
  async updateTeamPost(id: number, postData: Partial<TeamPost>): Promise<TeamPost | undefined> {
    const post = this.teamPosts.get(id);
    if (!post) return undefined;
    
    const updatedPost = { ...post, ...postData };
    this.teamPosts.set(id, updatedPost);
    return updatedPost;
  }
  
  async deleteTeamPost(id: number): Promise<boolean> {
    // Delete all comments for this post
    for (const [commentId, comment] of this.teamPostComments.entries()) {
      if (comment.postId === id) {
        this.teamPostComments.delete(commentId);
      }
    }
    
    return this.teamPosts.delete(id);
  }
  
  // Team post comment methods
  async getTeamPostComment(id: number): Promise<TeamPostComment | undefined> {
    return this.teamPostComments.get(id);
  }
  
  async getTeamPostComments(postId: number): Promise<TeamPostComment[]> {
    return Array.from(this.teamPostComments.values())
      .filter(comment => comment.postId === postId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); // Oldest first
  }
  
  async createTeamPostComment(comment: InsertTeamPostComment): Promise<TeamPostComment> {
    const id = this.teamPostCommentIdCounter++;
    const now = new Date();
    const newComment: TeamPostComment = {
      ...comment,
      id,
      createdAt: now,
      likes: 0
    };
    this.teamPostComments.set(id, newComment);
    return newComment;
  }
  
  async updateTeamPostComment(id: number, commentData: Partial<TeamPostComment>): Promise<TeamPostComment | undefined> {
    const comment = this.teamPostComments.get(id);
    if (!comment) return undefined;
    
    const updatedComment = { ...comment, ...commentData };
    this.teamPostComments.set(id, updatedComment);
    return updatedComment;
  }
  
  async deleteTeamPostComment(id: number): Promise<boolean> {
    return this.teamPostComments.delete(id);
  }
  
  // Team schedule methods
  async getTeamSchedule(id: number): Promise<TeamSchedule | undefined> {
    return this.teamSchedules.get(id);
  }
  
  async getTeamSchedules(teamId: number): Promise<TeamSchedule[]> {
    return Array.from(this.teamSchedules.values())
      .filter(schedule => schedule.teamId === teamId)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()); // Chronological order
  }
  
  async createTeamSchedule(schedule: InsertTeamSchedule): Promise<TeamSchedule> {
    const id = this.teamScheduleIdCounter++;
    const now = new Date();
    const newSchedule: TeamSchedule = {
      ...schedule,
      id,
      createdAt: now,
      updatedAt: now,
      description: schedule.description ?? null,
      location: schedule.location ?? null
    };
    this.teamSchedules.set(id, newSchedule);
    return newSchedule;
  }
  
  async updateTeamSchedule(id: number, scheduleData: Partial<TeamSchedule>): Promise<TeamSchedule | undefined> {
    const schedule = this.teamSchedules.get(id);
    if (!schedule) return undefined;
    
    const updatedSchedule = { 
      ...schedule, 
      ...scheduleData,
      updatedAt: new Date()
    };
    this.teamSchedules.set(id, updatedSchedule);
    return updatedSchedule;
  }
  
  async deleteTeamSchedule(id: number): Promise<boolean> {
    // Delete all responses for this schedule
    for (const [responseId, response] of this.teamScheduleResponses.entries()) {
      if (response.scheduleId === id) {
        this.teamScheduleResponses.delete(responseId);
      }
    }
    
    return this.teamSchedules.delete(id);
  }
  
  // Team schedule response methods
  async getTeamScheduleResponse(scheduleId: number, userId: number): Promise<TeamScheduleResponse | undefined> {
    return Array.from(this.teamScheduleResponses.values()).find(
      response => response.scheduleId === scheduleId && response.userId === userId
    );
  }
  
  async getTeamScheduleResponseById(id: number): Promise<TeamScheduleResponse | undefined> {
    return this.teamScheduleResponses.get(id);
  }
  
  async getTeamScheduleResponses(scheduleId: number): Promise<TeamScheduleResponse[]> {
    return Array.from(this.teamScheduleResponses.values()).filter(
      response => response.scheduleId === scheduleId
    );
  }
  
  async createTeamScheduleResponse(response: InsertTeamScheduleResponse): Promise<TeamScheduleResponse> {
    const id = this.teamScheduleResponseIdCounter++;
    const now = new Date();
    const newResponse: TeamScheduleResponse = {
      ...response,
      id,
      createdAt: now,
      updatedAt: now,
      notes: response.notes ?? null,
      maybeDeadline: response.maybeDeadline ?? null
    };
    this.teamScheduleResponses.set(id, newResponse);
    return newResponse;
  }
  
  async updateTeamScheduleResponse(id: number, responseData: Partial<TeamScheduleResponse>): Promise<TeamScheduleResponse | undefined> {
    const response = this.teamScheduleResponses.get(id);
    if (!response) return undefined;
    
    const updatedResponse = { 
      ...response, 
      ...responseData,
      updatedAt: new Date()
    };
    this.teamScheduleResponses.set(id, updatedResponse);
    return updatedResponse;
  }
  
  async deleteTeamScheduleResponse(id: number): Promise<boolean> {
    return this.teamScheduleResponses.delete(id);
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
      currentParticipants: 1, // Creator is automatically a participant
      description: insertEvent.description ?? null,
      locationCoordinates: null, // Set default value for required field
      eventImage: insertEvent.eventImage ?? null,
      isPublic: insertEvent.isPublic === undefined ? true : insertEvent.isPublic,
      isFree: insertEvent.isFree === undefined ? true : insertEvent.isFree,
      cost: insertEvent.cost ?? null
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
  
  // Sport Preferences methods
  async getUserSportPreferences(userId: number): Promise<UserSportPreference[]> {
    return Array.from(this.userSportPreferences.values()).filter(
      preference => preference.userId === userId
    );
  }
  
  async getUserSportPreference(userId: number, sportType: string): Promise<UserSportPreference | undefined> {
    return Array.from(this.userSportPreferences.values()).find(
      preference => preference.userId === userId && preference.sportType === sportType
    );
  }
  
  async createUserSportPreference(preference: InsertUserSportPreference): Promise<UserSportPreference> {
    const id = this.sportPreferenceIdCounter++;
    const now = new Date();
    const newPreference: UserSportPreference = { 
      ...preference, 
      id, 
      createdAt: now,
      yearsExperience: preference.yearsExperience ?? null,
      isVisible: preference.isVisible ?? true
    };
    this.userSportPreferences.set(id, newPreference);
    return newPreference;
  }
  
  async updateUserSportPreference(id: number, preferenceData: Partial<UserSportPreference>): Promise<UserSportPreference | undefined> {
    const preference = this.userSportPreferences.get(id);
    if (!preference) return undefined;
    
    const updatedPreference = { ...preference, ...preferenceData };
    this.userSportPreferences.set(id, updatedPreference);
    return updatedPreference;
  }
  
  async deleteUserSportPreference(id: number): Promise<boolean> {
    return this.userSportPreferences.delete(id);
  }
  
  // Player Ratings methods
  async getPlayerRatings(userId: number): Promise<PlayerRating[]> {
    return Array.from(this.playerRatings.values()).filter(
      rating => rating.ratedUserId === userId
    );
  }
  
  async getPlayerRatingsByEvent(eventId: number): Promise<PlayerRating[]> {
    return Array.from(this.playerRatings.values()).filter(
      rating => rating.eventId === eventId
    );
  }
  
  async createPlayerRating(rating: InsertPlayerRating): Promise<PlayerRating> {
    const id = this.playerRatingIdCounter++;
    const now = new Date();
    const newRating: PlayerRating = { 
      ...rating, 
      id, 
      createdAt: now,
      eventId: rating.eventId ?? null,
      comment: rating.comment ?? null
    };
    this.playerRatings.set(id, newRating);
    return newRating;
  }
  
  async updatePlayerRating(id: number, ratingData: Partial<PlayerRating>): Promise<PlayerRating | undefined> {
    const rating = this.playerRatings.get(id);
    if (!rating) return undefined;
    
    const updatedRating = { ...rating, ...ratingData };
    this.playerRatings.set(id, updatedRating);
    return updatedRating;
  }
  
  async deletePlayerRating(id: number): Promise<boolean> {
    return this.playerRatings.delete(id);
  }
  
  async getAveragePlayerRating(userId: number, sportType?: string): Promise<number> {
    const ratings = Array.from(this.playerRatings.values()).filter(
      rating => rating.ratedUserId === userId && (!sportType || rating.sportType === sportType)
    );
    
    if (ratings.length === 0) return 0;
    
    const sum = ratings.reduce((acc, rating) => acc + rating.rating, 0);
    return sum / ratings.length;
  }

  // Initialize with sample data
  private initSampleData() {
    // Create team-related maps for storage
    this.teams = new Map();
    this.teamMembers = new Map();
    this.teamPosts = new Map();
    this.teamPostComments = new Map();
    this.teamSchedules = new Map();
    this.teamScheduleResponses = new Map();
    
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
      
      // Add sport preferences for users
      const sportsPreferences = [
        // Alex's preferences
        { userId: 1, sportType: "basketball", skillLevel: "advanced", yearsExperience: 8 },
        { userId: 1, sportType: "soccer", skillLevel: "intermediate", yearsExperience: 4 },
        { userId: 1, sportType: "tennis", skillLevel: "advanced", yearsExperience: 6 },
        
        // Sarah's preferences
        { userId: 2, sportType: "volleyball", skillLevel: "expert", yearsExperience: 10 },
        { userId: 2, sportType: "swimming", skillLevel: "intermediate", yearsExperience: 3 },
        
        // Mark's preferences
        { userId: 3, sportType: "cycling", skillLevel: "expert", yearsExperience: 12 },
        { userId: 3, sportType: "running", skillLevel: "advanced", yearsExperience: 8 },
        
        // Emma's preferences
        { userId: 4, sportType: "yoga", skillLevel: "expert", yearsExperience: 7 },
        { userId: 4, sportType: "swimming", skillLevel: "advanced", yearsExperience: 5 }
      ];
      
      sportsPreferences.forEach(pref => {
        this.createUserSportPreference(pref);
      });
      
      // Add ratings between users
      const ratings = [
        // Ratings for Alex (user 1)
        { ratedUserId: 1, raterUserId: 2, eventId: 1, sportType: "basketball", rating: 5, comment: "Excellent player, great teamwork!" },
        { ratedUserId: 1, raterUserId: 3, eventId: 1, sportType: "basketball", rating: 4, comment: "Very skilled player" },
        { ratedUserId: 1, raterUserId: 4, eventId: 1, sportType: "basketball", rating: 5, comment: "Amazing skills and sportsmanship" },
        
        // Ratings for Sarah (user 2)
        { ratedUserId: 2, raterUserId: 1, eventId: 4, sportType: "volleyball", rating: 5, comment: "Incredible volleyball skills" },
        { ratedUserId: 2, raterUserId: 3, eventId: 4, sportType: "volleyball", rating: 5, comment: "Professional level player" },
        
        // Ratings for Mark (user 3)
        { ratedUserId: 3, raterUserId: 1, eventId: 5, sportType: "cycling", rating: 4, comment: "Very strong cyclist" },
        { ratedUserId: 3, raterUserId: 4, eventId: 5, sportType: "cycling", rating: 5, comment: "Exceptional endurance" },
        
        // Ratings for Emma (user 4)
        { ratedUserId: 4, raterUserId: 1, eventId: 6, sportType: "yoga", rating: 5, comment: "Amazing instructor, very helpful" },
        { ratedUserId: 4, raterUserId: 2, eventId: 6, sportType: "yoga", rating: 5, comment: "Patient and knowledgeable" }
      ];
      
      ratings.forEach(rating => {
        this.createPlayerRating(rating);
      });
      
      // Create sample teams
      const basketballTeam: InsertTeam = {
        name: "Downtown Dribblers",
        sportType: "basketball",
        creatorId: 1, // Alex
        description: "Casual basketball team that meets twice a week for practice and games.",
        logo: "https://images.unsplash.com/photo-1519861531473-9200262188bf?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&h=256&q=80",
        isPublic: true
      };
      
      const volleyballTeam: InsertTeam = {
        name: "Beach Spikers",
        sportType: "volleyball",
        creatorId: 2, // Sarah
        description: "Competitive beach volleyball team looking for tournaments and friendly matches.",
        logo: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=256&h=256&q=80",
        isPublic: true
      };
      
      this.createTeam(basketballTeam).then(team1 => {
        // Add additional team members for basketball team
        this.createTeamMember({
          teamId: team1.id,
          userId: 3, // Mark
          role: "member",
          position: "Forward"
        });
        
        this.createTeamMember({
          teamId: team1.id,
          userId: 4, // Emma
          role: "captain",
          position: "Guard"
        });
        
        // Create team posts for basketball team
        this.createTeamPost({
          teamId: team1.id,
          userId: 1, // Alex (admin)
          content: "Welcome to the Downtown Dribblers! Our next practice is on Friday at 6 PM."
        }).then(post => {
          // Add comments to the post
          this.createTeamPostComment({
            postId: post.id,
            userId: 3, // Mark
            content: "Looking forward to it!"
          });
          
          this.createTeamPostComment({
            postId: post.id,
            userId: 4, // Emma
            content: "I'll bring extra water bottles."
          });
        });
        
        this.createTeamPost({
          teamId: team1.id,
          userId: 4, // Emma (captain)
          content: "We need to work on our defensive rotations. Here's a video from our last game with some analysis."
        });
        
        // Create team schedule for basketball team
        const nextPractice = new Date();
        nextPractice.setDate(nextPractice.getDate() + 2); // 2 days from now
        nextPractice.setHours(18, 0, 0, 0); // 6:00 PM
        
        const practiceEnd = new Date(nextPractice);
        practiceEnd.setHours(19, 30, 0, 0); // 7:30 PM
        
        this.createTeamSchedule({
          teamId: team1.id,
          creatorId: 1, // Alex (admin)
          title: "Team Practice",
          eventType: "practice",
          startTime: nextPractice,
          endTime: practiceEnd,
          location: "Downtown Community Center",
          description: "Regular team practice focusing on defensive drills"
        }).then(schedule => {
          // Add responses to the schedule
          this.createTeamScheduleResponse({
            scheduleId: schedule.id,
            userId: 1, // Alex
            response: "attending"
          });
          
          this.createTeamScheduleResponse({
            scheduleId: schedule.id,
            userId: 3, // Mark
            response: "attending"
          });
          
          this.createTeamScheduleResponse({
            scheduleId: schedule.id,
            userId: 4, // Emma
            response: "maybe",
            responseNote: "I might be running late due to work",
            maybeDeadline: new Date(nextPractice.getTime() - 3600000) // 1 hour before practice
          });
        });
        
        // Create a game schedule
        const nextGame = new Date();
        nextGame.setDate(nextGame.getDate() + 5); // 5 days from now
        nextGame.setHours(19, 0, 0, 0); // 7:00 PM
        
        const gameEnd = new Date(nextGame);
        gameEnd.setHours(21, 0, 0, 0); // 9:00 PM
        
        this.createTeamSchedule({
          teamId: team1.id,
          creatorId: 4, // Emma (captain)
          title: "Game vs. Uptown Ballers",
          eventType: "game",
          startTime: nextGame,
          endTime: gameEnd,
          location: "City Sports Center",
          description: "Regular season game against the Uptown Ballers"
        }).then(schedule => {
          // Add responses to the schedule
          this.createTeamScheduleResponse({
            scheduleId: schedule.id,
            userId: 1, // Alex
            response: "attending"
          });
          
          this.createTeamScheduleResponse({
            scheduleId: schedule.id,
            userId: 3, // Mark
            response: "attending"
          });
          
          this.createTeamScheduleResponse({
            scheduleId: schedule.id,
            userId: 4, // Emma
            response: "attending"
          });
        });
      });
      
      this.createTeam(volleyballTeam).then(team2 => {
        // Add additional team members for volleyball team
        this.createTeamMember({
          teamId: team2.id,
          userId: 1, // Alex
          role: "member",
          position: "Outside Hitter"
        });
        
        // Create team posts for volleyball team
        this.createTeamPost({
          teamId: team2.id,
          userId: 2, // Sarah (admin)
          content: "Beach Spikers assemble! We have a tournament coming up in two weeks. Let's start preparing!"
        }).then(post => {
          // Add comments to the post
          this.createTeamPostComment({
            postId: post.id,
            userId: 1, // Alex
            content: "Can't wait! Do we need to register individually?"
          });
          
          this.createTeamPostComment({
            postId: post.id,
            userId: 2, // Sarah (response to Alex)
            content: "No, I'll handle the team registration. Just make sure you're available that weekend."
          });
        });
        
        // Create team schedule for volleyball team
        const beachPractice = new Date();
        beachPractice.setDate(beachPractice.getDate() + 3); // 3 days from now
        beachPractice.setHours(17, 0, 0, 0); // 5:00 PM
        
        const practiceEnd = new Date(beachPractice);
        practiceEnd.setHours(19, 0, 0, 0); // 7:00 PM
        
        this.createTeamSchedule({
          teamId: team2.id,
          creatorId: 2, // Sarah (admin)
          title: "Beach Practice",
          eventType: "practice",
          startTime: beachPractice,
          endTime: practiceEnd,
          location: "Ocean Beach Courts",
          description: "Practice focusing on service and reception"
        }).then(schedule => {
          // Add responses to the schedule
          this.createTeamScheduleResponse({
            scheduleId: schedule.id,
            userId: 2, // Sarah
            response: "attending"
          });
          
          this.createTeamScheduleResponse({
            scheduleId: schedule.id,
            userId: 1, // Alex
            response: "not_attending",
            notes: "I have a conflicting event that day"
          });
        });
      });
    });
  }
}

// Database storage implementation
export class DatabaseStorage implements IStorage {
  // Session store for authentication
  public sessionStore: session.Store;
  
  constructor() {
    // Initialize PostgreSQL session store
    this.sessionStore = new PostgresSessionStore({
      pool,
      tableName: "session",
      createTableIfMissing: true,
    });
  }
  
  // Team methods
  async getTeam(id: number): Promise<Team | undefined> {
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    return team;
  }
  
  async getTeamsByUser(userId: number): Promise<Team[]> {
    // Get teams where the user is a creator
    const creatorTeams = await db.select().from(teams).where(eq(teams.creatorId, userId));
    
    // Get teams where the user is a member
    const memberTeamIds = await db
      .select({ teamId: teamMembers.teamId })
      .from(teamMembers)
      .where(eq(teamMembers.userId, userId));
    
    const memberTeamIdsArray = memberTeamIds.map(item => item.teamId);
    
    // If user is not a member of any teams, just return creator teams
    if (memberTeamIdsArray.length === 0) {
      return creatorTeams;
    }
    
    // Get teams where user is a member but not a creator
    const memberTeams = await db
      .select()
      .from(teams)
      .where(
        and(
          or(...memberTeamIdsArray.map(teamId => eq(teams.id, teamId))),
          sql`${teams.creatorId} != ${userId}`
        )
      );
    
    // Combine the teams where user is creator and teams where user is member
    return [...creatorTeams, ...memberTeams];
  }
  
  async getAllTeams(nameQuery?: string): Promise<Team[]> {
    try {
      if (nameQuery) {
        return await db
          .select()
          .from(teams)
          .where(like(teams.name, `%${nameQuery}%`))
          .orderBy(desc(teams.createdAt));
      } else {
        return await db
          .select()
          .from(teams)
          .orderBy(desc(teams.createdAt));
      }
    } catch (error) {
      console.error("Error fetching all teams:", error);
      return [];
    }
  }
  
  async createTeam(team: InsertTeam): Promise<Team> {
    const [newTeam] = await db.insert(teams).values(team).returning();
    
    // Automatically add creator as admin
    await db.insert(teamMembers).values({
      teamId: newTeam.id,
      userId: newTeam.creatorId,
      role: "admin",
    });
    
    return newTeam;
  }
  
  async updateTeam(id: number, teamData: Partial<Team>): Promise<Team | undefined> {
    const [updatedTeam] = await db
      .update(teams)
      .set(teamData)
      .where(eq(teams.id, id))
      .returning();
    
    return updatedTeam;
  }
  
  async deleteTeam(id: number): Promise<boolean> {
    // First check if team exists
    const [team] = await db.select().from(teams).where(eq(teams.id, id));
    if (!team) return false;
    
    // Delete related data first (comments, responses, etc.)
    // Note: In a production system, we'd want to use a transaction here
    
    // Get all posts for this team
    const teamPosts = await db.select().from(teamPosts).where(eq(teamPosts.teamId, id));
    const postIds = teamPosts.map(post => post.id);
    
    // Delete post comments for team posts
    if (postIds.length > 0) {
      await db
        .delete(teamPostComments)
        .where(or(...postIds.map(postId => eq(teamPostComments.postId, postId))));
    }
    
    // Delete posts
    await db.delete(teamPosts).where(eq(teamPosts.teamId, id));
    
    // Get all schedules for this team
    const schedules = await db.select().from(teamSchedules).where(eq(teamSchedules.teamId, id));
    const scheduleIds = schedules.map(schedule => schedule.id);
    
    // Delete schedule responses
    if (scheduleIds.length > 0) {
      await db
        .delete(teamScheduleResponses)
        .where(or(...scheduleIds.map(scheduleId => eq(teamScheduleResponses.scheduleId, scheduleId))));
    }
    
    // Delete schedules
    await db.delete(teamSchedules).where(eq(teamSchedules.teamId, id));
    
    // Delete team members
    await db.delete(teamMembers).where(eq(teamMembers.teamId, id));
    
    // Finally, delete the team itself
    const deleted = await db.delete(teams).where(eq(teams.id, id));
    
    return deleted.count > 0;
  }
  
  // Team membership methods
  async getTeamMember(teamId: number, userId: number): Promise<TeamMember | undefined> {
    const [member] = await db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, teamId),
          eq(teamMembers.userId, userId)
        )
      );
    
    return member;
  }
  
  async getTeamMemberById(id: number): Promise<TeamMember | undefined> {
    const [member] = await db.select().from(teamMembers).where(eq(teamMembers.id, id));
    return member;
  }
  
  async getTeamMembers(teamId: number): Promise<TeamMember[]> {
    const members = await db
      .select({
        id: teamMembers.id,
        teamId: teamMembers.teamId,
        userId: teamMembers.userId,
        role: teamMembers.role,
        position: teamMembers.position,
        stats: teamMembers.stats,
        joinedAt: teamMembers.joinedAt,
        user: {
          id: users.id,
          username: users.username,
          name: users.name,
          email: users.email,
          profileImage: users.profileImage
        }
      })
      .from(teamMembers)
      .leftJoin(users, eq(teamMembers.userId, users.id))
      .where(eq(teamMembers.teamId, teamId));
    
    return members;
  }
  
  async createTeamMember(member: InsertTeamMember): Promise<TeamMember> {
    const [newMember] = await db.insert(teamMembers).values(member).returning();
    return newMember;
  }
  
  async updateTeamMember(id: number, memberData: Partial<TeamMember>): Promise<TeamMember | undefined> {
    const [updatedMember] = await db
      .update(teamMembers)
      .set(memberData)
      .where(eq(teamMembers.id, id))
      .returning();
    
    return updatedMember;
  }
  
  async deleteTeamMember(id: number): Promise<boolean> {
    const deleted = await db.delete(teamMembers).where(eq(teamMembers.id, id));
    return deleted.count > 0;
  }
  
  // Team post methods
  async getTeamPost(id: number): Promise<TeamPost | undefined> {
    const [post] = await db.select().from(teamPosts).where(eq(teamPosts.id, id));
    return post;
  }
  
  async getTeamPosts(teamId: number): Promise<TeamPost[]> {
    const posts = await db
      .select({
        id: teamPosts.id,
        teamId: teamPosts.teamId,
        userId: teamPosts.userId,
        content: teamPosts.content,
        image: teamPosts.image,
        createdAt: teamPosts.createdAt,
        updatedAt: teamPosts.updatedAt,
        user: {
          id: users.id,
          username: users.username,
          name: users.name,
          profileImage: users.profileImage
        }
      })
      .from(teamPosts)
      .leftJoin(users, eq(teamPosts.userId, users.id))
      .where(eq(teamPosts.teamId, teamId))
      .orderBy(desc(teamPosts.createdAt));
    
    return posts;
  }
  
  async createTeamPost(post: InsertTeamPost): Promise<TeamPost> {
    const [newPost] = await db.insert(teamPosts).values(post).returning();
    return newPost;
  }
  
  async updateTeamPost(id: number, postData: Partial<TeamPost>): Promise<TeamPost | undefined> {
    const [updatedPost] = await db
      .update(teamPosts)
      .set({
        ...postData,
        updatedAt: new Date()
      })
      .where(eq(teamPosts.id, id))
      .returning();
    
    return updatedPost;
  }
  
  async deleteTeamPost(id: number): Promise<boolean> {
    // Delete comments first
    await db.delete(teamPostComments).where(eq(teamPostComments.postId, id));
    
    // Then delete the post
    const deleted = await db.delete(teamPosts).where(eq(teamPosts.id, id));
    return deleted.count > 0;
  }
  
  // Team post comment methods
  async getTeamPostComment(id: number): Promise<TeamPostComment | undefined> {
    const [comment] = await db.select().from(teamPostComments).where(eq(teamPostComments.id, id));
    return comment;
  }
  
  async getTeamPostComments(postId: number): Promise<TeamPostComment[]> {
    const comments = await db
      .select({
        id: teamPostComments.id,
        postId: teamPostComments.postId,
        userId: teamPostComments.userId,
        content: teamPostComments.content,
        createdAt: teamPostComments.createdAt,
        user: {
          id: users.id,
          username: users.username,
          name: users.name,
          profileImage: users.profileImage
        }
      })
      .from(teamPostComments)
      .leftJoin(users, eq(teamPostComments.userId, users.id))
      .where(eq(teamPostComments.postId, postId))
      .orderBy(teamPostComments.createdAt);
    
    return comments;
  }
  
  async createTeamPostComment(comment: InsertTeamPostComment): Promise<TeamPostComment> {
    const [newComment] = await db.insert(teamPostComments).values(comment).returning();
    return newComment;
  }
  
  async updateTeamPostComment(id: number, commentData: Partial<TeamPostComment>): Promise<TeamPostComment | undefined> {
    const [updatedComment] = await db
      .update(teamPostComments)
      .set(commentData)
      .where(eq(teamPostComments.id, id))
      .returning();
    
    return updatedComment;
  }
  
  async deleteTeamPostComment(id: number): Promise<boolean> {
    const deleted = await db.delete(teamPostComments).where(eq(teamPostComments.id, id));
    return deleted.count > 0;
  }
  
  // Team schedule methods
  async getTeamSchedule(id: number): Promise<TeamSchedule | undefined> {
    const [schedule] = await db.select().from(teamSchedules).where(eq(teamSchedules.id, id));
    return schedule;
  }
  
  async getTeamSchedules(teamId: number): Promise<TeamSchedule[]> {
    const schedules = await db
      .select({
        id: teamSchedules.id,
        teamId: teamSchedules.teamId,
        creatorId: teamSchedules.creatorId,
        title: teamSchedules.title,
        description: teamSchedules.description,
        startTime: teamSchedules.startTime,
        endTime: teamSchedules.endTime,
        location: teamSchedules.location,
        isRequired: teamSchedules.isRequired,
        createdAt: teamSchedules.createdAt,
        creator: {
          id: users.id,
          username: users.username,
          name: users.name
        }
      })
      .from(teamSchedules)
      .leftJoin(users, eq(teamSchedules.creatorId, users.id))
      .where(eq(teamSchedules.teamId, teamId))
      .orderBy(teamSchedules.startTime);
    
    return schedules;
  }
  
  async createTeamSchedule(schedule: InsertTeamSchedule): Promise<TeamSchedule> {
    const [newSchedule] = await db.insert(teamSchedules).values(schedule).returning();
    return newSchedule;
  }
  
  async updateTeamSchedule(id: number, scheduleData: Partial<TeamSchedule>): Promise<TeamSchedule | undefined> {
    const [updatedSchedule] = await db
      .update(teamSchedules)
      .set(scheduleData)
      .where(eq(teamSchedules.id, id))
      .returning();
    
    return updatedSchedule;
  }
  
  async deleteTeamSchedule(id: number): Promise<boolean> {
    // Delete responses first
    await db.delete(teamScheduleResponses).where(eq(teamScheduleResponses.scheduleId, id));
    
    // Then delete the schedule
    const deleted = await db.delete(teamSchedules).where(eq(teamSchedules.id, id));
    return deleted.count > 0;
  }
  
  // Team schedule response methods
  async getTeamScheduleResponse(scheduleId: number, userId: number): Promise<TeamScheduleResponse | undefined> {
    const [response] = await db
      .select({
        id: teamScheduleResponses.id,
        scheduleId: teamScheduleResponses.scheduleId,
        userId: teamScheduleResponses.userId,
        response: teamScheduleResponses.response,
        notes: teamScheduleResponses.notes,
        maybeDeadline: teamScheduleResponses.maybeDeadline,
        createdAt: teamScheduleResponses.createdAt
      })
      .from(teamScheduleResponses)
      .where(
        and(
          eq(teamScheduleResponses.scheduleId, scheduleId),
          eq(teamScheduleResponses.userId, userId)
        )
      );
    
    return response;
  }
  
  async getTeamScheduleResponseById(id: number): Promise<TeamScheduleResponse | undefined> {
    const [response] = await db
      .select({
        id: teamScheduleResponses.id,
        scheduleId: teamScheduleResponses.scheduleId,
        userId: teamScheduleResponses.userId,
        response: teamScheduleResponses.response,
        notes: teamScheduleResponses.notes,
        maybeDeadline: teamScheduleResponses.maybeDeadline,
        createdAt: teamScheduleResponses.createdAt
      })
      .from(teamScheduleResponses)
      .where(eq(teamScheduleResponses.id, id));
    
    return response;
  }
  
  async getTeamScheduleResponses(scheduleId: number): Promise<any[]> {
    const responses = await db
      .select({
        id: teamScheduleResponses.id,
        scheduleId: teamScheduleResponses.scheduleId,
        userId: teamScheduleResponses.userId,
        response: teamScheduleResponses.response,
        notes: teamScheduleResponses.notes,
        maybeDeadline: teamScheduleResponses.maybeDeadline,
        createdAt: teamScheduleResponses.createdAt,
        user: {
          id: users.id,
          username: users.username,
          name: users.name,
          profileImage: users.profileImage
        }
      })
      .from(teamScheduleResponses)
      .leftJoin(users, eq(teamScheduleResponses.userId, users.id))
      .where(eq(teamScheduleResponses.scheduleId, scheduleId));
    
    return responses;
  }
  
  async createTeamScheduleResponse(response: InsertTeamScheduleResponse): Promise<TeamScheduleResponse> {
    const [newResponse] = await db.insert(teamScheduleResponses).values(response).returning();
    return newResponse;
  }
  
  async updateTeamScheduleResponse(id: number, responseData: Partial<TeamScheduleResponse>): Promise<TeamScheduleResponse | undefined> {
    const [updatedResponse] = await db
      .update(teamScheduleResponses)
      .set(responseData)
      .where(eq(teamScheduleResponses.id, id))
      .returning();
    
    return updatedResponse;
  }
  
  async deleteTeamScheduleResponse(id: number): Promise<boolean> {
    const deleted = await db.delete(teamScheduleResponses).where(eq(teamScheduleResponses.id, id));
    return deleted.count > 0;
  }

  // Team Join Request methods
  async getTeamJoinRequest(teamId: number, userId: number): Promise<TeamJoinRequest | undefined> {
    const [request] = await db
      .select()
      .from(teamJoinRequests)
      .where(and(
        eq(teamJoinRequests.teamId, teamId),
        eq(teamJoinRequests.userId, userId)
      ));
    return request;
  }

  async getTeamJoinRequests(teamId: number): Promise<TeamJoinRequest[]> {
    const requests = await db
      .select()
      .from(teamJoinRequests)
      .where(eq(teamJoinRequests.teamId, teamId));
    return requests;
  }

  async createTeamJoinRequest(joinRequest: InsertTeamJoinRequest): Promise<TeamJoinRequest> {
    const [newRequest] = await db
      .insert(teamJoinRequests)
      .values(joinRequest)
      .returning();
    return newRequest;
  }

  async updateTeamJoinRequest(id: number, status: string): Promise<TeamJoinRequest | undefined> {
    const [updatedRequest] = await db
      .update(teamJoinRequests)
      .set({ status })
      .where(eq(teamJoinRequests.id, id))
      .returning();
    return updatedRequest;
  }

  async deleteTeamJoinRequest(id: number): Promise<boolean> {
    const deleted = await db.delete(teamJoinRequests).where(eq(teamJoinRequests.id, id));
    return deleted.count > 0;
  }
  
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
      coverImage: insertUser.coverImage ?? null,
      bio: insertUser.bio ?? null,
      headline: insertUser.headline ?? null,
      location: insertUser.location ?? null
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

  async searchUsers(query: string): Promise<User[]> {
    try {
      // Split the query into words for better full name matching
      const queryParts = query.toLowerCase().split(/\s+/).filter(part => part.length > 0);
      
      let searchResults;
      
      // If there's only one part in the query, do a simple search
      if (queryParts.length <= 1) {
        searchResults = await db
          .select()
          .from(users)
          .where(
            or(
              like(users.username, `%${query}%`),
              like(users.name, `%${query}%`),
              like(users.email, `%${query}%`)
            )
          )
          .limit(10);
      } else {
        // For multi-word queries (e.g., "Alex Smith"), check if all parts match the name
        // We need to create conditions that check if each word appears in the name
        const conditions = queryParts.map(part => {
          return or(
            like(users.username, `%${part}%`),
            like(users.name, `%${part}%`),
            like(users.email, `%${part}%`)
          );
        });
        
        searchResults = await db
          .select()
          .from(users)
          .where(and(...conditions))
          .limit(10);
      }
      
      return searchResults;
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }
  
  async getAllUsers(): Promise<User[]> {
    try {
      const allUsers = await db.select().from(users);
      return allUsers;
    } catch (error) {
      console.error("Error fetching all users:", error);
      return [];
    }
  }

  // Friendship methods
  async getFriendship(userId: number, friendId: number): Promise<Friendship | undefined> {
    try {
      const [friendship] = await db
        .select()
        .from(friendships)
        .where(
          or(
            and(
              eq(friendships.userId, userId),
              eq(friendships.friendId, friendId)
            ),
            and(
              eq(friendships.userId, friendId),
              eq(friendships.friendId, userId)
            )
          )
        );
      
      return friendship;
    } catch (error) {
      console.error('Error getting friendship:', error);
      return undefined;
    }
  }

  async getFriendshipById(id: number): Promise<Friendship | undefined> {
    try {
      const [friendship] = await db
        .select()
        .from(friendships)
        .where(eq(friendships.id, id));
      
      return friendship;
    } catch (error) {
      console.error('Error getting friendship by id:', error);
      return undefined;
    }
  }

  async getFriendsByUserId(userId: number): Promise<User[]> {
    try {
      // Get all accepted friendships where user is either the user or friend
      const friendshipsAsUser = await db
        .select()
        .from(friendships)
        .where(
          and(
            eq(friendships.userId, userId),
            eq(friendships.status, 'accepted')
          )
        );
      
      const friendshipsAsFriend = await db
        .select()
        .from(friendships)
        .where(
          and(
            eq(friendships.friendId, userId),
            eq(friendships.status, 'accepted')
          )
        );
      
      // Extract friend IDs
      const friendIds = [
        ...friendshipsAsUser.map(f => f.friendId),
        ...friendshipsAsFriend.map(f => f.userId)
      ];
      
      // Get user details for all friend IDs
      if (friendIds.length === 0) return [];
      
      // Build the where condition using the in operator instead
      const friends = await db
        .select()
        .from(users)
        .where(
          // If we can't use a reduce trick, we can use a simple in condition
          friendIds.length === 1 
            ? eq(users.id, friendIds[0]) 
            : or(...friendIds.map(id => eq(users.id, id)))
        );
      
      return friends;
    } catch (error) {
      console.error('Error getting friends by user id:', error);
      return [];
    }
  }

  async getPendingFriendRequests(userId: number): Promise<Friendship[]> {
    try {
      // Get all pending friend requests sent to the user
      return db
        .select()
        .from(friendships)
        .where(
          and(
            eq(friendships.friendId, userId),
            eq(friendships.status, 'pending')
          )
        );
    } catch (error) {
      console.error('Error getting pending friend requests:', error);
      return [];
    }
  }

  async sendFriendRequest(friendship: InsertFriendship): Promise<Friendship> {
    try {
      // Set default status to pending if not provided
      const friendshipData = {
        ...friendship,
        status: friendship.status || 'pending'
      };
      
      const [newFriendship] = await db
        .insert(friendships)
        .values(friendshipData)
        .returning();
      
      return newFriendship;
    } catch (error) {
      console.error('Error sending friend request:', error);
      throw error;
    }
  }

  async updateFriendshipStatus(id: number, status: string): Promise<Friendship | undefined> {
    try {
      const [updatedFriendship] = await db
        .update(friendships)
        .set({ status })
        .where(eq(friendships.id, id))
        .returning();
      
      return updatedFriendship;
    } catch (error) {
      console.error('Error updating friendship status:', error);
      return undefined;
    }
  }

  async deleteFriendship(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(friendships)
        .where(eq(friendships.id, id))
        .returning({ id: friendships.id });
      
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting friendship:', error);
      return false;
    }
  }

  // Event methods
  async getEvent(id: number): Promise<Event | undefined> {
    // Get event with creator relationship using Drizzle's relation queries
    const [eventResult] = await db.query.events.findMany({
      where: eq(events.id, id),
      with: {
        creator: {
          columns: {
            password: false, // Don't include password
            id: true,
            username: true,
            name: true,
            email: true,
            profileImage: true,
            bio: true,
            location: true,
            headline: true,
            coverImage: true,
            createdAt: true
          }
        }
      }
    });
    
    // Log for debugging
    if (eventResult) {
      console.log("Found event:", eventResult.id, eventResult.title);
      console.log("Creator info:", eventResult.creator?.name || eventResult.creator?.username);
    }
    
    return eventResult;
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
    // Process date field to ensure it's a Date object
    const processedData = { ...eventData };
    
    // If date is a string, convert it to a Date object
    if (processedData.date && typeof processedData.date === 'string') {
      try {
        processedData.date = new Date(processedData.date);
      } catch (error) {
        console.error("Failed to convert date string to Date object:", error);
        throw new Error("Invalid date format");
      }
    }
    
    const [updatedEvent] = await db
      .update(events)
      .set(processedData)
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
  
  // Sport Preferences methods
  async getUserSportPreferences(userId: number): Promise<UserSportPreference[]> {
    try {
      return db
        .select()
        .from(userSportPreferences)
        .where(eq(userSportPreferences.userId, userId));
    } catch (error) {
      console.error('Error getting user sport preferences:', error);
      return [];
    }
  }
  
  async getUserSportPreference(userId: number, sportType: string): Promise<UserSportPreference | undefined> {
    try {
      const [preference] = await db
        .select()
        .from(userSportPreferences)
        .where(
          and(
            eq(userSportPreferences.userId, userId),
            eq(userSportPreferences.sportType, sportType)
          )
        );
      
      return preference;
    } catch (error) {
      console.error('Error getting user sport preference:', error);
      return undefined;
    }
  }
  
  async createUserSportPreference(preference: InsertUserSportPreference): Promise<UserSportPreference> {
    try {
      // Ensure null values for optional fields
      const preferenceWithNulls = {
        ...preference,
        yearsExperience: preference.yearsExperience ?? null,
        isVisible: preference.isVisible ?? true
      };
      
      const [newPreference] = await db
        .insert(userSportPreferences)
        .values(preferenceWithNulls)
        .returning();
      
      return newPreference;
    } catch (error) {
      console.error('Error creating user sport preference:', error);
      throw error;
    }
  }
  
  async updateUserSportPreference(id: number, preferenceData: Partial<UserSportPreference>): Promise<UserSportPreference | undefined> {
    try {
      const [updatedPreference] = await db
        .update(userSportPreferences)
        .set(preferenceData)
        .where(eq(userSportPreferences.id, id))
        .returning();
      
      return updatedPreference;
    } catch (error) {
      console.error('Error updating user sport preference:', error);
      return undefined;
    }
  }
  
  async deleteUserSportPreference(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(userSportPreferences)
        .where(eq(userSportPreferences.id, id))
        .returning({ id: userSportPreferences.id });
      
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting user sport preference:', error);
      return false;
    }
  }
  
  // Player Ratings methods
  async getPlayerRatings(userId: number): Promise<PlayerRating[]> {
    try {
      return db
        .select()
        .from(playerRatings)
        .where(eq(playerRatings.ratedUserId, userId));
    } catch (error) {
      console.error('Error getting player ratings:', error);
      return [];
    }
  }
  
  async getPlayerRatingsByEvent(eventId: number): Promise<PlayerRating[]> {
    try {
      return db
        .select()
        .from(playerRatings)
        .where(eq(playerRatings.eventId, eventId));
    } catch (error) {
      console.error('Error getting player ratings by event:', error);
      return [];
    }
  }
  
  async createPlayerRating(rating: InsertPlayerRating): Promise<PlayerRating> {
    try {
      // Ensure null values for optional fields
      const ratingWithNulls = {
        ...rating,
        eventId: rating.eventId ?? null,
        comment: rating.comment ?? null
      };
      
      const [newRating] = await db
        .insert(playerRatings)
        .values(ratingWithNulls)
        .returning();
      
      return newRating;
    } catch (error) {
      console.error('Error creating player rating:', error);
      throw error;
    }
  }
  
  async updatePlayerRating(id: number, ratingData: Partial<PlayerRating>): Promise<PlayerRating | undefined> {
    try {
      const [updatedRating] = await db
        .update(playerRatings)
        .set(ratingData)
        .where(eq(playerRatings.id, id))
        .returning();
      
      return updatedRating;
    } catch (error) {
      console.error('Error updating player rating:', error);
      return undefined;
    }
  }
  
  async deletePlayerRating(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(playerRatings)
        .where(eq(playerRatings.id, id))
        .returning({ id: playerRatings.id });
      
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting player rating:', error);
      return false;
    }
  }
  
  async getAveragePlayerRating(userId: number, sportType?: string): Promise<number> {
    try {
      const result = await db.execute(
        sql`SELECT AVG(rating) as average_rating 
            FROM ${playerRatings} 
            WHERE ${playerRatings.ratedUserId} = ${userId}
            ${sportType ? sql`AND ${playerRatings.sportType} = ${sportType}` : sql``}`
      );
      
      const average = result.rows[0]?.average_rating;
      return average ? parseFloat(average.toString()) : 0;
    } catch (error) {
      console.error('Error getting average player rating:', error);
      return 0;
    }
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
    
    // Add sport preferences for users
    const sportsPreferences = [
      // Alex's preferences
      { userId: user.id, sportType: "basketball", skillLevel: "advanced", yearsExperience: 8 },
      { userId: user.id, sportType: "soccer", skillLevel: "intermediate", yearsExperience: 4 },
      { userId: user.id, sportType: "tennis", skillLevel: "advanced", yearsExperience: 6 },
      
      // Sarah's preferences
      { userId: user2.id, sportType: "volleyball", skillLevel: "expert", yearsExperience: 10 },
      { userId: user2.id, sportType: "swimming", skillLevel: "intermediate", yearsExperience: 3 },
      
      // Mark's preferences
      { userId: user3.id, sportType: "cycling", skillLevel: "expert", yearsExperience: 12 },
      { userId: user3.id, sportType: "running", skillLevel: "advanced", yearsExperience: 8 },
      
      // Emma's preferences
      { userId: user4.id, sportType: "yoga", skillLevel: "expert", yearsExperience: 7 },
      { userId: user4.id, sportType: "swimming", skillLevel: "advanced", yearsExperience: 5 }
    ];
    
    for (const pref of sportsPreferences) {
      await this.createUserSportPreference(pref);
    }
    
    // Add ratings between users
    const ratings = [
      // Ratings for Alex (user 1)
      { ratedUserId: user.id, raterUserId: user2.id, eventId: basketballEventData.id, sportType: "basketball", rating: 5, comment: "Excellent player, great teamwork!" },
      { ratedUserId: user.id, raterUserId: user3.id, eventId: basketballEventData.id, sportType: "basketball", rating: 4, comment: "Very skilled player" },
      { ratedUserId: user.id, raterUserId: user4.id, eventId: basketballEventData.id, sportType: "basketball", rating: 5, comment: "Amazing skills and sportsmanship" },
      
      // Ratings for Sarah (user 2)
      { ratedUserId: user2.id, raterUserId: user.id, eventId: 4, sportType: "volleyball", rating: 5, comment: "Incredible volleyball skills" },
      { ratedUserId: user2.id, raterUserId: user3.id, eventId: 4, sportType: "volleyball", rating: 5, comment: "Professional level player" },
      
      // Ratings for Mark (user 3)
      { ratedUserId: user3.id, raterUserId: user.id, eventId: 5, sportType: "cycling", rating: 4, comment: "Very strong cyclist" },
      { ratedUserId: user3.id, raterUserId: user4.id, eventId: 5, sportType: "cycling", rating: 5, comment: "Exceptional endurance" },
      
      // Ratings for Emma (user 4)
      { ratedUserId: user4.id, raterUserId: user.id, eventId: 6, sportType: "yoga", rating: 5, comment: "Amazing instructor, very helpful" },
      { ratedUserId: user4.id, raterUserId: user2.id, eventId: 6, sportType: "yoga", rating: 5, comment: "Patient and knowledgeable" }
    ];
    
    for (const rating of ratings) {
      await this.createPlayerRating(rating);
    }
  }
}

// Initialize storage
export const storage = new DatabaseStorage();

// Seed the database with sample data
storage.initSampleData().catch(error => {
  console.error('Failed to initialize sample data:', error);
});
