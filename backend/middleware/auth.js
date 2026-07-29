/**
 * Authentication Middleware
 * Protects routes that require user authentication
 */

/**
 * Middleware to check if user is authenticated
 * Redirects to login page if not authenticated
 */
function requireAuth(req, res, next) {
  // Check if user is logged in via session
  if (req.session && req.session.user) {
    // User is authenticated, proceed to next middleware/route
    return next();
  }
  
  // User is not authenticated
  // Store the original URL they tried to access
  if (req.session) {
    req.session.returnTo = req.originalUrl;
  }
  
  // Check if it's an API request (JSON response)
  if (req.xhr || req.headers.accept?.indexOf('json') > -1) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required',
      redirectTo: '/auth/login'
    });
  }
  
  // For regular page requests, redirect to login
  return res.redirect('/auth/login?redirect=' + encodeURIComponent(req.originalUrl));
}

/**
 * Middleware to check if user is authenticated (API version)
 * Returns JSON error instead of redirecting
 */
function requireAuthAPI(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  
  return res.status(401).json({
    success: false,
    message: 'Authentication required. Please log in.',
    error: 'UNAUTHORIZED'
  });
}

/**
 * Middleware to check if user is already logged in
 * Redirects to intended page or home if already authenticated
 * Useful for login/register pages
 */
function redirectIfAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    // User is already logged in
    // Check if there's a redirect URL in the query parameters
    const redirectUrl = req.query.redirect;
    
    if (redirectUrl) {
      // Redirect to the intended destination
      return res.redirect(redirectUrl);
    }
    
    // No redirect URL, go to home
    return res.redirect('/');
  }
  
  // User is not logged in, proceed to login/register page
  next();
}

/**
 * Optional authentication - adds user info but doesn't require it
 * Useful for pages that show different content for logged-in users
 */
function optionalAuth(req, res, next) {
  // User info is already attached via the global middleware in server.js
  // This is just a placeholder for consistency
  next();
}

module.exports = {
  requireAuth,
  requireAuthAPI,
  redirectIfAuthenticated,
  optionalAuth
};
