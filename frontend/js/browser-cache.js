/**
 * browser-cache.js - Browser-side caching using LocalStorage
 * Implements browser caching for performance optimization
 * 
 * Features:
 * 1. Cache recently viewed products
 * 2. Cache search history
 * 3. Backup cart data
 * 4. Cache user preferences
 */

// Cache configuration
const CACHE_CONFIG = {
    RECENT_PRODUCTS_KEY: 'nursery_recent_products',
    SEARCH_HISTORY_KEY: 'nursery_search_history',
    CART_BACKUP_KEY: 'nursery_cart_backup',
    USER_PREFS_KEY: 'nursery_user_prefs',
    MAX_RECENT_PRODUCTS: 10,
    MAX_SEARCH_HISTORY: 20,
    CACHE_DURATION: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
};

/**
 * Browser Cache Manager
 */
class BrowserCacheManager {
    constructor() {
        this.enabled = this.checkLocalStorageSupport();
        if (this.enabled) {
            console.log('✅ Browser cache (localStorage) initialized');
            this.cleanExpiredCache();
        } else {
            console.warn('⚠️ localStorage not supported in this browser');
        }
    }

    /**
     * Check if localStorage is supported and available
     */
    checkLocalStorageSupport() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Get item from cache with expiry check
     */
    getItem(key) {
        if (!this.enabled) return null;
        
        try {
            const item = localStorage.getItem(key);
            if (!item) return null;

            const parsed = JSON.parse(item);
            
            // Check if expired
            if (parsed.expiry && Date.now() > parsed.expiry) {
                localStorage.removeItem(key);
                return null;
            }

            return parsed.data;
        } catch (error) {
            console.error('Cache read error:', error);
            return null;
        }
    }

    /**
     * Set item in cache with expiry
     */
    setItem(key, data, duration = CACHE_CONFIG.CACHE_DURATION) {
        if (!this.enabled) return false;

        try {
            const item = {
                data: data,
                expiry: Date.now() + duration,
                timestamp: Date.now()
            };
            localStorage.setItem(key, JSON.stringify(item));
            return true;
        } catch (error) {
            console.error('Cache write error:', error);
            // Handle quota exceeded error
            if (error.name === 'QuotaExceededError') {
                this.clearOldestItems();
            }
            return false;
        }
    }

    /**
     * Add to recently viewed products
     */
    addRecentProduct(product) {
        if (!this.enabled) return;

        try {
            let recent = this.getItem(CACHE_CONFIG.RECENT_PRODUCTS_KEY) || [];
            
            // Remove if already exists
            recent = recent.filter(p => p.id !== product.id);
            
            // Add to beginning
            recent.unshift({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                category: product.category,
                viewedAt: Date.now()
            });
            
            // Keep only last MAX_RECENT_PRODUCTS
            recent = recent.slice(0, CACHE_CONFIG.MAX_RECENT_PRODUCTS);
            
            this.setItem(CACHE_CONFIG.RECENT_PRODUCTS_KEY, recent);
            console.log('💾 Cached recent product:', product.name);
        } catch (error) {
            console.error('Error caching recent product:', error);
        }
    }

    /**
     * Get recently viewed products
     */
    getRecentProducts() {
        return this.getItem(CACHE_CONFIG.RECENT_PRODUCTS_KEY) || [];
    }

    /**
     * Add to search history
     */
    addSearchQuery(query) {
        if (!this.enabled || !query.trim()) return;

        try {
            let history = this.getItem(CACHE_CONFIG.SEARCH_HISTORY_KEY) || [];
            
            // Remove if already exists
            history = history.filter(q => q.toLowerCase() !== query.toLowerCase());
            
            // Add to beginning
            history.unshift(query.trim());
            
            // Keep only last MAX_SEARCH_HISTORY
            history = history.slice(0, CACHE_CONFIG.MAX_SEARCH_HISTORY);
            
            this.setItem(CACHE_CONFIG.SEARCH_HISTORY_KEY, history);
            console.log('💾 Cached search query:', query);
        } catch (error) {
            console.error('Error caching search query:', error);
        }
    }

    /**
     * Get search history
     */
    getSearchHistory() {
        return this.getItem(CACHE_CONFIG.SEARCH_HISTORY_KEY) || [];
    }

    /**
     * Backup cart data
     */
    backupCart(cartData) {
        if (!this.enabled) return;

        try {
            this.setItem(CACHE_CONFIG.CART_BACKUP_KEY, {
                items: cartData.items || [],
                total: cartData.total || 0,
                count: cartData.count || 0,
                lastUpdated: Date.now()
            });
            console.log('💾 Cart backed up to localStorage');
        } catch (error) {
            console.error('Error backing up cart:', error);
        }
    }

    /**
     * Restore cart from backup
     */
    restoreCart() {
        const backup = this.getItem(CACHE_CONFIG.CART_BACKUP_KEY);
        if (backup && backup.items && backup.items.length > 0) {
            console.log('💾 Cart restored from localStorage');
            return backup;
        }
        return null;
    }

    /**
     * Save user preferences
     */
    savePreferences(prefs) {
        if (!this.enabled) return;
        
        try {
            const current = this.getItem(CACHE_CONFIG.USER_PREFS_KEY) || {};
            const updated = { ...current, ...prefs };
            this.setItem(CACHE_CONFIG.USER_PREFS_KEY, updated);
            console.log('💾 User preferences saved');
        } catch (error) {
            console.error('Error saving preferences:', error);
        }
    }

    /**
     * Get user preferences
     */
    getPreferences() {
        return this.getItem(CACHE_CONFIG.USER_PREFS_KEY) || {};
    }

    /**
     * Clean expired cache items
     */
    cleanExpiredCache() {
        if (!this.enabled) return;

        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith('nursery_')) {
                    this.getItem(key); // This will auto-remove if expired
                }
            });
            console.log('🧹 Expired cache cleaned');
        } catch (error) {
            console.error('Error cleaning cache:', error);
        }
    }

    /**
     * Clear oldest items when quota exceeded
     */
    clearOldestItems() {
        try {
            const keys = Object.keys(localStorage).filter(k => k.startsWith('nursery_'));
            if (keys.length > 0) {
                localStorage.removeItem(keys[0]);
                console.log('🧹 Removed oldest cache item');
            }
        } catch (error) {
            console.error('Error clearing old items:', error);
        }
    }

    /**
     * Get cache statistics
     */
    getCacheStats() {
        if (!this.enabled) return null;

        try {
            const stats = {
                recentProducts: (this.getRecentProducts() || []).length,
                searchHistory: (this.getSearchHistory() || []).length,
                cartBackup: this.getItem(CACHE_CONFIG.CART_BACKUP_KEY) ? 'Available' : 'None',
                totalSize: new Blob(Object.values(localStorage)).size,
                enabled: true
            };
            return stats;
        } catch (error) {
            console.error('Error getting cache stats:', error);
            return null;
        }
    }

    /**
     * Clear all cache
     */
    clearAll() {
        if (!this.enabled) return;

        try {
            const keys = Object.keys(localStorage).filter(k => k.startsWith('nursery_'));
            keys.forEach(key => localStorage.removeItem(key));
            console.log('🧹 All cache cleared');
        } catch (error) {
            console.error('Error clearing cache:', error);
        }
    }
}

// Initialize global cache manager
const browserCache = new BrowserCacheManager();

// Make it globally available
window.browserCache = browserCache;

// Display cache stats on console (for demonstration)
console.log('📊 Browser Cache Stats:', browserCache.getCacheStats());
