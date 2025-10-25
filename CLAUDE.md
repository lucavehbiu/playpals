# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PlayPals is a dynamic sports and activity social platform built with React, Express, and PostgreSQL. Users can create/join sports events, form teams, manage tournaments, connect with friends, and engage in social features like activity feeds, polls, and skill matching.

## Tech Stack

- **Frontend**: React 18 with TypeScript, Wouter (routing), Tailwind CSS, shadcn/ui components
- **Backend**: Express.js with TypeScript (ESM modules)
- **Database**: PostgreSQL via Drizzle ORM with Neon serverless support
- **Authentication**: Passport.js (Local, Google OAuth, Apple OAuth)
- **Real-time**: WebSocket (ws library) for notifications and live updates
- **State Management**: TanStack Query (React Query) for server state
- **Build Tools**: Vite (frontend), esbuild (backend bundling)

## Development Commands

### Essential Commands

```bash
# Install dependencies
npm install

# Start development server (runs both frontend and backend)
npm run dev

# Type check TypeScript
npm run check

# Build for production (builds both frontend and backend)
npm run build

# Start production server
npm run start

# Push database schema changes
npm run db:push
```

### Environment Setup

Copy `.env.example` to `.env` and configure:
- `DATABASE_URL`: PostgreSQL connection string
- `AUTH_SECRET`: Session secret for authentication
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: Google OAuth credentials
- `APPLE_CLIENT_ID`, `APPLE_CLIENT_SECRET`: Apple OAuth credentials
- `OPENAI_API_KEY`: OpenAI API key for AI features
- `PORT`: Server port (defaults to 5000, Heroku assigns dynamically)
- `NODE_ENV`: Set to "production" for Heroku deployment

## Architecture

### Project Structure

```
playpals/
├── client/               # Frontend React application
│   └── src/
│       ├── components/   # React components organized by feature
│       │   ├── event/    # Event-related components
│       │   ├── groups/   # Sports group components
│       │   ├── layout/   # Header, MobileNav, etc.
│       │   ├── maps/     # Google Maps integration
│       │   ├── profile/  # User profile components
│       │   ├── rating/   # Player rating system
│       │   ├── tournament/ # Tournament management
│       │   └── ui/       # shadcn/ui component library
│       ├── hooks/        # Custom React hooks
│       ├── lib/          # Utility functions and types
│       └── pages/        # Top-level page components
├── server/               # Backend Express application
│   ├── index.ts          # Express server entry point
│   ├── routes.ts         # API route definitions and WebSocket setup
│   ├── auth.ts           # Passport authentication strategies
│   ├── db.ts             # Drizzle database connection
│   ├── storage.ts        # Data access layer with typed queries
│   └── vite.ts           # Vite integration for dev/prod
└── shared/               # Shared code between frontend and backend
    └── schema.ts         # Drizzle schema definitions and Zod validators
```

### Data Layer

The application uses a centralized storage layer (`server/storage.ts`) that provides a clean interface for database operations:

- All database queries go through the `storage` object
- Drizzle ORM handles SQL generation with full TypeScript support
- Schema is defined in `shared/schema.ts` with Drizzle and Zod validation
- Session storage uses PostgreSQL (connect-pg-simple) in production, memory store in dev

### Key Database Tables

Core entities defined in `shared/schema.ts`:
- `users`: User accounts with profile data, privacy settings, and OAuth info
- `events`: Sports events with location (Google Maps integration), participants, visibility
- `teams`: User-created teams with admin/member roles
- `sportsGroups`: Community groups for sports with feeds, polls, events
- `tournaments`: Tournament management with participants, matches, standings
- `friendships`: User relationships (pending/accepted)
- `rsvps`: Event participation status
- `playerRatings`: Peer rating system for skill assessment
- `skillMatches`: AI-powered skill matching system
- `matchResults`: Game score tracking and statistics

### Authentication Flow

1. Passport.js handles authentication with multiple strategies (Local, Google, Apple)
2. Sessions stored in PostgreSQL using `connect-pg-simple`
3. `authenticateUser` middleware protects API routes in `server/routes.ts`
4. Frontend uses `ProtectedRoute` component to guard pages requiring auth
5. Note: There's a temporary auth bypass in development for certain routes (see `server/routes.ts:70-100`)

### Frontend Routing

- Uses Wouter for lightweight client-side routing
- All routes defined in `client/src/App.tsx`
- Routes wrapped in `ProtectedRoute` require authentication
- Main routes: `/` (Feed), `/discover`, `/events`, `/teams`, `/tournaments`, `/groups`, `/friends`, `/profile`

### Real-time Features

WebSocket server runs alongside Express (see `server/routes.ts`):
- Broadcasts event updates, join requests, notifications
- Client hook: `use-websocket.tsx` for subscribing to updates
- WebSocketProvider wraps the app to maintain connection state

### Path Aliases

Configured in `vite.config.ts` and `tsconfig.json`:
- `@/`: maps to `client/src/`
- `@shared/`: maps to `shared/`
- `@assets/`: maps to `attached_assets/`

## Common Development Patterns

### Adding a New Database Table

1. Define table schema in `shared/schema.ts` with Drizzle ORM
2. Add Zod insert schema using `createInsertSchema()`
3. Export TypeScript types (e.g., `type User = typeof users.$inferSelect`)
4. Add CRUD methods to `IStorage` interface in `server/storage.ts`
5. Implement methods in the storage class
6. Run `npm run db:push` to sync schema to database

### Creating API Endpoints

1. Add route handler in `server/routes.ts` inside `registerRoutes` function
2. Use `authenticateUser` middleware for protected routes
3. Access database via `storage` object methods
4. Return JSON responses with appropriate status codes
5. Frontend queries via TanStack Query hooks (see `client/src/hooks/`)

### Building UI Components

1. Use shadcn/ui components from `client/src/components/ui/`
2. Follow the existing component organization by feature
3. Utilize Tailwind CSS for styling
4. Use React Hook Form for complex forms with Zod validation
5. Integrate with TanStack Query for data fetching and mutations

### Working with Google Maps

- Google Maps integration in `client/src/components/maps/`
- Uses `@googlemaps/react-wrapper` and `@googlemaps/js-api-loader`
- Store coordinates in `locationLatitude`, `locationLongitude`, and `locationPlaceId` fields
- `LocationSearch` component provides autocomplete for location selection

## Deployment

### Heroku Deployment

The project is configured for Heroku deployment:
- `Procfile` defines the web process: `web: npm run start`
- `heroku-postbuild` script in package.json runs the build
- Production server serves static files from `dist/public/`
- Uses Heroku's `PORT` environment variable
- Database: Compatible with Heroku Postgres or Neon

### Build Process

1. Frontend: Vite builds React app to `dist/public/`
2. Backend: esbuild bundles `server/index.ts` to `dist/index.js`
3. Both run via `npm run build`
4. Production mode serves static files via Express (see `server/vite.ts`)

## Important Notes

- The project uses ESM modules (`"type": "module"` in package.json)
- All TypeScript files should use `.ts` or `.tsx` extensions
- Import paths should use `.js` extensions for ESM compatibility when needed
- The app serves on a single port (5000 default) for both API and frontend
- Database migrations are handled via `drizzle-kit push` (not formal migration files)
- There are several `.bak` and `.new` backup files in the codebase from development iterations
- Authentication currently has development fallbacks - review before production deployment
