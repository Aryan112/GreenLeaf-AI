/**
 * main.js - Main application functionality and general utilities
 * This file handles navigation, modals, and other general functionality
 */

/**
 * Initialize main application functionality
 */
function initializeMainApp() {
    setupNavigation();
    setupModals();
    setupScrollEffects();
    setupLoadingStates();
    setupAccessibility();
    
    // Add smooth scrolling for anchor links
    setupSmoothScrolling();
    
    // Initialize tooltips and other UI enhancements
    setupUIEnhancements();
    
    // Setup cart button handlers
    setupCartHandlers();
    
    // Debug logging for cart functionality
    console.log('Main application initialized');
    console.log('Products available:', typeof window.allProductsData !== 'undefined' ? window.allProductsData.length : 'undefined');
    console.log('Cart functions available:', typeof window.addToCart !== 'undefined' ? 'Yes' : 'No');
}

/**
 * Setup navigation functionality
 */
function setupNavigation() {
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');
    const searchToggle = document.getElementById('searchToggle');
    const searchBar = document.getElementById('searchBar');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const clearSearch = document.getElementById('clearSearch');
    const cartToggle = document.getElementById('cartToggle');
    
    // Mobile menu toggle
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            const isOpen = navMenu.classList.contains('active');
            
            if (isOpen) {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
                document.body.style.overflow = '';
            } else {
                navMenu.classList.add('active');
                navToggle.classList.add('active');
                document.body.style.overflow = 'hidden';
                
                // Close search if open
                if (searchBar && searchBar.classList.contains('active')) {
                    searchBar.classList.remove('active');
                    searchToggle.classList.remove('active');
                }
            }
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!navToggle.contains(e.target) && !navMenu.contains(e.target)) {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
        
        // Close menu when clicking on nav links
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                navToggle.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
    }
    
    // Search toggle functionality
    if (searchToggle && searchBar) {
        searchToggle.addEventListener('click', () => {
            const isOpen = searchBar.classList.contains('active');
            
            if (isOpen) {
                searchBar.classList.remove('active');
                searchToggle.classList.remove('active');
            } else {
                searchBar.classList.add('active');
                searchToggle.classList.add('active');
                
                // Close mobile menu if open
                if (navMenu && navMenu.classList.contains('active')) {
                    navMenu.classList.remove('active');
                    navToggle.classList.remove('active');
                    document.body.style.overflow = '';
                }
                
                // Focus on search input
                if (searchInput) {
                    setTimeout(() => searchInput.focus(), 100);
                }
            }
        });
    }
    
    // Search input functionality
    if (searchInput && searchButton) {
        // Handle search input
        searchInput.addEventListener('input', handleSearchInput);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                performSearch();
            }
        });
        
        // Search button click
        searchButton.addEventListener('click', (e) => {
            e.preventDefault();
            performSearch();
        });
    }
    
    // Clear search functionality
    if (clearSearch && searchInput) {
        clearSearch.addEventListener('click', () => {
            searchInput.value = '';
            clearSearchSuggestions();
            searchInput.focus();
        });
    }
    
    // Cart toggle functionality
    if (cartToggle) {
        cartToggle.addEventListener('click', () => {
            // This will be handled by cart.js
            if (typeof openCart === 'function') {
                openCart();
            } else {
                console.warn('Cart functionality not loaded');
            }
        });
    }
    
    // Close search when clicking outside
    document.addEventListener('click', (e) => {
        if (searchBar && searchToggle && 
            !searchBar.contains(e.target) && 
            !searchToggle.contains(e.target)) {
            searchBar.classList.remove('active');
            searchToggle.classList.remove('active');
        }
    });
    
    // Active nav link highlighting
    const currentPath = window.location.pathname;
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath || 
            (currentPath === '/' && link.textContent.trim() === 'Home')) {
            link.classList.add('active');
        }
    });
    
    // Navbar scroll effect
    let lastScrollTop = 0;
    const navbar = document.querySelector('.navbar');
    
    if (navbar) {
        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            
            if (scrollTop > lastScrollTop && scrollTop > 100) {
                // Scrolling down - hide navbar
                navbar.style.transform = 'translateY(-100%)';
            } else {
                // Scrolling up - show navbar
                navbar.style.transform = 'translateY(0)';
            }
            
            // Add shadow on scroll
            if (scrollTop > 10) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
            
            lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
        });
    }
}

