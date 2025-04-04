import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { log } from "./vite";

const { Pool } = pg;

// Create a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Log database connection
pool.on("connect", () => {
  log("Connected to PostgreSQL database", "database");
});

// Initialize Drizzle with the pool
export const db = drizzle(pool);