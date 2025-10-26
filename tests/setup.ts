import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock environment variables for tests
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.AUTH_SECRET = 'test-secret-key-for-testing-only';
process.env.NODE_ENV = 'test';

// Mock Google Cloud Storage
vi.mock('@google-cloud/storage', () => {
  return {
    Storage: vi.fn(() => ({
      bucket: vi.fn(() => ({
        file: vi.fn(() => ({
          createWriteStream: vi.fn(() => ({
            on: vi.fn(),
            end: vi.fn(),
          })),
          makePublic: vi.fn(),
          delete: vi.fn(),
        })),
      })),
    })),
  };
});

// Mock fetch globally
global.fetch = vi.fn();

// Mock WebSocket
global.WebSocket = vi.fn() as any;