/**
 * Handle search input with debouncing
 */
function handleSearchInput() {
    const searchInput = document.getElementById('searchInput');
    const searchSuggestions = document.getElementById('searchSuggestions');
    
    if (!searchInput || !searchSuggestions) return;
    
    const query = searchInput.value.trim();
    
    // Clear previous timeout
    if (handleSearchInput.timeout) {
        clearTimeout(handleSearchInput.timeout);
    }
    
    if (query.length < 2) {
        clearSearchSuggestions();
        return;
    }
    
    // Debounce search requests
    handleSearchInput.timeout = setTimeout(() => {
        performLiveSearch(query);
    }, 300);
}

/**
 * Perform live search for suggestions
 */
async function performLiveSearch(query) {
    try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=5`);
        const data = await response.json();
        
        if (data.success && data.results.length > 0) {
            displaySearchSuggestions(data.results);
        } else {
            clearSearchSuggestions();
        }
    } catch (error) {
        console.error('Search error:', error);
        clearSearchSuggestions();
    }
}

/**
 * Display search suggestions
 */
function displaySearchSuggestions(results) {
    const searchSuggestions = document.getElementById('searchSuggestions');
    if (!searchSuggestions) return;
    
    searchSuggestions.innerHTML = results.map(item => `
        <div class="search-suggestion" data-id="${item.id}">
            <img src="${item.image}" alt="${item.name}" loading="lazy">
            <div class="suggestion-info">
                <h4>${item.name}</h4>
                <p>${item.price}</p>
            </div>
        </div>
    `).join('');
    
    // Add click handlers to suggestions
    searchSuggestions.querySelectorAll('.search-suggestion').forEach(suggestion => {
        suggestion.addEventListener('click', () => {
            const productId = suggestion.getAttribute('data-id');
            window.location.href = `/products?id=${productId}`;
        });
    });
    
    searchSuggestions.style.display = 'block';
}

/**
 * Clear search suggestions
 */
function clearSearchSuggestions() {
    const searchSuggestions = document.getElementById('searchSuggestions');
    if (searchSuggestions) {
        searchSuggestions.innerHTML = '';
        searchSuggestions.style.display = 'none';
    }
}

/**
 * Perform main search
 */
function performSearch() {
    const searchInput = document.getElementById('searchInput');
    if (!searchInput) return;
    
    const query = searchInput.value.trim();
    if (query.length < 1) return;
    
    // Redirect to products page with search query
    window.location.href = `/products?search=${encodeURIComponent(query)}`;
}

/**
 * Setup modal functionality
 */
function setupModals() {
    // Generic modal close functionality
    // NOTE: Cart modal is excluded - it has its own close handling in cart.js
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal') || e.target.classList.contains('close-modal')) {
            const modal = e.target.closest('.modal') || e.target;
            
            // Skip if this is the cart modal - it handles its own closing
            if (modal && modal.id === 'cart-modal') {
                return;
            }
            
            if (modal && modal.classList.contains('modal')) {
                modal.style.display = 'none';
                document.body.style.overflow = '';
            }
        }
    });
    
    // Close modal on Escape key
    // NOTE: Cart modal is excluded - it has its own close handling in cart.js
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const activeModal = document.querySelector('.modal[style*="block"]');
            
            // Skip if this is the cart modal - it handles its own closing
            if (activeModal && activeModal.id === 'cart-modal') {
                return;
            }
            
            if (activeModal) {
                activeModal.style.display = 'none';
                document.body.style.overflow = '';
            }
        }
    });
}

/**
 * Setup scroll effects
 */
function setupScrollEffects() {
    // Smooth reveal animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // Add revealed class for old animation system
                entry.target.classList.add('revealed');
                
                // Trigger our new animation system
                if (entry.target.classList.contains('animate')) {
                    // Small delay to ensure smooth animation
                    setTimeout(() => {
                        entry.target.style.opacity = '1';
                        entry.target.style.animationPlayState = 'running';
                    }, 50);
                }
            }
        });
    }, observerOptions);
    
    // Observe elements for reveal animation (old system)
    document.querySelectorAll('.fade-in, .slide-up, .zoom-in').forEach(el => {
        observer.observe(el);
    });
    
    // Observe elements for new animation system
    document.querySelectorAll('.animate').forEach(el => {
        // Initially pause animation and set opacity to 0
        el.style.animationPlayState = 'paused';
        el.style.opacity = '0';
        observer.observe(el);
    });
    
    // Immediate animation for elements already in viewport
    setTimeout(() => {
        document.querySelectorAll('.animate').forEach(el => {
            const rect = el.getBoundingClientRect();
            const isInViewport = rect.top >= 0 && rect.bottom <= window.innerHeight;
            
            if (isInViewport) {
                el.style.opacity = '1';
                el.style.animationPlayState = 'running';
            }
        });
    }, 100);
}

/**
 * Setup loading states
 */
function setupLoadingStates() {
    // Show loading overlay
    window.showLoading = function() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
        }
    };
    
    // Hide loading overlay
    window.hideLoading = function() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    };
    
    // Auto-hide loading after page load
    window.addEventListener('load', () => {
        setTimeout(() => {
            window.hideLoading();
        }, 500);
    });
}

/**
 * Setup accessibility features
 */
function setupAccessibility() {
    // Keyboard navigation for buttons and links
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            const target = e.target;
            if (target.classList.contains('btn') || target.hasAttribute('role')) {
                e.preventDefault();
                target.click();
            }
        }
    });
    
    // Focus management
    document.addEventListener('focusin', (e) => {
        e.target.closest('.btn, .nav-link')?.classList.add('focus-visible');
    });
    
    document.addEventListener('focusout', (e) => {
        e.target.closest('.btn, .nav-link')?.classList.remove('focus-visible');
    });
}

/**
 * Setup smooth scrolling
 */
function setupSmoothScrolling() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

/**
 * Setup UI enhancements
 */
function setupUIEnhancements() {
    // Newsletter form - Handled in layout.ejs, no need to duplicate here
    
    // Wishlist functionality
    document.addEventListener('click', (e) => {
        if (e.target.closest('.wishlist-btn')) {
            e.preventDefault();
            toggleWishlist(e.target.closest('.wishlist-btn'));
        }
    });
}

/**
 * Toggle wishlist item
 */
function toggleWishlist(button) {
    const productId = button.getAttribute('data-product-id');
    const isWishlisted = button.classList.contains('wishlisted');
    
    if (isWishlisted) {
        // Remove from wishlist
        button.classList.remove('wishlisted');
        button.innerHTML = '<i class="far fa-heart"></i>';
        showNotification('Removed from wishlist', 'info');
    } else {
        // Add to wishlist
        button.classList.add('wishlisted');
        button.innerHTML = '<i class="fas fa-heart"></i>';
        showNotification('Added to wishlist!', 'success');
    }
    
    // Store in localStorage
    updateWishlistStorage(productId, !isWishlisted);
}

/**
 * Update wishlist in localStorage
 */
function updateWishlistStorage(productId, add) {
    let wishlist = JSON.parse(localStorage.getItem('plantNurseryWishlist') || '[]');
    
    if (add && !wishlist.includes(productId)) {
        wishlist.push(productId);
    } else if (!add) {
        wishlist = wishlist.filter(id => id !== productId);
    }
    
    localStorage.setItem('plantNurseryWishlist', JSON.stringify(wishlist));
}

/**
 * Validate email address
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Setup cart button handlers for add to cart functionality
 */
function setupCartHandlers() {
    // Handle Add to Cart buttons
    document.addEventListener('click', (e) => {
        if (e.target.closest('.add-to-cart-btn')) {
            e.preventDefault();
            const button = e.target.closest('.add-to-cart-btn');
            
            // Get product ID from button's data attribute, parent card, or onclick attribute
            let productId = button.getAttribute('data-product-id');
            
            // If not on button, try parent card
            if (!productId) {
                const productCard = button.closest('.product-card');
                if (productCard) {
                    productId = productCard.getAttribute('data-product-id');
                }
            }
            
            // Fallback to onclick attribute parsing
            if (!productId) {
                const onclickAttr = button.getAttribute('onclick');
                if (onclickAttr) {
                    const match = onclickAttr.match(/addToCart\((\d+)\)/);
                    if (match) {
                        productId = match[1];
                    }
                }
            }
            
            console.log('🛒 Add to cart clicked - Product ID:', productId, 'Button:', button);
            
            if (productId) {
                // Handle gift products (string IDs) vs regular products (numeric IDs)
                if (isNaN(productId)) {
                    // Gift product - create a temporary product object
                    addGiftToCart(productId, button);
                } else {
                    // Regular product - use existing addToCart function
                    if (window.cartFunctions && window.cartFunctions.addToCart) {
                        window.cartFunctions.addToCart(parseInt(productId));
                    } else if (typeof addToCart === 'function') {
                        addToCart(parseInt(productId));
                    } else {
                        console.error('Add to cart function not found');
                        showNotification('Unable to add item to cart', 'error');
                    }
                }
            }
        }
    });
}

/**
 * Handle adding gift products to cart
 */
function addGiftToCart(giftId, button) {
    // Define gift products
    const giftProducts = {
        'gift-starter-set': {
            id: 'gift-starter-set',
            name: 'Plant Starter Set',
            price: 49.99,
            image: '/images/gift-starter-set.jpg',
            category: 'Gift Set'
        },
        'gift-succulent-garden': {
            id: 'gift-succulent-garden', 
            name: 'Succulent Garden Gift Set',
            price: 79.99,
            image: '/images/gift-succulent-garden.jpg',
            category: 'Gift Set'
        },
        'gift-air-plants': {
            id: 'gift-air-plants',
            name: 'Air Plant Collection',
            price: 34.99,
            image: '/images/gift-air-plants.jpg',
            category: 'Gift Set'
        },
        'gift-herb-garden': {
            id: 'gift-herb-garden',
            name: 'Herb Garden Kit',
            price: 39.99,
            image: '/images/gift-herb-garden.jpg',
            category: 'Gift Set'
        }
    };
    
    const giftProduct = giftProducts[giftId];
    if (giftProduct) {
        // Add to cart using the cart.js functionality
        if (window.cartFunctions) {
            // Manually add gift to cart storage
            let cart = [];
            try {
                cart = JSON.parse(localStorage.getItem('plant-nursery-cart') || '[]');
            } catch (error) {
                console.error('Error loading cart:', error);
            }
            
            // Check if already in cart
            const existingItem = cart.find(item => item.id === giftId);
            if (existingItem) {
                existingItem.quantity += 1;
            } else {
                cart.push({
                    id: giftProduct.id,
                    name: giftProduct.name,
                    price: giftProduct.price,
                    image: giftProduct.image,
                    category: giftProduct.category,
                    quantity: 1
                });
            }
            
            // Save cart and update displays
            localStorage.setItem('plant-nursery-cart', JSON.stringify(cart));
            
            // Update cart count manually
            const cartCountElement = document.getElementById('cart-count');
            if (cartCountElement) {
                const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
                cartCountElement.textContent = totalItems;
            }
            
            showNotification(`${giftProduct.name} added to cart!`, 'success');
        }
    } else {
        console.error('Gift product not found:', giftId);
        showNotification('Gift product not found', 'error');
    }
}

/**
 * Utility function to debounce function calls
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Initialize app when DOM is ready
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeMainApp);
} else {
    initializeMainApp();
}

/**
 * Display browser cache statistics (for demonstration)
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Display cache stats after 2 seconds
        setTimeout(() => {
            if (window.browserCache) {
                const stats = window.browserCache.getCacheStats();
                if (stats) {
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.log('📊 BROWSER CACHE STATISTICS (localStorage)');
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.log('✅ Cache Enabled:', stats.enabled);
                    console.log('🔍 Recent Products:', stats.recentProducts, 'items');
                    console.log('📝 Search History:', stats.searchHistory, 'queries');
                    console.log('🛒 Cart Backup:', stats.cartBackup);
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                }
            }
        }, 2000);
    });
}

/**
 * Export functions for global access
 */
window.initializeMainApp = initializeMainApp;
window.showLoading = function() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'flex';
};
window.hideLoading = function() {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'none';
};