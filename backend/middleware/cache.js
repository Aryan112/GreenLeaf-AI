import client from '../config/redisClient.js';

export const cache = async (req, res, next) => {
  const key = req.originalUrl;

  try {
    const cached = await client.get(key);
    if (cached) {
      console.log(`⚡ Cache hit for ${key}`);
      return res.json(JSON.parse(cached));
    }

    console.log(`🧭 Cache miss for ${key}`);
    const originalJson = res.json.bind(res);

    res.json = (data) => {
      client.setEx(key, 120, JSON.stringify(data)); // cache for 2 minutes
      return originalJson(data);
    };

    next();
  } catch (error) {
    console.error('Redis cache error:', error);
    next();
  }
};
