/**
 * products.js - Fetches products from API
 */

let sampleProducts = [];
let currentProducts = [];
let filteredProducts = [];
let currentPage = 1;
const productsPerPage = 12;
let currentView = 'grid';
let currentSort = 'featured';

// Fetch products from API
async function fetchProducts() {
  try {
    console.log('🔄 Fetching products from API...');
    // Fetch maximum allowed products (100 is the limit)
    const response = await fetch('/api/products?limit=100');
    const data = await response.json();
    console.log(data);
    console.log(Array.isArray(data.data.products));
    console.log(data.data.products.length);
    if (data.success && data.data && data.data.products) {
      // Filter to show only plants (exclude pots and tools) on home page
      const plantCategories = ['indoor', 'outdoor', 'flowering', 'succulent'];
      const allProducts = data.data.products;
      const onlyPlants = allProducts.filter(product => 
        plantCategories.includes(product.category.toLowerCase())
      );
      
      sampleProducts = onlyPlants;
      currentProducts = [...sampleProducts];
      filteredProducts = [...sampleProducts];
      console.log('✅ Loaded', sampleProducts.length, 'plant products from API (filtered from', allProducts.length, 'total products)');
      displayProducts();
      setupSearchFunctionality();
    } else {
      console.error('❌ Invalid API response:', data);
      console.error('Response data:', data);
    }
  } catch (error) {
    console.error('❌ Error fetching products:', error);
  }
}

// Setup search functionality for home page
function setupSearchFunctionality() {
  const searchInput = document.getElementById('search-input');
  const searchBtn = document.getElementById('search-btn');
  const sortSelect = document.getElementById('sort-select');
  
  if (searchInput && searchBtn) {
    // Search on button click
    searchBtn.addEventListener('click', () => {
      performProductSearch(searchInput.value);
    });
    
    // Search on Enter key
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        performProductSearch(searchInput.value);
      }
    });
    
    // Real-time search as user types
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.trim();
      if (query.length === 0) {
        // Reset to all products if search is cleared
        filteredProducts = [...sampleProducts];
        currentPage = 1;
        displayProducts();
      }
    });
  }
  
  // Setup sort functionality
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      applySorting();
    });
  }
}

// Perform search on current products
function performProductSearch(query) {
  const searchTerm = query.trim().toLowerCase();
  
  // Cache search query to browser cache
  if (searchTerm.length > 0 && window.browserCache) {
    window.browserCache.addSearchQuery(searchTerm);
  }
  
  if (searchTerm.length === 0) {
    filteredProducts = [...sampleProducts];
  } else {
    filteredProducts = sampleProducts.filter(product => {
      const searchableText = [
        product.name,
        product.description,
        product.category,
        product.care,
        product.size,
        product.badge
      ].join(' ').toLowerCase();
      
      return searchableText.includes(searchTerm);
    });
    
    console.log(`🔍 Found ${filteredProducts.length} products matching "${query}"`);
  }
  
  currentPage = 1;
  applySorting();
}

// Apply sorting to filtered products
function applySorting() {
  const sortedProducts = [...filteredProducts];
  
  switch (currentSort) {
    case 'price-low':
      sortedProducts.sort((a, b) => {
        const priceA = typeof a.price === 'number' ? a.price : parseFloat(a.price) || 0;
        const priceB = typeof b.price === 'number' ? b.price : parseFloat(b.price) || 0;
        return priceA - priceB;
      });
      console.log('📊 Sorted by: Price Low to High');
      break;
      
    case 'price-high':
      sortedProducts.sort((a, b) => {
        const priceA = typeof a.price === 'number' ? a.price : parseFloat(a.price) || 0;
        const priceB = typeof b.price === 'number' ? b.price : parseFloat(b.price) || 0;
        return priceB - priceA;
      });
      console.log('📊 Sorted by: Price High to Low');
      break;
      
    case 'name':
      sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
      console.log('📊 Sorted by: Name A-Z');
      break;
      
    case 'rating':
      sortedProducts.sort((a, b) => {
        const ratingA = typeof a.rating === 'number' ? a.rating : parseFloat(a.rating) || 0;
        const ratingB = typeof b.rating === 'number' ? b.rating : parseFloat(b.rating) || 0;
        return ratingB - ratingA;
      });
      console.log('📊 Sorted by: Customer Rating');
      break;
      
    case 'featured':
    default:
      // Featured - keep original order but prioritize badges
      sortedProducts.sort((a, b) => {
        const aBadge = a.badge ? 1 : 0;
        const bBadge = b.badge ? 1 : 0;
        return bBadge - aBadge;
      });
      console.log('📊 Sorted by: Featured');
      break;
  }
  
  currentPage = 1;
  displayProducts(sortedProducts);
}

