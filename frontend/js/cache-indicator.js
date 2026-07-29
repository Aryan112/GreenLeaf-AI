/**
 * cache-indicator.js - Visual indicator for browser caching
 * Shows a badge on the page indicating browser cache is active
 */

(function() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCacheIndicator);
    } else {
        initCacheIndicator();
    }

    function initCacheIndicator() {
        // Only show on non-checkout/auth pages
        if (window.location.pathname.includes('checkout') || 
            window.location.pathname.includes('auth')) {
            return;
        }

        // Create cache indicator badge
        const indicator = document.createElement('div');
        indicator.id = 'cache-indicator';
        indicator.innerHTML = `
            <div style="position: fixed; bottom: 20px; right: 20px; z-index: 9999; 
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; padding: 12px 20px; border-radius: 50px; 
                        box-shadow: 0 4px 15px rgba(0,0,0,0.2); font-size: 13px; 
                        font-weight: 600; cursor: pointer; transition: all 0.3s ease;
                        display: flex; align-items: center; gap: 8px;"
                 onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 6px 20px rgba(0,0,0,0.3)';"
                 onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 4px 15px rgba(0,0,0,0.2)';"
                 onclick="showCacheDetails()">
                <span style="font-size: 16px;">💾</span>
                <span>Browser Cache Active</span>
            </div>
        `;
        
        document.body.appendChild(indicator);

        // Make showCacheDetails global
        window.showCacheDetails = function() {
            if (window.browserCache) {
                const stats = window.browserCache.getCacheStats();
                const recentProducts = window.browserCache.getRecentProducts();
                const searchHistory = window.browserCache.getSearchHistory();
                
                let message = '📊 BROWSER CACHE STATISTICS\n\n';
                message += `✅ Cache Status: ${stats.enabled ? 'Active' : 'Disabled'}\n`;
                message += `🔍 Recent Products: ${stats.recentProducts} items\n`;
                message += `📝 Search History: ${stats.searchHistory} queries\n`;
                message += `🛒 Cart Backup: ${stats.cartBackup}\n\n`;
                
                if (recentProducts.length > 0) {
                    message += '📦 Recent Products:\n';
                    recentProducts.slice(0, 3).forEach((p, i) => {
                        message += `  ${i + 1}. ${p.name} - $${p.price}\n`;
                    });
                }
                
                if (searchHistory.length > 0) {
                    message += '\n🔍 Recent Searches:\n';
                    searchHistory.slice(0, 3).forEach((q, i) => {
                        message += `  ${i + 1}. "${q}"\n`;
                    });
                }
                
                alert(message);
                
                // Also log to console
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('📊 BROWSER CACHE DETAILS');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log('Stats:', stats);
                console.log('Recent Products:', recentProducts);
                console.log('Search History:', searchHistory);
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            }
        };

        console.log('💾 Cache indicator badge added to page');
    }
})();
