import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createTestApp, createMockStorage } from '../../tests/helpers/createTestApp';

describe('Authentication API', () => {
  let app: Express;
  let mockStorage: ReturnType<typeof createMockStorage>;

  beforeAll(() => {
    mockStorage = createMockStorage();
    app = createTestApp(mockStorage);
  });

  beforeEach(() => {
    mockStorage._reset();
  });

  describe('POST /api/register', () => {
    it('should register a new user with valid data', async () => {
      const newUser = {
        username: 'testuser',
        password: 'Test123!@#',
        email: 'test@example.com',
        name: 'Test User',
      };

      const response = await request(app)
        .post('/api/register')
        .send(newUser)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.username).toBe(newUser.username);
      expect(response.body.email).toBe(newUser.email);
      expect(response.body.name).toBe(newUser.name);
      expect(response.body).not.toHaveProperty('password'); // Password should be excluded
    });

    it('should create session and log in user after registration', async () => {
      const newUser = {
        username: 'testuser2',
        password: 'Test123!@#',
        email: 'test2@example.com',
        name: 'Test User 2',
      };

      const registerResponse = await request(app)
        .post('/api/register')
        .send(newUser)
        .expect(201);

      // Extract session cookie
      const cookies = registerResponse.headers['set-cookie'];
      expect(cookies).toBeDefined();

      // Try to access protected route with session
      const userResponse = await request(app)
        .get('/api/user')
        .set('Cookie', cookies)
        .expect(200);

      expect(userResponse.body.username).toBe(newUser.username);
    });

    it('should reject registration with existing username', async () => {
      const user = {
        username: 'duplicate',
        password: 'Password123',
        email: 'first@example.com',
        name: 'First User',
      };

      // Register first user
      await request(app)
        .post('/api/register')
        .send(user)
        .expect(201);

      // Try to register with same username
      const duplicateUser = {
        username: 'duplicate',
        password: 'Different123',
        email: 'second@example.com',
        name: 'Second User',
      };

      const response = await request(app)
        .post('/api/register')
        .send(duplicateUser)
        .expect(400);

      expect(response.body.message).toContain('already exists');
    });
  });

  describe('POST /api/login', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      await request(app)
        .post('/api/register')
        .send({
          username: 'logintest',
          password: 'LoginTest123',
          email: 'login@test.com',
          name: 'Login Test',
        });

      // Reset mock to clear registration call
      mockStorage.getUserByUsername.mockClear();
    });

    it('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          username: 'logintest',
          password: 'LoginTest123',
        })
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body.username).toBe('logintest');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should create session after successful login', async () => {
      const loginResponse = await request(app)
        .post('/api/login')
        .send({
          username: 'logintest',
          password: 'LoginTest123',
        })
        .expect(200);

      const cookies = loginResponse.headers['set-cookie'];
      expect(cookies).toBeDefined();

      // Verify session works
      const userResponse = await request(app)
        .get('/api/user')
        .set('Cookie', cookies)
        .expect(200);

      expect(userResponse.body.username).toBe('logintest');
    });

    it('should reject login with incorrect password', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          username: 'logintest',
          password: 'WrongPassword123',
        })
        .expect(400);

      expect(response.body.message).toContain('Invalid');
    });

    it('should reject login with non-existent user', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          username: 'nonexistent',
          password: 'Password123',
        })
        .expect(400);

      expect(response.body.message).toContain('Invalid');
    });
  });

  describe('POST /api/logout', () => {
    let sessionCookie: string[];

    beforeEach(async () => {
      // Register and login a user
      const registerResponse = await request(app)
        .post('/api/register')
        .send({
          username: 'logouttest',
          password: 'LogoutTest123',
          email: 'logout@test.com',
          name: 'Logout Test',
        });

      sessionCookie = registerResponse.headers['set-cookie'];
    });

    it('should logout authenticated user', async () => {
      const response = await request(app)
        .post('/api/logout')
        .set('Cookie', sessionCookie)
        .expect(200);

      expect(response.body.message).toContain('Logged out');
    });

    it('should clear session after logout', async () => {
      await request(app)
        .post('/api/logout')
        .set('Cookie', sessionCookie)
        .expect(200);

      // Try to access protected route - should fail
      await request(app)
        .get('/api/user')
        .set('Cookie', sessionCookie)
        .expect(401);
    });
  });

  describe('GET /api/user', () => {
    it('should return user data when authenticated', async () => {
      const registerResponse = await request(app)
        .post('/api/register')
        .send({
          username: 'authtest',
          password: 'AuthTest123',
          email: 'auth@test.com',
          name: 'Auth Test',
        });

      const cookies = registerResponse.headers['set-cookie'];

      const response = await request(app)
        .get('/api/user')
        .set('Cookie', cookies)
        .expect(200);

      expect(response.body.username).toBe('authtest');
      expect(response.body.email).toBe('auth@test.com');
      expect(response.body).not.toHaveProperty('password');
    });

    it('should return 401 when not authenticated', async () => {
      const response = await request(app)
        .get('/api/user')
        .expect(401);

      expect(response.body.message).toContain('Not authenticated');
    });
  });
});
