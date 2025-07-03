# PlayPals - Sports & Activity Social Platform

## Overview

PlayPals is a comprehensive sports and activity social platform that enables users to create, discover, and participate in local sports events. The platform combines social networking features with event management, team coordination, and skill matching to create a vibrant community for sports enthusiasts.

## System Architecture

The application follows a full-stack TypeScript architecture with clear separation between client and server:

- **Frontend**: React.js with TypeScript, styled using Tailwind CSS and Shadcn UI components
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Authentication**: Passport.js with session-based authentication
- **State Management**: TanStack Query for server state management
- **Build System**: Vite for development and production builds

## Key Components

### Frontend Architecture
- **Component-based React structure** with reusable UI components from Shadcn
- **Hook-based state management** using custom hooks for authentication, notifications, and WebSocket connections
- **Responsive design** with mobile-first approach using Tailwind CSS
- **Route-based navigation** using Wouter for lightweight client-side routing
- **Form handling** with React Hook Form and Zod validation

### Backend Architecture
- **RESTful API** with Express.js providing endpoints for all major features
- **Type-safe database operations** using Drizzle ORM with PostgreSQL
- **Session-based authentication** with Passport.js and session store
- **WebSocket support** for real-time notifications and updates
- **File upload handling** for user profiles and event images

### Database Schema
The database includes comprehensive tables for:
- **User management**: users, user_sport_preferences, user_onboarding_preferences
- **Event system**: events, rsvps, player_ratings
- **Social features**: friendships, posts, likes, comments
- **Team management**: teams, team_members, team_posts, team_schedules
- **Group functionality**: sports_groups, sports_group_members, sports_group_messages
- **Advanced features**: skill_matcher_preferences, skill_matches, polls

### Authentication & Authorization
- **Passport.js integration** with local strategy for username/password authentication
- **Session management** with PostgreSQL session store for persistence
- **Protected routes** on both client and server side
- **User role management** for teams and groups (admin, member, captain roles)

## Data Flow

1. **User Authentication**: Users authenticate through Passport.js, creating persistent sessions
2. **Event Management**: Users create events that are stored in PostgreSQL and made available through REST APIs
3. **Real-time Updates**: WebSocket connections provide live notifications for invitations, join requests, and messages
4. **Social Interactions**: Friend connections, team memberships, and group participation create interconnected social graphs
5. **Search & Discovery**: Multi-type search functionality across users, events, and teams with filtering capabilities

## External Dependencies

### Core Dependencies
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/**: Comprehensive UI component primitives
- **drizzle-orm**: Type-safe database toolkit
- **passport**: Authentication middleware
- **express-session**: Session management
- **wouter**: Lightweight routing for React
- **tailwindcss**: Utility-first CSS framework

### Development Tools
- **typescript**: Type safety across the entire stack
- **vite**: Fast build tool and development server
- **esbuild**: Fast JavaScript bundler for production builds
- **tsx**: TypeScript execution for development

## Deployment Strategy

The application is configured for flexible deployment:

- **Development**: Uses Vite dev server with hot reload and TypeScript compilation
- **Production**: Builds client assets to `dist/public` and server to `dist/index.js`
- **Database**: PostgreSQL with connection pooling and migration support through Drizzle
- **Environment Configuration**: Uses environment variables for database connections and session secrets
- **Static Assets**: Supports asset hosting with configurable paths

The build process creates optimized bundles with automatic code splitting and modern JavaScript output for production deployment.

## Changelog
- June 30, 2025. Initial setup
- June 30, 2025. CRITICAL SECURITY FIX: Added membership verification to all group endpoints to prevent unauthorized access to private group content
- July 1, 2025. Completed comprehensive friends system with Accept/Decline buttons and clickable profile navigation
- July 1, 2025. Fixed notification history system to display complete activity with history=true parameter  
- July 1, 2025. BUGFIX: Fixed friend request decline error in notification bell - corrected status mismatch between frontend ("declined") and backend ("rejected")
- July 1, 2025. FEATURE: Fixed group event creation flow - group events no longer show friend invitation modal, automatically notify all group members
- July 1, 2025. BUGFIX: Fixed price field input issue in CreateEvent - users can now clear the "0" value completely
- July 1, 2025. BUGFIX: Fixed participant count calculation - now only counts approved RSVPs, pending invitations don't count as participants
- July 1, 2025. BUGFIX: Fixed price display formatting - converts cents to dollars properly (1000 cents = $10.00)
- July 1, 2025. BUGFIX: Fixed group activity indicators - event notifications now properly created and counted alongside message notifications
- July 3, 2025. CRITICAL SECURITY FIX: Fixed group notification system - users now only receive notifications for groups they are actually members of, preventing unauthorized access to private group information
- July 3, 2025. FEATURE: Added "Friends of Event Participants" visibility option to Make Public modal for group events - now supports 4 visibility levels: Keep Private, Public to All, Friends of Group Members, and Friends of Event Participants
- July 3, 2025. BUGFIX: Fixed Feed creator display issue - events now show proper creator names instead of "Unknown" by fixing getDiscoverableEvents column mapping and getUser calls
- July 3, 2025. BUGFIX: Fixed notification display for group invitations - now correctly shows "group invitations to [GroupName]" instead of misleading "messages"
- July 3, 2025. CRITICAL SECURITY FIX: Fixed group notification authorization system - users now only see notifications for groups they're members of OR legitimate pending invitations, preventing unauthorized access to private group notification data

## User Preferences

Preferred communication style: Simple, everyday language.