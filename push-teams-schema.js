// Import required libraries
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';

dotenv.config();

// Setup the client
const connectionString = process.env.DATABASE_URL;
console.log('Connecting to database...');

const sql = postgres(connectionString, { max: 1 });
const db = drizzle(sql);

// Custom function to apply team schema changes
async function pushTeamsSchema() {
  try {
    console.log("Creating teams tables if they don't exist...");

    // Create teams table
    await sql`
      CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        sport_type TEXT NOT NULL,
        creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        logo TEXT,
        is_public BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Create team_members table
    await sql`
      CREATE TABLE IF NOT EXISTS team_members (
        id SERIAL PRIMARY KEY,
        team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        position TEXT,
        stats JSONB,
        joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(team_id, user_id)
      );
    `;

    // Create team_posts table
    await sql`
      CREATE TABLE IF NOT EXISTS team_posts (
        id SERIAL PRIMARY KEY,
        team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        image TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Create team_post_comments table
    await sql`
      CREATE TABLE IF NOT EXISTS team_post_comments (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES team_posts(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Create team_schedules table
    await sql`
      CREATE TABLE IF NOT EXISTS team_schedules (
        id SERIAL PRIMARY KEY,
        team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT,
        start_time TIMESTAMP WITH TIME ZONE NOT NULL,
        end_time TIMESTAMP WITH TIME ZONE NOT NULL,
        location TEXT,
        is_required BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // Create team_schedule_responses table
    await sql`
      CREATE TABLE IF NOT EXISTS team_schedule_responses (
        id SERIAL PRIMARY KEY,
        schedule_id INTEGER NOT NULL REFERENCES team_schedules(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        response TEXT NOT NULL,
        notes TEXT,
        maybe_deadline TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(schedule_id, user_id)
      );
    `;

    // Create team_join_requests table
    await sql`
      CREATE TABLE IF NOT EXISTS team_join_requests (
        id SERIAL PRIMARY KEY,
        team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(team_id, user_id)
      );
    `;

    // Add sample team data
    console.log('Adding sample team data...');

    // Check if we already have teams
    const teamCount = await sql`SELECT COUNT(*) FROM teams`;
    if (parseInt(teamCount[0].count) === 0) {
      // First create some teams
      const [basketballTeam] = await sql`
        INSERT INTO teams (name, description, sport_type, creator_id, is_public) 
        VALUES ('Neighborhood Ballers', 'A casual basketball team for weekend games', 'basketball', 1, true)
        RETURNING id
      `;

      const [soccerTeam] = await sql`
        INSERT INTO teams (name, description, sport_type, creator_id, is_public) 
        VALUES ('City Football Club', 'Competitive soccer team looking for matches', 'soccer', 2, true)
        RETURNING id
      `;

      const [tennisTeam] = await sql`
        INSERT INTO teams (name, description, sport_type, creator_id, is_public) 
        VALUES ('Tennis Aces', 'Tennis team for all skill levels', 'tennis', 1, true)
        RETURNING id
      `;

      // Now add team members
      await sql`
        INSERT INTO team_members (team_id, user_id, role, position) 
        VALUES 
          (${basketballTeam.id}, 1, 'admin', 'Point Guard'),
          (${basketballTeam.id}, 2, 'member', 'Shooting Guard'),
          (${basketballTeam.id}, 3, 'captain', 'Center'),
          (${soccerTeam.id}, 2, 'admin', 'Midfielder'),
          (${soccerTeam.id}, 1, 'member', 'Forward'),
          (${soccerTeam.id}, 4, 'captain', 'Goalkeeper'),
          (${tennisTeam.id}, 1, 'admin', 'Singles'),
          (${tennisTeam.id}, 3, 'member', 'Doubles'),
          (${tennisTeam.id}, 4, 'member', 'Singles/Doubles')
      `;

      // Add team posts
      const [basketballPost] = await sql`
        INSERT INTO team_posts (team_id, user_id, content) 
        VALUES (${basketballTeam.id}, 1, 'Welcome to the Neighborhood Ballers team! Looking forward to our first practice this weekend.')
        RETURNING id
      `;

      const [soccerPost] = await sql`
        INSERT INTO team_posts (team_id, user_id, content) 
        VALUES (${soccerTeam.id}, 2, 'City Football Club is looking for a match this Saturday. Any teams interested?')
        RETURNING id
      `;

      // Add post comments
      await sql`
        INSERT INTO team_post_comments (post_id, user_id, content) 
        VALUES 
          (${basketballPost.id}, 2, 'Excited to join the team!'),
          (${basketballPost.id}, 3, 'What time is practice?'),
          (${soccerPost.id}, 4, 'Our team might be available, I\'ll check with the captain.')
      `;

      // Add team schedules
      const [basketballSchedule] = await sql`
        INSERT INTO team_schedules (team_id, creator_id, title, description, start_time, end_time, location) 
        VALUES (${basketballTeam.id}, 1, 'Weekly Practice', 'Regular practice session', NOW() + INTERVAL '3 days', NOW() + INTERVAL '3 days 2 hours', 'City Park Courts')
        RETURNING id
      `;

      const [soccerSchedule] = await sql`
        INSERT INTO team_schedules (team_id, creator_id, title, description, start_time, end_time, location, is_required) 
        VALUES (${soccerTeam.id}, 2, 'Championship Game', 'Final match of the season', NOW() + INTERVAL '7 days', NOW() + INTERVAL '7 days 2 hours', 'City Stadium', true)
        RETURNING id
      `;

      // Add schedule responses
      await sql`
        INSERT INTO team_schedule_responses (schedule_id, user_id, response, notes) 
        VALUES 
          (${basketballSchedule.id}, 1, 'attending', 'I\'ll bring extra balls'),
          (${basketballSchedule.id}, 2, 'attending', NULL),
          (${basketballSchedule.id}, 3, 'maybe', 'Might be running late'),
          (${soccerSchedule.id}, 2, 'attending', 'I\'ll bring the team jerseys'),
          (${soccerSchedule.id}, 1, 'attending', NULL),
          (${soccerSchedule.id}, 4, 'not_attending', 'Family commitment')
      `;
    }

    console.log('Teams schema changes and sample data completed successfully');
  } catch (error) {
    console.error('Error applying teams schema changes:', error);
  } finally {
    await sql.end();
  }
}

// Run the function
pushTeamsSchema();
