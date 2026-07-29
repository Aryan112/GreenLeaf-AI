/**
 * errorHandler.js - Global error handling middleware
 * 
 * This middleware catches all errors that occur in the application
 * and sends appropriate responses to the client.
 * 
 * In Express.js, error handling middleware must have exactly 4 parameters:
 * (error, req, res, next)
 */

/**
 * Global error handler middleware
 * @param {Error} error - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object  
 * @param {Function} next - Express next function
 */
const errorHandler = (error, req, res, next) => {
    // Log the error for debugging
    console.error('💥 Error occurred:');
    console.error('   Path:', req.method, req.originalUrl);
    console.error('   Error:', error.message);
    console.error('   Stack:', error.stack);
    
    // Set default error status and message
    let statusCode = error.statusCode || 500; // Internal Server Error
    let message = error.message || 'Internal Server Error';
    
    // Handle specific error types
    switch (error.name) {
        case 'ValidationError':
            // Handle validation errors (from express-validator or similar)
            statusCode = 400; // Bad Request
            message = 'Validation Error';
            break;
            
        case 'CastError':
            // Handle database casting errors
            statusCode = 400; // Bad Request
            message = 'Invalid data format';
            break;
            
        case 'JsonWebTokenError':
            // Handle JWT token errors
            statusCode = 401; // Unauthorized
            message = 'Invalid token';
            break;
            
        case 'TokenExpiredError':
            // Handle expired JWT tokens
            statusCode = 401; // Unauthorized
            message = 'Token expired';
            break;
    }
    
    // Create error response object
    const errorResponse = {
        success: false,
        error: {
            message: message,
            status: statusCode
        }
    };
    
    // In development, include stack trace for debugging
    if (process.env.NODE_ENV === 'development') {
        errorResponse.error.stack = error.stack;
        errorResponse.error.details = error;
    }
    
    // Send error response
    res.status(statusCode).json(errorResponse);
};

/**
 * Async error wrapper
 * This utility function wraps async route handlers to catch errors automatically
 * Without this, you'd need try/catch in every async route handler
 * 
 * Usage: app.get('/route', asyncHandler(async (req, res) => { ... }))
 * 
 * @param {Function} fn - Async function to wrap
 * @returns {Function} - Wrapped function
 */
const asyncHandler = (fn) => {
    return (req, res, next) => {
        // Execute the async function and catch any errors
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

/**
 * Create custom error with status code
 * This utility helps create errors with specific status codes
 * 
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @returns {Error} - Custom error object
 */
const createError = (message, statusCode = 500) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};

// Export the error handler and utilities
module.exports = {
    errorHandler,
    asyncHandler,
    createError
};