const express = require('express');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const { asyncHandler, createError } = require('../middleware/errorHandler');
const User = require('../schemas/User'); // MongoDB User model
const { generateToken } = require('../middleware/jwt'); // JWT token generation
const { 
    checkLoginAttempts, 
    recordFailedAttempt, 
    clearFailedAttempts 
} = require('../middleware/loginRateLimiter');

const router = express.Router();

// Register new user
router.post('/register',
    [
        body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2-100 characters'),
        body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
        body('password').isLength({ min: 6, max: 100 }).withMessage('Password must be at least 6 characters')
    ],
    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, message: 'Invalid data', errors: errors.array() });
        }

        const { name, email, password } = req.body;

        // Check if email already exists in MongoDB Atlas
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'Email already registered' });
        }

        // Hash password and create user in MongoDB Atlas
        const passwordHash = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,
            email,
            passwordHash
        });

        req.session.user = { id: user._id.toString(), name: user.name, email: user.email };

        // Generate JWT token
        const token = generateToken({ id: user._id, name: user.name, email: user.email });

        res.status(201).json({ 
            success: true, 
            message: 'Account created', 
            data: { 
                id: user._id, 
                name: user.name, 
                email: user.email 
            },
            token // JWT token for API authentication
        });
    })
);

// Login with rate limiting
router.post('/login',
    checkLoginAttempts, // Check if user is blocked or has remaining attempts
    [
        body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
        body('password').isLength({ min: 6, max: 100 }).withMessage('Password is required')
    ],
    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, message: 'Invalid data', errors: errors.array() });
        }

        const { email, password } = req.body;
        
        // Find user in MongoDB Atlas
        const user = await User.findOne({ email });
        
        // User not found - record failed attempt
        if (!user) {
            const attemptInfo = await recordFailedAttempt(req);
            
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials',
                attemptsRemaining: attemptInfo ? attemptInfo.remaining : null
            });
        }

        // Check password
        const ok = await bcrypt.compare(password, user.passwordHash);
        
        if (!ok) {
            // Wrong password - record failed attempt
            const attemptInfo = await recordFailedAttempt(req);
            
            const message = attemptInfo && attemptInfo.remaining > 0
                ? `Invalid credentials. ${attemptInfo.remaining} attempt(s) remaining.`
                : attemptInfo && attemptInfo.remaining === 0
                ? 'Invalid credentials. Account will be locked after this attempt.'
                : 'Invalid credentials';
            
            return res.status(401).json({ 
                success: false, 
                message,
                attemptsRemaining: attemptInfo ? attemptInfo.remaining : null
            });
        }

        // Successful login - clear any failed attempts
        await clearFailedAttempts(req);

        req.session.user = { id: user._id.toString(), name: user.name, email: user.email };
        
        // Force session save before sending response
        req.session.save((err) => {
            if (err) {
                console.error('❌ Session save error:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Login successful but session error occurred' 
                });
            }
            
            console.log('✅ User logged in and session saved:', user.email);
            
            // Generate JWT token
            const token = generateToken({ id: user._id, name: user.name, email: user.email });
            
            res.json({ 
                success: true, 
                message: 'Logged in successfully', 
                data: { 
                    id: user._id, 
                    name: user.name, 
                    email: user.email 
                },
                token // JWT token for API authentication
            });
        });
    })
);

// Logout
router.post('/logout', asyncHandler(async (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.json({ success: true, message: 'Logged out' });
    });
}));

// Check session status
router.get('/check-session', asyncHandler(async (req, res) => {
    if (req.session && req.session.user) {
        res.json({ 
            authenticated: true, 
            user: req.session.user 
        });
    } else {
        res.json({ 
            authenticated: false 
        });
    }
}));

// Profile (requires auth)
router.get('/me', asyncHandler(async (req, res) => {
    if (!req.session.user) {
        throw createError(401, 'Not authenticated');
    }
    res.json({ success: true, data: req.session.user });
}));

module.exports = router;

