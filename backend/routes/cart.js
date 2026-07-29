/**
 * CART ROUTES - Shopping cart management API endpoints
 * 
 * This file handles all cart-related operations for the plant nursery.
 * It demonstrates session management, data persistence, and cart logic.
 * 
 * LEARNING OBJECTIVES:
 * - Shopping cart functionality implementation
 * - Session management without databases
 * - File-based data persistence
 * - Cart item calculations (totals, taxes, discounts)
 * - UUID generation for unique cart sessions
 * - Input validation for cart operations
 * - RESTful cart API design
 * 
 * CART SESSION CONCEPT:
 * Each cart is identified by a unique session ID (UUID).
 * Cart data is stored in a JSON file with the following structure:
 * {
 *   sessionId: "uuid-string",
 *   items: [{ productId, quantity, price, name }],
 *   totals: { subtotal, tax, shipping, total },
 *   createdAt: timestamp,
 *   updatedAt: timestamp
 * }
 */

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid'); // For generating unique session IDs
const { body, param, validationResult } = require('express-validator');
const { asyncHandler, createError } = require('../middleware/errorHandler');

const router = express.Router();

// File paths for data storage
const CARTS_FILE = path.join(__dirname, '../data/carts.json');
const PRODUCTS_FILE = path.join(__dirname, '../data/products.json');

/**
 * HELPER FUNCTIONS
 */

/**
 * Read all cart sessions from file
 * @returns {Array} Array of cart objects
 */
async function readCarts() {
    try {
        const data = await fs.readFile(CARTS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        if (error.code === 'ENOENT') {
            console.log('Carts file not found, returning empty array');
            return [];
        }
        console.error('Error reading carts:', error);
        throw error;
    }
}

/**
 * Write carts to file
 * @param {Array} carts - Array of cart objects to save
 */
async function writeCarts(carts) {
    try {
        const data = JSON.stringify(carts, null, 2);
        await fs.writeFile(CARTS_FILE, data, 'utf8');
    } catch (error) {
        console.error('Error writing carts:', error);
        throw error;
    }
}

/**
 * Read products from file (to get product details for cart items)
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
        console.error('Error reading products:', error);
        throw error;
    }
}

/**
 * Find a cart by session ID
 * @param {Array} carts - Array of cart objects
 * @param {string} sessionId - Cart session ID
 * @returns {Object|null} Cart object or null if not found
 */
function findCartBySessionId(carts, sessionId) {
    return carts.find(cart => cart.sessionId === sessionId) || null;
}

/**
 * Calculate cart totals
 * @param {Array} items - Cart items
 * @returns {Object} Totals object with subtotal, tax, shipping, total
 */
function calculateCartTotals(items) {
    // Calculate subtotal (sum of all item prices * quantities)
    const subtotal = items.reduce((sum, item) => {
        return sum + (item.price * item.quantity);
    }, 0);
    
    // Calculate tax (8.5% - this would be configurable in a real app)
    const taxRate = 0.085;
    const tax = subtotal * taxRate;
    
    // Calculate shipping (free over $75, otherwise $9.99)
    const shippingThreshold = 75;
    const shippingCost = 9.99;
    const shipping = subtotal >= shippingThreshold ? 0 : shippingCost;
    
    // Calculate total
    const total = subtotal + tax + shipping;
    
    return {
        subtotal: Math.round(subtotal * 100) / 100,      // Round to 2 decimal places
        tax: Math.round(tax * 100) / 100,
        shipping: Math.round(shipping * 100) / 100,
        total: Math.round(total * 100) / 100,
        freeShipping: subtotal >= shippingThreshold,
        amountForFreeShipping: subtotal >= shippingThreshold ? 0 : 
            Math.round((shippingThreshold - subtotal) * 100) / 100
    };
}

/**
 * Create a new empty cart
 * @returns {Object} New cart object
 */
function createNewCart() {
    const now = new Date().toISOString();
    return {
        sessionId: uuidv4(),          // Generate unique session ID
        items: [],                    // Empty items array
        totals: calculateCartTotals([]), // Calculate totals for empty cart
        createdAt: now,
        updatedAt: now,
        itemCount: 0                  // Total number of items in cart
    };
}

/**
 * Update cart totals and item count
 * @param {Object} cart - Cart object to update
 */
function updateCartCalculations(cart) {
    cart.totals = calculateCartTotals(cart.items);
    cart.itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    cart.updatedAt = new Date().toISOString();
}

/**
 * ROUTE DEFINITIONS
 */

/**
 * POST /api/cart/create
 * Create a new cart session
 * Returns a new cart with a unique session ID
 */
router.post('/create', asyncHandler(async (req, res) => {
    console.log('Creating new cart session');
    
    // Create new cart
    const newCart = createNewCart();
    
    // Read existing carts and add new one
    const carts = await readCarts();
    carts.push(newCart);
    
    // Save to file
    await writeCarts(carts);
    
    res.status(201).json({
        success: true,
        data: newCart,
        message: 'New cart created successfully'
    });
}));

/**
 * GET /api/cart/:sessionId
 * Get cart by session ID
 */
router.get('/:sessionId',
    [
        param('sessionId').isUUID(4)
            .withMessage('Session ID must be a valid UUID')
    ],
    
    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid session ID',
                errors: errors.array()
            });
        }
        
        const { sessionId } = req.params;
        console.log(`Getting cart for session: ${sessionId}`);
        
        const carts = await readCarts();
        const cart = findCartBySessionId(carts, sessionId);
        
        if (!cart) {
            throw createError(404, 'Cart not found');
        }
        
        res.json({
            success: true,
            data: cart,
            message: 'Cart retrieved successfully'
        });
    })
);

