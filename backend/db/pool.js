// backend/db/pool.js
const { Pool } = require("pg");
require("dotenv").config();

// For a global / cloud PostgreSQL, always use the DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // most hosted Postgres require SSL
  },
});

// Log pool-level errors so they don't crash the app silently
pool.on("error", (err) => {
  console.error("Unexpected error on idle PostgreSQL client:", err);
});

console.log("✅ PostgreSQL connection pool initialized");

module.exports = pool;