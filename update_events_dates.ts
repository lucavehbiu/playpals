import 'dotenv/config';
import { db } from './server/db';
import { events } from '@shared/schema';
import { lt, sql } from 'drizzle-orm';

async function updateEvents() {
  try {
    const now = new Date();
    console.log('Current time:', now.toISOString());

    // Update events in the past to be 1 year in the future
    // We'll use a raw SQL update for efficiency or iterate if needed.
    // Drizzle update:

    const result = await db.execute(sql`
      UPDATE events
      SET date = date + INTERVAL '1 year'
      WHERE date < NOW()
    `);

    console.log('Updated past events to next year.');
  } catch (error) {
    console.error('Error updating events:', error);
  }
  process.exit(0);
}

updateEvents();
