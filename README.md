# PlayPals

[![CI/CD Pipeline](https://github.com/yourusername/playpals/actions/workflows/ci.yml/badge.svg)](https://github.com/yourusername/playpals/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/yourusername/playpals/branch/main/graph/badge.svg)](https://codecov.io/gh/yourusername/playpals)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

PlayPals is a dynamic sports and activity social platform that empowers users to create, discover, and engage with local events through intuitive social connectivity and interactive features.

## Features

- **Event Creation & Management**: Easily create, join, and manage sports events
- **Social Network Functionality**: Connect with other users, follow friends, and view their activities
- **Team Management**: Create teams with admin/member roles and team-specific feeds
- **Advanced Filtering**: Find events by location, date, and sport type
- **Comprehensive Search**: Search for events, teams, and users across the platform
- **User Profiles**: View user profiles with sports preferences and performance ratings

## Tech Stack

- **Frontend**: React.js with TypeScript and Tailwind CSS
- **Backend**: Express.js with Node.js
- **Database**: PostgreSQL
- **Authentication**: Passport.js
- **UI Components**: Shadcn UI library
- **State Management**: TanStack Query

## Screenshots

![PlayPals Application](https://example.com/playpals-screenshot.png)

## Getting Started

### Prerequisites

- Node.js v18+
- PostgreSQL database

### Installation

1. Clone the repository

   ```bash
   git clone https://github.com/yourusername/playpals.git
   cd playpals
   ```

2. Install dependencies

   ```bash
   npm install
   ```

3. Set up environment variables
   Create a `.env` file in the root directory with the following variables:

   ```
   DATABASE_URL=postgresql://username:password@localhost:5432/playpals
   SESSION_SECRET=your_session_secret
   ```

4. Initialize the database

   ```bash
   npm run db:push
   npm run schema:push
   ```

5. Start the development server
   ```bash
   npm run dev
   ```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors automatically
- `npm run format` - Format code with Prettier
- `npm run check` - TypeScript type checking
- `npm run build` - Build for production

### Testing

This project has comprehensive test coverage with **97 tests** covering:

- Backend API endpoints (authentication, events, teams, RSVPs)
- Frontend components (EventCard, etc.)
- Integration tests

Run tests with:

```bash
npm test
```

### Code Quality

- **Pre-commit hooks**: Automatically runs linting and formatting before each commit
- **CI/CD**: GitHub Actions runs tests, linting, and type checking on every PR
- **Test coverage**: Minimum 80% coverage required for new features

## License

This project is licensed under the MIT License - see the LICENSE file for details.
