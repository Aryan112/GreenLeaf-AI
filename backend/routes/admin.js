// routes/admin.js
// Admin routes for managing login rate limits

const express = require('express');
const { asyncHandler } = require('../middleware/errorHandler');
const { 
    getLoginAttemptStatus, 
    unblockUser,
    MAX_ATTEMPTS,
    BLOCK_DURATION
} = require('../middleware/loginRateLimiter');

const router = express.Router();

/**
 * GET /api/admin/login-attempts/:identifier
 * Check login attempt status for a user (by email or IP)
 */
router.get('/login-attempts/:identifier', asyncHandler(async (req, res) => {
    const { identifier } = req.params;
    
    const status = await getLoginAttemptStatus(identifier);
    
    if (!status) {
        return res.status(500).json({
            success: false,
            message: 'Failed to retrieve login attempt status'
        });
    }
    
    res.json({
        success: true,
        data: {
            identifier,
            ...status,
            maxAttempts: MAX_ATTEMPTS,
            blockDuration: BLOCK_DURATION
        }
    });
}));

/**
 * POST /api/admin/unblock-user
 * Manually unblock a user
 */
router.post('/unblock-user', asyncHandler(async (req, res) => {
    const { identifier } = req.body;
    
    if (!identifier) {
        return res.status(400).json({
            success: false,
            message: 'Identifier (email or IP) is required'
        });
    }
    
    const result = await unblockUser(identifier);
    
    if (result) {
        res.json({
            success: true,
            message: `User ${identifier} has been unblocked`
        });
    } else {
        res.status(500).json({
            success: false,
            message: 'Failed to unblock user'
        });
    }
}));

/**
 * GET /api/admin/rate-limit-config
 * Get current rate limit configuration
 */
router.get('/rate-limit-config', (req, res) => {
    res.json({
        success: true,
        data: {
            maxAttempts: MAX_ATTEMPTS,
            blockDurationSeconds: BLOCK_DURATION,
            blockDurationMinutes: BLOCK_DURATION / 60,
            description: 'Users are blocked after exceeding max attempts within the window period'
        }
    });
});

module.exports = router;