function displayProducts(products = filteredProducts, page = currentPage) {
  const productsGrid = document.getElementById('products-grid');
  if (!productsGrid) {
    console.warn('⚠️ No products-grid element found, skipping display.');
    return;
  }

  const startIndex = (page - 1) * productsPerPage;
  const endIndex = startIndex + productsPerPage;
  const productsToShow = products.slice(startIndex, endIndex);

  productsGrid.classList.add('loading');

  setTimeout(() => {
    productsGrid.innerHTML = '';
    productsToShow.forEach((product, index) => {
      const productCard = createProductCard(product);
      productCard.style.animationDelay = `${index * 0.1}s`;
      productsGrid.appendChild(productCard);
    });

    updateResultsCount(products.length, startIndex + 1, Math.min(endIndex, products.length));
    updatePagination(products.length, page);
    productsGrid.classList.remove('loading');
    productsGrid.className = `products-grid ${currentView}-view`;
  }, 100);
}

function createProductCard(product) {
  const card = document.createElement('div');
  card.className = 'product-card';
  card.setAttribute('data-product-id', product.id);
  
  // Ensure price fields are numbers
  const price = typeof product.price === 'number' ? product.price : parseFloat(product.price) || 0;
  const originalPrice = product.originalPrice ? (typeof product.originalPrice === 'number' ? product.originalPrice : parseFloat(product.originalPrice)) : null;
  const discount = product.discount || 0;
  const rating = typeof product.rating === 'number' ? product.rating : parseFloat(product.rating) || 0;
  const reviews = product.reviews || 0;
  
  const imageHtml = product.image ? `<img src="${product.image}" alt="${product.name}" loading="lazy">`
    : `<i class="fas fa-seedling" style="font-size: 3rem; color: var(--secondary-green);"></i><p>${product.name}</p>`;
  const badgeHtml = product.badge ? `<div class="product-badge">${product.badge}</div>` : '';
  const discountHtml = discount > 0 ? `<span class="discount">-${discount}%</span>` : '';
  const originalPriceHtml = originalPrice ? `<span class="original-price">₹${originalPrice.toFixed(0)}</span>` : '';
  const starsHtml = createStarsHtml(rating);
  const isInStock = product.inStock ?? product.instock ?? false;
  const outOfStockClass = isInStock ? '' : 'out-of-stock';
  const addToCartText = isInStock ? 'Add to Cart' : 'Out of Stock';
  const addToCartDisabled = isInStock ? '' : 'disabled';

  card.innerHTML = `
    <div class="product-image ${outOfStockClass}">
      ${imageHtml}
      ${badgeHtml}
      ${!isInStock ? '<div class="out-of-stock-overlay">Out of Stock</div>' : ''}
    </div>
    <div class="product-details">
      <h3>${product.name}</h3>
      <div class="product-rating">
        <div class="stars">${starsHtml}</div><span class="rating-text">(${reviews})</span>
      </div>
      <div class="product-price">
        <span class="current-price">₹${price.toFixed(0)}</span>
        ${originalPriceHtml}${discountHtml}
      </div>
      <p>${product.description}</p>
      <div class="product-actions">
        <button class="add-to-cart-btn" data-product-id="${product.id}" ${addToCartDisabled}>🛒 ${addToCartText}</button>
        <button class="wishlist-btn">♡</button>
      </div>
    </div>
  `;
  return card;
}

function createStarsHtml(rating) {
  let starsHtml = '';
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  for (let i = 0; i < fullStars; i++) starsHtml += '<i class="fas fa-star"></i>';
  if (hasHalfStar) starsHtml += '<i class="fas fa-star-half-alt"></i>';
  const emptyStars = 5 - Math.ceil(rating);
  for (let i = 0; i < emptyStars; i++) starsHtml += '<i class="far fa-star"></i>';
  return starsHtml;
}

function updateResultsCount(total, start, end) {
  const el = document.getElementById('results-count');
  if (el) el.textContent = `Showing ${start}-${end} of ${total} products`;
}

function updatePagination(totalProducts, currentPageNum) {
  const totalPages = Math.ceil(totalProducts / productsPerPage);
  const pageNumbersContainer = document.getElementById('page-numbers');
  if (!pageNumbersContainer) return;
  pageNumbersContainer.innerHTML = '';

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement('button');
    btn.textContent = i;
    btn.className = `page-num ${i === currentPageNum ? 'active' : ''}`;
    btn.addEventListener('click', () => goToPage(i));
    pageNumbersContainer.appendChild(btn);
  }
}

