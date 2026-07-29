/**
 * logger.js - Custom logging middleware
 * 
 * This middleware logs information about incoming HTTP requests
 * It's useful for debugging and monitoring your application
 */

const fs = require('fs').promises;
const path = require('path');

/**
 * Custom logging middleware
 * Logs request information to console and optionally to file
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function (continues to next middleware)
 */
const logger = async (req, res, next) => {
    // Get current timestamp in readable format
    const timestamp = new Date().toISOString();
    
    // Get client IP address (handles proxy scenarios)
    const clientIP = req.headers['x-forwarded-for'] || 
                    req.connection.remoteAddress || 
                    req.socket.remoteAddress ||
                    (req.connection.socket ? req.connection.socket.remoteAddress : null);
    
    // Create log entry with request information
    const logEntry = {
        timestamp: timestamp,
        method: req.method,           // GET, POST, PUT, DELETE, etc.
        url: req.originalUrl,         // The full URL path
        ip: clientIP,                 // Client IP address
        userAgent: req.headers['user-agent'], // Browser/client information
        contentType: req.headers['content-type'], // Request content type
        contentLength: req.headers['content-length'] // Request size
    };
    
    // Log to console with nice formatting
    console.log(`📊 ${logEntry.timestamp} | ${logEntry.method} ${logEntry.url} | IP: ${logEntry.ip}`);
    
    // Store original res.end to intercept response
    const originalEnd = res.end;
    
    // Override res.end to capture response information
    res.end = function(chunk, encoding) {
        // Add response information to log entry
        logEntry.statusCode = res.statusCode;
        logEntry.responseTime = Date.now() - req.startTime;
        
        // Log response information
        const statusEmoji = getStatusEmoji(res.statusCode);
        console.log(`   ${statusEmoji} Status: ${res.statusCode} | Time: ${logEntry.responseTime}ms`);
        
        // Log to file in production or if LOG_TO_FILE is set
        if (process.env.NODE_ENV === 'production' || process.env.LOG_TO_FILE === 'true') {
            logToFile(logEntry);
        }
        
        // Call original res.end
        originalEnd.call(this, chunk, encoding);
    };
    
    // Add start time to request for response time calculation
    req.startTime = Date.now();
    
    // Continue to next middleware
    next();
};

/**
 * Get emoji for HTTP status code
 * Makes logs more visually appealing and easier to scan
 * 
 * @param {number} statusCode - HTTP status code
 * @returns {string} - Emoji representing the status
 */
function getStatusEmoji(statusCode) {
    if (statusCode >= 200 && statusCode < 300) return '✅'; // Success
    if (statusCode >= 300 && statusCode < 400) return '🔀'; // Redirect
    if (statusCode >= 400 && statusCode < 500) return '❌'; // Client Error
    if (statusCode >= 500) return '💥'; // Server Error
    return 'ℹ️'; // Other
}

/**
 * Log entry to file
 * Writes log entries to a daily log file for persistence
 * 
 * @param {Object} logEntry - Log entry object
 */
async function logToFile(logEntry) {
    try {
        // Create logs directory if it doesn't exist
        const logsDir = path.join(__dirname, '..', 'logs');
        try {
            await fs.access(logsDir);
        } catch {
            await fs.mkdir(logsDir, { recursive: true });
        }
        
        // Create filename with current date (one file per day)
        const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const logFile = path.join(logsDir, `access-${date}.log`);
        
        // Format log entry as JSON string
        const logLine = JSON.stringify(logEntry) + '\n';
        
        // Append to log file
        await fs.appendFile(logFile, logLine);
        
    } catch (error) {
        // Don't throw error if logging fails - just log to console
        console.error('Failed to write to log file:', error.message);
    }
}

/**
 * Security logging middleware
 * Logs suspicious activities that might indicate security threats
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const securityLogger = (req, res, next) => {
    // Check for potentially suspicious patterns
    const suspiciousPatterns = [
        /\.\.\//, // Directory traversal attempts
        /<script/i, // XSS attempts
        /union.*select/i, // SQL injection attempts
        /exec\(/, // Command injection attempts
        /eval\(/, // Code injection attempts
    ];
    
    // Check URL and query parameters for suspicious patterns
    const fullUrl = req.originalUrl;
    const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(fullUrl));
    
    if (isSuspicious) {
        console.warn('🚨 SECURITY ALERT:');
        console.warn('   Suspicious request detected');
        console.warn('   IP:', req.ip);
        console.warn('   URL:', fullUrl);
        console.warn('   User-Agent:', req.headers['user-agent']);
        
        // Log to security log file
        const securityLog = {
            timestamp: new Date().toISOString(),
            type: 'SUSPICIOUS_REQUEST',
            ip: req.ip,
            url: fullUrl,
            userAgent: req.headers['user-agent'],
            method: req.method
        };
        
        logSecurityEvent(securityLog);
    }
    
    next();
};

/**
 * Log security events to separate file
 * 
 * @param {Object} securityEvent - Security event object
 */
async function logSecurityEvent(securityEvent) {
    try {
        const logsDir = path.join(__dirname, '..', 'logs');
        const securityLogFile = path.join(logsDir, 'security.log');
        
        const logLine = JSON.stringify(securityEvent) + '\n';
        await fs.appendFile(securityLogFile, logLine);
        
    } catch (error) {
        console.error('Failed to write to security log:', error.message);
    }
}

/**
 * Request rate monitoring
 * Tracks request rates per IP for monitoring purposes
 */
const requestRates = new Map();

const rateMonitor = (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();
    const windowMs = 60000; // 1 minute window
    
    // Get existing rate data for IP
    if (!requestRates.has(ip)) {
        requestRates.set(ip, []);
    }
    
    const requests = requestRates.get(ip);
    
    // Remove old requests outside the window
    const recentRequests = requests.filter(time => now - time < windowMs);
    
    // Add current request
    recentRequests.push(now);
    
    // Update the map
    requestRates.set(ip, recentRequests);
    
    // Log high request rates (more than 30 requests per minute)
    if (recentRequests.length > 30) {
        console.warn(`🚨 HIGH REQUEST RATE: ${recentRequests.length} requests/min from IP ${ip}`);
    }
    
    // Clean up old entries periodically
    if (Math.random() < 0.01) { // 1% chance
        cleanupRateData(now, windowMs * 5); // Clean entries older than 5 minutes
    }
    
    next();
};

/**
 * Clean up old rate monitoring data
 * 
 * @param {number} now - Current timestamp
 * @param {number} maxAge - Maximum age to keep
 */
function cleanupRateData(now, maxAge) {
    for (const [ip, requests] of requestRates.entries()) {
        const recentRequests = requests.filter(time => now - time < maxAge);
        if (recentRequests.length === 0) {
            requestRates.delete(ip);
        } else {
            requestRates.set(ip, recentRequests);
        }
    }
}

// Export middleware functions
module.exports = {
    logger,
    securityLogger,
    rateMonitor
};