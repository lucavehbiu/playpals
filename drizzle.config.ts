import { defineConfig } from 'drizzle-kit';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL, ensure the database is provisioned');
}

// Check if this is a Heroku Postgres database or production environment
const isHerokuOrProduction =
  process.env.DATABASE_URL?.includes('.amazonaws.com') ||
  process.env.DATABASE_URL?.includes('neon.tech') ||
  process.env.NODE_ENV === 'production';

// Append SSL parameter to DATABASE_URL for Heroku/production
let connectionUrl = process.env.DATABASE_URL;
if (isHerokuOrProduction && connectionUrl && !connectionUrl.includes('sslmode=')) {
  const separator = connectionUrl.includes('?') ? '&' : '?';
  connectionUrl = `${connectionUrl}${separator}sslmode=require`;
}

export default defineConfig({
  out: './migrations',
  schema: './shared/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: connectionUrl,
    ssl: isHerokuOrProduction ? { rejectUnauthorized: false } : false,
  },
});