/**
 * POST /api/cart/:sessionId/items
 * Add an item to the cart
 * 
 * Request Body:
 * {
 *   productId: number,
 *   quantity: number (optional, defaults to 1)
 * }
 */
router.post('/:sessionId/items',
    [
        param('sessionId').isUUID(4)
            .withMessage('Session ID must be a valid UUID'),
        body('productId').isInt({ min: 1 })
            .withMessage('Product ID must be a positive integer'),
        body('quantity').optional().isInt({ min: 1, max: 99 })
            .withMessage('Quantity must be between 1 and 99')
    ],
    
    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid request data',
                errors: errors.array()
            });
        }
        
        const { sessionId } = req.params;
        const { productId, quantity = 1 } = req.body;
        
        console.log(`Adding product ${productId} (qty: ${quantity}) to cart ${sessionId}`);
        
        // Read carts and products
        const carts = await readCarts();
        const products = await readProducts();
        
        // Find cart
        let cart = findCartBySessionId(carts, sessionId);
        if (!cart) {
            throw createError(404, 'Cart not found');
        }
        
        // Find product
        const product = products.find(p => p.id === productId);
        if (!product) {
            throw createError(404, 'Product not found');
        }
        
        // Check if product is in stock
        if (!product.inStock) {
            throw createError(400, 'Product is out of stock');
        }
        
        // Check if item already exists in cart
        const existingItemIndex = cart.items.findIndex(item => item.productId === productId);
        
        if (existingItemIndex >= 0) {
            // Update existing item quantity
            const existingItem = cart.items[existingItemIndex];
            const newQuantity = existingItem.quantity + quantity;
            
            // Check quantity limits
            if (newQuantity > 99) {
                throw createError(400, 'Maximum quantity per item is 99');
            }
            
            cart.items[existingItemIndex].quantity = newQuantity;
            console.log(`Updated item quantity to ${newQuantity}`);
        } else {
            // Add new item to cart
            const cartItem = {
                productId: product.id,
                name: product.name,
                price: product.price,
                originalPrice: product.originalPrice,
                image: product.image,
                size: product.size,
                quantity: quantity,
                addedAt: new Date().toISOString()
            };
            
            cart.items.push(cartItem);
            console.log('Added new item to cart');
        }
        
        // Update cart calculations
        updateCartCalculations(cart);
        
        // Find cart index and update in array
        const cartIndex = carts.findIndex(c => c.sessionId === sessionId);
        carts[cartIndex] = cart;
        
        // Save to file
        await writeCarts(carts);
        
        // Emit Socket.io event for real-time cart updates
        const io = req.app.get('io');
        if (io) {
            io.emit('cart:updated', {
                sessionId: cart.sessionId,
                action: 'item_added',
                itemCount: cart.itemCount,
                totals: cart.totals,
                product: { id: product.id, name: product.name, quantity }
            });
        }
        
        res.json({
            success: true,
            data: cart,
            message: `Added ${product.name} to cart successfully`
        });
    })
);

