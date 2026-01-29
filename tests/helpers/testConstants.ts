/**
 * Test constants and fixtures
 * These are NOT real credentials - they are mock data for testing purposes only
 */

// Mock test credentials - NOT REAL PASSWORDS
export const TEST_PASSWORD = 'MockTestPassword123!';
export const TEST_USERNAME = 'test-user-mock';
export const TEST_EMAIL = 'test-mock@example.com';

// Test user fixtures
export const TEST_USERS = {
  valid: {
    username: 'testuser-fixture',
    password: TEST_PASSWORD,
    email: 'fixture-test@example.com',
    name: 'Test User Fixture',
  },
  duplicate: {
    username: 'existing-fixture',
    password: TEST_PASSWORD,
    email: 'existing-fixture@example.com',
    name: 'Existing User Fixture',
  },
  invalid: {
    username: 'a', // Too short
    password: '123', // Weak password
    email: 'invalid-email',
    name: '',
  },
} as const;

// Test credentials fixtures
export const TEST_CREDENTIALS = {
  correct: {
    username: 'testuser-fixture',
    password: TEST_PASSWORD,
  },
  wrongPassword: {
    username: 'testuser-fixture',
    password: 'WrongMockPassword123!',
  },
  nonExistent: {
    username: 'nonexistent-fixture',
    password: TEST_PASSWORD,
  },
} as const;
