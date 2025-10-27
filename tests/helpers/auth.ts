import { vi } from 'vitest';
import { TEST_USERS, TEST_CREDENTIALS } from './testConstants';

// Mock password hashing for tests
export const mockHashPassword = vi.fn(async (password: string) => {
  return `hashed-${password}`;
});

export const mockComparePassword = vi.fn(async (password: string, hash: string) => {
  return hash === `hashed-${password}`;
});

// Re-export test fixtures from constants
export const testUsers = TEST_USERS;
export const testCredentials = TEST_CREDENTIALS;
