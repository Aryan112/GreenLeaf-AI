// backend/db/index.js
require("dotenv").config();

if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set in the environment variables.");
  throw new Error("DATABASE_URL is required to connect to the database.");
}

console.log("🔗 Using DATABASE_URL:", process.env.DATABASE_URL);

// Just re-export the pool from pool.js
const pool = require("./pool");

module.exports = pool;