const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkOrders() {
    try {
        const result = await pool.query(
            'SELECT id, user_id, order_number, created_at, total_amount FROM orders ORDER BY created_at DESC LIMIT 5'
        );
        
        console.log('\n=== Recent Orders ===\n');
        result.rows.forEach((order, index) => {
            const utcDate = new Date(order.created_at);
            const istDate = new Date(utcDate.getTime() + (5.5 * 60 * 60 * 1000));
            
            console.log(`${index + 1}. Order #${order.order_number}`);
            console.log(`   UTC Time: ${utcDate.toISOString()}`);
            console.log(`   IST Time: ${istDate.toLocaleString('en-IN', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
            })}`);
            console.log(`   Amount: ₹${order.total_amount}\n`);
        });
        
        // Show current time for comparison
        const now = new Date();
        const istNow = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
        console.log('Current Time:');
        console.log(`   UTC: ${now.toISOString()}`);
        console.log(`   IST: ${istNow.toLocaleString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        })}`);
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await pool.end();
    }
}

checkOrders();
