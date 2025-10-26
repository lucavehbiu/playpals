import { vi } from 'vitest';

// Mock password hashing for tests
export const mockHashPassword = vi.fn(async (password: string) => {
  return `hashed-${password}`;
});

export const mockComparePassword = vi.fn(async (password: string, hash: string) => {
  return hash === `hashed-${password}`;
});

// Test user data
export const testUsers = {
  valid: {
    username: 'testuser',
    password: 'Test123!@#',
    email: 'test@example.com',
    name: 'Test User',
  },
  duplicate: {
    username: 'existinguser',
    password: 'Existing123!@#',
    email: 'existing@example.com',
    name: 'Existing User',
  },
  invalid: {
    username: 'a', // Too short
    password: '123', // Weak password
    email: 'invalid-email',
    name: '',
  },
};

// Test credentials
export const testCredentials = {
  correct: {
    username: 'testuser',
    password: 'Test123!@#',
  },
  wrongPassword: {
    username: 'testuser',
    password: 'WrongPassword123',
  },
  nonExistent: {
    username: 'nonexistent',
    password: 'Password123',
  },
};
