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
  } = filters;

  let query = "SELECT * FROM products WHERE 1=1";
  const values = [];
  let i = 1;

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

  const offset = (page - 1) * limit;

  // query += ` LIMIT ${limit} OFFSET ${offset}`;

  const result = await pool.query(query, values);

  return result.rows;
}

module.exports = {
  getFilteredProducts,
};