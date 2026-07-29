/**
 * GENERAL API ROUTES - Miscellaneous API endpoints
 * 
 * This file contains various utility endpoints that don't fit into
 * specific resource categories like products or cart.
 * 
 * LEARNING OBJECTIVES:
 * - API health checks and monitoring
 * - Search functionality across multiple resources
 * - Contact form handling
 * - Newsletter subscription management
 * - File upload handling (future: plant images)
 * - Rate limiting implementation
 * - API documentation endpoints
 * 
 * ENDPOINTS INCLUDED:
 * - Health check
 * - API information
 * - Global search
 * - Contact form submission
 * - Newsletter subscription
 * - Popular products
 * - Recent products
 */

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { body, query, validationResult } = require('express-validator');
const { asyncHandler, createError } = require('../middleware/errorHandler');
const client = require('../config/redisClient');

const router = express.Router();

// File paths
const PRODUCTS_FILE = path.join(__dirname, '../data/products.json');
const CONTACTS_FILE = path.join(__dirname, '../data/contacts.json');
const NEWSLETTER_FILE = path.join(__dirname, '../data/newsletter.json');
const SERVICES_BOOKINGS_FILE = path.join(__dirname, '../data/services-bookings.json');

/**
 * HELPER FUNCTIONS
 */

/**
 * Read products from file
 * @returns {Array} Array of product objects
 */
