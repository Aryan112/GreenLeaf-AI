/**
 * JWT Authentication Middleware
 * Provides token-based authentication alongside session-based auth
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'plant_nursery_jwt_secret_key_2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Generate JWT token for a user
 * @param {Object} user - User object with id, email, name
 * @returns {String} JWT token
 */
function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Verify JWT token
 * @param {String} token - JWT token to verify
 * @returns {Object} Decoded token payload or null
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Middleware to verify JWT from Authorization header
 * Supports both session-based and token-based authentication
 */
function authenticateJWT(req, res, next) {
  // First check if user is authenticated via session
  if (req.session && req.session.user) {
    return next();
  }

  // Then check for JWT token in Authorization header
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'No authentication token provided'
    });
  }

  const token = authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : authHeader;

  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }

  // Attach user info to request
  req.user = decoded;
  next();
}

/**
 * Optional JWT authentication - doesn't fail if no token
 */
function optionalJWT(req, res, next) {
  // Check session first
  if (req.session && req.session.user) {
    req.user = req.session.user;
    return next();
  }

  // Check JWT
  const authHeader = req.headers.authorization;
  
  if (authHeader) {
    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;
    
    const decoded = verifyToken(token);
    if (decoded) {
      req.user = decoded;
    }
  }

  next();
}

module.exports = {
  generateToken,
  verifyToken,
  authenticateJWT,
  optionalJWT
};
