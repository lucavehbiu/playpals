const { execSync } = require('child_process');

// Create a few sample events with colorful images via API calls
const sampleEvents = [
  {
    title: 'Morning Basketball Pickup',
    description: 'Casual basketball game at the local court. All skill levels welcome!',
    sportType: 'basketball',
    location: 'Central Park Basketball Courts',
    maxParticipants: 12,
    isPublic: true,
    isFree: true,
    cost: 0,
    eventImage:
      'data:image/svg+xml;base64,' +
      Buffer.from(
        `<svg width="300" height="200" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
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
    </svg>`
      ).toString('base64'),
  },
  {
    title: 'Tennis Tournament',
    description: 'Singles tennis tournament. Prizes for winners! Bring your own racket.',
    sportType: 'tennis',
    location: 'City Tennis Complex',
    maxParticipants: 16,
    isPublic: true,
    isFree: false,
    cost: 15,
    eventImage:
      'data:image/svg+xml;base64,' +
      Buffer.from(
        `<svg width="300" height="200" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="tennisbg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#22c55e"/>
          <stop offset="100%" style="stop-color:#16a34a"/>
        </linearGradient>
      </defs>
      <rect width="300" height="200" fill="url(#tennisbg)"/>
      <circle cx="150" cy="100" r="15" fill="white"/>
      <path d="M100 120 Q150 80 200 120" stroke="white" stroke-width="4" fill="none"/>
      <rect x="145" y="65" width="10" height="50" fill="white"/>
      <text x="150" y="180" text-anchor="middle" fill="white" font-family="Arial" font-size="16" font-weight="bold">TENNIS</text>
    </svg>`
      ).toString('base64'),
  },
  {
    title: 'Swimming Meetup',
    description: 'Pool swimming session. Practice laps and technique. Pool entry included.',
    sportType: 'swimming',
    location: 'Olympic Aquatic Center',
    maxParticipants: 20,
    isPublic: true,
    isFree: false,
    cost: 10,
    eventImage:
      'data:image/svg+xml;base64,' +
      Buffer.from(
        `<svg width="300" height="200" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="swimbg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#0ea5e9"/>
          <stop offset="100%" style="stop-color:#0284c7"/>
        </linearGradient>
      </defs>
      <rect width="300" height="200" fill="url(#swimbg)"/>
      <path d="M50 120 Q100 100 150 120 T250 120" stroke="white" stroke-width="3" fill="none"/>
      <path d="M50 140 Q100 120 150 140 T250 140" stroke="white" stroke-width="3" fill="none"/>
      <circle cx="180" cy="110" r="8" fill="white"/>
      <text x="150" y="180" text-anchor="middle" fill="white" font-family="Arial" font-size="14" font-weight="bold">SWIMMING</text>
    </svg>`
      ).toString('base64'),
  },
];

// Function to create events via API
async function createEvents() {
  const fetch = (await import('node-fetch')).default;

  for (const event of sampleEvents) {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + Math.floor(Math.random() * 7) + 1);

      const eventData = {
        ...event,
        date: tomorrow.toISOString(),
      };

      const response = await fetch('http://localhost:3000/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: 'connect.sid=s%3A123456789.example',
        },
        body: JSON.stringify(eventData),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`Created event: ${event.title} (ID: ${result.id})`);
      } else {
        console.log(`Failed to create ${event.title}: ${response.status}`);
      }
    } catch (error) {
      console.log(`Error creating ${event.title}: ${error.message}`);
    }
  }
}

createEvents()
  .then(() => {
    console.log('Finished creating sample events');
  })
  .catch(console.error);