async function readProducts() {
    try {
        const data = await fs.readFile(PRODUCTS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}

/**
 * Read contacts from file
 * @returns {Array} Array of contact submissions
 */
async function readContacts() {
    try {
        const data = await fs.readFile(CONTACTS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}

/**
 * Write contacts to file
 * @param {Array} contacts - Array of contact submissions
 */
async function writeContacts(contacts) {
    try {
        const data = JSON.stringify(contacts, null, 2);
        await fs.writeFile(CONTACTS_FILE, data, 'utf8');
    } catch (error) {
        console.error('Error writing contacts:', error);
        throw error;
    }
}

/**
 * Read newsletter subscriptions from file
 * @returns {Array} Array of newsletter subscriptions
 */
async function readNewsletterSubscriptions() {
    try {
        const data = await fs.readFile(NEWSLETTER_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}

/**
 * Write newsletter subscriptions to file
 * @param {Array} subscriptions - Array of newsletter subscriptions
 */
async function writeNewsletterSubscriptions(subscriptions) {
    try {
        const data = JSON.stringify(subscriptions, null, 2);
        await fs.writeFile(NEWSLETTER_FILE, data, 'utf8');
    } catch (error) {
        console.error('Error writing newsletter subscriptions:', error);
        throw error;
    }
}

/**
 * Read and write service bookings
 */
async function readServiceBookings() {
    try {
        const data = await fs.readFile(SERVICES_BOOKINGS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            return [];
        }
        throw error;
    }
}

async function writeServiceBookings(bookings) {
    try {
        const data = JSON.stringify(bookings, null, 2);
        await fs.writeFile(SERVICES_BOOKINGS_FILE, data, 'utf8');
    } catch (error) {
        console.error('Error writing service bookings:', error);
        throw error;
    }
}

/**
 * ROUTE DEFINITIONS
 */

/**
 * GET /api/health
 * Health check endpoint - useful for monitoring and deployment
 * This endpoint should always return quickly and indicate if the API is working
 */
router.get('/health', asyncHandler(async (req, res) => {
    const startTime = Date.now();
    
    // Check if we can read data files (basic functionality test)
    let dataHealth = 'healthy';
    try {
        await readProducts();
    } catch (error) {
        dataHealth = 'error';
        console.error('Health check - data error:', error.message);
    }
    
    const responseTime = Date.now() - startTime;
    
    const healthData = {
        status: dataHealth === 'healthy' ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        responseTime: `${responseTime}ms`,
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        services: {
            api: 'healthy',
            dataStore: dataHealth
        }
    };
    
    // Return 200 if healthy, 503 if degraded
    const statusCode = healthData.status === 'healthy' ? 200 : 503;
    
    res.status(statusCode).json({
        success: healthData.status === 'healthy',
        data: healthData,
        message: `API is ${healthData.status}`
    });
}));

/**
 * GET /api/info
 * API information and documentation
 * Returns information about available endpoints and API version
 */
router.get('/info', asyncHandler(async (req, res) => {
    const apiInfo = {
        name: 'Plant Nursery API',
        version: '1.0.0',
        description: 'RESTful API for a plant nursery e-commerce website',
        author: 'Plant Nursery Team',
        documentation: '/api/docs',
        endpoints: {
            products: {
                base: '/api/products',
                methods: ['GET', 'POST', 'PUT', 'DELETE'],
                description: 'Product management and catalog browsing'
            },
            cart: {
                base: '/api/cart',
                methods: ['GET', 'POST', 'PUT', 'DELETE'],
                description: 'Shopping cart management'
            },
            general: {
                base: '/api',
                methods: ['GET', 'POST'],
                description: 'General utilities, search, contact forms'
            }
        },
        features: [
            'Product catalog management',
            'Shopping cart functionality',
            'Search and filtering',
            'Contact form handling',
            'Newsletter subscriptions',
            'Health monitoring',
            'Input validation',
            'Error handling',
            'Request logging'
        ],
        lastUpdated: new Date().toISOString()
    };
    
    res.json({
        success: true,
        data: apiInfo,
        message: 'API information retrieved successfully'
    });
}));

/**
 * GET /api/search
 * Global search across products
 * Searches product names, descriptions, and categories
 * 
 * Query Parameters:
 * - q: Search query string
 * - limit: Maximum results to return (default: 10, max: 50)
 * - category: Filter by category
 */
router.get('/search',
    [
        query('q').notEmpty().isLength({ min: 1, max: 100 })
            .withMessage('Search query is required and must be 1-100 characters'),
        query('limit').optional().isInt({ min: 1, max: 50 })
            .withMessage('Limit must be between 1 and 50'),
        query('category').optional().isIn(['indoor', 'outdoor', 'flowering', 'succulent'])
            .withMessage('Invalid category')
    ],
    
    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid search parameters',
                errors: errors.array()
            });
        }
        
        const { q: query, limit = 10, category } = req.query;
        const searchTerm = query.toLowerCase();
        
        console.log(`Searching for: "${query}"${category ? ` in category: ${category}` : ''}`);
        
        // Read products
        let products = await readProducts();
        
        // Filter by category if specified
        if (category) {
            products = products.filter(product => 
                product.category.toLowerCase() === category.toLowerCase()
            );
        }
        
        // Search in multiple fields
        const searchResults = products.filter(product => {
            const searchableText = [
                product.name,
                product.description,
                product.category,
                product.care,
                product.size,
                product.badge,
                Object.values(product.details || {}).join(' ')
            ].join(' ').toLowerCase();
            
            return searchableText.includes(searchTerm);
        });
        
        // Sort by relevance (simple scoring based on where the match occurs)
        searchResults.sort((a, b) => {
            const aNameMatch = a.name.toLowerCase().includes(searchTerm) ? 10 : 0;
            const bNameMatch = b.name.toLowerCase().includes(searchTerm) ? 10 : 0;
            const aCategoryMatch = a.category.toLowerCase().includes(searchTerm) ? 5 : 0;
            const bCategoryMatch = b.category.toLowerCase().includes(searchTerm) ? 5 : 0;
            const aDescMatch = a.description.toLowerCase().includes(searchTerm) ? 2 : 0;
            const bDescMatch = b.description.toLowerCase().includes(searchTerm) ? 2 : 0;
            
            const aScore = aNameMatch + aCategoryMatch + aDescMatch + a.rating;
            const bScore = bNameMatch + bCategoryMatch + bDescMatch + b.rating;
            
            return bScore - aScore;
        });
        
        // Limit results
        const limitedResults = searchResults.slice(0, parseInt(limit));
        
        res.json({
            success: true,
            data: {
                results: limitedResults,
                query: query,
                category: category || 'all',
                totalFound: searchResults.length,
                limit: parseInt(limit),
                hasMore: searchResults.length > parseInt(limit)
            },
            message: `Found ${searchResults.length} results for "${query}"`
        });
    })
);

/**
 * POST /api/contact
 * Handle contact form submissions
 * 
 * Request Body:
 * {
 *   name: string,
 *   email: string,
 *   subject: string,
 *   message: string,
 *   phone?: string (optional)
 * }
 */
router.post('/contact',
    [
        body('name').notEmpty().isLength({ min: 2, max: 100 })
            .withMessage('Name is required and must be 2-100 characters'),
        body('email').isEmail().normalizeEmail()
            .withMessage('Valid email is required'),
        body('subject').notEmpty().isLength({ min: 5, max: 200 })
            .withMessage('Subject is required and must be 5-200 characters'),
        body('message').notEmpty().isLength({ min: 10, max: 1000 })
            .withMessage('Message is required and must be 10-1000 characters'),
        body('phone').optional().isMobilePhone('any', { strictMode: false })
            .withMessage('Invalid phone number format')
    ],
    
    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid contact form data',
                errors: errors.array()
            });
        }
        
        const { name, email, subject, message, phone } = req.body;
        
        console.log(`New contact form submission from: ${name} (${email})`);
        
        // Create contact submission object
        const contactSubmission = {
            id: Date.now(), // Simple ID based on timestamp
            name,
            email,
            subject,
            message,
            phone: phone || null,
            submittedAt: new Date().toISOString(),
            status: 'new', // new, read, responded
            ipAddress: req.ip || req.connection.remoteAddress
        };
        
        // Read existing contacts and add new one
        const contacts = await readContacts();
        contacts.push(contactSubmission);
        
        // Save to file
        await writeContacts(contacts);
        
        // In a real application, you would:
        // 1. Send email notification to admin
        // 2. Send confirmation email to user
        // 3. Store in database instead of JSON file
        // 4. Maybe integrate with CRM system
        
        res.status(201).json({
            success: true,
            data: {
                id: contactSubmission.id,
                submittedAt: contactSubmission.submittedAt
            },
            message: 'Contact form submitted successfully. We will get back to you soon!'
        });
    })
);

