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

// Custom function to update schema
async function updateSchema() {
  try {
    console.log('Checking for cover_image column...');
    
    // Check if column exists
    const columnCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'cover_image'
    `;
    
    if (columnCheck.length === 0) {
      console.log('Adding cover_image column to users table...');
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS cover_image TEXT`;
      console.log('cover_image column added successfully');
    } else {
      console.log('cover_image column already exists');
    }
    
    // Check for other columns that might be missing
    const headlineCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'headline'
    `;
    
    if (headlineCheck.length === 0) {
      console.log('Adding headline column to users table...');
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS headline TEXT`;
      console.log('headline column added successfully');
    }
    
    const locationCheck = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'location'
    `;
    
    if (locationCheck.length === 0) {
      console.log('Adding location column to users table...');
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS location TEXT`;
      console.log('location column added successfully');
    }
    
    console.log('Schema update completed successfully');
  } catch (error) {
    console.error('Error updating schema:', error);
  } finally {
    await sql.end();
  }
}

// Run the function
updateSchema();