function goToPage(pageNum) {
  currentPage = pageNum;
  displayProducts(filteredProducts, pageNum);
  const section = document.querySelector('.products-section');
  if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function initializeProducts() {
  const grid = document.getElementById('products-grid');
  if (!grid) {
    console.log('No product grid found, skipping product initialization.');
    return;
  }
  // Fetch products from API
  fetchProducts();
  console.log('✅ Products module initialized');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeProducts);
} else {
  initializeProducts();
}
// ======================================
// AI Chat UI
// ======================================

const aiChat = document.getElementById("ai-chat-history");

function addUserMessage(message){

    aiChat.innerHTML += `

        <div class="ai-message" style="justify-content:flex-end;">

            <div class="ai-bubble"
                style="
                    background:#2e7d32;
                    color:white;
                ">

                ${message}

            </div>

            <div class="ai-avatar">

                👤

            </div>

        </div>

    `;

    aiChat.scrollTop = aiChat.scrollHeight;

}

function addAIMessage(message){

    aiChat.innerHTML += `

        <div class="ai-message">

            <div class="ai-avatar">

                🤖

            </div>

            <div class="ai-bubble">

                ${message}

            </div>

        </div>

    `;

    aiChat.scrollTop = aiChat.scrollHeight;

}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function animateThinking() {

    const bubble = aiChat.lastElementChild.querySelector(".ai-bubble");

    const messages = [
        "🧠 Understanding your request...",
        "🔍 Searching our plant database...",
        "🌿 Finding the best matches..."
    ];

    for (const message of messages) {

        bubble.innerHTML = message;

        await sleep(700);

    }

}
// ==========================
// AI Plant Recommendation
// ==========================

const aiButton = document.getElementById("ai-search-btn");

if (aiButton) {

    aiButton.addEventListener("click", async () => {

        const query = document.getElementById("ai-query").value.trim();

        if (!query) {
            alert("Please describe the plant you need.");
            return;
        }

        // Show user message
        addUserMessage(query);

        try {

            aiButton.disabled = true;
            aiButton.innerText = "Finding...";

            // Temporary AI message
            addAIMessage("🧠 Understanding your request...");

            await animateThinking();

            const response = await fetch("/api/products/recommend", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    query: query
                })

            });

            const data = await response.json();

            if (data.success) {

                // Update last AI message
                aiChat.lastElementChild.querySelector(".ai-bubble").innerHTML = `
    <div style="line-height:1.8">

        <h3 style="margin-bottom:10px;">
            🌿 Found ${data.products.length} Plants
        </h3>

        <p>
            I searched our nursery and selected the plants that best match your request.
        </p>

        <br>

        <div style="
            background:#eef8ee;
            border-left:5px solid #2e7d32;
            padding:12px;
            border-radius:10px;
        ">

            <strong>✨ Your Request</strong>

            <br><br>

            "${query}"

        </div>

        <br>

        Scroll down to explore your recommendations 👇

    </div>
`;

                filteredProducts = data.products.map(product => ({
                    ...product,
                    inStock: product.inStock ?? product.instock ?? true,
                    originalPrice: product.originalPrice ?? product.original_price
                }));

                sampleProducts = [...filteredProducts];
                currentProducts = [...filteredProducts];
                currentPage = 1;

                displayProducts(filteredProducts);

            } else {

               aiChat.lastElementChild.querySelector(".ai-bubble").innerHTML = `
    <h3>⚠️ Server Error</h3>

    <p>

        I couldn't connect to the AI recommendation service.

    </p>

    <br>

    Please try again in a few seconds.

`;

            }

        } catch (err) {

            console.error(err);

            aiChat.lastElementChild.querySelector(".ai-bubble").innerHTML = `
    <h3>😔 No matching plants found</h3>

    <br>

    Try searching like:

    <ul style="margin-top:10px;padding-left:20px;">

        <li>Indoor plants</li>

        <li>Low maintenance</li>

        <li>Office plants</li>

        <li>Plants under ₹500</li>

    </ul>
`;

        } finally {

            aiButton.disabled = false;
            aiButton.innerText = "🌱 Find My Plant";

        }

    });

}
const aiInput = document.getElementById("ai-query");

if (aiInput) {

    aiInput.addEventListener("keypress", (e) => {

        if (e.key === "Enter") {

            aiButton.click();

        }

    });

}
document.querySelectorAll(".suggestion-chip").forEach(chip => {

    chip.addEventListener("click", () => {

        document.getElementById("ai-query").value =
            chip.innerText.replace(/^[^\w]+/, "").trim();

        aiButton.click();

    });

});