/**
 * POST /api/newsletter/subscribe
 * Handle newsletter subscription
 * 
 * Request Body:
 * {
 *   email: string,
 *   name?: string (optional)
 * }
 */
router.post('/newsletter/subscribe',
    [
        body('email').isEmail().normalizeEmail()
            .withMessage('Valid email is required'),
        body('name').optional().isLength({ min: 2, max: 100 })
            .withMessage('Name must be 2-100 characters if provided')
    ],
    
    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid subscription data',
                errors: errors.array()
            });
        }
        
        const { email, name } = req.body;
        
        console.log(`New newsletter subscription: ${email}`);
        
        // Read existing subscriptions
        const subscriptions = await readNewsletterSubscriptions();
        
        // Check if email already exists
        const existingSubscription = subscriptions.find(sub => sub.email === email);
        if (existingSubscription) {
            if (existingSubscription.status === 'active') {
                return res.status(409).json({
                    success: false,
                    message: 'This email is already subscribed to our newsletter'
                });
            } else {
                // Reactivate subscription
                existingSubscription.status = 'active';
                existingSubscription.resubscribedAt = new Date().toISOString();
                existingSubscription.name = name || existingSubscription.name;
            }
        } else {
            // Create new subscription
            const newSubscription = {
                id: Date.now(),
                email,
                name: name || null,
                status: 'active', // active, unsubscribed
                subscribedAt: new Date().toISOString(),
                ipAddress: req.ip || req.connection.remoteAddress,
                source: 'website' // website, popup, checkout, etc.
            };
            
            subscriptions.push(newSubscription);
        }
        
        // Save to file
        await writeNewsletterSubscriptions(subscriptions);
        
        res.status(201).json({
            success: true,
            message: 'Successfully subscribed to our newsletter!'
        });
    })
);

