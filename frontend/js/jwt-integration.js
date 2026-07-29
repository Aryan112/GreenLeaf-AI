/**
 * JWT Authentication Integration
 * This file adds JWT token handling to the Plant Nursery website
 * Stores tokens and includes them in API requests
 */

(function() {
    'use strict';
    
    const TOKEN_KEY = 'plant_nursery_jwt_token';
    const USER_KEY = 'plant_nursery_user_data';
    
    /**
     * Save JWT token to localStorage
     */
    function saveToken(token) {
        try {
            localStorage.setItem(TOKEN_KEY, token);
            console.log('✅ JWT token saved');
            return true;
        } catch (error) {
            console.error('❌ Error saving token:', error);
            return false;
        }
    }
    
    /**
     * Get JWT token from localStorage
     */
    function getToken() {
        try {
            return localStorage.getItem(TOKEN_KEY);
        } catch (error) {
            console.error('❌ Error getting token:', error);
            return null;
        }
    }
    
    /**
     * Remove JWT token from localStorage
     */
    function removeToken() {
        try {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            console.log('✅ JWT token removed');
            return true;
        } catch (error) {
            console.error('❌ Error removing token:', error);
            return false;
        }
    }
    
    /**
     * Save user data to localStorage
     */
    function saveUser(userData) {
        try {
            localStorage.setItem(USER_KEY, JSON.stringify(userData));
            console.log('✅ User data saved:', userData.name);
            return true;
        } catch (error) {
            console.error('❌ Error saving user data:', error);
            return false;
        }
    }
    
    /**
     * Get user data from localStorage
     */
    function getUser() {
        try {
            const userData = localStorage.getItem(USER_KEY);
            return userData ? JSON.parse(userData) : null;
        } catch (error) {
            console.error('❌ Error getting user data:', error);
            return null;
        }
    }
    
    /**
     * Check if user is authenticated (has valid token)
     */
    function isAuthenticated() {
        const token = getToken();
        return token !== null && token !== '';
    }
    
    /**
     * Get authorization headers with JWT token
     */
    function getAuthHeaders() {
        const token = getToken();
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (token) {
            headers['Authorization'] = 'Bearer ' + token;
        }
        
        return headers;
    }
    
    /**
     * Fetch with automatic JWT token inclusion
     */
    function authenticatedFetch(url, options) {
        options = options || {};
        options.headers = options.headers || {};
        
        // Add JWT token to headers
        const token = getToken();
        if (token) {
            options.headers['Authorization'] = 'Bearer ' + token;
        }
        
        // Add Content-Type if not present
        if (!options.headers['Content-Type']) {
            options.headers['Content-Type'] = 'application/json';
        }
        
        return fetch(url, options);
    }
    
    /**
     * Intercept login response to save JWT token
     */
    function interceptAuthResponse(response) {
        if (response.success && response.token) {
            saveToken(response.token);
            
            if (response.user) {
                saveUser(response.user);
                showAuthNotification('✅ Logged in as ' + response.user.name);
            }
        }
        return response;
    }
    
    /**
     * Handle logout
     */
    function logout() {
        removeToken();
        console.log('👋 User logged out');
        showAuthNotification('👋 Logged out successfully');
        
        // Redirect to login or home page
        setTimeout(function() {
            window.location.href = '/auth/login';
        }, 1000);
    }
    
    /**
     * Show authentication notification
     */
    function showAuthNotification(message) {
        // Use WebSocket notification if available
        if (typeof window.WebSocketCart !== 'undefined' && window.WebSocketCart.showNotification) {
            window.WebSocketCart.showNotification(message, 'success');
            return;
        }
        
        // Create simple notification
        const notification = document.createElement('div');
        notification.textContent = message;
        
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#4caf50',
            color: 'white',
            padding: '15px 25px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: '10000',
            fontSize: '14px',
            fontWeight: '500'
        });
        
        document.body.appendChild(notification);
        
        setTimeout(function() {
            notification.remove();
        }, 3000);
    }
    
    /**
     * Update UI based on authentication status
     */
    function updateAuthUI() {
        const user = getUser();
        const isAuth = isAuthenticated();
        
        // Update user display in header
        const userDisplays = document.querySelectorAll('[data-user-display]');
        const loginButtons = document.querySelectorAll('[data-login-button]');
        const logoutButtons = document.querySelectorAll('[data-logout-button]');
        
        if (isAuth && user) {
            // Show user info
            userDisplays.forEach(function(display) {
                display.textContent = user.name;
                display.style.display = 'block';
            });
            
            // Hide login buttons
            loginButtons.forEach(function(btn) {
                btn.style.display = 'none';
            });
            
            // Show logout buttons
            logoutButtons.forEach(function(btn) {
                btn.style.display = 'block';
            });
            
            console.log('👤 Authenticated as:', user.name);
        } else {
            // Show login buttons
            loginButtons.forEach(function(btn) {
                btn.style.display = 'block';
            });
            
            // Hide user info
            userDisplays.forEach(function(display) {
                display.style.display = 'none';
            });
            
            // Hide logout buttons
            logoutButtons.forEach(function(btn) {
                btn.style.display = 'none';
            });
        }
    }
    
    /**
     * Intercept fetch to automatically add JWT tokens
     */
    function interceptFetch() {
        const originalFetch = window.fetch;
        
        window.fetch = function(url, options) {
            // Only intercept API calls
            if (typeof url === 'string' && url.includes('/api/')) {
                options = options || {};
                options.headers = options.headers || {};
                
                // Add JWT token if available
                const token = getToken();
                if (token && !options.headers['Authorization']) {
                    options.headers['Authorization'] = 'Bearer ' + token;
                }
            }
            
            return originalFetch(url, options);
        };
        
        console.log('🔄 Fetch interceptor installed - JWT tokens will be added automatically');
    }
    
    // Expose functions globally
    window.JWTAuth = {
        saveToken: saveToken,
        getToken: getToken,
        removeToken: removeToken,
        saveUser: saveUser,
        getUser: getUser,
        isAuthenticated: isAuthenticated,
        getAuthHeaders: getAuthHeaders,
        fetch: authenticatedFetch,
        interceptResponse: interceptAuthResponse,
        logout: logout,
        updateUI: updateAuthUI
    };
    
    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            updateAuthUI();
            interceptFetch();
        });
    } else {
        updateAuthUI();
        interceptFetch();
    }
    
    console.log('🔐 JWT Authentication integration loaded');
})();
