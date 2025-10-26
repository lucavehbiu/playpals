import { describe, it, expect, beforeEach, beforeAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createTestApp, createMockStorage } from '../../tests/helpers/createTestApp';

describe('Events API', () => {
  let app: Express;
  let mockStorage: ReturnType<typeof createMockStorage>;
  let sessionCookie: string[];
  let userId: number;

  beforeAll(() => {
    mockStorage = createMockStorage();
    app = createTestApp(mockStorage);
  });

  beforeEach(async () => {
    mockStorage._reset();

    // Register and login a user for authenticated tests
    const registerResponse = await request(app)
      .post('/api/register')
      .send({
        username: 'eventcreator',
        password: 'EventTest123',
        email: 'event@test.com',
        name: 'Event Creator',
      });

    sessionCookie = registerResponse.headers['set-cookie'];
    userId = registerResponse.body.id;
  });

  describe('POST /api/events', () => {
    it('should create an event with valid data', async () => {
      const eventData = {
        title: 'Test Basketball Game',
        description: 'Friendly pickup game',
        sportType: 'basketball',
        location: '123 Main St, City, Country',
        locationLatitude: 40.7128,
        locationLongitude: -74.0060,
        locationPlaceId: 'ChIJOwg_06VPwokRYv534QaPC8g',
        date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        maxParticipants: 10,
        isPublic: true,
        isFree: true,
        cost: 0,
      };

      const response = await request(app)
        .post('/api/events')
        .set('Cookie', sessionCookie)
        .send(eventData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(eventData.title);
      expect(response.body.description).toBe(eventData.description);
      expect(response.body.sportType).toBe(eventData.sportType);
      expect(response.body.creatorId).toBe(userId);
      expect(response.body.currentParticipants).toBe(1);
    });

    it('should reject event creation without authentication', async () => {
      const eventData = {
        title: 'Test Event',
        sportType: 'basketball',
        location: 'Test Location',
        date: new Date().toISOString(),
        maxParticipants: 10,
      };

      const response = await request(app)
        .post('/api/events')
        .send(eventData)
        .expect(401);

      expect(response.body.message).toContain('Unauthorized');
    });

    it('should create event with null eventImage by default', async () => {
      const eventData = {
        title: 'No Image Event',
        sportType: 'soccer',
        location: 'Test Location',
        date: new Date().toISOString(),
        maxParticipants: 8,
      };

      const response = await request(app)
        .post('/api/events')
        .set('Cookie', sessionCookie)
        .send(eventData)
        .expect(201);

      expect(response.body.eventImage).toBeNull();
    });
  });

  describe('GET /api/events/:id', () => {
    it('should return event details with creator info', async () => {
      // Create an event first
      const createResponse = await request(app)
        .post('/api/events')
        .set('Cookie', sessionCookie)
        .send({
          title: 'Test Event',
          sportType: 'basketball',
          location: 'Test Location',
          date: new Date().toISOString(),
          maxParticipants: 10,
        });

      const eventId = createResponse.body.id;

      // Get the event
      const response = await request(app)
        .get(`/api/events/${eventId}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', eventId);
      expect(response.body).toHaveProperty('title', 'Test Event');
      expect(response.body).toHaveProperty('creator');
      expect(response.body.creator).toHaveProperty('id', userId);
      expect(response.body.creator).toHaveProperty('username', 'eventcreator');
      expect(response.body.creator).not.toHaveProperty('password');
    });

    it('should return 404 for non-existent event', async () => {
      const response = await request(app)
        .get('/api/events/99999')
        .expect(404);

      expect(response.body.message).toContain('Event not found');
    });
  });

  describe('POST /api/events/:id/image', () => {
    let eventId: number;

    beforeEach(async () => {
      // Create a test event for image upload
      const createResponse = await request(app)
        .post('/api/events')
        .set('Cookie', sessionCookie)
        .send({
          title: 'Image Upload Event',
          sportType: 'basketball',
          location: 'Test Location',
          date: new Date().toISOString(),
          maxParticipants: 10,
        });

      eventId = createResponse.body.id;
    });

    it('should upload image successfully (mocked GCS)', async () => {
      const response = await request(app)
        .post(`/api/events/${eventId}/image`)
        .set('Cookie', sessionCookie)
        .send({ image: 'fake-image-data' })
        .expect(200);

      expect(response.body.imageUrl).toContain('storage.googleapis.com');
      expect(response.body.imageUrl).toContain('playpals/events/');
      expect(response.body.imageUrl).toContain(`event-${eventId}`);
    });

    it('should reject upload without authentication', async () => {
      const response = await request(app)
        .post(`/api/events/${eventId}/image`)
        .send({ image: 'fake-image-data' })
        .expect(401);

      expect(response.body.message).toContain('Unauthorized');
    });

    it('should return 404 for non-existent event', async () => {
      const response = await request(app)
        .post('/api/events/99999/image')
        .set('Cookie', sessionCookie)
        .send({ image: 'fake-image-data' })
        .expect(404);

      expect(response.body.message).toContain('Event not found');
    });

    it('should update event with image URL after upload', async () => {
      // Upload image
      const uploadResponse = await request(app)
        .post(`/api/events/${eventId}/image`)
        .set('Cookie', sessionCookie)
        .send({ image: 'fake-image-data' })
        .expect(200);

      const imageUrl = uploadResponse.body.imageUrl;

      // Verify event was updated
      const eventResponse = await request(app)
        .get(`/api/events/${eventId}`)
        .expect(200);

      expect(eventResponse.body.eventImage).toBe(imageUrl);
    });
  });

  describe('DELETE /api/events/:id', () => {
    let eventId: number;

    beforeEach(async () => {
      // Create a test event for deletion
      const createResponse = await request(app)
        .post('/api/events')
        .set('Cookie', sessionCookie)
        .send({
          title: 'Delete Test Event',
          sportType: 'basketball',
          location: 'Test Location',
          date: new Date().toISOString(),
          maxParticipants: 10,
        });

      eventId = createResponse.body.id;
    });

    it('should allow creator to delete event', async () => {
      const response = await request(app)
        .delete(`/api/events/${eventId}`)
        .set('Cookie', sessionCookie)
        .expect(200);

      expect(response.body.message).toContain('Event deleted successfully');

      // Verify event is deleted
      await request(app)
        .get(`/api/events/${eventId}`)
        .expect(404);
    });

    it('should prevent non-creator from deleting event', async () => {
      // Register a different user
      const otherUserResponse = await request(app)
        .post('/api/register')
        .send({
          username: 'otheruser',
          password: 'OtherTest123',
          email: 'other@test.com',
          name: 'Other User',
        });

      const otherUserCookie = otherUserResponse.headers['set-cookie'];

      // Try to delete with different user
      const response = await request(app)
        .delete(`/api/events/${eventId}`)
        .set('Cookie', otherUserCookie)
        .expect(403);

      expect(response.body.message).toContain('Not authorized');
    });

    it('should require authentication to delete event', async () => {
      const response = await request(app)
        .delete(`/api/events/${eventId}`)
        .expect(401);

      expect(response.body.message).toContain('Unauthorized');
    });

    it('should return 404 when deleting non-existent event', async () => {
      const response = await request(app)
        .delete('/api/events/99999')
        .set('Cookie', sessionCookie)
        .expect(404);

      expect(response.body.message).toContain('Event not found');
    });
  });
});