/**
 * POST /api/services/book
 * Create a service booking entry
 */
router.post('/services/book',
    [
        body('customerName').notEmpty().isLength({ min: 2, max: 100 })
            .withMessage('Name is required'),
        body('customerEmail').isEmail().normalizeEmail()
            .withMessage('Valid email is required'),
        body('customerPhone').optional().isLength({ min: 7, max: 20 })
            .withMessage('Phone must be 7-20 characters'),
        body('preferredDate').notEmpty()
            .withMessage('Preferred date is required'),
        body('preferredTime').notEmpty()
            .withMessage('Preferred time is required'),
        body('serviceType').notEmpty().isLength({ min: 3, max: 100 })
            .withMessage('Service type is required'),
        body('serviceAddress').notEmpty().isLength({ min: 5 })
            .withMessage('Service address is required')
    ],
    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid booking data',
                errors: errors.array()
            });
        }

        const booking = {
            id: Date.now(),
            ...req.body,
            createdAt: new Date().toISOString(),
            status: 'pending'
        };

        const bookings = await readServiceBookings();
        bookings.push(booking);
        await writeServiceBookings(bookings);

        res.status(201).json({
            success: true,
            data: { id: booking.id },
            message: 'Service booking received. We will contact you shortly.'
        });
    })
);

/**
 * GET /api/popular
 * Get popular products based on ratings and reviews
 * Returns top-rated products with most reviews
 */
router.get('/popular',
    [
        query('limit').optional().isInt({ min: 1, max: 20 })
            .withMessage('Limit must be between 1 and 20')
    ],
    
    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid parameters',
                errors: errors.array()
            });
        }
        
        const limit = parseInt(req.query.limit) || 8;
        
        console.log(`Getting ${limit} popular products`);
        
        const products = await readProducts();
        
        // Calculate popularity score (rating * reviews with some weighting)
        const popularProducts = products
            .filter(product => product.inStock) // Only show in-stock items
            .map(product => ({
                ...product,
                popularityScore: (product.rating * product.reviews) + (product.rating * 10)
            }))
            .sort((a, b) => b.popularityScore - a.popularityScore)
            .slice(0, limit)
            .map(product => {
                // Remove the temporary popularityScore from response
                const { popularityScore, ...productWithoutScore } = product;
                return productWithoutScore;
            });
        
        res.json({
            success: true,
            data: {
                products: popularProducts,
                count: popularProducts.length,
                criteria: 'Based on customer ratings and review counts'
            },
            message: `Retrieved ${popularProducts.length} popular products`
        });
    })
);

/**
 * GET /api/featured
 * Get featured products (products with special badges)
 * Returns products that have been marked as featured or have special badges
 */
router.get('/featured',
    [
        query('limit').optional().isInt({ min: 1, max: 20 })
            .withMessage('Limit must be between 1 and 20')
    ],
    
    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid parameters',
                errors: errors.array()
            });
        }
        
        const limit = parseInt(req.query.limit) || 6;
        
        console.log(`Getting ${limit} featured products`);
        
        const products = await readProducts();
        
        // Define featured badges priority
        const featuredBadges = ['popular', 'new', 'sale', 'exotic', 'beginner-friendly'];
        
        const featuredProducts = products
            .filter(product => product.inStock && product.badge && featuredBadges.includes(product.badge))
            .sort((a, b) => {
                // Sort by badge priority, then by rating
                const aPriority = featuredBadges.indexOf(a.badge);
                const bPriority = featuredBadges.indexOf(b.badge);
                
                if (aPriority !== bPriority) {
                    return aPriority - bPriority;
                }
                
                return b.rating - a.rating;
            })
            .slice(0, limit);
        
        res.json({
            success: true,
            data: {
                products: featuredProducts,
                count: featuredProducts.length,
                badges: featuredBadges
            },
            message: `Retrieved ${featuredProducts.length} featured products`
        });
    })
);

