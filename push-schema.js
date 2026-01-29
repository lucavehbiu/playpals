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

// Custom function to apply schema changes
async function pushSchema() {
  try {
    console.log("Creating tables if they don't exist...");

    // Create users_sport_preferences table
    await sql`
      CREATE TABLE IF NOT EXISTS user_sport_preferences (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        sport_type TEXT NOT NULL,
        skill_level TEXT NOT NULL,
        years_experience INTEGER,
        is_visible BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, sport_type)
      );
    `;

    // Create player_ratings table
    await sql`
      CREATE TABLE IF NOT EXISTS player_ratings (
        id SERIAL PRIMARY KEY,
        rated_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        rater_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        event_id INTEGER REFERENCES events(id) ON DELETE SET NULL,
        sport_type TEXT NOT NULL,
        rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
        comment TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(rated_user_id, rater_user_id, sport_type, event_id)
      );
    `;

    // Create user_onboarding_preferences table
    await sql`
      CREATE TABLE IF NOT EXISTS user_onboarding_preferences (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        preferred_sports TEXT[] NOT NULL,
        play_frequency TEXT NOT NULL,
        team_size_preference TEXT NOT NULL,
        team_status TEXT NOT NULL,
        additional_info TEXT,
        onboarding_completed BOOLEAN DEFAULT FALSE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id)
      );
    `;

    // Add sample sport preferences
    console.log('Adding sample sport preferences...');
    // Check if we already have preferences
    const prefCount = await sql`SELECT COUNT(*) FROM user_sport_preferences`;
    if (parseInt(prefCount[0].count) === 0) {
      await sql`
        INSERT INTO user_sport_preferences (user_id, sport_type, skill_level, years_experience, is_visible) 
        VALUES 
          (1, 'basketball', 'advanced', 8, true),
          (1, 'soccer', 'intermediate', 4, true),
          (1, 'tennis', 'advanced', 6, true),
          (2, 'volleyball', 'expert', 10, true),
          (2, 'swimming', 'intermediate', 3, true),
          (3, 'cycling', 'expert', 12, true),
          (3, 'running', 'advanced', 8, true),
          (4, 'yoga', 'expert', 7, true),
          (4, 'swimming', 'advanced', 5, true)
      `;
    }

    // Add sample player ratings
    console.log('Adding sample player ratings...');
    const ratingCount = await sql`SELECT COUNT(*) FROM player_ratings`;
    if (parseInt(ratingCount[0].count) === 0) {
      await sql`
        INSERT INTO player_ratings (rated_user_id, rater_user_id, event_id, sport_type, rating, comment)
        VALUES
          (1, 2, 1, 'basketball', 5, 'Excellent player, great teamwork!'),
          (1, 3, 1, 'basketball', 4, 'Very skilled player'),
          (1, 4, 1, 'basketball', 5, 'Amazing skills and sportsmanship'),
          (2, 1, 4, 'volleyball', 5, 'Incredible volleyball skills'),
          (2, 3, 4, 'volleyball', 5, 'Professional level player'),
          (3, 1, 5, 'cycling', 4, 'Very strong cyclist'),
          (3, 4, 5, 'cycling', 5, 'Exceptional endurance'),
          (4, 1, 6, 'yoga', 5, 'Amazing instructor, very helpful'),
          (4, 2, 6, 'yoga', 5, 'Patient and knowledgeable')
      `;
    }

    console.log('Schema changes and sample data completed successfully');
  } catch (error) {
    console.error('Error applying schema changes:', error);
  } finally {
    await sql.end();
  }
}

// Run the function
pushSchema();
