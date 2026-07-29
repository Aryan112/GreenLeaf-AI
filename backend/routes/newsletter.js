/**
 * NEWSLETTER ROUTES - Subscription management API endpoints
 * 
 * This file handles newsletter subscription functionality.
 * Integrates with PostgreSQL for subscriber persistence.
 * 
 * LEARNING OBJECTIVES:
 * - Email validation and sanitization
 * - Duplicate prevention (UNIQUE constraint)
 * - PostgreSQL error handling
 * - Subscription management
 * 
 * DATABASE SCHEMA:
 * Table: newsletter
 * - id: SERIAL PRIMARY KEY
 * - email: VARCHAR(100) UNIQUE
 * - subscribed_at: TIMESTAMP DEFAULT NOW()
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const { asyncHandler } = require('../middleware/errorHandler');
const pool = require('../db/pool');

const router = express.Router();

/**
 * Helper function to ensure newsletter table exists
 */
// async function ensureNewsletterTableExists() {
//     const createTableQuery = `
//         CREATE TABLE IF NOT EXISTS newsletter (
//             id SERIAL PRIMARY KEY,
//             email VARCHAR(100) UNIQUE NOT NULL,
//             subscribed_at TIMESTAMP DEFAULT NOW(),
//             is_active BOOLEAN DEFAULT true
//         );
//     `;
    
//     try {
//         await pool.query(createTableQuery);
//         console.log('✅ Newsletter table ready');
//     } catch (error) {
//         console.error('Error creating newsletter table:', error);
//         throw error;
//     }
// }

// // Initialize table on module load
// ensureNewsletterTableExists();

/**
 * POST /api/subscribe
 * Subscribe email to newsletter
 * 
 * Request Body:
 * {
 *   email: string (required) - Valid email address
 * }
 * 
 * Response:
 * {
 *   success: true/false,
 *   message: string
 * }
 */
router.post('/',
    [
        // Validation rules
        body('email')
            .trim()
            .isEmail()
            .withMessage('Please provide a valid email address')
            .normalizeEmail()
            .isLength({ max: 100 })
            .withMessage('Email address is too long')
    ],
    
    asyncHandler(async (req, res) => {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email address',
                errors: errors.array()
            });
        }
        
        const { email } = req.body;
        
        console.log(`📧 Newsletter subscription request: ${email}`);
        
        try {
            // Check if email already exists
            const checkQuery = `SELECT * FROM newsletter WHERE email = $1;`;
            const checkResult = await pool.query(checkQuery, [email]);
            
            if (checkResult.rows.length > 0) {
                const subscriber = checkResult.rows[0];
                
                // If previously subscribed but inactive, reactivate
                if (!subscriber.is_active) {
                    const reactivateQuery = `
                        UPDATE newsletter 
                        SET is_active = true, subscribed_at = NOW() 
                        WHERE email = $1
                        RETURNING *;
                    `;
                    await pool.query(reactivateQuery, [email]);
                    
                    console.log(`✅ Reactivated subscription: ${email}`);
                    
                    return res.json({
                        success: true,
                        message: 'Welcome back! Your subscription has been reactivated.'
                    });
                }
                
                // Already subscribed and active
                console.log(`ℹ Email already subscribed: ${email}`);
                
                return res.json({
                    success: true,
                    message: 'You are already subscribed to our newsletter!'
                });
            }
            
            // Insert new subscriber
            const insertQuery = `
                INSERT INTO newsletter (email)
                VALUES ($1)
                RETURNING *;
            `;
            
            const result = await pool.query(insertQuery, [email]);
            const subscriber = result.rows[0];
            
            console.log(`✅ New newsletter subscriber: ${email}`);
            
            res.status(201).json({
                success: true,
                message: 'Thank you for subscribing! You will receive our latest updates and offers.',
                data: {
                    email: subscriber.email,
                    subscribedAt: subscriber.subscribed_at
                }
            });
            
        } catch (error) {
            console.error('❌ Newsletter subscription error:', error);
            
            // Handle duplicate email (unique constraint violation)
            if (error.code === '23505') {
                return res.json({
                    success: true,
                    message: 'You are already subscribed to our newsletter!'
                });
            }
            
            res.status(500).json({
                success: false,
                message: 'Failed to subscribe. Please try again later.',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    })
);

/**
 * DELETE /api/subscribe
 * Unsubscribe from newsletter
 * 
 * Request Body:
 * {
 *   email: string (required)
 * }
 */
router.delete('/',
    [
        body('email')
            .trim()
            .isEmail()
            .withMessage('Please provide a valid email address')
            .normalizeEmail()
    ],
    
    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email address',
                errors: errors.array()
            });
        }
        
        const { email } = req.body;
        
        console.log(`📧 Unsubscribe request: ${email}`);
        
        // Soft delete - mark as inactive instead of removing
        const updateQuery = `
            UPDATE newsletter 
            SET is_active = false 
            WHERE email = $1 AND is_active = true
            RETURNING *;
        `;
        
        const result = await pool.query(updateQuery, [email]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Email not found in our subscriber list.'
            });
        }
        
        console.log(`✅ Unsubscribed: ${email}`);
        
        res.json({
            success: true,
            message: 'You have been successfully unsubscribed from our newsletter.'
        });
    })
);

/**
 * GET /api/subscribe/count
 * Get total number of active subscribers
 * (Admin endpoint - should be protected in production)
 */
router.get('/count',
    asyncHandler(async (req, res) => {
        const query = `SELECT COUNT(*) as count FROM newsletter WHERE is_active = true;`;
        const result = await pool.query(query);
        
        res.json({
            success: true,
            count: parseInt(result.rows[0].count)
        });
    })
);

/**
 * GET /api/subscribe/list
 * Get all active subscribers
 * (Admin endpoint - should be protected with authentication in production)
 */
router.get('/list',
    asyncHandler(async (req, res) => {
        const query = `
            SELECT email, subscribed_at 
            FROM newsletter 
            WHERE is_active = true 
            ORDER BY subscribed_at DESC;
        `;
        
        const result = await pool.query(query);
        
        res.json({
            success: true,
            message: `Found ${result.rows.length} active subscriber(s)`,
            subscribers: result.rows
        });
    })
);

module.exports = router;