/**
 * PUT /api/cart/:sessionId/items/:productId
 * Update item quantity in cart
 * 
 * Request Body:
 * {
 *   quantity: number (1-99)
 * }
 */
router.put('/:sessionId/items/:productId',
    [
        param('sessionId').isUUID(4)
            .withMessage('Session ID must be a valid UUID'),
        param('productId').isInt({ min: 1 })
            .withMessage('Product ID must be a positive integer'),
        body('quantity').isInt({ min: 1, max: 99 })
            .withMessage('Quantity must be between 1 and 99')
    ],
    
    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid request data',
                errors: errors.array()
            });
        }
        
        const { sessionId, productId } = req.params;
        const { quantity } = req.body;
        
        console.log(`Updating product ${productId} quantity to ${quantity} in cart ${sessionId}`);
        
        const carts = await readCarts();
        let cart = findCartBySessionId(carts, sessionId);
        
        if (!cart) {
            throw createError(404, 'Cart not found');
        }
        
        // Find item in cart
        const itemIndex = cart.items.findIndex(item => item.productId === parseInt(productId));
        if (itemIndex === -1) {
            throw createError(404, 'Item not found in cart');
        }
        
        // Update quantity
        cart.items[itemIndex].quantity = quantity;
        
        // Update cart calculations
        updateCartCalculations(cart);
        
        // Update cart in array
        const cartIndex = carts.findIndex(c => c.sessionId === sessionId);
        carts[cartIndex] = cart;
        
        // Save to file
        await writeCarts(carts);
        
        // Emit Socket.io event for real-time cart updates
        const io = req.app.get('io');
        if (io) {
            io.emit('cart:updated', {
                sessionId: cart.sessionId,
                action: 'item_quantity_updated',
                itemCount: cart.itemCount,
                totals: cart.totals,
                productId: parseInt(productId),
                quantity
            });
        }
        
        res.json({
            success: true,
            data: cart,
            message: 'Cart item updated successfully'
        });
    })
);

/**
 * DELETE /api/cart/:sessionId/items/:productId
 * Remove an item from the cart
 */
router.delete('/:sessionId/items/:productId',
    [
        param('sessionId').isUUID(4)
            .withMessage('Session ID must be a valid UUID'),
        param('productId').isInt({ min: 1 })
            .withMessage('Product ID must be a positive integer')
    ],
    
    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid request parameters',
                errors: errors.array()
            });
        }
        
        const { sessionId, productId } = req.params;
        
        console.log(`Removing product ${productId} from cart ${sessionId}`);
        
        const carts = await readCarts();
        let cart = findCartBySessionId(carts, sessionId);
        
        if (!cart) {
            throw createError(404, 'Cart not found');
        }
        
        // Find and remove item
        const itemIndex = cart.items.findIndex(item => item.productId === parseInt(productId));
        if (itemIndex === -1) {
            throw createError(404, 'Item not found in cart');
        }
        
        const removedItem = cart.items[itemIndex];
        cart.items.splice(itemIndex, 1);
        
        // Update cart calculations
        updateCartCalculations(cart);
        
        // Update cart in array
        const cartIndex = carts.findIndex(c => c.sessionId === sessionId);
        carts[cartIndex] = cart;
        
        // Save to file
        await writeCarts(carts);
        
        // Emit Socket.io event for real-time cart updates
        const io = req.app.get('io');
        if (io) {
            io.emit('cart:updated', {
                sessionId: cart.sessionId,
                action: 'item_removed',
                itemCount: cart.itemCount,
                totals: cart.totals,
                product: { id: parseInt(productId), name: removedItem.name }
            });
        }
        
        res.json({
            success: true,
            data: cart,
            message: `Removed ${removedItem.name} from cart successfully`
        });
    })
);

/**
 * DELETE /api/cart/:sessionId/clear
 * Clear all items from the cart
 */
