// @ts-nocheck
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { vi } from 'vitest';

// Create a custom render function that wraps components with providers
export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

// Mock router hook
export const mockUseLocation = vi.fn(() => '/');
export const mockUseRoute = vi.fn((path: string) => [path === '/', {}]);
export const mockUseNavigate = vi.fn();

// Mock authentication context
export const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@example.com',
  name: 'Test User',
};

export const createMockAuthContext = (isAuthenticated = true, user = mockUser) => ({
  user: isAuthenticated ? user : null,
  isAuthenticated,
  login: vi.fn(),
  logout: vi.fn(),
  register: vi.fn(),
});

// Mock fetch API
export const mockFetch = (responseData: any, status = 200) => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(responseData),
    } as Response)
  );
};

// Mock successful query responses
export const createMockQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
    },
  });
};

// Test data factories
export const createMockEvent = (overrides = {}) => ({
  id: 1,
  title: 'Test Basketball Game',
  description: 'A friendly pickup game',
  sportType: 'basketball',
  location: '123 Main St',
  locationLatitude: 40.7128,
  locationLongitude: -74.006,
  date: new Date().toISOString(),
  maxParticipants: 10,
  currentParticipants: 5,
  isPublic: true,
  isFree: true,
  cost: 0,
  creatorId: 1,
  creator: {
    id: 1,
    username: 'creator',
    name: 'Event Creator',
    profileImage: null,
  },
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const createMockTeam = (overrides = {}) => ({
  id: 1,
  name: 'Test Team',
  description: 'A competitive team',
  sportType: 'basketball',
  isPrivate: false,
  adminId: 1,
  memberCount: 5,
  admin: {
    id: 1,
    username: 'admin',
    name: 'Team Admin',
    profileImage: null,
  },
  createdAt: new Date().toISOString(),
  ...overrides,
});

export const createMockRSVP = (overrides = {}) => ({
  id: 1,
  eventId: 1,
  userId: 1,
  status: 'attending',
  createdAt: new Date().toISOString(),
  ...overrides,
});

// Re-export everything from testing library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
