// Import required modules
const { Pool } = require('@neondatabase/serverless');
const ws = require('ws');

// Setup database connection
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ws: ws 
});

// Define colorful event images
const eventImages = {
  basketball: "data:image/svg+xml;base64," + Buffer.from(`<svg width="300" height="200" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="basketbg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#f97316"/>
        <stop offset="100%" style="stop-color:#ea580c"/>
      </linearGradient>
    </defs>
    <rect width="300" height="200" fill="url(#basketbg)"/>
    <circle cx="150" cy="100" r="25" fill="none" stroke="white" stroke-width="3"/>
    <rect x="140" y="80" width="20" height="5" fill="white"/>
    <rect x="140" y="115" width="20" height="5" fill="white"/>
    <text x="150" y="180" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">BASKETBALL</text>
  </svg>`).toString('base64'),
  
  volleyball: "data:image/svg+xml;base64," + Buffer.from(`<svg width="300" height="200" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="volleybg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#f59e0b"/>
        <stop offset="100%" style="stop-color:#d97706"/>
      </linearGradient>
    </defs>
    <rect width="300" height="200" fill="url(#volleybg)"/>
    <circle cx="150" cy="100" r="15" fill="white" stroke="#d97706" stroke-width="2"/>
    <rect x="140" y="170" width="20" height="30" fill="white"/>
    <text x="150" y="180" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">VOLLEYBALL</text>
  </svg>`).toString('base64'),
  
  soccer: "data:image/svg+xml;base64," + Buffer.from(`<svg width="300" height="200" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="soccerbg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#22c55e"/>
        <stop offset="100%" style="stop-color:#16a34a"/>
      </linearGradient>
    </defs>
    <rect width="300" height="200" fill="url(#soccerbg)"/>
    <circle cx="150" cy="100" r="20" fill="white" stroke="#16a34a" stroke-width="2"/>
    <polygon points="150,90 155,100 150,110 145,100" fill="#16a34a"/>
    <text x="150" y="180" text-anchor="middle" fill="white" font-family="Arial" font-size="16" font-weight="bold">SOCCER</text>
  </svg>`).toString('base64'),
  
  tennis: "data:image/svg+xml;base64," + Buffer.from(`<svg width="300" height="200" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="tennisbg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#06b6d4"/>
        <stop offset="100%" style="stop-color:#0891b2"/>
      </linearGradient>
    </defs>
    <rect width="300" height="200" fill="url(#tennisbg)"/>
    <circle cx="150" cy="100" r="12" fill="white"/>
    <path d="M100 120 Q150 80 200 120" stroke="white" stroke-width="4" fill="none"/>
    <text x="150" y="180" text-anchor="middle" fill="white" font-family="Arial" font-size="16" font-weight="bold">TENNIS</text>
  </svg>`).toString('base64'),
  
  running: "data:image/svg+xml;base64," + Buffer.from(`<svg width="300" height="200" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="runbg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#8b5cf6"/>
        <stop offset="100%" style="stop-color:#7c3aed"/>
      </linearGradient>
    </defs>
    <rect width="300" height="200" fill="url(#runbg)"/>
    <path d="M50 150 Q100 100 150 120 T250 100" stroke="white" stroke-width="3" fill="none"/>
    <circle cx="80" cy="130" r="3" fill="white"/>
    <circle cx="180" cy="110" r="3" fill="white"/>
    <text x="150" y="180" text-anchor="middle" fill="white" font-family="Arial" font-size="16" font-weight="bold">RUNNING</text>
  </svg>`).toString('base64')
};

async function updateEventsWithImages() {
  try {
    console.log('Connecting to database...');
    
    // Get some events to update
    const eventsResult = await pool.query('SELECT id, title, sport_type FROM events WHERE event_image IS NULL LIMIT 5');
    const events = eventsResult.rows;
    
    console.log(`Found ${events.length} events without images`);
    
    for (const event of events) {
      const sportType = event.sport_type;
      const image = eventImages[sportType] || eventImages.basketball; // fallback to basketball
      
      console.log(`Updating event ${event.id}: ${event.title} (${sportType})`);
      
      await pool.query(
        'UPDATE events SET event_image = $1 WHERE id = $2',
        [image, event.id]
      );
    }
    
    console.log('✅ Successfully updated events with colorful images!');
  } catch (error) {
    console.error('Error updating events:', error);
  } finally {
    await pool.end();
  }
}

updateEventsWithImages();