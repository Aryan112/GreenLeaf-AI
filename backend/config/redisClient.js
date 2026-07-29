// backend/config/redisClient.js
const { createClient } = require('redis');
require('dotenv').config();

const client = createClient({
  username: process.env.REDIS_USERNAME || 'default',
  password: process.env.REDIS_PASSWORD || 'xPfmEUQ6xCjOEovD1POvUw2boTFmtJgv',
  socket: {
    host: process.env.REDIS_HOST || 'redis-19713.c11.us-east-1-2.ec2.redns.redis-cloud.com',
    port: process.env.REDIS_PORT || 19713
  }
});

client.on('connect', () => console.log('✅ Connected to Redis Cloud'));
client.on('error', (err) => console.error('❌ Redis Client Error:', err.message));

// Connect asynchronously 
client.connect().catch((err) => {
  console.error('❌ Failed to connect to Redis:', err.message);
});
//now export the client
module.exports = client;