router.delete('/:sessionId/clear',
    [
        param('sessionId').isUUID(4)
            .withMessage('Session ID must be a valid UUID')
    ],
    
    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid session ID',
                errors: errors.array()
            });
        }
        
        const { sessionId } = req.params;
        
        console.log(`Clearing cart ${sessionId}`);
        
        const carts = await readCarts();
        let cart = findCartBySessionId(carts, sessionId);
        
        if (!cart) {
            throw createError(404, 'Cart not found');
        }
        
        // Clear items
        cart.items = [];
        updateCartCalculations(cart);
        
        // Update cart in array
        const cartIndex = carts.findIndex(c => c.sessionId === sessionId);
        carts[cartIndex] = cart;
        
        // Save to file
        await writeCarts(carts);
        
        // Emit Socket.io event for real-time cart updates
        const io = req.app.get('io');
        if (io) {
            io.emit('cart:updated', {
                sessionId: cart.sessionId,
                action: 'cart_cleared',
                itemCount: 0,
                totals: cart.totals
            });
        }
        
        res.json({
            success: true,
            data: cart,
            message: 'Cart cleared successfully'
        });
    })
);

/**
 * GET /api/cart/:sessionId/summary
 * Get cart summary with totals and item count
 * This is useful for displaying cart information in headers/navbars
 */
router.get('/:sessionId/summary',
    [
        param('sessionId').isUUID(4)
            .withMessage('Session ID must be a valid UUID')
    ],
    
    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid session ID',
                errors: errors.array()
            });
        }
        
        const { sessionId } = req.params;
        
        const carts = await readCarts();
        const cart = findCartBySessionId(carts, sessionId);
        
        if (!cart) {
            throw createError(404, 'Cart not found');
        }
        
        // Return only summary information (not full item details)
        const summary = {
            sessionId: cart.sessionId,
            itemCount: cart.itemCount,
            totals: cart.totals,
            hasItems: cart.items.length > 0,
            updatedAt: cart.updatedAt
        };
        
        res.json({
            success: true,
            data: summary,
            message: 'Cart summary retrieved successfully'
        });
    })
);

/**
 * POST /api/cart/:sessionId/validate
 * Validate cart items (check stock, prices, etc.)
 * This should be called before checkout to ensure all items are still available
 */
router.post('/:sessionId/validate',
    [
        param('sessionId').isUUID(4)
            .withMessage('Session ID must be a valid UUID')
    ],
    
    asyncHandler(async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Invalid session ID',
                errors: errors.array()
            });
        }
        
        const { sessionId } = req.params;
        
        console.log(`Validating cart ${sessionId}`);
        
        const carts = await readCarts();
        const products = await readProducts();
        let cart = findCartBySessionId(carts, sessionId);
        
        if (!cart) {
            throw createError(404, 'Cart not found');
        }
        
        const validationIssues = [];
        let hasChanges = false;
        
        // Validate each item in cart
        for (let i = cart.items.length - 1; i >= 0; i--) {
            const cartItem = cart.items[i];
            const product = products.find(p => p.id === cartItem.productId);
            
            if (!product) {
                // Product no longer exists
                validationIssues.push({
                    type: 'product_removed',
                    productId: cartItem.productId,
                    message: `${cartItem.name} is no longer available and has been removed from your cart`
                });
                cart.items.splice(i, 1);
                hasChanges = true;
            } else if (!product.inStock) {
                // Product out of stock
                validationIssues.push({
                    type: 'out_of_stock',
                    productId: cartItem.productId,
                    message: `${product.name} is currently out of stock and has been removed from your cart`
                });
                cart.items.splice(i, 1);
                hasChanges = true;
            } else if (product.price !== cartItem.price) {
                // Price changed
                validationIssues.push({
                    type: 'price_change',
                    productId: cartItem.productId,
                    oldPrice: cartItem.price,
                    newPrice: product.price,
                    message: `The price of ${product.name} has changed from $${cartItem.price} to $${product.price}`
                });
                cartItem.price = product.price;
                hasChanges = true;
            }
        }
        
        // Update cart if there were changes
        if (hasChanges) {
            updateCartCalculations(cart);
            
            const cartIndex = carts.findIndex(c => c.sessionId === sessionId);
            carts[cartIndex] = cart;
            await writeCarts(carts);
        }
        
        const isValid = validationIssues.length === 0;
        
        res.json({
            success: true,
            data: {
                cart: cart,
                isValid: isValid,
                issues: validationIssues,
                hasChanges: hasChanges
            },
            message: isValid ? 'Cart is valid' : `Cart validation found ${validationIssues.length} issues`
        });
    })
);

module.exports = router;