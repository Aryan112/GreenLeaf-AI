/**
 * CONTACT ROUTES - Contact form submission API endpoints
 * 
 * This file handles contact form submissions.
 * Integrates with PostgreSQL for message persistence.
 * 
 * LEARNING OBJECTIVES:
 * - Form data validation
 * - Text sanitization
 * - PostgreSQL data insertion
 * - Contact management
 * 
 * DATABASE SCHEMA:
 * Table: contacts
 * - id: SERIAL PRIMARY KEY
 * - name: VARCHAR(100)
 * - email: VARCHAR(100)
 * - phone: VARCHAR(20)
 * - subject: VARCHAR(200)
 * - message: TEXT
 * - created_at: TIMESTAMP DEFAULT NOW()
 * - is_read: BOOLEAN DEFAULT false
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const { asyncHandler } = require('../middleware/errorHandler');
const pool = require('../db/pool');

const router = express.Router();

/**
 * Helper function to ensure contacts table exists
 */
// async function ensureContactsTableExists() {
//     const createTableQuery = `
//         CREATE TABLE IF NOT EXISTS contacts (
//             id SERIAL PRIMARY KEY,
//             name VARCHAR(100) NOT NULL,
//             email VARCHAR(100) NOT NULL,
//             phone VARCHAR(20),
//             subject VARCHAR(200),
//             message TEXT NOT NULL,
//             created_at TIMESTAMP DEFAULT NOW(),
//             is_read BOOLEAN DEFAULT false,
//             is_replied BOOLEAN DEFAULT false
//         );
//     `;
    
//     try {
//         await pool.query(createTableQuery);
//         console.log('✅ Contacts table ready');
//     } catch (error) {
//         console.error('Error creating contacts table:', error);
//         throw error;
//     }
// }

// // Initialize table on module load
// ensureContactsTableExists();

/**
 * POST /api/contact
 * Submit contact form
 * 
 * Request Body:
 * {
 *   firstName: string (required),
 *   lastName: string (required),
 *   email: string (required),
 *   phone: string (optional),
 *   subject: string (required),
 *   message: string (required),
 *   newsletter: boolean (optional)
 * }
 * 
 * Response:
 * {
 *   success: true/false,
 *   message: string,
 *   data: object (if success)
 * }
 */
