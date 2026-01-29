import 'dotenv/config';
import { db } from './server/db';
import { events } from '@shared/schema';
import { count, gte, and, eq } from 'drizzle-orm';

async function debugEvents() {
  try {
    // Total events
    const total = await db.select({ count: count() }).from(events);
    console.log('Total events in DB:', total[0].count);

    // Future events
    const now = new Date();
    const future = await db.select({ count: count() }).from(events).where(gte(events.date, now));
    console.log('Future events (>= now):', future[0].count);

    // Public future events
    const publicFuture = await db
      .select({ count: count() })
      .from(events)
      .where(and(gte(events.date, now), eq(events.isPublic, true)));
    console.log('Public future events:', publicFuture[0].count);

    // Sample of past events to verify dates
    const pastEvents = await db.query.events.findMany({
      limit: 5,
      orderBy: (events, { desc }) => [desc(events.date)],
    });
    console.log(
      'Sample 5 most recent events:',
      JSON.stringify(
        pastEvents.map((e) => ({ id: e.id, title: e.title, date: e.date, isPublic: e.isPublic })),
        null,
        2
      )
    );
  } catch (error) {
    console.error('Error debugging events:', error);
  }
  process.exit(0);
}

debugEvents();
