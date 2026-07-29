/**
 * filters.js - Safe version
 */

let activeFilters = {
  categories: [],
  priceRange: { min: 0, max: 3000 },
  size: null,
  careLevel: [],
  inStock: null,
};

function initializeFilters() {
  setupCategoryFilters();
  setupPriceFilter();
  setupSizeFilters();
  setupCareFilters();
  setupClearFiltersButton();
  loadFiltersFromURL();
  console.log('✅ Filters module initialized');
}

function setupCategoryFilters() {
  document.querySelectorAll('input[name="category"]').forEach(input => {
    input.addEventListener('change', e => {
      const category = e.target.value;
      const isChecked = e.target.checked;
      if (isChecked) activeFilters.categories.push(category);
      else activeFilters.categories = activeFilters.categories.filter(c => c !== category);
      applyFilters();
    });
  });
}

function setupPriceFilter() {
  const range = document.getElementById('price-range');
  const label = document.getElementById('price-value');
  if (!range || !label) return;
  range.addEventListener('input', e => label.textContent = `₹${e.target.value}`);
  range.addEventListener('change', e => {
    activeFilters.priceRange.max = parseInt(e.target.value);
    applyFilters();
  });
}

function setupSizeFilters() {
  document.querySelectorAll('input[name="size"]').forEach(input => {
    input.addEventListener('change', e => {
      activeFilters.size = e.target.checked ? e.target.value : null;
      applyFilters();
    });
  });
}

function setupCareFilters() {
  document.querySelectorAll('input[name="care"]').forEach(input => {
    input.addEventListener('change', e => {
      const val = e.target.value;
      if (e.target.checked) activeFilters.careLevel.push(val);
      else activeFilters.careLevel = activeFilters.careLevel.filter(c => c !== val);
      applyFilters();
    });
  });
}

function setupClearFiltersButton() {
  const btn = document.querySelector('.clear-filters-btn');
  if (btn) btn.addEventListener('click', clearAllFilters);
}

function applyFilters() {
  if (typeof currentProducts === 'undefined') return;
  let filtered = [...currentProducts];
  if (activeFilters.categories.length) filtered = filtered.filter(p => activeFilters.categories.includes(p.category));
  filtered = filtered.filter(p => p.price >= activeFilters.priceRange.min && p.price <= activeFilters.priceRange.max);
  if (activeFilters.size) filtered = filtered.filter(p => p.size === activeFilters.size);
  if (activeFilters.careLevel.length) filtered = filtered.filter(p => activeFilters.careLevel.includes(p.care));
  if (activeFilters.inStock !== null) filtered = filtered.filter(p => p.inStock === activeFilters.inStock);

  filteredProducts = filtered;
  currentPage = 1;
  if (typeof displayProducts === 'function') displayProducts(filteredProducts);
  const grid = document.getElementById('products-grid');
  if (grid) console.log(`✅ ${filtered.length} products after filters`);
}

function clearAllFilters() {
  activeFilters = { categories: [], priceRange: { min: 0, max: 3000 }, size: null, careLevel: [], inStock: null };
  document.querySelectorAll('input[type="checkbox"], input[type="radio"]').forEach(i => i.checked = false);
  applyFilters();
}

function loadFiltersFromURL() {
  const params = new URLSearchParams(window.location.search);
  const cat = params.get('categories');
  if (cat) activeFilters.categories = cat.split(',');
  const maxPrice = parseInt(params.get('maxPrice')) || 500;
  activeFilters.priceRange.max = maxPrice;
  applyFilters();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeFilters);
} else {
  initializeFilters();
}
