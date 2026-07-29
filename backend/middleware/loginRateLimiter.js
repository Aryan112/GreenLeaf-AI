// middleware/loginRateLimiter.js
// Redis-based login rate limiter to prevent brute force attacks
// Blocks users after 5 failed login attempts for 15 minutes

const redisClient = require('../config/redisClient');

/**
 * Login Rate Limiter Middleware
 * Tracks failed login attempts per IP address or email
 * Blocks after 5 failed attempts for 15 minutes
 */

const MAX_ATTEMPTS = 5;
const BLOCK_DURATION = 15 * 60; // 15 minutes in seconds
const ATTEMPT_WINDOW = 15 * 60; // 15 minutes window for attempts

/**
 * Check if user/IP is blocked
 */
async function checkLoginAttempts(req, res, next) {
  try {
    const identifier = req.body.email || req.ip; // Use email or IP address
    const key = `login_attempts:${identifier}`;
    const blockKey = `login_blocked:${identifier}`;

    // Check if user is currently blocked
    const isBlocked = await redisClient.get(blockKey);
    
    if (isBlocked) {
      const ttl = await redisClient.ttl(blockKey);
      const minutesLeft = Math.ceil(ttl / 60);
      
      return res.status(429).json({
        success: false,
        message: `Too many failed login attempts. Please try again in ${minutesLeft} minute(s).`,
        blockedUntil: new Date(Date.now() + ttl * 1000).toISOString(),
        attemptsRemaining: 0
      });
    }

    // Get current attempt count
    const attempts = await redisClient.get(key);
    const attemptCount = attempts ? parseInt(attempts) : 0;

    // Check if max attempts reached
    if (attemptCount >= MAX_ATTEMPTS) {
      // Block the user
      await redisClient.setEx(blockKey, BLOCK_DURATION, 'blocked');
      await redisClient.del(key); // Clear attempt counter
      
      return res.status(429).json({
        success: false,
        message: `Account temporarily locked due to too many failed login attempts. Please try again in 15 minutes.`,
        blockedUntil: new Date(Date.now() + BLOCK_DURATION * 1000).toISOString(),
        attemptsRemaining: 0
      });
    }

    // Store attempt info in request for later use
    req.loginAttempts = {
      identifier,
      key,
      currentAttempts: attemptCount,
      remainingAttempts: MAX_ATTEMPTS - attemptCount
    };

    next();
  } catch (error) {
    console.error('❌ Login rate limiter error:', error);
    // If Redis fails, allow the request to proceed (fail open)
    next();
  }
}

/**
 * Record a failed login attempt
 */
async function recordFailedAttempt(req) {
  try {
    if (!req.loginAttempts) return;

    const { key, currentAttempts, identifier } = req.loginAttempts;
    const newAttemptCount = currentAttempts + 1;

    // Increment attempt counter with expiry
    await redisClient.setEx(key, ATTEMPT_WINDOW, newAttemptCount.toString());

    const remainingAttempts = MAX_ATTEMPTS - newAttemptCount;

    console.log(`⚠️ Failed login attempt for ${identifier}: ${newAttemptCount}/${MAX_ATTEMPTS}`);

    return {
      attempts: newAttemptCount,
      remaining: remainingAttempts,
      willBlock: remainingAttempts <= 0
    };
  } catch (error) {
    console.error('❌ Error recording failed attempt:', error);
    return null;
  }
}

/**
 * Clear failed attempts after successful login
 */
async function clearFailedAttempts(req) {
  try {
    if (!req.loginAttempts) return;

    const { key, identifier } = req.loginAttempts;
    await redisClient.del(key);
    
    console.log(`✅ Cleared failed attempts for ${identifier}`);
  } catch (error) {
    console.error('❌ Error clearing failed attempts:', error);
  }
}

/**
 * Manually unblock a user (admin function)
 */
async function unblockUser(identifier) {
  try {
    const key = `login_attempts:${identifier}`;
    const blockKey = `login_blocked:${identifier}`;
    
    await redisClient.del(key);
    await redisClient.del(blockKey);
    
    console.log(`✅ Manually unblocked user: ${identifier}`);
    return true;
  } catch (error) {
    console.error('❌ Error unblocking user:', error);
    return false;
  }
}

/**
 * Get current status of login attempts for a user
 */
async function getLoginAttemptStatus(identifier) {
  try {
    const key = `login_attempts:${identifier}`;
    const blockKey = `login_blocked:${identifier}`;
    
    const isBlocked = await redisClient.get(blockKey);
    const attempts = await redisClient.get(key);
    const attemptCount = attempts ? parseInt(attempts) : 0;
    
    if (isBlocked) {
      const ttl = await redisClient.ttl(blockKey);
      return {
        blocked: true,
        attempts: MAX_ATTEMPTS,
        remaining: 0,
        blockedFor: ttl,
        unblockAt: new Date(Date.now() + ttl * 1000)
      };
    }
    
    return {
      blocked: false,
      attempts: attemptCount,
      remaining: MAX_ATTEMPTS - attemptCount,
      blockedFor: 0,
      unblockAt: null
    };
  } catch (error) {
    console.error('❌ Error getting login attempt status:', error);
    return null;
  }
}

module.exports = {
  checkLoginAttempts,
  recordFailedAttempt,
  clearFailedAttempts,
  unblockUser,
  getLoginAttemptStatus,
  MAX_ATTEMPTS,
  BLOCK_DURATION
};
