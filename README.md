# PlayPals

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

## License

This project is licensed under the MIT License - see the LICENSE file for details.