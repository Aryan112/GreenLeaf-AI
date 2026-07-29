/**
 * WebSocket Real-Time Integration
 * This file adds Socket.io real-time updates to the Plant Nursery website
 * Shows live cart updates across all browser tabs
 */

(function() {
    'use strict';
    
    let socket = null;
    let isConnected = false;
    
    /**
     * Initialize WebSocket connection
     */
    function initWebSocket() {
        // Check if Socket.io is loaded
        if (typeof io === 'undefined') {
            console.warn('⚠️ Socket.io not loaded. Real-time features disabled.');
            return;
        }
        
        console.log('🔌 Connecting to WebSocket server...');
        
        // Connect to Socket.io server
        socket = io('http://localhost:3000', {
            withCredentials: true,
            transports: ['websocket', 'polling']
        });
        
        // Connection successful
        socket.on('connect', function() {
            isConnected = true;
            console.log('✅ WebSocket connected! Socket ID:', socket.id);
            showNotification('🔌 Real-time updates enabled!', 'success');
        });
        
        // Connection error
        socket.on('connect_error', function(error) {
            console.error('❌ WebSocket connection error:', error);
        });
        
        // Disconnected
        socket.on('disconnect', function() {
            isConnected = false;
            console.log('❌ WebSocket disconnected');
        });
        
        // Listen for cart updates
        socket.on('cart:updated', function(data) {
            console.log('🔔 Real-time cart update received:', data);
            handleCartUpdate(data);
        });
    }
    
    /**
     * Handle cart update events
     */
    function handleCartUpdate(data) {
        const { action, itemCount, totals, product } = data;
        
        // Update cart badge
        updateCartBadge(itemCount);
        
        // Show notification based on action
        let message = '';
        switch(action) {
            case 'item_added':
                message = `✅ ${product.name} added to cart`;
                showNotification(message, 'success');
                break;
            case 'item_quantity_updated':
                message = `✏️ Cart quantity updated`;
                showNotification(message, 'info');
                break;
            case 'item_removed':
                message = `🗑️ ${product.name} removed from cart`;
                showNotification(message, 'warning');
                break;
            case 'cart_cleared':
                message = `🧹 Cart cleared`;
                showNotification(message, 'info');
                break;
        }
        
        // Update cart total in header if exists
        updateCartTotal(totals);
        
        // Refresh cart display if on cart page
        if (window.location.pathname.includes('cart') || window.location.pathname.includes('checkout')) {
            console.log('🔄 Refreshing cart display...');
            // Trigger cart refresh if the function exists
            if (typeof renderCart === 'function') {
                setTimeout(renderCart, 500);
            }
        }
    }
    
    /**
     * Update cart badge with item count
     */
    function updateCartBadge(count) {
        // Find cart badge elements
        const badges = document.querySelectorAll('.cart-badge, .cart-count, [data-cart-count]');
        
        badges.forEach(function(badge) {
            badge.textContent = count;
            
            // Show/hide based on count
            if (count > 0) {
                badge.style.display = 'flex';
                badge.classList.add('animate-pulse');
                setTimeout(function() {
                    badge.classList.remove('animate-pulse');
                }, 600);
            } else {
                badge.style.display = 'none';
            }
        });
        
        console.log('🔢 Cart badge updated:', count);
    }
    
    /**
     * Update cart total in header
     */
    function updateCartTotal(totals) {
        if (!totals) return;
        
        const totalElements = document.querySelectorAll('.cart-total, [data-cart-total]');
        
        totalElements.forEach(function(element) {
            element.textContent = '₹' + totals.total.toFixed(0);
        });
        
        console.log('💰 Cart total updated: ₹' + totals.total.toFixed(0));
    }
    
    /**
     * Show notification toast
     */
    function showNotification(message, type) {
        // Check if custom notification function exists
        if (typeof showToast === 'function') {
            showToast(message, type);
            return;
        }
        
        // Create simple notification
        const notification = document.createElement('div');
        notification.className = 'websocket-notification websocket-notification-' + type;
        notification.textContent = message;
        
        // Apply styles
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: type === 'success' ? '#4caf50' : type === 'warning' ? '#ff9800' : '#2196f3',
            color: 'white',
            padding: '15px 25px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            zIndex: '10000',
            fontSize: '14px',
            fontWeight: '500',
            maxWidth: '350px',
            animation: 'slideInRight 0.3s ease-out',
            transition: 'all 0.3s ease'
        });
        
        document.body.appendChild(notification);
        
        // Add animation keyframes if not exists
        if (!document.getElementById('websocket-animations')) {
            const style = document.createElement('style');
            style.id = 'websocket-animations';
            style.textContent = `
                @keyframes slideInRight {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                }
                .animate-pulse {
                    animation: pulse 0.6s ease-in-out;
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.2); }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Remove after 3 seconds
        setTimeout(function() {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(function() {
                notification.remove();
            }, 300);
        }, 3000);
    }
    
    /**
     * Get connection status
     */
    function getConnectionStatus() {
        return {
            connected: isConnected,
            socketId: socket ? socket.id : null
        };
    }
    
    /**
     * Manually emit cart update (for testing)
     */
    function emitCartUpdate(cartData) {
        if (!socket || !isConnected) {
            console.warn('⚠️ WebSocket not connected');
            return;
        }
        
        socket.emit('cart:update', cartData);
        console.log('📤 Cart update emitted:', cartData);
    }
    
    // Expose functions globally
    window.WebSocketCart = {
        init: initWebSocket,
        status: getConnectionStatus,
        emit: emitCartUpdate,
        showNotification: showNotification
    };
    
    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWebSocket);
    } else {
        initWebSocket();
    }
    
    console.log('📦 WebSocket integration loaded');
})();
