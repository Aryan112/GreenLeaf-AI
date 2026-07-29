/**
 * Quick script to check all tables in your PostgreSQL database
 * Usage: node check-tables.js
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkTables() {
  try {
    console.log('📊 Checking tables in database...\n');

    // Get all tables
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);

    if (result.rows.length === 0) {
      console.log('❌ No tables found in database');
    } else {
      console.log(`✅ Found ${result.rows.length} tables:\n`);
      result.rows.forEach((row, index) => {
        console.log(`${index + 1}. ${row.table_name}`);
      });

      // Get row counts for each table
      console.log('\n📈 Row counts:');
      for (const row of result.rows) {
        const countResult = await pool.query(`SELECT COUNT(*) FROM ${row.table_name}`);
        console.log(`   ${row.table_name}: ${countResult.rows[0].count} rows`);
      }
    }

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkTables();
