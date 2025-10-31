import { defineConfig } from 'drizzle-kit';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL, ensure the database is provisioned');
}

// Check if this is a Heroku Postgres database or production environment
const isHerokuOrProduction =
  process.env.DATABASE_URL?.includes('.amazonaws.com') ||
  process.env.DATABASE_URL?.includes('neon.tech') ||
  process.env.NODE_ENV === 'production';

export default defineConfig({
  out: './migrations',
  schema: './shared/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
    ssl: isHerokuOrProduction ? { rejectUnauthorized: false } : false,
  },
});
