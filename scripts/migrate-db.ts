#!/usr/bin/env tsx
/**
 * Database Migration Script
 * Copies all data from Replit PostgreSQL database to local Neon database
 */

import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../shared/schema.js';
import { sql } from 'drizzle-orm';

const { Pool } = pg;

// Table migration order (respecting foreign key constraints)
const MIGRATION_ORDER = [
  'users',
  'friendships',
  'events',
  'rsvps',
  'teams',
  'teamMembers',
  'teamJoinRequests',
  'teamSchedules',
  'teamScheduleResponses',
  'teamPosts',
  'teamPostComments',
  'tournaments',
  'tournamentParticipants',
  'tournamentMatches',
  'tournamentStandings',
  'tournamentInvitations',
  'sportsGroups',
  'sportsGroupMembers',
  'sportsGroupJoinRequests',
  'sportsGroupEvents',
  'sportsGroupPolls',
  'sportsGroupPollTimeSlots',
  'sportsGroupPollResponses',
  'sportsGroupNotifications',
  'sportSkillLevels',
  'userSportPreferences',
  'userOnboardingPreferences',
  'professionalTeamHistory',
  'playerRatings',
  'playerStatistics',
  'skillMatcherPreferences',
  'skillMatches',
  'matchResults',
  'matchParticipants',
  'matchResultNotifications',
  'scoreHistory'
];

interface MigrationStats {
  table: string;
  rowsExported: number;
  rowsImported: number;
  success: boolean;
  error?: string;
}

async function getTableRowCount(db: any, tableName: string): Promise<number> {
  try {
    const result = await db.execute(sql.raw(`SELECT COUNT(*) as count FROM "${tableName}"`));
    return parseInt(result.rows[0]?.count || '0');
  } catch (error) {
    return 0;
  }
}

async function exportTableData(sourceDb: any, tableName: string): Promise<any[]> {
  try {
    console.log(`  📤 Exporting data from ${tableName}...`);
    const result = await sourceDb.execute(sql.raw(`SELECT * FROM "${tableName}" ORDER BY id`));
    console.log(`  ✅ Exported ${result.rows.length} rows from ${tableName}`);
    return result.rows;
  } catch (error: any) {
    console.error(`  ❌ Error exporting ${tableName}:`, error.message);
    throw error;
  }
}

async function importTableData(targetDb: any, tableName: string, data: any[]): Promise<number> {
  if (data.length === 0) {
    console.log(`  ⏭️  No data to import for ${tableName}`);
    return 0;
  }

  try {
    console.log(`  📥 Importing ${data.length} rows into ${tableName}...`);

    // Get column names from first row
    const columns = Object.keys(data[0]);
    const columnList = columns.map(c => `"${c}"`).join(', ');

    // Build VALUES clause for batch insert
    const valuePlaceholders: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const row of data) {
      const rowPlaceholders = columns.map(() => `$${paramIndex++}`);
      valuePlaceholders.push(`(${rowPlaceholders.join(', ')})`);

      for (const col of columns) {
        values.push(row[col]);
      }
    }

    const insertQuery = `
      INSERT INTO "${tableName}" (${columnList})
      VALUES ${valuePlaceholders.join(', ')}
      ON CONFLICT (id) DO UPDATE SET
        ${columns.filter(c => c !== 'id').map(c => `"${c}" = EXCLUDED."${c}"`).join(', ')}
    `;

    await targetDb.execute(sql.raw(insertQuery, values));

    // Reset sequence to max id
    await targetDb.execute(sql.raw(`
      SELECT setval(
        pg_get_serial_sequence('"${tableName}"', 'id'),
        COALESCE((SELECT MAX(id) FROM "${tableName}"), 1),
        true
      )
    `));

    console.log(`  ✅ Imported ${data.length} rows into ${tableName}`);
    return data.length;
  } catch (error: any) {
    console.error(`  ❌ Error importing ${tableName}:`, error.message);
    throw error;
  }
}

async function migrateTable(
  sourceDb: any,
  targetDb: any,
  tableName: string
): Promise<MigrationStats> {
  console.log(`\n🔄 Migrating table: ${tableName}`);

  try {
    const data = await exportTableData(sourceDb, tableName);
    const importedRows = await importTableData(targetDb, tableName, data);

    return {
      table: tableName,
      rowsExported: data.length,
      rowsImported: importedRows,
      success: true
    };
  } catch (error: any) {
    return {
      table: tableName,
      rowsExported: 0,
      rowsImported: 0,
      success: false,
      error: error.message
    };
  }
}

async function main() {
  console.log('🚀 Starting Database Migration\n');
  console.log('=' .repeat(60));

  // Get connection strings from environment
  const replitDbUrl = process.env.REPLIT_DATABASE_URL;
  const localDbUrl = process.env.DATABASE_URL;

  if (!replitDbUrl) {
    throw new Error('❌ REPLIT_DATABASE_URL environment variable is not set');
  }

  if (!localDbUrl) {
    throw new Error('❌ DATABASE_URL environment variable is not set');
  }

  console.log('📊 Connection Details:');
  console.log(`  Source (Replit): ${replitDbUrl.replace(/:[^:@]+@/, ':***@')}`);
  console.log(`  Target (Local):  ${localDbUrl.replace(/:[^:@]+@/, ':***@')}`);
  console.log('=' .repeat(60));

  // Create database connections
  console.log('\n🔌 Connecting to databases...');
  const sourcePool = new Pool({ connectionString: replitDbUrl });
  const targetPool = new Pool({ connectionString: localDbUrl });

  const sourceDb = drizzle(sourcePool, { schema });
  const targetDb = drizzle(targetPool, { schema });

  try {
    // Test connections
    await sourcePool.query('SELECT 1');
    console.log('✅ Connected to source database (Replit)');

    await targetPool.query('SELECT 1');
    console.log('✅ Connected to target database (Local)');

    // Migration stats
    const stats: MigrationStats[] = [];
    let totalRows = 0;

    // Migrate each table in order
    console.log(`\n📋 Migrating ${MIGRATION_ORDER.length} tables...`);

    for (const tableName of MIGRATION_ORDER) {
      const stat = await migrateTable(sourceDb, targetDb, tableName);
      stats.push(stat);
      if (stat.success) {
        totalRows += stat.rowsImported;
      }
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary\n');

    const successful = stats.filter(s => s.success);
    const failed = stats.filter(s => !s.success);

    console.log(`✅ Successful: ${successful.length}/${stats.length} tables`);
    console.log(`📈 Total rows migrated: ${totalRows}`);

    if (failed.length > 0) {
      console.log(`\n❌ Failed tables (${failed.length}):`);
      failed.forEach(stat => {
        console.log(`  - ${stat.table}: ${stat.error}`);
      });
    }

    console.log('\n📋 Detailed Results:');
    stats.forEach(stat => {
      const icon = stat.success ? '✅' : '❌';
      console.log(`  ${icon} ${stat.table}: ${stat.rowsImported} rows`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('✨ Migration completed!');

  } catch (error: any) {
    console.error('\n❌ Migration failed:', error.message);
    throw error;
  } finally {
    // Close connections
    await sourcePool.end();
    await targetPool.end();
    console.log('\n🔌 Database connections closed');
  }
}

// Run migration
main()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error);
    process.exit(1);
  });
