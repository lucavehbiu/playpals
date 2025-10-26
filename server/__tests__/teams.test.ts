import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createTestApp, createMockStorage } from '../../tests/helpers/createTestApp';

describe('Teams API', () => {
  let app: Express;
  let mockStorage: ReturnType<typeof createMockStorage>;
  let sessionCookie: string[];
  let userId: number;
  let otherUserCookie: string[];
  let otherUserId: number;

  beforeAll(() => {
    mockStorage = createMockStorage();
    app = createTestApp(mockStorage);
  });

  beforeEach(async () => {
    mockStorage._reset();

    // Register and login first user
    const registerResponse = await request(app)
      .post('/api/register')
      .send({
        username: 'teamadmin',
        password: 'Admin123',
        email: 'admin@test.com',
        name: 'Team Admin',
      });

    sessionCookie = registerResponse.headers['set-cookie'];
    userId = registerResponse.body.id;

    // Register second user for member tests
    const otherUserResponse = await request(app)
      .post('/api/register')
      .send({
        username: 'teammember',
        password: 'Member123',
        email: 'member@test.com',
        name: 'Team Member',
      });

    otherUserCookie = otherUserResponse.headers['set-cookie'];
    otherUserId = otherUserResponse.body.id;
  });

  describe('POST /api/teams', () => {
    it('should create a team with valid data', async () => {
      const teamData = {
        name: 'Test Basketball Team',
        description: 'A competitive basketball team',
        sportType: 'basketball',
        isPrivate: false,
      };

      const response = await request(app)
        .post('/api/teams')
        .set('Cookie', sessionCookie)
        .send(teamData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe(teamData.name);
      expect(response.body.description).toBe(teamData.description);
      expect(response.body.sportType).toBe(teamData.sportType);
      expect(response.body.adminId).toBe(userId);
      expect(response.body.memberCount).toBe(1);
    });

    it('should reject team creation without authentication', async () => {
      const teamData = {
        name: 'Test Team',
        sportType: 'soccer',
      };

      const response = await request(app)
        .post('/api/teams')
        .send(teamData)
        .expect(401);

      expect(response.body.message).toContain('Unauthorized');
    });

    it('should auto-add creator as admin member', async () => {
      const teamData = {
        name: 'Auto Member Team',
        sportType: 'basketball',
      };

      const createResponse = await request(app)
        .post('/api/teams')
        .set('Cookie', sessionCookie)
        .send(teamData)
        .expect(201);

      const teamId = createResponse.body.id;

      // Get team members
      const membersResponse = await request(app)
        .get(`/api/teams/${teamId}/members`)
        .expect(200);

      expect(membersResponse.body).toHaveLength(1);
      expect(membersResponse.body[0].userId).toBe(userId);
      expect(membersResponse.body[0].role).toBe('admin');
    });
  });

  describe('GET /api/teams', () => {
    it('should return list of all teams', async () => {
      // Create two teams
      await request(app)
        .post('/api/teams')
        .set('Cookie', sessionCookie)
        .send({ name: 'Team 1', sportType: 'basketball' });

      await request(app)
        .post('/api/teams')
        .set('Cookie', sessionCookie)
        .send({ name: 'Team 2', sportType: 'soccer' });

      const response = await request(app)
        .get('/api/teams')
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].name).toBe('Team 1');
      expect(response.body[1].name).toBe('Team 2');
    });
  });

  describe('GET /api/teams/user/:userId', () => {
    it('should return teams for specific user', async () => {
      // Create team as first user
      const team1Response = await request(app)
        .post('/api/teams')
        .set('Cookie', sessionCookie)
        .send({ name: 'User1 Team', sportType: 'basketball' });

      // Create team as second user
      await request(app)
        .post('/api/teams')
        .set('Cookie', otherUserCookie)
        .send({ name: 'User2 Team', sportType: 'soccer' });

      // Get first user's teams
      const response = await request(app)
        .get(`/api/teams/user/${userId}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe('User1 Team');
    });
  });

  describe('GET /api/teams/:id', () => {
    it('should return team details with admin info', async () => {
      const createResponse = await request(app)
        .post('/api/teams')
        .set('Cookie', sessionCookie)
        .send({ name: 'Detail Team', sportType: 'basketball' });

      const teamId = createResponse.body.id;

      const response = await request(app)
        .get(`/api/teams/${teamId}`)
        .expect(200);

      expect(response.body.id).toBe(teamId);
      expect(response.body.name).toBe('Detail Team');
      expect(response.body).toHaveProperty('admin');
      expect(response.body.admin.id).toBe(userId);
      expect(response.body.admin.username).toBe('teamadmin');
    });

    it('should return 404 for non-existent team', async () => {
      const response = await request(app)
        .get('/api/teams/99999')
        .expect(404);

      expect(response.body.message).toContain('Team not found');
    });
  });

  describe('PUT /api/teams/:id', () => {
    let teamId: number;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/teams')
        .set('Cookie', sessionCookie)
        .send({ name: 'Update Team', sportType: 'basketball' });

      teamId = createResponse.body.id;
    });

    it('should allow admin to update team', async () => {
      const updates = {
        name: 'Updated Team Name',
        description: 'Updated description',
      };

      const response = await request(app)
        .put(`/api/teams/${teamId}`)
        .set('Cookie', sessionCookie)
        .send(updates)
        .expect(200);

      expect(response.body.name).toBe(updates.name);
      expect(response.body.description).toBe(updates.description);
    });

    it('should prevent non-admin from updating team', async () => {
      const updates = { name: 'Hacked Team' };

      const response = await request(app)
        .put(`/api/teams/${teamId}`)
        .set('Cookie', otherUserCookie)
        .send(updates)
        .expect(403);

      expect(response.body.message).toContain('Not authorized');
    });

    it('should require authentication to update team', async () => {
      const updates = { name: 'No Auth Update' };

      const response = await request(app)
        .put(`/api/teams/${teamId}`)
        .send(updates)
        .expect(401);

      expect(response.body.message).toContain('Unauthorized');
    });

    it('should return 404 for non-existent team', async () => {
      const response = await request(app)
        .put('/api/teams/99999')
        .set('Cookie', sessionCookie)
        .send({ name: 'Update' })
        .expect(404);

      expect(response.body.message).toContain('Team not found');
    });
  });

  describe('DELETE /api/teams/:id', () => {
    let teamId: number;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/teams')
        .set('Cookie', sessionCookie)
        .send({ name: 'Delete Team', sportType: 'basketball' });

      teamId = createResponse.body.id;
    });

    it('should allow admin to delete team', async () => {
      const response = await request(app)
        .delete(`/api/teams/${teamId}`)
        .set('Cookie', sessionCookie)
        .expect(200);

      expect(response.body.message).toContain('Team deleted successfully');

      // Verify team is deleted
      await request(app)
        .get(`/api/teams/${teamId}`)
        .expect(404);
    });

    it('should delete team members when deleting team', async () => {
      // Add another member
      await request(app)
        .post(`/api/teams/${teamId}/members`)
        .set('Cookie', sessionCookie)
        .send({ userId: otherUserId, role: 'member' });

      // Delete team
      await request(app)
        .delete(`/api/teams/${teamId}`)
        .set('Cookie', sessionCookie)
        .expect(200);

      // Verify members are also deleted
      const membersResponse = await request(app)
        .get(`/api/teams/${teamId}/members`)
        .expect(200);

      expect(membersResponse.body).toHaveLength(0);
    });

    it('should prevent non-admin from deleting team', async () => {
      const response = await request(app)
        .delete(`/api/teams/${teamId}`)
        .set('Cookie', otherUserCookie)
        .expect(403);

      expect(response.body.message).toContain('Not authorized');
    });

    it('should require authentication to delete team', async () => {
      const response = await request(app)
        .delete(`/api/teams/${teamId}`)
        .expect(401);

      expect(response.body.message).toContain('Unauthorized');
    });
  });

  describe('POST /api/teams/:teamId/members', () => {
    let teamId: number;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/teams')
        .set('Cookie', sessionCookie)
        .send({ name: 'Member Team', sportType: 'basketball' });

      teamId = createResponse.body.id;
    });

    it('should add member to team', async () => {
      const memberData = {
        userId: otherUserId,
        role: 'member',
      };

      const response = await request(app)
        .post(`/api/teams/${teamId}/members`)
        .set('Cookie', sessionCookie)
        .send(memberData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.userId).toBe(otherUserId);
      expect(response.body.teamId).toBe(teamId);
      expect(response.body.role).toBe('member');
    });

    it('should increase team member count', async () => {
      // Check initial count
      let team = await request(app).get(`/api/teams/${teamId}`);
      const initialCount = team.body.memberCount;

      // Add member
      await request(app)
        .post(`/api/teams/${teamId}/members`)
        .set('Cookie', sessionCookie)
        .send({ userId: otherUserId, role: 'member' })
        .expect(201);

      // Check updated count
      team = await request(app).get(`/api/teams/${teamId}`);
      expect(team.body.memberCount).toBe(initialCount + 1);
    });

    it('should require authentication to add member', async () => {
      const response = await request(app)
        .post(`/api/teams/${teamId}/members`)
        .send({ userId: otherUserId, role: 'member' })
        .expect(401);

      expect(response.body.message).toContain('Unauthorized');
    });

    it('should return 404 for non-existent team', async () => {
      const response = await request(app)
        .post('/api/teams/99999/members')
        .set('Cookie', sessionCookie)
        .send({ userId: otherUserId, role: 'member' })
        .expect(404);

      expect(response.body.message).toContain('Team not found');
    });
  });

  describe('GET /api/teams/:teamId/members', () => {
    let teamId: number;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/teams')
        .set('Cookie', sessionCookie)
        .send({ name: 'Get Members Team', sportType: 'basketball' });

      teamId = createResponse.body.id;
    });

    it('should return team members with user info', async () => {
      // Add another member
      await request(app)
        .post(`/api/teams/${teamId}/members`)
        .set('Cookie', sessionCookie)
        .send({ userId: otherUserId, role: 'member' });

      const response = await request(app)
        .get(`/api/teams/${teamId}/members`)
        .expect(200);

      expect(response.body).toHaveLength(2); // Admin + new member
      expect(response.body[0]).toHaveProperty('user');
      expect(response.body[0].user).toHaveProperty('username');
      expect(response.body[0].user).not.toHaveProperty('password');
    });
  });

  describe('PUT /api/teams/:teamId/members/:memberId', () => {
    let teamId: number;
    let memberId: number;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/teams')
        .set('Cookie', sessionCookie)
        .send({ name: 'Update Member Team', sportType: 'basketball' });

      teamId = createResponse.body.id;

      const memberResponse = await request(app)
        .post(`/api/teams/${teamId}/members`)
        .set('Cookie', sessionCookie)
        .send({ userId: otherUserId, role: 'member' });

      memberId = memberResponse.body.id;
    });

    it('should allow admin to update member role', async () => {
      const updates = { role: 'coach' };

      const response = await request(app)
        .put(`/api/teams/${teamId}/members/${memberId}`)
        .set('Cookie', sessionCookie)
        .send(updates)
        .expect(200);

      expect(response.body.role).toBe('coach');
    });

    it('should prevent non-admin from updating member', async () => {
      const updates = { role: 'admin' };

      const response = await request(app)
        .put(`/api/teams/${teamId}/members/${memberId}`)
        .set('Cookie', otherUserCookie)
        .send(updates)
        .expect(403);

      expect(response.body.message).toContain('Not authorized');
    });

    it('should return 404 for non-existent member', async () => {
      const response = await request(app)
        .put(`/api/teams/${teamId}/members/99999`)
        .set('Cookie', sessionCookie)
        .send({ role: 'coach' })
        .expect(404);

      expect(response.body.message).toContain('Member not found');
    });
  });

  describe('DELETE /api/teams/:teamId/members/:memberId', () => {
    let teamId: number;
    let memberId: number;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post('/api/teams')
        .set('Cookie', sessionCookie)
        .send({ name: 'Remove Member Team', sportType: 'basketball' });

      teamId = createResponse.body.id;

      const memberResponse = await request(app)
        .post(`/api/teams/${teamId}/members`)
        .set('Cookie', sessionCookie)
        .send({ userId: otherUserId, role: 'member' });

      memberId = memberResponse.body.id;
    });

    it('should allow admin to remove member', async () => {
      const response = await request(app)
        .delete(`/api/teams/${teamId}/members/${memberId}`)
        .set('Cookie', sessionCookie)
        .expect(200);

      expect(response.body.message).toContain('Member removed successfully');
    });

    it('should allow member to remove themselves', async () => {
      const response = await request(app)
        .delete(`/api/teams/${teamId}/members/${memberId}`)
        .set('Cookie', otherUserCookie)
        .expect(200);

      expect(response.body.message).toContain('Member removed successfully');
    });

    it('should decrease team member count', async () => {
      // Check initial count
      let team = await request(app).get(`/api/teams/${teamId}`);
      const initialCount = team.body.memberCount;

      // Remove member
      await request(app)
        .delete(`/api/teams/${teamId}/members/${memberId}`)
        .set('Cookie', sessionCookie)
        .expect(200);

      // Check updated count
      team = await request(app).get(`/api/teams/${teamId}`);
      expect(team.body.memberCount).toBe(initialCount - 1);
    });

    it('should prevent unauthorized user from removing member', async () => {
      // Register third user
      const thirdUserResponse = await request(app)
        .post('/api/register')
        .send({
          username: 'thirduser',
          password: 'Third123',
          email: 'third@test.com',
          name: 'Third User',
        });

      const thirdUserCookie = thirdUserResponse.headers['set-cookie'];

      const response = await request(app)
        .delete(`/api/teams/${teamId}/members/${memberId}`)
        .set('Cookie', thirdUserCookie)
        .expect(403);

      expect(response.body.message).toContain('Not authorized');
    });

    it('should return 404 for non-existent member', async () => {
      const response = await request(app)
        .delete(`/api/teams/${teamId}/members/99999`)
        .set('Cookie', sessionCookie)
        .expect(404);

      expect(response.body.message).toContain('Member not found');
    });
  });
});
