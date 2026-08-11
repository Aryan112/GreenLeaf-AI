const pool = require("../db/pool");

async function getFilteredProducts(filters) {
  const {
    category,
    care,
    size,
    minPrice,
    maxPrice,
    search,
    inStock,
    sort = "popular",
    page = 1,
    limit = 12,
    recommended_plants = [],
  } = filters;

  let query = "SELECT * FROM products WHERE 1=1";
  const values = [];
  let i = 1;

  // ==========================
  // AI Recommendation Search
  // ==========================
  if (recommended_plants.length > 0) {
    query += ` AND LOWER(name) = ANY($${i++})`;

    values.push(
      recommended_plants.map((plant) => plant.toLowerCase())
    );
  } else {
    // ==========================
    // Normal Filter Search
    // ==========================

    if (category && category !== "all") {
      query += ` AND LOWER(category)=LOWER($${i++})`;
      values.push(category);
    }

    if (care && care !== "all") {
      query += ` AND LOWER(care)=LOWER($${i++})`;
      values.push(care);
    }

    if (size && size !== "all") {
      query += ` AND LOWER(size)=LOWER($${i++})`;
      values.push(size);
    }

    if (minPrice) {
      query += ` AND price >= $${i++}`;
      values.push(parseFloat(minPrice));
    }

    if (maxPrice) {
      query += ` AND price <= $${i++}`;
      values.push(parseFloat(maxPrice));
    }

    if (inStock === true || inStock === "true") {
      query += " AND instock = true";
    }

    if (search) {
      query += ` AND (
        LOWER(name) LIKE LOWER($${i})
        OR LOWER(description) LIKE LOWER($${i})
      )`;
      values.push(`%${search}%`);
      i++;
    }
  }

  // ==========================
  // Sorting
  // ==========================
  switch (sort) {
    case "price-low":
      query += " ORDER BY price ASC";
      break;

    case "price-high":
      query += " ORDER BY price DESC";
      break;

    case "rating":
      query += " ORDER BY rating DESC";
      break;

    case "name":
      query += " ORDER BY name ASC";
      break;

    case "newest":
      query += " ORDER BY id DESC";
      break;

    default:
      query += " ORDER BY id ASC";
  }

  // ==========================
  // Pagination — SAFETY NET
  // ==========================
  // Always enforce a limit, even if filters end up empty (e.g. a
  // fallback response with no detected category/price). Without
  // this, an empty-filters bug can silently return the ENTIRE
  // catalog instead of a bounded page of results.
  const safeLimit = Math.min(parseInt(limit) || 12, 1000);
  const safePage = Math.max(parseInt(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  query += ` LIMIT $${i++} OFFSET $${i++}`;
  values.push(safeLimit, offset);

  const result = await pool.query(query, values);

  return result.rows;
}

module.exports = {
  getFilteredProducts,
};