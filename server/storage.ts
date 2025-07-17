import { 
  users, type User, type InsertUser, 
  events, type Event, type InsertEvent,
  rsvps, type RSVP, type InsertRSVP,
  friendships, type Friendship, type InsertFriendship,
  userSportPreferences, type UserSportPreference, type InsertUserSportPreference,
  userOnboardingPreferences, type UserOnboardingPreference, type InsertUserOnboardingPreference,
  playerRatings, type PlayerRating, type InsertPlayerRating,
  teams, type Team, type InsertTeam,
  teamMembers, type TeamMember, type InsertTeamMember,
  teamPosts, type TeamPost, type InsertTeamPost,
  teamPostComments, type TeamPostComment, type InsertTeamPostComment,
  teamSchedules, type TeamSchedule, type InsertTeamSchedule,
  teamScheduleResponses, type TeamScheduleResponse, type InsertTeamScheduleResponse,
  teamJoinRequests, type TeamJoinRequest, type InsertTeamJoinRequest,
  sportsGroups, type SportsGroup, type InsertSportsGroup,
  sportsGroupMembers, type SportsGroupMember, type InsertSportsGroupMember,
  sportsGroupMessages, type SportsGroupMessage, type InsertSportsGroupMessage,
  sportsGroupEvents, type SportsGroupEvent, type InsertSportsGroupEvent,
  sportsGroupPolls, type SportsGroupPoll, type InsertSportsGroupPoll,
  sportsGroupPollTimeSlots, type SportsGroupPollTimeSlot, type InsertSportsGroupPollTimeSlot,
  sportsGroupPollResponses, type SportsGroupPollResponse, type InsertSportsGroupPollResponse,
  sportsGroupJoinRequests, type SportsGroupJoinRequest, type InsertSportsGroupJoinRequest,
  skillMatcherPreferences, type SkillMatcherPreference, type InsertSkillMatcherPreference,
  skillMatches, type SkillMatch, type InsertSkillMatch,
  matchResults, type MatchResult, type InsertMatchResult,
  matchParticipants, type MatchParticipant, type InsertMatchParticipant,
  playerStatistics, type PlayerStatistics, type InsertPlayerStatistics,
  matchResultNotifications, type MatchResultNotification, type InsertMatchResultNotification,
  professionalTeamHistory, type ProfessionalTeamHistory, type InsertProfessionalTeamHistory,
  sportSkillLevels, type SportSkillLevel, type InsertSportSkillLevel
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, asc, or, like, avg, sql, gte, lt } from "drizzle-orm";
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
  getSentFriendRequests(userId: number): Promise<Friendship[]>;
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
  getDiscoverableEvents(userId?: number | null): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, eventData: Partial<Event>): Promise<Event | undefined>;
  updateEventVisibility(id: number, publicVisibility: string | null): Promise<boolean>;
  deleteEvent(id: number): Promise<boolean>;
  
  // RSVP methods
  getRSVPById(id: number): Promise<RSVP | undefined>;
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
  getUserMatchesCount(userId: number): Promise<number>;
  
  // User onboarding preferences methods
  getUserOnboardingPreference(userId: number): Promise<UserOnboardingPreference | undefined>;
  createUserOnboardingPreference(preference: InsertUserOnboardingPreference): Promise<UserOnboardingPreference>;
  updateUserOnboardingPreference(userId: number, preferenceData: Partial<UserOnboardingPreference>): Promise<UserOnboardingPreference | undefined>;
  completeUserOnboarding(userId: number): Promise<UserOnboardingPreference | undefined>;

  // Team join request methods
  getTeamJoinRequests(teamId: number): Promise<TeamJoinRequest[]>;
  getAcceptedTeamJoinRequests(userId: number): Promise<TeamJoinRequest[]>;
  createTeamJoinRequest(request: InsertTeamJoinRequest): Promise<TeamJoinRequest>;
  updateTeamJoinRequest(id: number, requestData: Partial<TeamJoinRequest>): Promise<TeamJoinRequest | undefined>;
  deleteTeamJoinRequest(id: number): Promise<boolean>;

  // Sports Groups methods
  getSportsGroup(id: number): Promise<SportsGroup | undefined>;
  getSportsGroupsByUser(userId: number): Promise<SportsGroup[]>;
  getAllSportsGroups(sportType?: string, nameQuery?: string): Promise<SportsGroup[]>;
  createSportsGroup(group: InsertSportsGroup): Promise<SportsGroup>;
  updateSportsGroup(id: number, groupData: Partial<SportsGroup>): Promise<SportsGroup | undefined>;
  deleteSportsGroup(id: number): Promise<boolean>;

  // Sports Group Members methods
  getSportsGroupMember(groupId: number, userId: number): Promise<SportsGroupMember | undefined>;
  getSportsGroupMembers(groupId: number): Promise<SportsGroupMember[]>;
  addSportsGroupMember(member: InsertSportsGroupMember): Promise<SportsGroupMember>;
  updateSportsGroupMember(id: number, memberData: Partial<SportsGroupMember>): Promise<SportsGroupMember | undefined>;
  removeSportsGroupMember(id: number): Promise<boolean>;

  // Sports Group Messages methods
  getSportsGroupMessages(groupId: number): Promise<SportsGroupMessage[]>;
  createSportsGroupMessage(message: InsertSportsGroupMessage): Promise<SportsGroupMessage>;
  updateSportsGroupMessage(id: number, messageData: Partial<SportsGroupMessage>): Promise<SportsGroupMessage | undefined>;
  deleteSportsGroupMessage(id: number): Promise<boolean>;

  // Sports Group Events methods
  getSportsGroupEvents(groupId: number): Promise<SportsGroupEvent[]>;
  getSportsGroupEventHistory(groupId: number): Promise<SportsGroupEvent[]>;
  getSportsGroupEventByEventId(eventId: number): Promise<SportsGroupEvent | undefined>;
  addSportsGroupEvent(groupEvent: InsertSportsGroupEvent): Promise<SportsGroupEvent>;
  removeSportsGroupEvent(id: number): Promise<boolean>;

  // Sports Group Polls methods
  getSportsGroupPolls(groupId: number): Promise<SportsGroupPoll[]>;
  getSportsGroupPoll(id: number): Promise<SportsGroupPoll | undefined>;
  createSportsGroupPoll(poll: InsertSportsGroupPoll): Promise<SportsGroupPoll>;
  updateSportsGroupPoll(id: number, pollData: Partial<SportsGroupPoll>): Promise<SportsGroupPoll | undefined>;
  deleteSportsGroupPoll(id: number): Promise<boolean>;

  // Sports Group Poll Time Slots methods
  getSportsGroupPollTimeSlots(pollId: number): Promise<SportsGroupPollTimeSlot[]>;
  createSportsGroupPollTimeSlot(timeSlot: InsertSportsGroupPollTimeSlot): Promise<SportsGroupPollTimeSlot>;
  deleteSportsGroupPollTimeSlot(id: number): Promise<boolean>;

  // Sports Group Poll Responses methods
  getSportsGroupPollResponses(pollId: number): Promise<SportsGroupPollResponse[]>;
  getSportsGroupPollUserResponses(pollId: number, userId: number): Promise<SportsGroupPollResponse[]>;
  createSportsGroupPollResponse(response: InsertSportsGroupPollResponse): Promise<SportsGroupPollResponse>;
  updateSportsGroupPollResponse(id: number, responseData: Partial<SportsGroupPollResponse>): Promise<SportsGroupPollResponse | undefined>;
  deleteSportsGroupPollResponse(id: number): Promise<boolean>;
  markPollSuggestionAsUsed(pollId: number, suggestionId: number, eventId: number): Promise<boolean>;

  // Sports Group Join Requests methods
  getSportsGroupJoinRequests(groupId: number): Promise<SportsGroupJoinRequest[]>;
  getSportsGroupJoinRequest(groupId: number, userId: number): Promise<SportsGroupJoinRequest | undefined>;
  createSportsGroupJoinRequest(request: InsertSportsGroupJoinRequest): Promise<SportsGroupJoinRequest>;
  updateSportsGroupJoinRequest(id: number, requestData: Partial<SportsGroupJoinRequest>): Promise<SportsGroupJoinRequest | undefined>;
  deleteSportsGroupJoinRequest(id: number): Promise<boolean>;

  // Skill Matcher methods
  getSkillMatcherPreferences(userId: number): Promise<SkillMatcherPreference[]>;
  getSkillMatcherPreference(userId: number, sportType: string): Promise<SkillMatcherPreference | undefined>;
  createSkillMatcherPreference(preference: InsertSkillMatcherPreference): Promise<SkillMatcherPreference>;
  updateSkillMatcherPreference(id: number, preferenceData: Partial<SkillMatcherPreference>): Promise<SkillMatcherPreference | undefined>;
  deleteSkillMatcherPreference(id: number): Promise<boolean>;
  
  // Skill Matches methods
  getSkillMatches(userId: number): Promise<any[]>;
  getSkillMatchesBySport(userId: number, sportType: string): Promise<any[]>;
  createSkillMatch(match: InsertSkillMatch): Promise<SkillMatch>;
  updateSkillMatch(id: number, matchData: Partial<SkillMatch>): Promise<SkillMatch | undefined>;
  deleteSkillMatch(id: number): Promise<boolean>;
  generateSkillMatches(userId: number, sportType: string): Promise<any[]>;
  findCompatiblePlayers(userId: number, sportType: string): Promise<any[]>;

  // Scoreboard/Match Results methods
  getMatchResult(id: number): Promise<MatchResult | undefined>;
  getMatchResultByEvent(eventId: number): Promise<MatchResult | undefined>;
  getMatchResultsByGroup(groupId: number): Promise<MatchResult[]>;
  createMatchResult(result: InsertMatchResult): Promise<MatchResult>;
  updateMatchResult(id: number, resultData: Partial<MatchResult>): Promise<MatchResult | undefined>;
  deleteMatchResult(id: number): Promise<boolean>;
  
  // Match Participants methods
  getMatchParticipants(matchId: number): Promise<MatchParticipant[]>;
  createMatchParticipant(participant: InsertMatchParticipant): Promise<MatchParticipant>;
  updateMatchParticipant(id: number, participantData: Partial<MatchParticipant>): Promise<MatchParticipant | undefined>;
  deleteMatchParticipant(id: number): Promise<boolean>;

  // Player Statistics methods
  getPlayerStatistics(userId: number, groupId: number, sportType: string): Promise<PlayerStatistics | undefined>;
  getPlayerStatisticsByGroup(groupId: number, sportType?: string): Promise<PlayerStatistics[]>;
  createPlayerStatistics(stats: InsertPlayerStatistics): Promise<PlayerStatistics>;
  updatePlayerStatistics(id: number, statsData: Partial<PlayerStatistics>): Promise<PlayerStatistics | undefined>;
  deletePlayerStatistics(id: number): Promise<boolean>;

  // Match Result Notifications methods
  getMatchResultNotifications(userId: number): Promise<MatchResultNotification[]>;
  createMatchResultNotification(notification: InsertMatchResultNotification): Promise<MatchResultNotification>;
  markMatchResultNotificationViewed(id: number): Promise<boolean>;

  // Professional Team History methods
  getProfessionalTeamHistory(userId: number): Promise<ProfessionalTeamHistory[]>;
  createProfessionalTeamHistory(history: InsertProfessionalTeamHistory): Promise<ProfessionalTeamHistory>;
  updateProfessionalTeamHistory(id: number, historyData: Partial<ProfessionalTeamHistory>): Promise<ProfessionalTeamHistory | undefined>;
  deleteProfessionalTeamHistory(id: number): Promise<boolean>;

  // Sport Skill Levels methods
  getSportSkillLevels(userId: number): Promise<SportSkillLevel[]>;
  getSportSkillLevel(userId: number, sportType: string): Promise<SportSkillLevel | undefined>;
  createSportSkillLevel(skillLevel: InsertSportSkillLevel): Promise<SportSkillLevel>;
  updateSportSkillLevel(id: number, skillData: Partial<SportSkillLevel>): Promise<SportSkillLevel | undefined>;
  deleteSportSkillLevel(id: number): Promise<boolean>;

  // Profile completion methods
  updateUserProfileCompletion(userId: number, completionLevel: number): Promise<User | undefined>;

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
  private teamJoinRequests: Map<number, TeamJoinRequest>;
  private userOnboardingPreferences: Map<number, UserOnboardingPreference>;
  private sportsGroups: Map<number, SportsGroup>;
  private sportsGroupMembers: Map<number, SportsGroupMember>;
  private sportsGroupPosts: Map<number, SportsGroupPost>;
  private sportsGroupPostComments: Map<number, SportsGroupPostComment>;
  private sportsGroupPolls: Map<number, SportsGroupPoll>;
  private sportsGroupPollOptions: Map<number, SportsGroupPollOption>;
  private sportsGroupPollVotes: Map<number, SportsGroupPollVote>;
  private sportsGroupAvailability: Map<number, SportsGroupAvailability>;
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
  private teamJoinRequestIdCounter: number;
  private userOnboardingPrefIdCounter: number;
  
  // Session store for authentication
  public sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.events = new Map();
    this.rsvps = new Map();
    this.friendships = new Map();
    this.userSportPreferences = new Map();
    this.userOnboardingPreferences = new Map();
    this.playerRatings = new Map();
    this.teams = new Map();
    this.teamMembers = new Map();
    this.teamPosts = new Map();
    this.teamPostComments = new Map();
    this.teamSchedules = new Map();
    this.teamScheduleResponses = new Map();
    this.teamJoinRequests = new Map();
    this.sportsGroups = new Map();
    this.sportsGroupMembers = new Map();
    this.sportsGroupPosts = new Map();
    this.sportsGroupPostComments = new Map();
    this.sportsGroupPolls = new Map();
    this.sportsGroupPollOptions = new Map();
    this.sportsGroupPollVotes = new Map();
    this.sportsGroupAvailability = new Map();
    this.userIdCounter = 1;
    this.eventIdCounter = 1;
    this.rsvpIdCounter = 1;
    this.friendshipIdCounter = 1;
    this.sportPreferenceIdCounter = 1;
    this.userOnboardingPrefIdCounter = 1;
    this.playerRatingIdCounter = 1;
    this.teamIdCounter = 1;
    this.teamMemberIdCounter = 1;
    this.teamPostIdCounter = 1;
    this.teamPostCommentIdCounter = 1;
    this.teamScheduleIdCounter = 1;
    this.teamScheduleResponseIdCounter = 1;
    this.teamJoinRequestIdCounter = 1;
    
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

  async getSentFriendRequests(userId: number): Promise<Friendship[]> {
    // Get pending friend requests sent by the user
    return Array.from(this.friendships.values()).filter(
      friendship => 
        friendship.status === "pending" &&
        friendship.userId === userId
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

  async updateEventVisibility(id: number, publicVisibility: string | null): Promise<boolean> {
    const event = this.events.get(id);
    if (!event) return false;
    
    const updatedEvent = { ...event, publicVisibility };
    this.events.set(id, updatedEvent);
    return true;
  }

  async deleteEvent(id: number): Promise<boolean> {
    return this.events.delete(id);
  }

  // RSVP methods
  async getRSVPById(id: number): Promise<RSVP | undefined> {
    return this.rsvps.get(id);
  }

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
  
  // User onboarding preferences methods
  private userOnboardingPreferences: Map<number, UserOnboardingPreference>;
  private userOnboardingPrefIdCounter: number;
  
  async getUserOnboardingPreference(userId: number): Promise<UserOnboardingPreference | undefined> {
    return Array.from(this.userOnboardingPreferences.values()).find(
      preference => preference.userId === userId
    );
  }
  
  async createUserOnboardingPreference(preference: InsertUserOnboardingPreference): Promise<UserOnboardingPreference> {
    const id = this.userOnboardingPrefIdCounter++;
    const now = new Date();
    const newPreference: UserOnboardingPreference = {
      ...preference,
      id,
      createdAt: now,
      updatedAt: now,
      onboardingCompleted: false
    };
    this.userOnboardingPreferences.set(id, newPreference);
    return newPreference;
  }
  
  async updateUserOnboardingPreference(userId: number, preferenceData: Partial<UserOnboardingPreference>): Promise<UserOnboardingPreference | undefined> {
    const preference = Array.from(this.userOnboardingPreferences.values()).find(
      pref => pref.userId === userId
    );
    
    if (!preference) return undefined;
    
    const updatedPreference = { 
      ...preference, 
      ...preferenceData,
      updatedAt: new Date()
    };
    this.userOnboardingPreferences.set(preference.id, updatedPreference);
    return updatedPreference;
  }
  
  async completeUserOnboarding(userId: number): Promise<UserOnboardingPreference | undefined> {
    const preference = Array.from(this.userOnboardingPreferences.values()).find(
      pref => pref.userId === userId
    );
    
    if (!preference) return undefined;
    
    const completedPreference = { 
      ...preference, 
      onboardingCompleted: true,
      updatedAt: new Date()
    };
    this.userOnboardingPreferences.set(preference.id, completedPreference);
    return completedPreference;
  }

  // Team join request methods
  async getTeamJoinRequests(teamId: number): Promise<TeamJoinRequest[]> {
    return Array.from(this.teamJoinRequests.values()).filter(
      request => request.teamId === teamId
    );
  }

  async getAcceptedTeamJoinRequests(userId: number): Promise<TeamJoinRequest[]> {
    return Array.from(this.teamJoinRequests.values()).filter(
      request => request.userId === userId && request.status === "accepted"
    );
  }

  async createTeamJoinRequest(request: InsertTeamJoinRequest): Promise<TeamJoinRequest> {
    const id = this.teamJoinRequestIdCounter++;
    const now = new Date();
    const newRequest: TeamJoinRequest = {
      ...request,
      id,
      createdAt: now,
      status: request.status || 'pending',
      viewed: request.viewed || false
    };
    this.teamJoinRequests.set(id, newRequest);
    return newRequest;
  }

  async updateTeamJoinRequest(id: number, requestData: Partial<TeamJoinRequest>): Promise<TeamJoinRequest | undefined> {
    const request = this.teamJoinRequests.get(id);
    if (!request) return undefined;
    
    const updatedRequest = { ...request, ...requestData };
    this.teamJoinRequests.set(id, updatedRequest);
    return updatedRequest;
  }

  async deleteTeamJoinRequest(id: number): Promise<boolean> {
    return this.teamJoinRequests.delete(id);
  }

  // Sports Groups methods
  async getAllSportsGroups(): Promise<SportsGroup[]> {
    return Array.from(this.sportsGroups.values());
  }

  async getSportsGroup(id: number): Promise<SportsGroup | undefined> {
    return this.sportsGroups.get(id);
  }

  async getSportsGroupsByUser(userId: number): Promise<SportsGroup[]> {
    const userGroups: SportsGroup[] = [];
    
    // Get groups where user is admin
    for (const group of this.sportsGroups.values()) {
      if (group.adminId === userId) {
        userGroups.push(group);
      }
    }
    
    // Get groups where user is a member
    for (const member of this.sportsGroupMembers.values()) {
      if (member.userId === userId) {
        const group = this.sportsGroups.get(member.groupId);
        if (group && !userGroups.find(g => g.id === group.id)) {
          userGroups.push(group);
        }
      }
    }
    
    return userGroups;
  }

  async createSportsGroup(data: Omit<SportsGroup, 'id' | 'createdAt'>): Promise<SportsGroup> {
    const id = Date.now();
    const newGroup: SportsGroup = {
      id,
      ...data,
      createdAt: new Date(),
    };
    
    this.sportsGroups.set(id, newGroup);
    
    // Add the admin as the first member
    const memberData = {
      id: Date.now() + 1,
      groupId: id,
      userId: data.adminId,
      role: 'admin' as const,
      joinedAt: new Date(),
    };
    this.sportsGroupMembers.set(memberData.id, memberData);
    
    return newGroup;
  }

  async getSportsGroupMembers(groupId: number): Promise<SportsGroupMember[]> {
    const members: SportsGroupMember[] = [];
    for (const member of this.sportsGroupMembers.values()) {
      if (member.groupId === groupId) {
        members.push(member);
      }
    }
    return members;
  }

  async updateSportsGroup(id: number, data: Partial<SportsGroup>): Promise<SportsGroup | undefined> {
    const group = this.sportsGroups.get(id);
    if (!group) return undefined;
    
    const updatedGroup = { ...group, ...data };
    this.sportsGroups.set(id, updatedGroup);
    return updatedGroup;
  }

  async deleteSportsGroup(id: number): Promise<boolean> {
    return this.sportsGroups.delete(id);
  }

  // Sports Group Members methods
  async getSportsGroupMembers(groupId: number): Promise<SportsGroupMember[]> {
    return Array.from(this.sportsGroupMembers.values()).filter(member => member.groupId === groupId);
  }

  async createSportsGroupMember(data: Omit<SportsGroupMember, 'id' | 'joinedAt'>): Promise<SportsGroupMember> {
    const id = Date.now();
    const newMember: SportsGroupMember = {
      id,
      ...data,
      joinedAt: new Date(),
    };
    
    this.sportsGroupMembers.set(id, newMember);
    return newMember;
  }

  async updateSportsGroupMember(id: number, data: Partial<SportsGroupMember>): Promise<SportsGroupMember | undefined> {
    const member = this.sportsGroupMembers.get(id);
    if (!member) return undefined;
    
    const updatedMember = { ...member, ...data };
    this.sportsGroupMembers.set(id, updatedMember);
    return updatedMember;
  }

  async deleteSportsGroupMember(id: number): Promise<boolean> {
    return this.sportsGroupMembers.delete(id);
  }

  // Placeholder methods for other sports groups features (to be implemented later)
  async getSportsGroupPosts(groupId: number): Promise<any[]> { return []; }
  async createSportsGroupPost(data: any): Promise<any> { return data; }
  async updateSportsGroupPost(id: number, data: any): Promise<any> { return data; }
  async deleteSportsGroupPost(id: number): Promise<boolean> { return true; }
  async getSportsGroupPostComments(postId: number): Promise<any[]> { return []; }
  async createSportsGroupPostComment(data: any): Promise<any> { return data; }
  async updateSportsGroupPostComment(id: number, data: any): Promise<any> { return data; }
  async deleteSportsGroupPostComment(id: number): Promise<boolean> { return true; }
  async updateSportsGroupPollVote(id: number, data: any): Promise<any> { return data; }
  async deleteSportsGroupPollVote(id: number): Promise<boolean> { return true; }
  async getSportsGroupAvailability(groupId: number): Promise<any[]> { return []; }
  async createSportsGroupAvailability(data: any): Promise<any> { return data; }
  async updateSportsGroupAvailability(id: number, data: any): Promise<any> { return data; }
  async deleteSportsGroupAvailability(id: number): Promise<boolean> { return true; }

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
  
  async getTeamJoinRequestById(id: number): Promise<TeamJoinRequest | undefined> {
    const [request] = await db
      .select()
      .from(teamJoinRequests)
      .where(eq(teamJoinRequests.id, id));
    return request;
  }

  async getTeamJoinRequests(teamId: number): Promise<TeamJoinRequest[]> {
    const requests = await db
      .select()
      .from(teamJoinRequests)
      .where(eq(teamJoinRequests.teamId, teamId));
    return requests;
  }
  
  async getAcceptedTeamJoinRequests(userId: number): Promise<TeamJoinRequest[]> {
    const requests = await db
      .select()
      .from(teamJoinRequests)
      .where(and(
        eq(teamJoinRequests.userId, userId),
        eq(teamJoinRequests.status, 'accepted'),
        eq(teamJoinRequests.viewed, false)
      ))
      .orderBy(desc(teamJoinRequests.createdAt));
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
  
  async markTeamJoinRequestAsViewed(id: number): Promise<TeamJoinRequest | undefined> {
    const [updatedRequest] = await db
      .update(teamJoinRequests)
      .set({ viewed: true })
      .where(eq(teamJoinRequests.id, id))
      .returning();
    return updatedRequest;
  }

  // Get all team join requests for a specific user (for notification history)
  async getUserTeamJoinRequests(userId: number): Promise<TeamJoinRequest[]> {
    const requests = await db
      .select()
      .from(teamJoinRequests)
      .where(eq(teamJoinRequests.userId, userId))
      .orderBy(desc(teamJoinRequests.createdAt));
    return requests;
  }

  // Alias for getUserRSVPs
  async getUserRSVPs(userId: number): Promise<RSVP[]> {
    return this.getRSVPsByUser(userId);
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

  async getSentFriendRequests(userId: number): Promise<Friendship[]> {
    try {
      // Get all pending friend requests sent by the user
      return db
        .select()
        .from(friendships)
        .where(
          and(
            eq(friendships.userId, userId),
            eq(friendships.status, 'pending')
          )
        );
    } catch (error) {
      console.error('Error getting sent friend requests:', error);
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
      .where(and(
        eq(events.creatorId, creatorId),
        gte(events.date, new Date())
      ))
      .orderBy(events.date);
  }

  async getPublicEvents(): Promise<Event[]> {
    return db
      .select()
      .from(events)
      .where(and(
        eq(events.isPublic, true),
        gte(events.date, new Date())
      ))
      .orderBy(events.date);
  }

  async getDiscoverableEvents(userId?: number | null): Promise<Event[]> {
    if (!userId) {
      // If no user provided, return only public events
      return this.getPublicEvents();
    }

    // Complex query to handle different visibility levels
    const result = await db.execute(sql`
      SELECT DISTINCT e.*
      FROM events e
      LEFT JOIN sports_group_events sge ON e.id = sge.event_id
      LEFT JOIN sports_group_members sgm ON sge.group_id = sgm.group_id
      LEFT JOIN friendships f1 ON sgm.user_id = f1.user_id AND f1.friend_id = ${userId} AND f1.status = 'accepted'
      LEFT JOIN friendships f2 ON sgm.user_id = f2.friend_id AND f2.user_id = ${userId} AND f2.status = 'accepted'
      LEFT JOIN rsvps r ON e.id = r.event_id AND r.status = 'approved'
      LEFT JOIN friendships f3 ON r.user_id = f3.user_id AND f3.friend_id = ${userId} AND f3.status = 'accepted'
      LEFT JOIN friendships f4 ON r.user_id = f4.friend_id AND f4.user_id = ${userId} AND f4.status = 'accepted'
      WHERE e.date >= NOW()
      AND (
        -- Regular public events (isPublic = true)
        e.is_public = true
        OR
        -- Group events with public visibility "all"
        (sge.group_id IS NOT NULL AND e.public_visibility = 'all')
        OR
        -- Group events with "friends of group members" visibility
        (sge.group_id IS NOT NULL AND e.public_visibility = 'friends' AND (f1.user_id IS NOT NULL OR f2.user_id IS NOT NULL))
        OR
        -- Group events with "friends of event participants" visibility
        (sge.group_id IS NOT NULL AND e.public_visibility = 'friends_participants' AND (f3.user_id IS NOT NULL OR f4.user_id IS NOT NULL))
      )
      ORDER BY e.date
    `);

    // Map the raw SQL results to proper Event objects
    return result.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      sportType: row.sport_type,
      date: new Date(row.date),
      location: row.location,
      locationCoordinates: row.location_coordinates,
      maxParticipants: row.max_participants,
      currentParticipants: row.current_participants,
      isPublic: row.is_public,
      isFree: row.is_free,
      cost: row.cost,
      creatorId: row.creator_id,
      eventImage: row.event_image,
      createdAt: new Date(row.created_at),
      publicVisibility: row.public_visibility
    }));
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

  async updateEventVisibility(id: number, publicVisibility: string | null): Promise<boolean> {
    const result = await db
      .update(events)
      .set({ publicVisibility })
      .where(eq(events.id, id))
      .returning({ id: events.id });
    return result.length > 0;
  }

  async deleteEvent(id: number): Promise<boolean> {
    const result = await db
      .delete(events)
      .where(eq(events.id, id))
      .returning({ id: events.id });
    return result.length > 0;
  }

  // RSVP methods
  async getRSVPById(id: number): Promise<RSVP | undefined> {
    const [rsvp] = await db
      .select()
      .from(rsvps)
      .where(eq(rsvps.id, id));
    return rsvp || undefined;
  }
  
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

  async getUserMatchesCount(userId: number): Promise<number> {
    try {
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(rsvps)
        .where(and(eq(rsvps.userId, userId), eq(rsvps.status, 'approved')));
      
      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error getting user matches count:', error);
      return 0;
    }
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
  
  // User onboarding preferences methods
  async getUserOnboardingPreference(userId: number): Promise<UserOnboardingPreference | undefined> {
    try {
      const [preference] = await db
        .select()
        .from(userOnboardingPreferences)
        .where(eq(userOnboardingPreferences.userId, userId));
      
      return preference;
    } catch (error) {
      console.error("Error getting user onboarding preferences:", error);
      return undefined;
    }
  }
  
  async createUserOnboardingPreference(preference: InsertUserOnboardingPreference): Promise<UserOnboardingPreference> {
    try {
      const now = new Date();
      const [newPreference] = await db
        .insert(userOnboardingPreferences)
        .values({
          ...preference,
          createdAt: now,
          updatedAt: now,
          onboardingCompleted: false
        })
        .returning();
      
      return newPreference;
    } catch (error) {
      console.error("Error creating user onboarding preferences:", error);
      throw error;
    }
  }
  
  async updateUserOnboardingPreference(userId: number, preferenceData: Partial<UserOnboardingPreference>): Promise<UserOnboardingPreference | undefined> {
    try {
      const [updatedPreference] = await db
        .update(userOnboardingPreferences)
        .set({
          ...preferenceData,
          updatedAt: new Date()
        })
        .where(eq(userOnboardingPreferences.userId, userId))
        .returning();
      
      return updatedPreference;
    } catch (error) {
      console.error("Error updating user onboarding preferences:", error);
      return undefined;
    }
  }
  
  async completeUserOnboarding(userId: number): Promise<UserOnboardingPreference | undefined> {
    try {
      const [updatedPreference] = await db
        .update(userOnboardingPreferences)
        .set({
          onboardingCompleted: true,
          updatedAt: new Date()
        })
        .where(eq(userOnboardingPreferences.userId, userId))
        .returning();
      
      return updatedPreference;
    } catch (error) {
      console.error("Error completing user onboarding:", error);
      return undefined;
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

  // Sports Groups methods
  async getAllSportsGroups(): Promise<SportsGroup[]> {
    return db.select().from(sportsGroups).orderBy(desc(sportsGroups.createdAt));
  }

  async getSportsGroup(id: number): Promise<SportsGroup | undefined> {
    const [group] = await db.select().from(sportsGroups).where(eq(sportsGroups.id, id));
    return group;
  }

  async createSportsGroup(data: Omit<SportsGroup, 'id' | 'createdAt'>): Promise<SportsGroup> {
    const [newGroup] = await db.insert(sportsGroups).values({
      ...data,
      createdAt: new Date(),
    }).returning();

    // Add the admin as the first member
    await db.insert(sportsGroupMembers).values({
      groupId: newGroup.id,
      userId: data.adminId,
      role: 'admin',
      joinedAt: new Date(),
    });

    return newGroup;
  }

  async getSportsGroupMembers(groupId: number): Promise<SportsGroupMember[]> {
    return db.select().from(sportsGroupMembers).where(eq(sportsGroupMembers.groupId, groupId));
  }

  async updateSportsGroup(id: number, data: Partial<SportsGroup>): Promise<SportsGroup | undefined> {
    const [updatedGroup] = await db
      .update(sportsGroups)
      .set(data)
      .where(eq(sportsGroups.id, id))
      .returning();
    return updatedGroup;
  }

  async deleteSportsGroup(id: number): Promise<boolean> {
    const result = await db
      .delete(sportsGroups)
      .where(eq(sportsGroups.id, id))
      .returning({ id: sportsGroups.id });
    return result.length > 0;
  }

  // Placeholder methods for other sports groups features (to be implemented later)
  async getSportsGroupMember(groupId: number, userId: number): Promise<SportsGroupMember | undefined> {
    const [member] = await db
      .select()
      .from(sportsGroupMembers)
      .where(and(eq(sportsGroupMembers.groupId, groupId), eq(sportsGroupMembers.userId, userId)));
    return member;
  }

  async addSportsGroupMember(member: InsertSportsGroupMember): Promise<SportsGroupMember> {
    const [newMember] = await db.insert(sportsGroupMembers).values(member).returning();
    return newMember;
  }

  async removeSportsGroupMember(id: number): Promise<boolean> {
    const result = await db
      .delete(sportsGroupMembers)
      .where(eq(sportsGroupMembers.id, id))
      .returning({ id: sportsGroupMembers.id });
    return result.length > 0;
  }

  async updateSportsGroupMember(id: number, memberData: Partial<SportsGroupMember>): Promise<SportsGroupMember | undefined> {
    const [updatedMember] = await db
      .update(sportsGroupMembers)
      .set(memberData)
      .where(eq(sportsGroupMembers.id, id))
      .returning();
    return updatedMember;
  }

  async getSportsGroupsByUser(userId: number): Promise<SportsGroup[]> {
    // Get groups where user is admin
    const adminGroups = await db.select().from(sportsGroups).where(eq(sportsGroups.adminId, userId));
    
    // Get groups where user is a member
    const memberGroupIds = await db
      .select({ groupId: sportsGroupMembers.groupId })
      .from(sportsGroupMembers)
      .where(eq(sportsGroupMembers.userId, userId));

    const memberGroupIdsArray = memberGroupIds.map(item => item.groupId);
    
    if (memberGroupIdsArray.length === 0) {
      return adminGroups;
    }

    // Get all member groups (including those where user is also admin)
    const memberGroups = await db
      .select()
      .from(sportsGroups)
      .where(
        or(...memberGroupIdsArray.map(groupId => eq(sportsGroups.id, groupId)))
      );

    // Combine and deduplicate
    const allGroups = [...adminGroups, ...memberGroups];
    const uniqueGroups = allGroups.filter((group, index, self) => 
      index === self.findIndex(g => g.id === group.id)
    );

    return uniqueGroups;
  }

  async getUserSportsGroups(userId: number): Promise<SportsGroup[]> {
    return this.getSportsGroupsByUser(userId);
  }

  // Sports Group Messages methods
  async getSportsGroupMessages(groupId: number): Promise<any[]> {
    const result = await pool.query(`
      SELECT 
        sgm.id,
        sgm.group_id as "groupId",
        sgm.user_id as "userId",
        sgm.content,
        sgm.parent_message_id as "parentMessageId",
        sgm.created_at as "createdAt",
        json_build_object(
          'id', u.id,
          'username', u.username,
          'name', u.name,
          'profileImage', u.profile_image
        ) as user
      FROM sports_group_messages sgm
      LEFT JOIN users u ON sgm.user_id = u.id
      WHERE sgm.group_id = $1
      ORDER BY sgm.created_at DESC
    `, [groupId]);
    
    return result.rows;
  }

  async createSportsGroupMessage(message: any): Promise<any> {
    // Insert the message using raw SQL
    const result = await pool.query(
      'INSERT INTO sports_group_messages (group_id, user_id, content, parent_message_id, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING id',
      [message.groupId, message.userId, message.content, message.parentMessageId || null]
    );
    
    const messageId = result.rows[0].id;
    
    // Get the message with user details
    const messageWithUser = await pool.query(`
      SELECT 
        sgm.id,
        sgm.group_id as "groupId",
        sgm.user_id as "userId",
        sgm.content,
        sgm.parent_message_id as "parentMessageId",
        sgm.created_at as "createdAt",
        json_build_object(
          'id', u.id,
          'username', u.username,
          'name', u.name,
          'profileImage', u.profile_image
        ) as user
      FROM sports_group_messages sgm
      LEFT JOIN users u ON sgm.user_id = u.id
      WHERE sgm.id = $1
    `, [messageId]);
    
    return messageWithUser.rows[0];
  }
  async updateSportsGroupMessage(id: number, messageData: any): Promise<any> { return messageData; }
  async deleteSportsGroupMessage(id: number): Promise<boolean> { return true; }
  async getSportsGroupEvents(groupId: number): Promise<any[]> {
    try {
      const groupEvents = await db
        .select({
          event: events,
          user: {
            id: users.id,
            username: users.username,
            name: users.name,
            profileImage: users.profileImage,
          },
        })
        .from(sportsGroupEvents)
        .innerJoin(events, eq(sportsGroupEvents.eventId, events.id))
        .innerJoin(users, eq(events.creatorId, users.id))
        .where(and(
          eq(sportsGroupEvents.groupId, groupId),
          gte(events.date, new Date())
        ))
        .orderBy(events.date);

      return groupEvents.map(({ event, user }) => ({
        ...event,
        creator: user,
      }));
    } catch (error) {
      console.error('Error fetching group events:', error);
      return [];
    }
  }

  async getSportsGroupEventByEventId(eventId: number): Promise<SportsGroupEvent | undefined> {
    try {
      const [groupEvent] = await db
        .select()
        .from(sportsGroupEvents)
        .where(eq(sportsGroupEvents.eventId, eventId));
      
      return groupEvent;
    } catch (error) {
      console.error('Error fetching group event by event ID:', error);
      return undefined;
    }
  }

  async getSportsGroupEventHistory(groupId: number): Promise<any[]> {
    try {
      const groupEvents = await db
        .select({
          event: events,
          user: {
            id: users.id,
            username: users.username,
            name: users.name,
            profileImage: users.profileImage,
          },
        })
        .from(sportsGroupEvents)
        .innerJoin(events, eq(sportsGroupEvents.eventId, events.id))
        .innerJoin(users, eq(events.creatorId, users.id))
        .where(and(
          eq(sportsGroupEvents.groupId, groupId),
          lt(events.date, new Date())
        ))
        .orderBy(desc(events.date));

      return groupEvents.map(({ event, user }) => ({
        ...event,
        creator: user,
      }));
    } catch (error) {
      console.error('Error fetching group event history:', error);
      return [];
    }
  }

  async createSportsGroupNotification(notification: any): Promise<any> {
    try {
      const result = await pool.query(
        'INSERT INTO sports_group_notifications (group_id, user_id, type, title, message, reference_id, viewed, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *',
        [notification.groupId, notification.userId, notification.type, notification.title, notification.message, notification.referenceId, notification.viewed || false]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Error creating sports group notification:', error);
      throw error;
    }
  }

  async addSportsGroupEvent(groupEvent: any): Promise<any> {
    try {
      const [result] = await db
        .insert(sportsGroupEvents)
        .values({
          groupId: groupEvent.groupId,
          eventId: groupEvent.eventId,
        })
        .returning();
      return result;
    } catch (error) {
      console.error('Error adding event to group:', error);
      throw error;
    }
  }
  async removeSportsGroupEvent(id: number): Promise<boolean> { return true; }

  // ================ SPORTS GROUP POLLS IMPLEMENTATION ================

  async getSportsGroupPolls(groupId: number): Promise<SportsGroupPoll[]> {
    try {
      const polls = await db
        .select()
        .from(sportsGroupPolls)
        .where(
          and(
            eq(sportsGroupPolls.groupId, groupId),
            eq(sportsGroupPolls.isActive, true),
            sql`${sportsGroupPolls.endDate} > NOW()`
          )
        )
        .orderBy(desc(sportsGroupPolls.createdAt));
      

      
      return polls;
    } catch (error) {
      console.error('Error fetching sports group polls:', error);
      return [];
    }
  }

  async getSportsGroupPoll(id: number): Promise<SportsGroupPoll | undefined> {
    try {
      const [poll] = await db
        .select()
        .from(sportsGroupPolls)
        .where(eq(sportsGroupPolls.id, id));
      return poll;
    } catch (error) {
      console.error('Error fetching sports group poll:', error);
      return undefined;
    }
  }

  async createSportsGroupPoll(poll: InsertSportsGroupPoll): Promise<SportsGroupPoll> {
    try {
      const [result] = await db
        .insert(sportsGroupPolls)
        .values(poll)
        .returning();
      return result;
    } catch (error) {
      console.error('Error creating sports group poll:', error);
      throw error;
    }
  }

  async updateSportsGroupPoll(id: number, pollData: Partial<SportsGroupPoll>): Promise<SportsGroupPoll | undefined> {
    try {
      const [result] = await db
        .update(sportsGroupPolls)
        .set(pollData)
        .where(eq(sportsGroupPolls.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error('Error updating sports group poll:', error);
      return undefined;
    }
  }

  async deleteSportsGroupPoll(id: number): Promise<boolean> {
    try {
      await db
        .delete(sportsGroupPolls)
        .where(eq(sportsGroupPolls.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting sports group poll:', error);
      return false;
    }
  }

  // Sports Group Poll Time Slots methods
  async getSportsGroupPollTimeSlots(pollId: number): Promise<SportsGroupPollTimeSlot[]> {
    try {
      const timeSlots = await db
        .select()
        .from(sportsGroupPollTimeSlots)
        .where(eq(sportsGroupPollTimeSlots.pollId, pollId))
        .orderBy(sportsGroupPollTimeSlots.dayOfWeek, sportsGroupPollTimeSlots.startTime);
      return timeSlots;
    } catch (error) {
      console.error('Error fetching sports group poll time slots:', error);
      return [];
    }
  }

  async createSportsGroupPollTimeSlot(timeSlot: InsertSportsGroupPollTimeSlot): Promise<SportsGroupPollTimeSlot> {
    try {
      const [result] = await db
        .insert(sportsGroupPollTimeSlots)
        .values(timeSlot)
        .returning();
      return result;
    } catch (error) {
      console.error('Error creating sports group poll time slot:', error);
      throw error;
    }
  }

  async deleteSportsGroupPollTimeSlot(id: number): Promise<boolean> {
    try {
      await db
        .delete(sportsGroupPollTimeSlots)
        .where(eq(sportsGroupPollTimeSlots.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting sports group poll time slot:', error);
      return false;
    }
  }

  // Sports Group Poll Responses methods
  async getSportsGroupPollResponses(pollId: number): Promise<SportsGroupPollResponse[]> {
    try {
      const responses = await db
        .select()
        .from(sportsGroupPollResponses)
        .where(eq(sportsGroupPollResponses.pollId, pollId))
        .orderBy(sportsGroupPollResponses.createdAt);
      return responses;
    } catch (error) {
      console.error('Error fetching sports group poll responses:', error);
      return [];
    }
  }

  async getSportsGroupPollUserResponses(pollId: number, userId: number): Promise<SportsGroupPollResponse[]> {
    try {
      const responses = await db
        .select()
        .from(sportsGroupPollResponses)
        .where(and(
          eq(sportsGroupPollResponses.pollId, pollId),
          eq(sportsGroupPollResponses.userId, userId)
        ))
        .orderBy(sportsGroupPollResponses.createdAt);
      return responses;
    } catch (error) {
      console.error('Error fetching user sports group poll responses:', error);
      return [];
    }
  }

  async createSportsGroupPollResponse(response: InsertSportsGroupPollResponse): Promise<SportsGroupPollResponse> {
    try {
      const [result] = await db
        .insert(sportsGroupPollResponses)
        .values(response)
        .returning();
      return result;
    } catch (error) {
      console.error('Error creating sports group poll response:', error);
      throw error;
    }
  }

  async updateSportsGroupPollResponse(id: number, responseData: Partial<SportsGroupPollResponse>): Promise<SportsGroupPollResponse | undefined> {
    try {
      const [result] = await db
        .update(sportsGroupPollResponses)
        .set(responseData)
        .where(eq(sportsGroupPollResponses.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error('Error updating sports group poll response:', error);
      return undefined;
    }
  }

  async deleteSportsGroupPollResponse(id: number): Promise<boolean> {
    try {
      await db
        .delete(sportsGroupPollResponses)
        .where(eq(sportsGroupPollResponses.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting sports group poll response:', error);
      return false;
    }
  }

  async markPollSuggestionAsUsed(pollId: number, timeSlotId: number, eventId: number): Promise<boolean> {
    try {
      await db
        .update(sportsGroupPollTimeSlots)
        .set({ usedForEventId: eventId })
        .where(eq(sportsGroupPollTimeSlots.id, timeSlotId));
      return true;
    } catch (error) {
      console.error('Error marking poll suggestion as used:', error);
      return false;
    }
  }

  // Skill Matcher Preferences methods
  async getSkillMatcherPreferences(userId: number): Promise<SkillMatcherPreference[]> {
    try {
      const preferences = await db
        .select()
        .from(skillMatcherPreferences)
        .where(eq(skillMatcherPreferences.userId, userId));
      return preferences;
    } catch (error) {
      console.error('Error fetching skill matcher preferences:', error);
      return [];
    }
  }

  async getSkillMatcherPreference(userId: number, sportType: string): Promise<SkillMatcherPreference | undefined> {
    try {
      const preference = await db
        .select()
        .from(skillMatcherPreferences)
        .where(and(
          eq(skillMatcherPreferences.userId, userId),
          eq(skillMatcherPreferences.sportType, sportType)
        ))
        .limit(1);
      return preference[0];
    } catch (error) {
      console.error('Error fetching skill matcher preference:', error);
      return undefined;
    }
  }

  async createSkillMatcherPreference(preference: InsertSkillMatcherPreference): Promise<SkillMatcherPreference> {
    try {
      const result = await db
        .insert(skillMatcherPreferences)
        .values(preference)
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error creating skill matcher preference:', error);
      throw error;
    }
  }

  async updateSkillMatcherPreference(id: number, preferenceData: Partial<SkillMatcherPreference>): Promise<SkillMatcherPreference | undefined> {
    try {
      const result = await db
        .update(skillMatcherPreferences)
        .set({ ...preferenceData, updatedAt: new Date() })
        .where(eq(skillMatcherPreferences.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating skill matcher preference:', error);
      return undefined;
    }
  }

  async deleteSkillMatcherPreference(id: number): Promise<boolean> {
    try {
      await db
        .delete(skillMatcherPreferences)
        .where(eq(skillMatcherPreferences.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting skill matcher preference:', error);
      return false;
    }
  }

  // Skill Matches methods
  async getSkillMatches(userId: number): Promise<any[]> {
    try {
      const matches = await db
        .select({
          match: skillMatches,
          matchedUser: {
            id: users.id,
            username: users.username,
            name: users.name,
            profileImage: users.profileImage,
            bio: users.bio,
            location: users.location,
          },
        })
        .from(skillMatches)
        .innerJoin(users, eq(skillMatches.matchedUserId, users.id))
        .where(eq(skillMatches.userId, userId))
        .orderBy(desc(skillMatches.compatibilityScore));

      return matches.map(({ match, matchedUser }) => ({
        ...match,
        matchedUser,
      }));
    } catch (error) {
      console.error('Error fetching skill matches:', error);
      return [];
    }
  }

  async getSkillMatchesBySport(userId: number, sportType: string): Promise<any[]> {
    try {
      const matches = await db
        .select({
          match: skillMatches,
          matchedUser: {
            id: users.id,
            username: users.username,
            name: users.name,
            profileImage: users.profileImage,
            bio: users.bio,
            location: users.location,
          },
        })
        .from(skillMatches)
        .innerJoin(users, eq(skillMatches.matchedUserId, users.id))
        .where(and(
          eq(skillMatches.userId, userId),
          eq(skillMatches.sportType, sportType)
        ))
        .orderBy(desc(skillMatches.compatibilityScore));

      return matches.map(({ match, matchedUser }) => ({
        ...match,
        matchedUser,
      }));
    } catch (error) {
      console.error('Error fetching skill matches by sport:', error);
      return [];
    }
  }

  async createSkillMatch(match: InsertSkillMatch): Promise<SkillMatch> {
    try {
      const result = await db
        .insert(skillMatches)
        .values(match)
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error creating skill match:', error);
      throw error;
    }
  }

  async updateSkillMatch(id: number, matchData: Partial<SkillMatch>): Promise<SkillMatch | undefined> {
    try {
      const result = await db
        .update(skillMatches)
        .set(matchData)
        .where(eq(skillMatches.id, id))
        .returning();
      return result[0];
    } catch (error) {
      console.error('Error updating skill match:', error);
      return undefined;
    }
  }

  async deleteSkillMatch(id: number): Promise<boolean> {
    try {
      await db
        .delete(skillMatches)
        .where(eq(skillMatches.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting skill match:', error);
      return false;
    }
  }

  async generateSkillMatches(userId: number, sportType: string): Promise<any[]> {
    try {
      // Get user's sport preference and matcher preference
      const userSportPref = await db
        .select()
        .from(userSportPreferences)
        .where(and(
          eq(userSportPreferences.userId, userId),
          eq(userSportPreferences.sportType, sportType)
        ))
        .limit(1);

      if (!userSportPref[0]) {
        return [];
      }

      const userMatcherPref = await this.getSkillMatcherPreference(userId, sportType);
      if (!userMatcherPref) {
        return [];
      }

      // Find compatible players based on preferences
      const compatiblePlayers = await this.findCompatiblePlayers(userId, sportType);

      // Create skill matches
      const matches = [];
      for (const player of compatiblePlayers) {
        const existingMatch = await db
          .select()
          .from(skillMatches)
          .where(and(
            eq(skillMatches.userId, userId),
            eq(skillMatches.matchedUserId, player.id),
            eq(skillMatches.sportType, sportType)
          ))
          .limit(1);

        if (existingMatch.length === 0) {
          const match = await this.createSkillMatch({
            userId,
            matchedUserId: player.id,
            sportType,
            compatibilityScore: player.compatibilityScore,
            skillLevelDifference: player.skillLevelDifference,
            distance: player.distance,
            matchReason: player.matchReason,
          });

          matches.push({
            ...match,
            matchedUser: player,
          });
        }
      }

      return matches;
    } catch (error) {
      console.error('Error generating skill matches:', error);
      return [];
    }
  }

  async findCompatiblePlayers(userId: number, sportType: string): Promise<any[]> {
    try {
      // Get user's preferences
      const userSportPref = await db
        .select()
        .from(userSportPreferences)
        .where(and(
          eq(userSportPreferences.userId, userId),
          eq(userSportPreferences.sportType, sportType)
        ))
        .limit(1);

      const userMatcherPref = await this.getSkillMatcherPreference(userId, sportType);

      if (!userSportPref[0] || !userMatcherPref) {
        return [];
      }

      const userSkillLevel = userSportPref[0].skillLevel;
      const skillLevels = ['beginner', 'intermediate', 'advanced', 'expert'];
      const userSkillIndex = skillLevels.indexOf(userSkillLevel);

      // Find other users with sport preferences in the same sport
      const potentialMatches = await db
        .select({
          user: {
            id: users.id,
            username: users.username,
            name: users.name,
            profileImage: users.profileImage,
            bio: users.bio,
            location: users.location,
          },
          sportPref: userSportPreferences,
        })
        .from(userSportPreferences)
        .innerJoin(users, eq(userSportPreferences.userId, users.id))
        .where(and(
          eq(userSportPreferences.sportType, sportType),
          eq(userSportPreferences.isVisible, true),
          sql`${userSportPreferences.userId} != ${userId}`
        ));

      const compatiblePlayers = [];

      for (const match of potentialMatches) {
        const matchSkillIndex = skillLevels.indexOf(match.sportPref.skillLevel);
        const skillDifference = Math.abs(userSkillIndex - matchSkillIndex);

        // Check if skill level matches preferences
        let isCompatible = false;
        let compatibilityScore = 0;
        let matchReason = '';

        switch (userMatcherPref.skillMatchMode) {
          case 'exact':
            isCompatible = skillDifference === 0;
            compatibilityScore = isCompatible ? 100 : 0;
            matchReason = isCompatible ? 'Exact skill level match' : '';
            break;
          case 'similar':
            isCompatible = skillDifference <= 1;
            compatibilityScore = isCompatible ? (100 - skillDifference * 20) : 0;
            matchReason = isCompatible ? 'Similar skill level' : '';
            break;
          case 'range':
            isCompatible = userMatcherPref.preferredSkillLevels.includes(match.sportPref.skillLevel);
            compatibilityScore = isCompatible ? 90 : 0;
            matchReason = isCompatible ? 'Within preferred skill range' : '';
            break;
          case 'any':
            isCompatible = true;
            compatibilityScore = 80 - skillDifference * 10;
            matchReason = 'Open to all skill levels';
            break;
        }

        if (isCompatible) {
          // Add bonus for experience similarity
          const experienceDiff = Math.abs((userSportPref[0].yearsExperience || 0) - (match.sportPref.yearsExperience || 0));
          if (experienceDiff <= 2) {
            compatibilityScore += 10;
            matchReason += ' + Similar experience';
          }

          compatiblePlayers.push({
            ...match.user,
            compatibilityScore: Math.min(100, compatibilityScore),
            skillLevelDifference: skillDifference,
            distance: null, // TODO: Calculate actual distance
            matchReason,
            skillLevel: match.sportPref.skillLevel,
            yearsExperience: match.sportPref.yearsExperience,
          });
        }
      }

      // Sort by compatibility score
      return compatiblePlayers.sort((a, b) => b.compatibilityScore - a.compatibilityScore).slice(0, 10);
    } catch (error) {
      console.error('Error finding compatible players:', error);
      return [];
    }
  }

  async getSportsGroupPollTimeSlots(pollId: number): Promise<SportsGroupPollTimeSlot[]> {
    try {
      const slots = await db
        .select()
        .from(sportsGroupPollTimeSlots)
        .where(eq(sportsGroupPollTimeSlots.pollId, pollId))
        .orderBy(asc(sportsGroupPollTimeSlots.dayOfWeek), asc(sportsGroupPollTimeSlots.startTime));
      return slots;
    } catch (error) {
      console.error('Error fetching poll time slots:', error);
      return [];
    }
  }

  async getSportsGroupPollResponses(pollId: number): Promise<SportsGroupPollResponse[]> {
    try {
      const responses = await db
        .select()
        .from(sportsGroupPollResponses)
        .where(eq(sportsGroupPollResponses.pollId, pollId));
      return responses;
    } catch (error) {
      console.error('Error fetching poll responses:', error);
      return [];
    }
  }

  async getSportsGroupPollUserResponses(pollId: number, userId: number): Promise<SportsGroupPollResponse[]> {
    try {
      const responses = await db
        .select()
        .from(sportsGroupPollResponses)
        .where(and(
          eq(sportsGroupPollResponses.pollId, pollId),
          eq(sportsGroupPollResponses.userId, userId)
        ));
      return responses;
    } catch (error) {
      console.error('Error fetching user poll responses:', error);
      return [];
    }
  }

  async createSportsGroupPollResponse(response: InsertSportsGroupPollResponse): Promise<SportsGroupPollResponse> {
    try {
      const [result] = await db
        .insert(sportsGroupPollResponses)
        .values(response)
        .returning();
      return result;
    } catch (error) {
      console.error('Error creating poll response:', error);
      throw error;
    }
  }

  async deleteSportsGroupPollResponse(id: number): Promise<boolean> {
    try {
      await db
        .delete(sportsGroupPollResponses)
        .where(eq(sportsGroupPollResponses.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting poll response:', error);
      return false;
    }
  }

  async markPollSuggestionAsUsed(pollId: number, suggestionId: number, eventId: number): Promise<boolean> {
    try {
      // For now, we'll store this as a simple flag or metadata
      // In a real application, you might want a separate table for poll suggestion events
      // For this implementation, we'll just return true as the notification is handled in the UI
      console.log(`Poll suggestion ${suggestionId} from poll ${pollId} marked as used for event ${eventId}`);
      return true;
    } catch (error) {
      console.error('Error marking poll suggestion as used:', error);
      return false;
    }
  }
  async getSportsGroupJoinRequests(groupId: number): Promise<any[]> { return []; }
  async getSportsGroupJoinRequest(groupId: number, userId: number): Promise<any> { return null; }
  async createSportsGroupJoinRequest(request: any): Promise<any> { return request; }
  async updateSportsGroupJoinRequest(id: number, requestData: any): Promise<any> { return requestData; }
  async deleteSportsGroupJoinRequest(id: number): Promise<boolean> { return true; }

  // Scoreboard/Match Results methods
  async getMatchResult(id: number): Promise<MatchResult | undefined> {
    const [result] = await db.select().from(matchResults).where(eq(matchResults.id, id));
    return result;
  }

  async getMatchResultByEvent(eventId: number): Promise<MatchResult | undefined> {
    const [result] = await db.select().from(matchResults).where(eq(matchResults.eventId, eventId));
    return result;
  }

  async getMatchResultsByGroup(groupId: number): Promise<MatchResult[]> {
    return await db.select().from(matchResults).where(eq(matchResults.groupId, groupId)).orderBy(desc(matchResults.createdAt));
  }

  async createMatchResult(result: InsertMatchResult): Promise<MatchResult> {
    const [newResult] = await db.insert(matchResults).values(result).returning();
    return newResult;
  }

  async updateMatchResult(id: number, resultData: Partial<MatchResult>): Promise<MatchResult | undefined> {
    try {
      const [updatedResult] = await db
        .update(matchResults)
        .set(resultData)
        .where(eq(matchResults.id, id))
        .returning();
      return updatedResult;
    } catch (error) {
      console.error("Error updating match result:", error);
      return undefined;
    }
  }

  async deleteMatchResult(id: number): Promise<boolean> {
    try {
      await db.delete(matchResults).where(eq(matchResults.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting match result:", error);
      return false;
    }
  }

  // Match Participants methods
  async getMatchParticipants(matchId: number): Promise<MatchParticipant[]> {
    return await db.select().from(matchParticipants).where(eq(matchParticipants.matchId, matchId));
  }

  async createMatchParticipant(participant: InsertMatchParticipant): Promise<MatchParticipant> {
    const [newParticipant] = await db.insert(matchParticipants).values(participant).returning();
    return newParticipant;
  }

  async updateMatchParticipant(id: number, participantData: Partial<MatchParticipant>): Promise<MatchParticipant | undefined> {
    try {
      const [updatedParticipant] = await db
        .update(matchParticipants)
        .set(participantData)
        .where(eq(matchParticipants.id, id))
        .returning();
      return updatedParticipant;
    } catch (error) {
      console.error("Error updating match participant:", error);
      return undefined;
    }
  }

  async deleteMatchParticipant(id: number): Promise<boolean> {
    try {
      await db.delete(matchParticipants).where(eq(matchParticipants.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting match participant:", error);
      return false;
    }
  }

  // Player Statistics methods
  async getPlayerStatistics(userId: number, groupId: number, sportType: string): Promise<PlayerStatistics | undefined> {
    const [stats] = await db.select()
      .from(playerStatistics)
      .where(and(
        eq(playerStatistics.userId, userId),
        eq(playerStatistics.groupId, groupId),
        eq(playerStatistics.sportType, sportType)
      ));
    return stats;
  }

  async getPlayerStatisticsByGroup(groupId: number, sportType?: string): Promise<PlayerStatistics[]> {
    const query = db.select().from(playerStatistics).where(eq(playerStatistics.groupId, groupId));
    
    if (sportType) {
      query.where(and(eq(playerStatistics.groupId, groupId), eq(playerStatistics.sportType, sportType)));
    }
    
    return await query.orderBy(desc(playerStatistics.matchesWon));
  }

  async createPlayerStatistics(stats: InsertPlayerStatistics): Promise<PlayerStatistics> {
    const [newStats] = await db.insert(playerStatistics).values(stats).returning();
    return newStats;
  }

  async updatePlayerStatistics(id: number, statsData: Partial<PlayerStatistics>): Promise<PlayerStatistics | undefined> {
    try {
      const [updatedStats] = await db
        .update(playerStatistics)
        .set({
          ...statsData,
          updatedAt: new Date()
        })
        .where(eq(playerStatistics.id, id))
        .returning();
      return updatedStats;
    } catch (error) {
      console.error("Error updating player statistics:", error);
      return undefined;
    }
  }

  async deletePlayerStatistics(id: number): Promise<boolean> {
    try {
      await db.delete(playerStatistics).where(eq(playerStatistics.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting player statistics:", error);
      return false;
    }
  }

  // Match Result Notifications methods
  async getMatchResultNotifications(userId: number): Promise<MatchResultNotification[]> {
    return await db.select()
      .from(matchResultNotifications)
      .where(eq(matchResultNotifications.userId, userId))
      .orderBy(desc(matchResultNotifications.createdAt));
  }

  async createMatchResultNotification(notification: InsertMatchResultNotification): Promise<MatchResultNotification> {
    const [newNotification] = await db.insert(matchResultNotifications).values(notification).returning();
    return newNotification;
  }

  async markMatchResultNotificationViewed(id: number): Promise<boolean> {
    try {
      await db
        .update(matchResultNotifications)
        .set({ viewed: true })
        .where(eq(matchResultNotifications.id, id));
      return true;
    } catch (error) {
      console.error("Error marking match result notification as viewed:", error);
      return false;
    }
  }

  // Professional Team History methods
  async getProfessionalTeamHistory(userId: number): Promise<ProfessionalTeamHistory[]> {
    return await db.select()
      .from(professionalTeamHistory)
      .where(eq(professionalTeamHistory.userId, userId))
      .orderBy(desc(professionalTeamHistory.yearFrom));
  }

  async createProfessionalTeamHistory(history: InsertProfessionalTeamHistory): Promise<ProfessionalTeamHistory> {
    const [newHistory] = await db.insert(professionalTeamHistory).values(history).returning();
    return newHistory;
  }

  async updateProfessionalTeamHistory(id: number, historyData: Partial<ProfessionalTeamHistory>): Promise<ProfessionalTeamHistory | undefined> {
    try {
      const [updatedHistory] = await db
        .update(professionalTeamHistory)
        .set(historyData)
        .where(eq(professionalTeamHistory.id, id))
        .returning();
      return updatedHistory;
    } catch (error) {
      console.error("Error updating professional team history:", error);
      return undefined;
    }
  }

  async deleteProfessionalTeamHistory(id: number): Promise<boolean> {
    try {
      await db.delete(professionalTeamHistory).where(eq(professionalTeamHistory.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting professional team history:", error);
      return false;
    }
  }

  // Sport Skill Levels methods
  async getSportSkillLevels(userId: number): Promise<SportSkillLevel[]> {
    return await db.select()
      .from(sportSkillLevels)
      .where(eq(sportSkillLevels.userId, userId))
      .orderBy(sportSkillLevels.sportType);
  }

  async getSportSkillLevel(userId: number, sportType: string): Promise<SportSkillLevel | undefined> {
    const [skillLevel] = await db.select()
      .from(sportSkillLevels)
      .where(and(
        eq(sportSkillLevels.userId, userId),
        eq(sportSkillLevels.sportType, sportType)
      ));
    return skillLevel;
  }

  async createSportSkillLevel(skillLevel: InsertSportSkillLevel): Promise<SportSkillLevel> {
    const [newSkillLevel] = await db.insert(sportSkillLevels).values(skillLevel).returning();
    return newSkillLevel;
  }

  async updateSportSkillLevel(id: number, skillData: Partial<SportSkillLevel>): Promise<SportSkillLevel | undefined> {
    try {
      const [updatedSkillLevel] = await db
        .update(sportSkillLevels)
        .set({ ...skillData, updatedAt: new Date() })
        .where(eq(sportSkillLevels.id, id))
        .returning();
      return updatedSkillLevel;
    } catch (error) {
      console.error("Error updating sport skill level:", error);
      return undefined;
    }
  }

  async deleteSportSkillLevel(id: number): Promise<boolean> {
    try {
      await db.delete(sportSkillLevels).where(eq(sportSkillLevels.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting sport skill level:", error);
      return false;
    }
  }

  // Profile completion methods
  async updateUserProfileCompletion(userId: number, completionLevel: number): Promise<User | undefined> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({ profileCompletionLevel: completionLevel })
        .where(eq(users.id, userId))
        .returning();
      return updatedUser;
    } catch (error) {
      console.error("Error updating user profile completion:", error);
      return undefined;
    }
  }
}

// Initialize storage - use DatabaseStorage for persistent data
export const storage = new DatabaseStorage();

// Initialize sample data for testing
const testUsers: InsertUser[] = [
  {
    username: "admin",
    password: "admin123",
    name: "Alex Smith",
    email: "alex@example.com",
    bio: "Passionate about basketball and tennis. Always looking for new challenges!",
    location: "New York, NY",
    headline: "Sports Enthusiast & Coach"
  },
  {
    username: "sarah_runner",
    password: "password123",
    name: "Sarah Johnson",
    email: "sarah@example.com",
    bio: "Marathon runner and yoga instructor. Love connecting with fellow athletes.",
    location: "Los Angeles, CA",
    headline: "Marathon Runner & Yoga Instructor"
  },
  {
    username: "mike_soccer",
    password: "password123",
    name: "Mike Rodriguez",
    email: "mike@example.com",
    bio: "Soccer player for 15 years. Captain of local amateur league team.",
    location: "Chicago, IL",
    headline: "Soccer Team Captain"
  },
  {
    username: "emma_tennis",
    password: "password123",
    name: "Emma Wilson",
    email: "emma@example.com",
    bio: "Former college tennis player. Now coaching and organizing tournaments.",
    location: "Miami, FL",
    headline: "Tennis Coach & Tournament Organizer"
  },
  {
    username: "david_fitness",
    password: "password123",
    name: "David Chen",
    email: "david@example.com",
    bio: "CrossFit athlete and personal trainer. Believer in functional fitness.",
    location: "Seattle, WA",
    headline: "CrossFit Athlete & Personal Trainer"
  },
  {
    username: "lisa_swimmer",
    password: "password123",
    name: "Lisa Park",
    email: "lisa@example.com",
    bio: "Competitive swimmer and water polo player. Ocean swimming enthusiast.",
    location: "San Diego, CA",
    headline: "Competitive Swimmer"
  },
  // New 10 random users
  {
    username: "carlos_runner",
    password: "password123",
    name: "Carlos Martinez",
    email: "carlos@example.com",
    bio: "Ultra-marathon runner and trail enthusiast. Love exploring new hiking paths.",
    location: "Denver, CO",
    headline: "Ultra Runner & Trail Explorer",
    profileImage: "data:image/svg+xml;base64," + btoa(`<svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#4f46e5"/>
          <stop offset="100%" style="stop-color:#7c3aed"/>
        </linearGradient>
      </defs>
      <rect width="120" height="120" fill="url(#bg1)"/>
      <circle cx="60" cy="45" r="22" fill="#fbbf24"/>
      <path d="M30 90 Q60 75 90 90 L90 120 L30 120 Z" fill="#fbbf24"/>
      <text x="60" y="110" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">CM</text>
    </svg>`)
  },
  {
    username: "nina_volleyball",
    password: "password123", 
    name: "Nina Thompson",
    email: "nina@example.com",
    bio: "Beach volleyball player and coach. Organizing local tournaments and training camps.",
    location: "San Diego, CA",
    headline: "Beach Volleyball Coach",
    profileImage: "data:image/svg+xml;base64," + btoa(`<svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#ec4899"/>
          <stop offset="100%" style="stop-color:#f97316"/>
        </linearGradient>
      </defs>
      <rect width="120" height="120" fill="url(#bg2)"/>
      <circle cx="60" cy="45" r="22" fill="#fef3c7"/>
      <path d="M30 90 Q60 75 90 90 L90 120 L30 120 Z" fill="#fef3c7"/>
      <text x="60" y="110" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">NT</text>
    </svg>`)
  },
  {
    username: "jordan_climbing",
    password: "password123",
    name: "Jordan Lee",
    email: "jordan@example.com", 
    bio: "Rock climbing instructor and outdoor adventure guide. Safety first, fun always!",
    location: "Boulder, CO",
    headline: "Rock Climbing Instructor",
    profileImage: "data:image/svg+xml;base64," + btoa(`<svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#10b981"/>
          <stop offset="100%" style="stop-color:#0ea5e9"/>
        </linearGradient>
      </defs>
      <rect width="120" height="120" fill="url(#bg3)"/>
      <circle cx="60" cy="45" r="22" fill="#fed7aa"/>
      <path d="M30 90 Q60 75 90 90 L90 120 L30 120 Z" fill="#fed7aa"/>
      <text x="60" y="110" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">JL</text>
    </svg>`)
  },
  {
    username: "priya_yoga",
    password: "password123",
    name: "Priya Patel",
    email: "priya@example.com",
    bio: "Certified yoga instructor specializing in power yoga and meditation practices.",
    location: "Austin, TX",
    headline: "Power Yoga Instructor",
    profileImage: "data:image/svg+xml;base64," + btoa(`<svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg4" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#8b5cf6"/>
          <stop offset="100%" style="stop-color:#ec4899"/>
        </linearGradient>
      </defs>
      <rect width="120" height="120" fill="url(#bg4)"/>
      <circle cx="60" cy="45" r="22" fill="#f3e8ff"/>
      <path d="M30 90 Q60 75 90 90 L90 120 L30 120 Z" fill="#f3e8ff"/>
      <text x="60" y="110" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">PP</text>
    </svg>`)
  },
  {
    username: "tyler_cycling",
    password: "password123",
    name: "Tyler Johnson",
    email: "tyler@example.com",
    bio: "Competitive cyclist and bike shop owner. Organizing weekly group rides and races.",
    location: "Portland, OR", 
    headline: "Competitive Cyclist & Shop Owner",
    profileImage: "data:image/svg+xml;base64," + btoa(`<svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg5" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#06b6d4"/>
          <stop offset="100%" style="stop-color:#3b82f6"/>
        </linearGradient>
      </defs>
      <rect width="120" height="120" fill="url(#bg5)"/>
      <circle cx="60" cy="45" r="22" fill="#ddd6fe"/>
      <path d="M30 90 Q60 75 90 90 L90 120 L30 120 Z" fill="#ddd6fe"/>
      <text x="60" y="110" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">TJ</text>
    </svg>`)
  },
  {
    username: "maya_boxing",
    password: "password123",
    name: "Maya Rivera",
    email: "maya@example.com",
    bio: "Professional boxing trainer and former amateur champion. Training fighters of all levels.",
    location: "Las Vegas, NV",
    headline: "Professional Boxing Trainer",
    profileImage: "data:image/svg+xml;base64," + btoa(`<svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg6" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#dc2626"/>
          <stop offset="100%" style="stop-color:#ea580c"/>
        </linearGradient>
      </defs>
      <rect width="120" height="120" fill="url(#bg6)"/>
      <circle cx="60" cy="45" r="22" fill="#fde68a"/>
      <path d="M30 90 Q60 75 90 90 L90 120 L30 120 Z" fill="#fde68a"/>
      <text x="60" y="110" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">MR</text>
    </svg>`)
  },
  {
    username: "ethan_golf",
    password: "password123",
    name: "Ethan Davis",
    email: "ethan@example.com", 
    bio: "Golf pro and course designer. Teaching proper swing techniques and course management.",
    location: "Scottsdale, AZ",
    headline: "Golf Professional & Course Designer",
    profileImage: "data:image/svg+xml;base64," + btoa(`<svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg7" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#059669"/>
          <stop offset="100%" style="stop-color:#ca8a04"/>
        </linearGradient>
      </defs>
      <rect width="120" height="120" fill="url(#bg7)"/>
      <circle cx="60" cy="45" r="22" fill="#fef9c3"/>
      <path d="M30 90 Q60 75 90 90 L90 120 L30 120 Z" fill="#fef9c3"/>
      <text x="60" y="110" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">ED</text>
    </svg>`)
  },
  {
    username: "sophia_dance",
    password: "password123",
    name: "Sophia Kim",
    email: "sophia@example.com",
    bio: "Dance fitness instructor and choreographer. Making fitness fun through movement!",
    location: "Miami, FL",
    headline: "Dance Fitness Instructor",
    profileImage: "data:image/svg+xml;base64," + btoa(`<svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg8" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#f59e0b"/>
          <stop offset="100%" style="stop-color:#ef4444"/>
        </linearGradient>
      </defs>
      <rect width="120" height="120" fill="url(#bg8)"/>
      <circle cx="60" cy="45" r="22" fill="#fecaca"/>
      <path d="M30 90 Q60 75 90 90 L90 120 L30 120 Z" fill="#fecaca"/>
      <text x="60" y="110" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">SK</text>
    </svg>`)
  },
  {
    username: "marcus_martial",
    password: "password123",
    name: "Marcus Brown",
    email: "marcus@example.com",
    bio: "Mixed martial arts instructor and former competitor. Teaching discipline and technique.",
    location: "Las Vegas, NV", 
    headline: "MMA Instructor & Former Fighter",
    profileImage: "data:image/svg+xml;base64," + btoa(`<svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg9" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#374151"/>
          <stop offset="100%" style="stop-color:#1f2937"/>
        </linearGradient>
      </defs>
      <rect width="120" height="120" fill="url(#bg9)"/>
      <circle cx="60" cy="45" r="22" fill="#f9fafb"/>
      <path d="M30 90 Q60 75 90 90 L90 120 L30 120 Z" fill="#f9fafb"/>
      <text x="60" y="110" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">MB</text>
    </svg>`)
  },
  {
    username: "zoe_skating",
    password: "password123",
    name: "Zoe Wilson",
    email: "zoe@example.com",
    bio: "Figure skating coach and former competitive skater. Training the next generation!",
    location: "Minneapolis, MN",
    headline: "Figure Skating Coach",
    profileImage: "data:image/svg+xml;base64," + btoa(`<svg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg10" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#a855f7"/>
          <stop offset="100%" style="stop-color:#06b6d4"/>
        </linearGradient>
      </defs>
      <rect width="120" height="120" fill="url(#bg10)"/>
      <circle cx="60" cy="45" r="22" fill="#e0e7ff"/>
      <path d="M30 90 Q60 75 90 90 L90 120 L30 120 Z" fill="#e0e7ff"/>
      <text x="60" y="110" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">ZW</text>
    </svg>`)
  }
];

// Create test users and sample data
Promise.all(testUsers.map(async (userData) => {
  try {
    const user = await storage.createUser(userData);
    console.log(`Created test user: ${user.username}`);
    return user;
  } catch (error) {
    // User might already exist, try to get existing user
    try {
      const existingUsers = await storage.getAllUsers();
      const existingUser = existingUsers.find(u => u.username === userData.username);
      if (existingUser) {
        console.log(`User ${userData.username} already exists`);
        return existingUser;
      }
    } catch (e) {
      console.error(`Error handling user ${userData.username}:`, error);
    }
    return null;
  }
})).then(async (users) => {
  const validUsers = users.filter(u => u !== null);
  console.log(`Successfully created/found ${validUsers.length} test users`);
  
  if (validUsers.length < 4) {
    console.log('Not enough users created, skipping sample data creation');
    return;
  }
  
  // Create diverse sample events from different users
  const sampleEvents = [
    // Alex Smith (admin) - Basketball & Tennis events
    {
      title: "Morning Basketball Pickup",
      description: "Early morning basketball session. Great way to start the day! All skill levels welcome.",
      sportType: "basketball",
      date: new Date(Date.now() + 86400000), // Tomorrow
      location: "Central Park Basketball Courts",
      locationCoordinates: { lat: 40.785091, lng: -73.968285 },
      maxParticipants: 10,
      currentParticipants: 3,
      isPublic: true,
      isFree: true,
      cost: 0,
      creatorId: validUsers[0].id,
      eventImage: null
    },
    {
      title: "Tennis Doubles Championship",
      description: "Competitive doubles tournament. Prizes for winners! Register with your partner.",
      sportType: "tennis",
      date: new Date(Date.now() + 345600000), // 4 days from now
      location: "NYC Tennis Club",
      locationCoordinates: { lat: 40.758896, lng: -73.985130 },
      maxParticipants: 16,
      currentParticipants: 8,
      isPublic: true,
      isFree: false,
      cost: 25,
      creatorId: validUsers[0].id,
      eventImage: null
    },
    
    // Sarah Johnson - Running & Yoga events
    {
      title: "Central Park 5K Run",
      description: "Join our weekly 5K run through Central Park. Perfect for building endurance and meeting fellow runners.",
      sportType: "running",
      date: new Date(Date.now() + 259200000), // 3 days from now
      location: "Central Park - Bethesda Fountain",
      locationCoordinates: { lat: 40.773663, lng: -73.971249 },
      maxParticipants: 25,
      currentParticipants: 12,
      isPublic: true,
      isFree: true,
      cost: 0,
      creatorId: validUsers[1].id,
      eventImage: null
    },
    {
      title: "Sunrise Yoga Session",
      description: "Start your weekend with peaceful yoga as the sun rises. Bring your own mat. All levels welcome.",
      sportType: "yoga",
      date: new Date(Date.now() + 518400000), // 6 days from now
      location: "Brooklyn Bridge Park",
      locationCoordinates: { lat: 40.702312, lng: -73.996136 },
      maxParticipants: 20,
      currentParticipants: 15,
      isPublic: true,
      isFree: false,
      cost: 15,
      creatorId: validUsers[1].id,
      eventImage: null
    },
    
    // Mike Rodriguez - Soccer events
    {
      title: "Sunday Soccer League",
      description: "Weekly league match. Looking for skilled players to join our team for the season.",
      sportType: "soccer",
      date: new Date(Date.now() + 432000000), // 5 days from now
      location: "Randalls Island Soccer Fields",
      locationCoordinates: { lat: 40.795765, lng: -73.922876 },
      maxParticipants: 22,
      currentParticipants: 18,
      isPublic: true,
      isFree: true,
      cost: 0,
      creatorId: validUsers[2].id,
      eventImage: null
    },
    {
      title: "Youth Soccer Training Camp",
      description: "Training session for young players (ages 12-16). Focus on fundamentals and teamwork.",
      sportType: "soccer",
      date: new Date(Date.now() + 172800000), // 2 days from now
      location: "Chelsea Piers Soccer Fields",
      locationCoordinates: { lat: 40.746621, lng: -74.009781 },
      maxParticipants: 16,
      currentParticipants: 9,
      isPublic: true,
      isFree: false,
      cost: 30,
      creatorId: validUsers[2].id,
      eventImage: null
    },
    
    // Emma Wilson - Tennis events
    {
      title: "Beginner Tennis Clinic",
      description: "Learn the basics of tennis in a fun, supportive environment. Rackets provided for beginners.",
      sportType: "tennis",
      date: new Date(Date.now() + 604800000), // 7 days from now
      location: "Miami Tennis Academy",
      locationCoordinates: { lat: 25.761681, lng: -80.191788 },
      maxParticipants: 12,
      currentParticipants: 7,
      isPublic: true,
      isFree: false,
      cost: 40,
      creatorId: validUsers[3].id,
      eventImage: null
    },
    
    // David Chen - CrossFit & Fitness events
    {
      title: "CrossFit Beach Workout",
      description: "High-intensity beach workout. Bodyweight exercises with ocean views. Bring water and towel.",
      sportType: "crossfit",
      date: new Date(Date.now() + 691200000), // 8 days from now
      location: "Santa Monica Beach",
      locationCoordinates: { lat: 34.019394, lng: -118.491227 },
      maxParticipants: 15,
      currentParticipants: 11,
      isPublic: true,
      isFree: true,
      cost: 0,
      creatorId: validUsers[0].id,
      eventImage: null
    },
    {
      title: "Functional Fitness Workshop",
      description: "Learn proper form and techniques for functional movements. Great for CrossFit beginners.",
      sportType: "crossfit",
      date: new Date(Date.now() + 777600000), // 9 days from now
      location: "Seattle Fitness Center",
      locationCoordinates: { lat: 47.606209, lng: -122.332069 },
      maxParticipants: 10,
      currentParticipants: 6,
      isPublic: true,
      isFree: false,
      cost: 35,
      creatorId: validUsers[1].id,
      eventImage: null
    },
    
    // Lisa Park - Swimming events
    {
      title: "Open Water Swimming",
      description: "Ocean swimming session for experienced swimmers. Safety kayak will be present.",
      sportType: "swimming",
      date: new Date(Date.now() + 864000000), // 10 days from now
      location: "La Jolla Cove",
      locationCoordinates: { lat: 32.850932, lng: -117.273309 },
      maxParticipants: 8,
      currentParticipants: 5,
      isPublic: true,
      isFree: true,
      cost: 0,
      creatorId: validUsers[3].id,
      eventImage: null
    },
    {
      title: "Water Polo Practice",
      description: "Competitive water polo training. Must be a strong swimmer. New players welcome to try.",
      sportType: "swimming",
      date: new Date(Date.now() + 1209600000), // 14 days from now
      location: "UCSD Aquatic Center",
      locationCoordinates: { lat: 32.881178, lng: -117.240094 },
      maxParticipants: 14,
      currentParticipants: 10,
      isPublic: true,
      isFree: false,
      cost: 20,
      creatorId: validUsers[5].id,
      eventImage: null
    },
    
    // Mixed sports events from various users
    {
      title: "Volleyball Beach Tournament",
      description: "Sand volleyball tournament. Teams of 4. Prizes for top 3 teams. Food trucks on site!",
      sportType: "volleyball",
      date: new Date(Date.now() + 1296000000), // 15 days from now
      location: "Manhattan Beach Volleyball Courts",
      locationCoordinates: { lat: 33.884566, lng: -118.410755 },
      maxParticipants: 32,
      currentParticipants: 20,
      isPublic: true,
      isFree: false,
      cost: 15,
      creatorId: validUsers[1].id,
      eventImage: null
    },
    {
      title: "Hiking Adventure",
      description: "Moderate difficulty hike with stunning views. Bring water, snacks, and hiking boots.",
      sportType: "hiking",
      date: new Date(Date.now() + 1382400000), // 16 days from now
      location: "Griffith Observatory Trail",
      locationCoordinates: { lat: 34.118434, lng: -118.300392 },
      maxParticipants: 20,
      currentParticipants: 14,
      isPublic: true,
      isFree: true,
      cost: 0,
      creatorId: validUsers[2].id,
      eventImage: null
    },
    {
      title: "Cycling Group Ride",
      description: "30-mile road cycling ride through scenic routes. Intermediate pace. Helmets required.",
      sportType: "cycling",
      date: new Date(Date.now() + 1468800000), // 17 days from now
      location: "Golden Gate Park",
      locationCoordinates: { lat: 37.769421, lng: -122.486214 },
      maxParticipants: 25,
      currentParticipants: 16,
      isPublic: true,
      isFree: true,
      cost: 0,
      creatorId: validUsers[2].id,
      eventImage: null
    },
    {
      title: "Badminton Club Night",
      description: "Friendly badminton games. All skill levels. Rackets and shuttlecocks provided.",
      sportType: "badminton",
      date: new Date(Date.now() + 1555200000), // 18 days from now
      location: "Community Sports Center",
      locationCoordinates: { lat: 40.712775, lng: -74.005973 },
      maxParticipants: 12,
      currentParticipants: 8,
      isPublic: true,
      isFree: false,
      cost: 10,
      creatorId: validUsers[3].id,
      eventImage: null
    },
    
    // Events from the 10 new users (starting from index 6)
    // Carlos Martinez - Running events
    {
      title: "Mountain Trail Ultra Run",
      description: "50K trail run through Rocky Mountain trails. Advanced runners only. Aid stations provided.",
      sportType: "running",
      date: new Date(Date.now() + 1900800000), // 22 days from now
      location: "Rocky Mountain National Park",
      locationCoordinates: { lat: 40.3428, lng: -105.6836 },
      maxParticipants: 20,
      currentParticipants: 0,
      isPublic: true,
      isFree: false,
      cost: 40,
      creatorId: validUsers[6]?.id || validUsers[0].id,
      eventImage: "data:image/svg+xml;base64," + btoa(`<svg width="300" height="200" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="runbg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#10b981"/>
            <stop offset="100%" style="stop-color:#059669"/>
          </linearGradient>
        </defs>
        <rect width="300" height="200" fill="url(#runbg)"/>
        <path d="M50 150 Q100 100 150 120 T250 100" stroke="white" stroke-width="3" fill="none"/>
        <circle cx="80" cy="130" r="3" fill="white"/>
        <circle cx="180" cy="110" r="3" fill="white"/>
        <text x="150" y="180" text-anchor="middle" fill="white" font-family="Arial" font-size="16" font-weight="bold">TRAIL RUN</text>
      </svg>`)
    },
    
    // Nina Thompson - Volleyball events
    {
      title: "Beach Volleyball Tournament",
      description: "Professional level beach volleyball tournament. Teams of 2. Cash prizes for winners!",
      sportType: "volleyball",
      date: new Date(Date.now() + 2073600000), // 24 days from now
      location: "Mission Beach Volleyball Courts",
      locationCoordinates: { lat: 32.7767, lng: -117.2533 },
      maxParticipants: 16,
      currentParticipants: 0,
      isPublic: true,
      isFree: false,
      cost: 25,
      creatorId: validUsers[7]?.id || validUsers[1].id,
      eventImage: "data:image/svg+xml;base64," + btoa(`<svg width="300" height="200" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
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
      </svg>`)
    },
    
    // Jordan Lee - Rock Climbing
    {
      title: "Indoor Climbing Workshop",
      description: "Learn proper climbing techniques and safety. Equipment included. Perfect for beginners.",
      sportType: "climbing",
      date: new Date(Date.now() + 2160000000), // 25 days from now
      location: "Boulder Rock Club",
      locationCoordinates: { lat: 40.0150, lng: -105.2705 },
      maxParticipants: 10,
      currentParticipants: 0,
      isPublic: true,
      isFree: false,
      cost: 35,
      creatorId: validUsers[8]?.id || validUsers[2].id,
      eventImage: "data:image/svg+xml;base64," + btoa(`<svg width="300" height="200" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="climbg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#7c3aed"/>
            <stop offset="100%" style="stop-color:#5b21b6"/>
          </linearGradient>
        </defs>
        <rect width="300" height="200" fill="url(#climbg)"/>
        <path d="M50 180 L100 140 L150 160 L200 120 L250 140" stroke="white" stroke-width="4" fill="none"/>
        <circle cx="120" cy="150" r="4" fill="white"/>
        <text x="150" y="180" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">CLIMBING</text>
      </svg>`)
    },
    
    // Priya Patel - Yoga events
    {
      title: "Power Yoga Flow Class",
      description: "Intense 90-minute power yoga session. Build strength and flexibility. All levels welcome.",
      sportType: "yoga",
      date: new Date(Date.now() + 2246400000), // 26 days from now
      location: "Austin Yoga Center",
      locationCoordinates: { lat: 30.2672, lng: -97.7431 },
      maxParticipants: 25,
      currentParticipants: 0,
      isPublic: true,
      isFree: false,
      cost: 20,
      creatorId: validUsers[9]?.id || validUsers[3].id,
      eventImage: "data:image/svg+xml;base64," + btoa(`<svg width="300" height="200" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="yogabg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#06b6d4"/>
            <stop offset="100%" style="stop-color:#0891b2"/>
          </linearGradient>
        </defs>
        <rect width="300" height="200" fill="url(#yogabg)"/>
        <circle cx="150" cy="90" r="8" fill="white"/>
        <rect x="145" y="100" width="10" height="40" fill="white"/>
        <rect x="125" y="115" width="15" height="5" fill="white"/>
        <rect x="160" y="115" width="15" height="5" fill="white"/>
        <text x="150" y="180" text-anchor="middle" fill="white" font-family="Arial" font-size="16" font-weight="bold">YOGA</text>
      </svg>`)
    },
    
    // Tyler Johnson - Cycling
    {
      title: "Portland Century Ride",
      description: "100-mile cycling challenge through scenic Oregon countryside. Support vehicle included.",
      sportType: "cycling",
      date: new Date(Date.now() + 2332800000), // 27 days from now
      location: "Portland Cycling Club",
      locationCoordinates: { lat: 45.5152, lng: -122.6784 },
      maxParticipants: 30,
      currentParticipants: 0,
      isPublic: true,
      isFree: false,
      cost: 30,
      creatorId: validUsers[10]?.id || validUsers[0].id,
      eventImage: "data:image/svg+xml;base64," + btoa(`<svg width="300" height="200" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bikebg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#3b82f6"/>
            <stop offset="100%" style="stop-color:#1d4ed8"/>
          </linearGradient>
        </defs>
        <rect width="300" height="200" fill="url(#bikebg)"/>
        <circle cx="100" cy="130" r="20" fill="none" stroke="white" stroke-width="3"/>
        <circle cx="200" cy="130" r="20" fill="none" stroke="white" stroke-width="3"/>
        <path d="M120 130 L180 130 L150 100 Z" stroke="white" stroke-width="3" fill="none"/>
        <text x="150" y="180" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">CYCLING</text>
      </svg>`)
    },
    
    // Maya Rivera - Boxing
    {
      title: "Boxing Fundamentals Workshop",
      description: "Learn proper boxing stance, jab, cross, and footwork. Gloves provided. Great workout!",
      sportType: "boxing",
      date: new Date(Date.now() + 2419200000), // 28 days from now
      location: "Las Vegas Boxing Gym",
      locationCoordinates: { lat: 36.1699, lng: -115.1398 },
      maxParticipants: 15,
      currentParticipants: 0,
      isPublic: true,
      isFree: false,
      cost: 25,
      creatorId: validUsers[11]?.id || validUsers[1].id,
      eventImage: "data:image/svg+xml;base64," + btoa(`<svg width="300" height="200" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="boxbg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#dc2626"/>
            <stop offset="100%" style="stop-color:#b91c1c"/>
          </linearGradient>
        </defs>
        <rect width="300" height="200" fill="url(#boxbg)"/>
        <circle cx="120" cy="110" r="12" fill="white"/>
        <circle cx="180" cy="110" r="12" fill="white"/>
        <rect x="140" y="120" width="20" height="30" fill="white"/>
        <text x="150" y="180" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">BOXING</text>
      </svg>`)
    },
    
    // Ethan Davis - Golf
    {
      title: "Golf Swing Analysis Clinic",
      description: "Professional golf instruction with video analysis. Improve your swing technique.",
      sportType: "golf",
      date: new Date(Date.now() + 2505600000), // 29 days from now
      location: "Scottsdale Golf Course",
      locationCoordinates: { lat: 33.4942, lng: -111.9261 },
      maxParticipants: 8,
      currentParticipants: 0,
      isPublic: true,
      isFree: false,
      cost: 50,
      creatorId: validUsers[12]?.id || validUsers[2].id,
      eventImage: "data:image/svg+xml;base64," + btoa(`<svg width="300" height="200" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="golfbg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#059669"/>
            <stop offset="100%" style="stop-color:#047857"/>
          </linearGradient>
        </defs>
        <rect width="300" height="200" fill="url(#golfbg)"/>
        <circle cx="200" cy="160" r="6" fill="white"/>
        <path d="M100 120 Q150 100 200 160" stroke="white" stroke-width="3" fill="none"/>
        <rect x="145" y="95" width="3" height="30" fill="white"/>
        <text x="150" y="180" text-anchor="middle" fill="white" font-family="Arial" font-size="16" font-weight="bold">GOLF</text>
      </svg>`)
    },
    
    // Sophia Kim - Dance Fitness
    {
      title: "Dance Cardio Blast",
      description: "High-energy dance fitness class mixing hip-hop, Latin, and pop moves. No experience needed!",
      sportType: "dance",
      date: new Date(Date.now() + 2592000000), // 30 days from now
      location: "Miami Dance Studio",
      locationCoordinates: { lat: 25.7617, lng: -80.1918 },
      maxParticipants: 20,
      currentParticipants: 0,
      isPublic: true,
      isFree: false,
      cost: 15,
      creatorId: validUsers[13]?.id || validUsers[3].id,
      eventImage: "data:image/svg+xml;base64," + btoa(`<svg width="300" height="200" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="dancebg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#ec4899"/>
            <stop offset="100%" style="stop-color:#db2777"/>
          </linearGradient>
        </defs>
        <rect width="300" height="200" fill="url(#dancebg)"/>
        <circle cx="150" cy="90" r="8" fill="white"/>
        <path d="M150 100 L130 140 M150 100 L170 140" stroke="white" stroke-width="4"/>
        <path d="M135 120 L165 120" stroke="white" stroke-width="4"/>
        <text x="150" y="180" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">DANCE</text>
      </svg>`)
    },
    
    // Marcus Brown - Martial Arts
    {
      title: "MMA Introduction Class",
      description: "Learn basic mixed martial arts techniques including striking and grappling. Beginner friendly.",
      sportType: "martial_arts",
      date: new Date(Date.now() + 2678400000), // 31 days from now
      location: "Las Vegas MMA Academy",
      locationCoordinates: { lat: 36.1699, lng: -115.1398 },
      maxParticipants: 12,
      currentParticipants: 0,
      isPublic: true,
      isFree: false,
      cost: 30,
      creatorId: validUsers[14]?.id || validUsers[0].id,
      eventImage: "data:image/svg+xml;base64," + btoa(`<svg width="300" height="200" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="mmabg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#374151"/>
            <stop offset="100%" style="stop-color:#1f2937"/>
          </linearGradient>
        </defs>
        <rect width="300" height="200" fill="url(#mmabg)"/>
        <circle cx="150" cy="90" r="8" fill="white"/>
        <rect x="145" y="100" width="10" height="40" fill="white"/>
        <path d="M135 110 L125 130 M165 110 L175 130" stroke="white" stroke-width="4"/>
        <text x="150" y="180" text-anchor="middle" fill="white" font-family="Arial" font-size="18" font-weight="bold">MMA</text>
      </svg>`)
    },
    
    // Zoe Wilson - Figure Skating
    {
      title: "Figure Skating Basics",
      description: "Learn fundamental figure skating moves including forward and backward skating, stops, and turns.",
      sportType: "skating",
      date: new Date(Date.now() + 2764800000), // 32 days from now
      location: "Minneapolis Ice Arena",
      locationCoordinates: { lat: 44.9778, lng: -93.2650 },
      maxParticipants: 10,
      currentParticipants: 0,
      isPublic: true,
      isFree: false,
      cost: 25,
      creatorId: validUsers[15]?.id || validUsers[1].id,
      eventImage: "data:image/svg+xml;base64," + btoa(`<svg width="300" height="200" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="icebg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#0ea5e9"/>
            <stop offset="100%" style="stop-color:#0284c7"/>
          </linearGradient>
        </defs>
        <rect width="300" height="200" fill="url(#icebg)"/>
        <circle cx="150" cy="90" r="8" fill="white"/>
        <rect x="145" y="100" width="10" height="30" fill="white"/>
        <path d="M100 150 Q150 120 200 150" stroke="white" stroke-width="3" fill="none"/>
        <text x="150" y="180" text-anchor="middle" fill="white" font-family="Arial" font-size="12" font-weight="bold">SKATING</text>
      </svg>`)
    }
  ];
  
  // Create events from the sample data
  console.log(`Creating ${sampleEvents.length} sample events...`);
  
  for (const eventData of sampleEvents) {
    try {
      await storage.createEvent(eventData);
      console.log(`Created event: ${eventData.title}`);
    } catch (error) {
      console.error(`Error creating event ${eventData.title}:`, error);
    }
  }
  
  // Create user sport preferences for realistic matching
  console.log('Creating user sport preferences...');
  
  const userSportPrefs = [
    // Alex Smith (admin) preferences
    { userId: validUsers[0].id, sportType: "basketball", skillLevel: "advanced", yearsExperience: 8, isVisible: true },
    { userId: validUsers[0].id, sportType: "tennis", skillLevel: "intermediate", yearsExperience: 5, isVisible: true },
    
    // Sarah Johnson preferences
    { userId: validUsers[1].id, sportType: "running", skillLevel: "expert", yearsExperience: 12, isVisible: true },
    { userId: validUsers[1].id, sportType: "yoga", skillLevel: "advanced", yearsExperience: 7, isVisible: true },
    { userId: validUsers[1].id, sportType: "volleyball", skillLevel: "intermediate", yearsExperience: 3, isVisible: true },
    
    // Mike Rodriguez preferences
    { userId: validUsers[2].id, sportType: "soccer", skillLevel: "expert", yearsExperience: 15, isVisible: true },
    { userId: validUsers[2].id, sportType: "cycling", skillLevel: "advanced", yearsExperience: 6, isVisible: true },
    
    // Emma Wilson preferences
    { userId: validUsers[3].id, sportType: "tennis", skillLevel: "expert", yearsExperience: 10, isVisible: true },
    { userId: validUsers[3].id, sportType: "badminton", skillLevel: "advanced", yearsExperience: 4, isVisible: true },
    
    // David Chen preferences
    { userId: validUsers[2].id, sportType: "crossfit", skillLevel: "expert", yearsExperience: 8, isVisible: true },
    { userId: validUsers[2].id, sportType: "hiking", skillLevel: "advanced", yearsExperience: 10, isVisible: true },
    { userId: validUsers[2].id, sportType: "cycling", skillLevel: "intermediate", yearsExperience: 3, isVisible: true },
    
    // Lisa Park preferences
    { userId: validUsers[3].id, sportType: "swimming", skillLevel: "expert", yearsExperience: 14, isVisible: true },
    { userId: validUsers[3].id, sportType: "volleyball", skillLevel: "advanced", yearsExperience: 5, isVisible: true }
  ];
  
  for (const pref of userSportPrefs) {
    try {
      await storage.createUserSportPreference(pref);
      console.log(`Created sport preference: ${pref.sportType} for user ${pref.userId}`);
    } catch (error) {
      console.error(`Error creating sport preference:`, error);
    }
  }
  
  console.log('Sample data creation completed!');
}).catch(error => {
  console.error("Error creating test users:", error);
});