router.post('/',
    [
        // Validation rules
        body('firstName')
            .trim()
            .notEmpty()
            .withMessage('First name is required')
            .isLength({ min: 2, max: 50 })
            .withMessage('First name must be between 2 and 50 characters')
            .matches(/^[a-zA-Z\s]+$/)
            .withMessage('First name can only contain letters'),
        
        body('lastName')
            .trim()
            .notEmpty()
            .withMessage('Last name is required')
            .isLength({ min: 2, max: 50 })
            .withMessage('Last name must be between 2 and 50 characters')
            .matches(/^[a-zA-Z\s]+$/)
            .withMessage('Last name can only contain letters'),
        
        body('email')
            .trim()
            .isEmail()
            .withMessage('Please provide a valid email address')
            .normalizeEmail()
            .isLength({ max: 100 })
            .withMessage('Email address is too long'),
        
        body('phone')
            .optional({ checkFalsy: true })
            .trim()
            .matches(/^[\d\s\-\+\(\)]+$/)
            .withMessage('Please provide a valid phone number')
            .isLength({ max: 20 })
            .withMessage('Phone number is too long'),
        
        body('subject')
            .trim()
            .notEmpty()
            .withMessage('Subject is required')
            .isLength({ min: 3, max: 200 })
            .withMessage('Subject must be between 3 and 200 characters'),
        
        body('message')
            .trim()
            .notEmpty()
            .withMessage('Message is required')
            .isLength({ min: 10, max: 2000 })
            .withMessage('Message must be between 10 and 2000 characters'),
        
        body('newsletter')
            .optional()
            .isBoolean()
            .withMessage('Newsletter must be a boolean value')
    ],
    
    asyncHandler(async (req, res) => {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }
        
        const { firstName, lastName, email, phone, subject, message, newsletter } = req.body;
        
        // Combine first and last name
        const fullName = `${firstName} ${lastName}`.trim();
        
        console.log(`📨 Contact form submission from: ${fullName} (${email})`);
        console.log(`📋 Subject: ${subject}`);
        
        try {
            // Insert contact message into database
            const insertQuery = `
                INSERT INTO contacts (name, email, phone, subject, message)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *;
            `;
            
            const values = [
                fullName,
                email,
                phone || null,
                subject,
                message
            ];
            
            const result = await pool.query(insertQuery, values);
            const contact = result.rows[0];
            
            console.log(`✅ Contact message saved (ID: ${contact.id})`);
            
            // If newsletter checkbox was checked, subscribe them
            if (newsletter) {
                try {
                    const subscribeQuery = `
                        INSERT INTO newsletter (email)
                        VALUES ($1)
                        ON CONFLICT (email) DO NOTHING;
                    `;
                    await pool.query(subscribeQuery, [email]);
                    console.log(`📧 Also subscribed to newsletter: ${email}`);
                } catch (subError) {
                    console.error('Newsletter subscription error:', subError);
                    // Don't fail the whole request if newsletter subscription fails
                }
            }
            
            // Return success response
            res.status(201).json({
                success: true,
                message: 'Thank you for contacting us! We will get back to you soon.',
                data: {
                    id: contact.id,
                    name: contact.name,
                    email: contact.email,
                    subject: contact.subject,
                    createdAt: contact.created_at
                }
            });
            
            // TODO: In production, send confirmation email to user
            // TODO: Send notification email to admin/support team
            
        } catch (error) {
            console.error('❌ Contact form submission error:', error);
            
            res.status(500).json({
                success: false,
                message: 'Failed to submit contact form. Please try again later.',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    })
);

/**
 * GET /api/contact/all
 * Get all contact messages
 * (Admin endpoint - should be protected with authentication in production)
 */
router.get('/all',
    asyncHandler(async (req, res) => {
        const { unreadOnly } = req.query;
        
        let query = `
            SELECT * FROM contacts 
            ORDER BY created_at DESC;
        `;
        
        if (unreadOnly === 'true') {
            query = `
                SELECT * FROM contacts 
                WHERE is_read = false 
                ORDER BY created_at DESC;
            `;
        }
        
        const result = await pool.query(query);
        
        res.json({
            success: true,
            message: `Found ${result.rows.length} contact message(s)`,
            contacts: result.rows
        });
    })
);

/**
 * GET /api/contact/:id
 * Get specific contact message by ID
 * (Admin endpoint)
 */
router.get('/:id',
    asyncHandler(async (req, res) => {
        const { id } = req.params;
        
        const query = `SELECT * FROM contacts WHERE id = $1;`;
        const result = await pool.query(query, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Contact message not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Contact message retrieved successfully',
            contact: result.rows[0]
        });
    })
);

/**
 * PATCH /api/contact/:id/read
 * Mark contact message as read
 * (Admin endpoint)
 */
router.patch('/:id/read',
    asyncHandler(async (req, res) => {
        const { id } = req.params;
        
        const query = `
            UPDATE contacts 
            SET is_read = true 
            WHERE id = $1
            RETURNING *;
        `;
        
        const result = await pool.query(query, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Contact message not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Contact message marked as read',
            contact: result.rows[0]
        });
    })
);

/**
 * PATCH /api/contact/:id/replied
 * Mark contact message as replied
 * (Admin endpoint)
 */
router.patch('/:id/replied',
    asyncHandler(async (req, res) => {
        const { id } = req.params;
        
        const query = `
            UPDATE contacts 
            SET is_replied = true, is_read = true 
            WHERE id = $1
            RETURNING *;
        `;
        
        const result = await pool.query(query, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Contact message not found'
            });
        }
        
        res.json({
            success: true,
            message: 'Contact message marked as replied',
            contact: result.rows[0]
        });
    })
);

/**
 * GET /api/contact/stats
 * Get contact statistics
 * (Admin endpoint)
 */
router.get('/stats/summary',
    asyncHandler(async (req, res) => {
        const statsQuery = `
            SELECT 
                COUNT(*) as total_messages,
                COUNT(*) FILTER (WHERE is_read = false) as unread_messages,
                COUNT(*) FILTER (WHERE is_replied = false) as unreplied_messages,
                COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as messages_today,
                COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as messages_this_week
            FROM contacts;
        `;
        
        const result = await pool.query(statsQuery);
        
        res.json({
            success: true,
            message: 'Contact statistics retrieved successfully',
            stats: result.rows[0]
        });
    })
);

module.exports = router;
