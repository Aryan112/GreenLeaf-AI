/**
 * 🌱 Plant Nursery Database Setup Script
 * 
 * This script automates the entire database setup process:
 * - Creates all necessary tables
 * - Imports all current products (37 total: 21 plants, 8 pots, 8 tools)
 * - Sets up indexes for performance
 * - Verifies the setup
 * 
 * Usage: node setup-database.js
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function setupDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Setting up Plant Nursery Database...\n');

    // Start transaction
    await client.query('BEGIN');

    // Create products table
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        original_price DECIMAL(10, 2),
        category VARCHAR(50) NOT NULL,
        image VARCHAR(255),
        instock BOOLEAN DEFAULT true,
        badge VARCHAR(20),
        size VARCHAR(50),
        rating DECIMAL(3, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Products table created');

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Users table created');

    // Create carts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS carts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        session_id VARCHAR(255),
        product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
        quantity INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Carts table created');

    // Create contacts table
    await client.query(`
      CREATE TABLE IF NOT EXISTS contacts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(255),
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Contacts table created');

    // Create newsletter table
    await client.query(`
      CREATE TABLE IF NOT EXISTS newsletter (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Newsletter table created');

    // Create orders table
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        transaction_id VARCHAR(255) UNIQUE NOT NULL,
        total_amount DECIMAL(10, 2) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        payment_status VARCHAR(20) DEFAULT 'pending',
        shipping_info JSONB NOT NULL,
        items JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Orders table created');

    // Import products from SQL file
    console.log('\n📦 Importing products from products-data.sql...');
    const sqlFilePath = path.join(__dirname, 'database', 'products-data.sql');
    
    if (fs.existsSync(sqlFilePath)) {
      const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
      
      // Execute the SQL file content
      await client.query(sqlContent);
      console.log('✅ Products imported successfully\n');
    } else {
      console.error('❌ products-data.sql file not found!');
      throw new Error('Missing products data file');
    }

    // Create indexes for performance
    await client.query('CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_products_badge ON products(badge);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_products_instock ON products(instock);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_carts_user_id ON carts(user_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_carts_session_id ON carts(session_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);');
    await client.query('CREATE INDEX IF NOT EXISTS idx_orders_transaction_id ON orders(transaction_id);');
    console.log('✅ Created performance indexes');

    // Commit transaction
    await client.query('COMMIT');

    // Verify setup
    const result = await client.query('SELECT COUNT(*) as count FROM products');
    const count = result.rows[0].count;

    console.log('\n🎉 Database setup complete!');
    console.log(`📊 Total products in database: ${count}`);
    console.log('\n📋 Product breakdown:');
    
    const categories = await client.query(`
      SELECT category, COUNT(*) as count 
      FROM products 
      GROUP BY category 
      ORDER BY category
    `);
    
    categories.rows.forEach(row => {
      console.log(`   - ${row.category}: ${row.count} items`);
    });

    console.log('\n✨ Ready to start! Run: npm run dev');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error setting up database:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run setup
setupDatabase();
