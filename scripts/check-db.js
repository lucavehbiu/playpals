import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;

console.log('Checking database connection...');
console.log('DATABASE_URL exists:', !!connectionString);

if (!connectionString) {
  console.error('ERROR: DATABASE_URL environment variable is not set');
  process.exit(1);
}

try {
  const sql = postgres(connectionString, { max: 1 });

  console.log('Attempting to connect...');
  const result = await sql`SELECT NOW()`;
  console.log('✅ Database connection successful!');
  console.log('Server time:', result[0].now);

  await sql.end();
  process.exit(0);
} catch (error) {
  console.error('❌ Database connection failed:');
  console.error(error.message);
  process.exit(1);
}