/**
 * GET /api/categories
 * Get all available product categories with counts
 * Useful for building navigation menus and filters
 */
router.get('/categories', asyncHandler(async (req, res) => {
    console.log('Getting product categories');
    
    const products = await readProducts();
    
    // Count products in each category
    const categoryCounts = products.reduce((counts, product) => {
        const category = product.category;
        counts[category] = (counts[category] || 0) + 1;
        return counts;
    }, {});
    
    // Format response
    const categories = Object.entries(categoryCounts).map(([name, count]) => ({
        name,
        count,
        inStockCount: products.filter(p => p.category === name && p.inStock).length
    }));
    
    res.json({
        success: true,
        data: {
            categories,
            totalCategories: categories.length,
            totalProducts: products.length
        },
        message: 'Product categories retrieved successfully'
    });
}));

/**
 * GET /api/redis/stats
 * Get Redis cache statistics
 * Shows cache performance metrics and stored keys
 */
router.get('/redis/stats', asyncHandler(async (req, res) => {
    try {
        console.log('📊 Getting Redis cache statistics...');
        
        // Get Redis info
        const info = await client.info('stats');
        const dbSize = await client.dbSize();
        
        // Get all keys matching our pattern
        const keys = await client.keys('/api/*');
        
        // Get TTL for some keys (first 5)
        const keyDetails = await Promise.all(
            keys.slice(0, 5).map(async (key) => {
                const ttl = await client.ttl(key);
                return {
                    key: key,
                    ttl: ttl > 0 ? `${ttl}s` : 'expired/no expiry'
                };
            })
        );
        
        // Parse info string for useful stats
        const infoLines = info.split('\r\n');
        const stats = {};
        infoLines.forEach(line => {
            if (line.includes(':')) {
                const [key, value] = line.split(':');
                stats[key] = value;
            }
        });
        
        res.json({
            success: true,
            data: {
                enabled: true,
                totalKeys: dbSize,
                cachedEndpoints: keys.length,
                sampleKeys: keyDetails,
                cacheHits: stats.keyspace_hits || 'N/A',
                cacheMisses: stats.keyspace_misses || 'N/A',
                hitRate: stats.keyspace_hits && stats.keyspace_misses 
                    ? `${((parseInt(stats.keyspace_hits) / (parseInt(stats.keyspace_hits) + parseInt(stats.keyspace_misses))) * 100).toFixed(2)}%`
                    : 'N/A',
                evictedKeys: stats.evicted_keys || '0',
                expiredKeys: stats.expired_keys || '0',
                uptime: stats.uptime_in_seconds ? `${Math.floor(stats.uptime_in_seconds / 3600)}h` : 'N/A'
            },
            message: '✅ Redis cache statistics retrieved successfully'
        });
    } catch (error) {
        console.error('❌ Redis stats error:', error);
        res.json({
            success: false,
            data: {
                enabled: false,
                error: 'Redis not available or not configured'
            },
            message: '⚠️ Redis cache is not available'
        });
    }
}));

/**
 * POST /api/redis/clear
 * Clear Redis cache (admin function)
 */
router.post('/redis/clear', asyncHandler(async (req, res) => {
    try {
        console.log('🧹 Clearing Redis cache...');
        
        // Get all keys matching our pattern
        const keys = await client.keys('/api/*');
        
        if (keys.length > 0) {
            await client.del(keys);
            console.log(`✅ Cleared ${keys.length} cached endpoints`);
        }
        
        res.json({
            success: true,
            data: {
                clearedKeys: keys.length
            },
            message: `✅ Redis cache cleared (${keys.length} keys removed)`
        });
    } catch (error) {
        console.error('❌ Redis clear error:', error);
        res.status(500).json({
            success: false,
            message: '❌ Failed to clear Redis cache',
            error: error.message
        });
    }
}));

module.exports = router;