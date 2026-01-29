import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createTestApp, createMockStorage } from '../../tests/helpers/createTestApp';

describe('RSVPs API', () => {
  let app: Express;
  let mockStorage: ReturnType<typeof createMockStorage>;
  let sessionCookie: string[];
  let userId: number;
  let eventId: number;
  let otherUserCookie: string[];
  let otherUserId: number;

  beforeAll(() => {
    mockStorage = createMockStorage();
    app = createTestApp(mockStorage);
  });

  beforeEach(async () => {
    mockStorage._reset();

    // Register and login first user (event creator)
    const registerResponse = await request(app).post('/api/register').send({
      username: 'eventcreator',
      password: 'Creator123',
      email: 'creator@test.com',
      name: 'Event Creator',
    });

    sessionCookie = registerResponse.headers['set-cookie'];
    userId = registerResponse.body.id;

    // Create an event for RSVP tests
    const eventResponse = await request(app).post('/api/events').set('Cookie', sessionCookie).send({
      title: 'Test Event',
      sportType: 'basketball',
      location: 'Test Location',
      date: new Date().toISOString(),
      maxParticipants: 10,
    });

    eventId = eventResponse.body.id;

    // Register second user for RSVP tests
    const otherUserResponse = await request(app).post('/api/register').send({
      username: 'attendee',
      password: 'Attendee123',
      email: 'attendee@test.com',
      name: 'Event Attendee',
    });

    otherUserCookie = otherUserResponse.headers['set-cookie'];
    otherUserId = otherUserResponse.body.id;
  });

  describe('POST /api/rsvps', () => {
    it('should create RSVP with valid data', async () => {
      const rsvpData = {
        eventId,
        status: 'pending',
      };

      const response = await request(app)
        .post('/api/rsvps')
        .set('Cookie', otherUserCookie)
        .send(rsvpData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.eventId).toBe(eventId);
      expect(response.body.userId).toBe(otherUserId);
      expect(response.body.status).toBe('pending');
    });

    it('should require authentication to create RSVP', async () => {
      const rsvpData = {
        eventId,
        status: 'pending',
      };

      const response = await request(app).post('/api/rsvps').send(rsvpData).expect(401);

      expect(response.body.message).toContain('Unauthorized');
    });

    it('should return 404 for non-existent event', async () => {
      const rsvpData = {
        eventId: 99999,
        status: 'pending',
      };

      const response = await request(app)
        .post('/api/rsvps')
        .set('Cookie', otherUserCookie)
        .send(rsvpData)
        .expect(404);

      expect(response.body.message).toContain('Event not found');
    });

    it('should set userId from authenticated user', async () => {
      const rsvpData = {
        eventId,
        status: 'attending',
      };

      const response = await request(app)
        .post('/api/rsvps')
        .set('Cookie', otherUserCookie)
        .send(rsvpData)
        .expect(201);

      // UserId should be set from auth, not from request body
      expect(response.body.userId).toBe(otherUserId);
    });
  });

  describe('GET /api/rsvps/event/:eventId', () => {
    beforeEach(async () => {
      // Create some RSVPs for the event
      await request(app)
        .post('/api/rsvps')
        .set('Cookie', otherUserCookie)
        .send({ eventId, status: 'attending' });

      // Register and create RSVP for third user
      const thirdUserResponse = await request(app).post('/api/register').send({
        username: 'thirduser',
        password: 'Third123',
        email: 'third@test.com',
        name: 'Third User',
      });

      await request(app)
        .post('/api/rsvps')
        .set('Cookie', thirdUserResponse.headers['set-cookie'])
        .send({ eventId, status: 'pending' });
    });

    it('should return all RSVPs for an event', async () => {
      const response = await request(app).get(`/api/rsvps/event/${eventId}`).expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('eventId', eventId);
    });

    it('should return empty array for event with no RSVPs', async () => {
      // Create another event
      const newEventResponse = await request(app)
        .post('/api/events')
        .set('Cookie', sessionCookie)
        .send({
          title: 'No RSVPs Event',
          sportType: 'soccer',
          location: 'Test Location',
          date: new Date().toISOString(),
          maxParticipants: 5,
        });

      const response = await request(app)
        .get(`/api/rsvps/event/${newEventResponse.body.id}`)
        .expect(200);

      expect(response.body).toHaveLength(0);
    });
  });

  describe('GET /api/rsvps/user/:userId', () => {
    let secondEventId: number;

    beforeEach(async () => {
      // Create second event
      const event2Response = await request(app)
        .post('/api/events')
        .set('Cookie', sessionCookie)
        .send({
          title: 'Second Event',
          sportType: 'soccer',
          location: 'Test Location 2',
          date: new Date().toISOString(),
          maxParticipants: 8,
        });

      secondEventId = event2Response.body.id;

      // User RSVPs to both events
      await request(app)
        .post('/api/rsvps')
        .set('Cookie', otherUserCookie)
        .send({ eventId, status: 'attending' });

      await request(app)
        .post('/api/rsvps')
        .set('Cookie', otherUserCookie)
        .send({ eventId: secondEventId, status: 'pending' });
    });

    it('should return all RSVPs for a user', async () => {
      const response = await request(app).get(`/api/rsvps/user/${otherUserId}`).expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('userId', otherUserId);
      expect(response.body[1]).toHaveProperty('userId', otherUserId);
    });

    it('should return empty array for user with no RSVPs', async () => {
      // Register user who hasn't RSVP'd
      const newUserResponse = await request(app).post('/api/register').send({
        username: 'norsvp',
        password: 'NoRsvp123',
        email: 'norsvp@test.com',
        name: 'No RSVP User',
      });

      const response = await request(app)
        .get(`/api/rsvps/user/${newUserResponse.body.id}`)
        .expect(200);

      expect(response.body).toHaveLength(0);
    });
  });

  describe('PUT /api/rsvps/:id', () => {
    let rsvpId: number;

    beforeEach(async () => {
      const rsvpResponse = await request(app)
        .post('/api/rsvps')
        .set('Cookie', otherUserCookie)
        .send({ eventId, status: 'pending' });

      rsvpId = rsvpResponse.body.id;
    });

    it('should allow RSVP owner to update status', async () => {
      const updates = { status: 'attending' };

      const response = await request(app)
        .put(`/api/rsvps/${rsvpId}`)
        .set('Cookie', otherUserCookie)
        .send(updates)
        .expect(200);

      expect(response.body.status).toBe('attending');
    });

    it('should allow event creator to update RSVP', async () => {
      const updates = { status: 'approved' };

      const response = await request(app)
        .put(`/api/rsvps/${rsvpId}`)
        .set('Cookie', sessionCookie)
        .send(updates)
        .expect(200);

      expect(response.body.status).toBe('approved');
    });

    it('should prevent unauthorized user from updating RSVP', async () => {
      // Register third user
      const thirdUserResponse = await request(app).post('/api/register').send({
        username: 'unauthorized',
        password: 'Unauth123',
        email: 'unauth@test.com',
        name: 'Unauthorized User',
      });

      const thirdUserCookie = thirdUserResponse.headers['set-cookie'];
      const updates = { status: 'declined' };

      const response = await request(app)
        .put(`/api/rsvps/${rsvpId}`)
        .set('Cookie', thirdUserCookie)
        .send(updates)
        .expect(403);

      expect(response.body.message).toContain('Not authorized');
    });

    it('should require authentication to update RSVP', async () => {
      const updates = { status: 'attending' };

      const response = await request(app).put(`/api/rsvps/${rsvpId}`).send(updates).expect(401);

      expect(response.body.message).toContain('Unauthorized');
    });

    it('should return 404 for non-existent RSVP', async () => {
      const updates = { status: 'attending' };

      const response = await request(app)
        .put('/api/rsvps/99999')
        .set('Cookie', otherUserCookie)
        .send(updates)
        .expect(404);

      expect(response.body.message).toContain('RSVP not found');
    });
  });

  describe('DELETE /api/rsvps/:id', () => {
    let rsvpId: number;

    beforeEach(async () => {
      const rsvpResponse = await request(app)
        .post('/api/rsvps')
        .set('Cookie', otherUserCookie)
        .send({ eventId, status: 'attending' });

      rsvpId = rsvpResponse.body.id;
    });

    it('should allow RSVP owner to delete their RSVP', async () => {
      const response = await request(app)
        .delete(`/api/rsvps/${rsvpId}`)
        .set('Cookie', otherUserCookie)
        .expect(200);

      expect(response.body.message).toContain('RSVP deleted successfully');

      // Verify RSVP is deleted
      const rsvps = await request(app).get(`/api/rsvps/event/${eventId}`);
      expect(rsvps.body).toHaveLength(0);
    });

    it('should prevent non-owner from deleting RSVP', async () => {
      const response = await request(app)
        .delete(`/api/rsvps/${rsvpId}`)
        .set('Cookie', sessionCookie)
        .expect(403);

      expect(response.body.message).toContain('Not authorized');
    });

    it('should require authentication to delete RSVP', async () => {
      const response = await request(app).delete(`/api/rsvps/${rsvpId}`).expect(401);

      expect(response.body.message).toContain('Unauthorized');
    });

    it('should return 404 for non-existent RSVP', async () => {
      const response = await request(app)
        .delete('/api/rsvps/99999')
        .set('Cookie', otherUserCookie)
        .expect(404);

      expect(response.body.message).toContain('RSVP not found');
    });
  });
});
