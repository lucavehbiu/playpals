# Testing Guide for PlayPals

## Overview

This project uses **Vitest** as the test runner, with React Testing Library for component tests and Supertest for API testing.

## Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode (reruns on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with interactive UI
npm run test:ui
```

## Testing Standards

### IMPORTANT: Test-First Development

**Every feature or change MUST follow this process:**

1. ✅ **Write tests FIRST** - Before implementing the feature
2. ✅ **Run tests** - They should fail (red)
3. ✅ **Implement feature** - Write the minimum code to pass tests
4. ✅ **Run tests again** - They should pass (green)
5. ✅ **Refactor** - Improve code while keeping tests green

### Test Coverage Requirements

- **New features**: Minimum 80% coverage
- **Bug fixes**: Add regression test that reproduces the bug
- **API endpoints**: Test happy path + error cases
- **Components**: Test user interactions + edge cases

### Test File Organization

```
playpals/
├── server/
│   └── __tests__/
│       ├── auth.test.ts       # Authentication tests
│       ├── events.test.ts     # Event API tests
│       ├── teams.test.ts      # Team API tests
│       └── gcs.test.ts        # GCS upload tests
├── client/src/
│   └── __tests__/
│       ├── components/
│       │   ├── CreateEventModal.test.tsx
│       │   └── EventCard.test.tsx
│       └── pages/
│           └── CreateEvent.test.tsx
└── tests/
    ├── setup.ts               # Global test setup
    ├── integration/           # End-to-end integration tests
    └── fixtures/              # Test data and mocks
```

## Writing Tests

### Backend API Tests Example

```typescript
import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';

describe('POST /api/events', () => {
  it('should create an event with valid data', async () => {
    const response = await request(app)
      .post('/api/events')
      .set('Cookie', authToken)
      .send({
        title: 'Test Event',
        sportType: 'basketball',
        // ... other fields
      })
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.title).toBe('Test Event');
  });

  it('should reject unauthenticated requests', async () => {
    await request(app)
      .post('/api/events')
      .send({ title: 'Test' })
      .expect(401);
  });
});
```

### Frontend Component Tests Example

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import CreateEventModal from '@/components/event/CreateEventModal';

describe('CreateEventModal', () => {
  it('should render form fields', () => {
    render(<CreateEventModal isOpen={true} onClose={() => {}} />);

    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sport type/i)).toBeInTheDocument();
  });

  it('should submit form with valid data', async () => {
    const onClose = vi.fn();
    render(<CreateEventModal isOpen={true} onClose={onClose} />);

    fireEvent.change(screen.getByLabelText(/title/i), {
      target: { value: 'Test Event' },
    });

    fireEvent.click(screen.getByRole('button', { name: /create/i }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });
});
```

## Test Data & Mocks

### GCS Mock

Google Cloud Storage is automatically mocked in `tests/setup.ts`. Image uploads return mock URLs:

```typescript
// Mocked GCS upload returns:
// https://storage.googleapis.com/playpals/events/event-123-timestamp
```

### Database Mocks

For unit tests, mock the storage layer:

```typescript
vi.mock('@/server/storage', () => ({
  storage: {
    createEvent: vi.fn().mockResolvedValue({ id: 1, title: 'Test' }),
    getEvent: vi.fn().mockResolvedValue({ id: 1, title: 'Test' }),
  },
}));
```

## CI/CD Integration

Tests run automatically:
- ✅ Before every commit (via pre-commit hook - TODO)
- ✅ On every pull request (via GitHub Actions - TODO)
- ✅ Before deployment to production

## Debugging Tests

### Run specific test file
```bash
npm test -- auth.test.ts
```

### Run tests matching pattern
```bash
npm test -- -t "should create an event"
```

### Debug in VS Code
Add breakpoint and run "JavaScript Debug Terminal"

## Common Testing Patterns

### Testing Authenticated Endpoints

```typescript
let authCookie: string;

beforeAll(async () => {
  // Login and get session cookie
  const response = await request(app)
    .post('/api/login')
    .send({ username: 'test', password: 'password' });

  authCookie = response.headers['set-cookie'][0];
});

it('should access protected route', async () => {
  await request(app)
    .get('/api/user')
    .set('Cookie', authCookie)
    .expect(200);
});
```

### Testing File Uploads

```typescript
it('should upload image to GCS', async () => {
  const mockImage = Buffer.from('fake-image-data');

  const response = await request(app)
    .post('/api/events/1/image')
    .set('Cookie', authCookie)
    .attach('image', mockImage, 'test.jpg')
    .expect(200);

  expect(response.body.imageUrl).toContain('storage.googleapis.com');
});
```

### Testing WebSocket Events

```typescript
it('should broadcast event creation', (done) => {
  const ws = new WebSocket('ws://localhost:5000');

  ws.on('message', (data) => {
    const message = JSON.parse(data.toString());
    expect(message.type).toBe('EVENT_CREATED');
    done();
  });

  // Trigger event creation
  request(app).post('/api/events').send(eventData);
});
```

## Troubleshooting

### Tests fail with "Cannot find module"
- Check path aliases in `vitest.config.ts`
- Ensure `tsconfig.json` paths match

### Database connection errors
- Tests should use mock database or test database
- Never run tests against production database
- Use `beforeEach` to reset test data

### Timeout errors
- Increase timeout: `it('test', { timeout: 10000 }, async () => {})`
- Check for unresolved promises
- Ensure async operations complete

## Next Steps

1. Implement full test coverage for authentication
2. Add integration tests for critical user flows
3. Set up GitHub Actions for CI/CD
4. Add pre-commit hooks with Husky
5. Achieve 80%+ test coverage

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Supertest](https://github.com/visionmedia/supertest)
