/**
 * PRODUCT ROUTES - RESTful API endpoints for plant nursery products
 * 
 * CE-2 Upgraded Version: Uses PostgreSQL + Redis Cloud Caching
 */
const axios = require("axios");
const express = require("express");
const { body, query, param, validationResult } = require("express-validator");
const { asyncHandler, createError } = require("../middleware/errorHandler");
const pool = require("../db/pool");
const redisClient = require("../config/redisClient"); // ✅ Redis Cloud client
const { getFilteredProducts } = require("../services/productService");
const router = express.Router();

/* -------------------------------------------------------------------------- */
/*                            GET /api/products (Cached)                      */
/* -------------------------------------------------------------------------- */

router.get(
  "/",
  [
    query("category").optional().isIn(["indoor", "outdoor", "flowering", "succulent", "all"]),
    query("care").optional().isIn(["easy", "moderate", "expert", "all"]),
    query("size").optional().isIn(["small", "medium", "large", "all"]),
    query("minPrice").optional().isFloat({ min: 0 }),
    query("maxPrice").optional().isFloat({ min: 0 }),
    query("inStock").optional().isBoolean(),
    query("search").optional().isLength({ min: 1, max: 100 }),
    query("sort").optional().isIn(["price-low", "price-high", "rating", "name", "newest", "popular"]),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 1000 }),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: "Invalid query parameters", errors: errors.array() });
    }

    const cacheKey = `products:${JSON.stringify(req.query)}`;

    // ✅ Try Redis cache first
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log("⚡ Cache hit:", cacheKey);
      return res.json(JSON.parse(cachedData));
    }
    console.log("🧭 Cache miss:", cacheKey);

    const {
      category,
      care,
      size,
      minPrice,
      maxPrice,
      inStock,
      search,
      sort,
      page = 1,
      limit = 12,
    } = req.query;

    // ---------------------- Build SQL Query Dynamically ----------------------
    let queryStr = "SELECT * FROM products WHERE 1=1";
    const values = [];
    let i = 1;

    if (category && category !== "all") {
      queryStr += ` AND LOWER(category)=LOWER($${i++})`;
      values.push(category);
    }
    if (care && care !== "all") {
      queryStr += ` AND LOWER(care)=LOWER($${i++})`;
      values.push(care);
    }
    if (size && size !== "all") {
      queryStr += ` AND LOWER(size)=LOWER($${i++})`;
      values.push(size);
    }
    if (minPrice) {
      queryStr += ` AND price >= $${i++}`;
      values.push(parseFloat(minPrice));
    }
    if (maxPrice) {
      queryStr += ` AND price <= $${i++}`;
      values.push(parseFloat(maxPrice));
    }
    if (inStock === "true") queryStr += " AND instock = true";
    if (search) {
      queryStr += ` AND (LOWER(name) LIKE LOWER($${i}) OR LOWER(description) LIKE LOWER($${i}))`;
      values.push(`%${search}%`);
      i++;
    }

    // ----------------------------- Sorting -----------------------------------
    if (sort) {
      switch (sort.toLowerCase()) {
        case "price-low": queryStr += " ORDER BY price ASC"; break;
        case "price-high": queryStr += " ORDER BY price DESC"; break;
        case "rating": queryStr += " ORDER BY rating DESC"; break;
        case "name": queryStr += " ORDER BY name ASC"; break;
        case "newest": queryStr += " ORDER BY id DESC"; break;
        default: queryStr += " ORDER BY id ASC";
      }
    } else queryStr += " ORDER BY id ASC";

    // ---------------------------- Pagination ---------------------------------
    const offset = (page - 1) * limit;
    queryStr += ` LIMIT ${limit} OFFSET ${offset}`;

    // ----------------------------- Execute -----------------------------------
    const result = await pool.query(queryStr, values);
    
    // Convert snake_case to camelCase for frontend compatibility
    const products = result.rows.map(row => ({
      ...row,
      inStock: row.instock !== undefined ? row.instock : true,
      originalPrice: row.original_price ? parseFloat(row.original_price) : null,
      price: parseFloat(row.price) || 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    const countResult = await pool.query("SELECT COUNT(*) FROM products");
    const totalProducts = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(totalProducts / limit);

    const responseData = {
      success: true,
      data: {
        products,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalProducts,
          productsPerPage: parseInt(limit),
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
        filters: {
          category: category || "all",
          care: care || "all",
          size: size || "all",
          minPrice: minPrice || null,
          maxPrice: maxPrice || null,
          inStock: inStock || null,
          search: search || null,
          sort: sort || "popular",
        },
      },
      message: `Found ${products.length} products (page ${page}/${totalPages})`,
    };

    // ✅ Store in Redis for 2 minutes
    await redisClient.setEx(cacheKey, 120, JSON.stringify(responseData));

    res.json(responseData);
  })
);

/* -------------------------------------------------------------------------- */
/*                             GET /api/products/:id                          */
/* -------------------------------------------------------------------------- */

router.get(
  "/:id",
  [param("id").isInt({ min: 1 })],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: "Invalid product ID", errors: errors.array() });
    }

    const { id } = req.params;

    // ✅ Try Redis first
    const cacheKey = `product:${id}`;
    const cachedProduct = await redisClient.get(cacheKey);
    if (cachedProduct) {
      console.log("⚡ Cache hit:", cacheKey);
      return res.json(JSON.parse(cachedProduct));
    }

    const result = await pool.query("SELECT * FROM products WHERE id=$1", [id]);
    if (result.rows.length === 0) throw createError(404, `Product with ID ${id} not found`);

    const response = { success: true, data: result.rows[0], message: "Product retrieved successfully" };

    // ✅ Store single product cache for 5 minutes
    await redisClient.setEx(cacheKey, 300, JSON.stringify(response));

    res.json(response);
  })
);

/* -------------------------------------------------------------------------- */
/*                           POST /api/products (Admin)                       */
/* -------------------------------------------------------------------------- */

router.post(
  "/",
  [
    body("name").notEmpty(),
    body("category").isIn(["indoor", "outdoor", "flowering", "succulent"]),
    body("price").isFloat({ min: 0 }),
    body("description").notEmpty(),
    body("size").isIn(["small", "medium", "large"]),
    body("care").isIn(["easy", "moderate", "expert"]),
    body("inStock").isBoolean(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: "Invalid product data", errors: errors.array() });
    }

    const {
      name, category, price, badge, description, inStock,
      image, lightRequirement, wateringFrequency, humidity,
      toxicity, origin, adultSize
    } = req.body;

    const result = await pool.query(
      `INSERT INTO products
      (name, category, price, badge, description, instock, image,
       lightRequirement, wateringFrequency, humidity, toxicity, origin, adultSize)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [name, category, price, badge || null, description, inStock, image || null,
       lightRequirement, wateringFrequency, humidity, toxicity, origin, adultSize]
    );

    // ✅ Clear cache after product creation
    await redisClient.flushAll();

    res.status(201).json({ success: true, data: result.rows[0], message: "Product created successfully" });
  })
);

/* -------------------------------------------------------------------------- */
/*                           PUT /api/products/:id                            */
/* -------------------------------------------------------------------------- */

router.put(
  "/:id",
  [param("id").isInt({ min: 1 })],
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const fields = [];
    const values = [];
    let idx = 1;

    for (const [key, value] of Object.entries(req.body)) {
      fields.push(`${key}=$${idx++}`);
      values.push(value);
    }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, message: "No fields to update" });
    }

    values.push(id);
    const query = `UPDATE products SET ${fields.join(", ")} WHERE id=$${idx} RETURNING *`;
    const result = await pool.query(query, values);

    if (result.rows.length === 0) throw createError(404, `Product with ID ${id} not found`);

    // ✅ Invalidate product cache
    await redisClient.del(`product:${id}`);
    await redisClient.flushAll(); // clear product list cache

    res.json({ success: true, data: result.rows[0], message: "Product updated successfully" });
  })
);

/* -------------------------------------------------------------------------- */
/*                         DELETE /api/products/:id                           */
/* -------------------------------------------------------------------------- */

router.delete(
  "/:id",
  [param("id").isInt({ min: 1 })],
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await pool.query("DELETE FROM products WHERE id=$1 RETURNING *", [id]);
    if (result.rows.length === 0) throw createError(404, `Product with ID ${id} not found`);

    // ✅ Clear cache after delete
    await redisClient.del(`product:${id}`);
    await redisClient.flushAll();

    res.json({ success: true, message: `Product ${result.rows[0].name} deleted successfully` });
  })
);
router.post(
  "/recommend",
  asyncHandler(async (req, res) => {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Query is required",
      });
    }

    // Call FastAPI
   // Call FastAPI
console.log("AI_SERVICE_URL:", process.env.AI_SERVICE_URL);
const plantResult = await pool.query(`
  SELECT
    name,
    category,
    care,
    description,
    price,
    size
FROM products
  WHERE category IN ('indoor', 'outdoor', 'flowering', 'succulent')
`);
console.log(plantResult.rows);

console.log("==================================");
console.log("🚀 Calling AI Service...");

// TEMPORARY: Send only first 5 plants
const payload = {
    query,
    plants: plantResult.rows.map(p => ({
    name: p.name || "",
    category: p.category || "",
    care: p.care || "",
    description: p.description || "",
    price: Number(p.price || 0),
    size: p.size || ""
}))
};

console.log("Plants Sent:", payload.plants.length);
const start = Date.now();

try {

    console.log("Calling:", `${process.env.AI_SERVICE_URL}/recommend`);

    const aiResponse = await axios.post(
        `${process.env.AI_SERVICE_URL}/recommend`,
        payload,
        {
            timeout: 90000,
        }
    );

    const aiResult = aiResponse.data;

    console.log("SUCCESS");
    console.log("⏱ AI Response Time:", Date.now() - start, "ms");
    console.log("========== AI RESPONSE ==========");
    console.log(aiResult);

    let products;

    switch (aiResult.intent) {

        case "browse_all":
            products = await getFilteredProducts({
                page: 1,
                limit: 1000,
            });
            break;

        case "browse_category":
        case "browse_filtered":
            products = await getFilteredProducts({
                ...aiResult.filters,
                page: 1,
                limit: 1000,
            });
            break;

        case "compare_plants":
            // No product query needed — the AI service already built
            // the comparison data in aiResult.comparison. The frontend
            // should check aiResult.intent === "compare_plants" and
            // render aiResult.comparison instead of a product grid.
            products = [];
            break;

        case "recommend_plants":
        default:
            products = await getFilteredProducts({
                ...aiResult.filters,
                recommended_plants: aiResult.recommended_plants,
                page: 1,
                limit: 20,
            });
            break;
    }

    console.log("========== PRODUCTS ==========");
    console.log(products.length);

    console.log("========== FINAL RESPONSE ==========");
    console.log(JSON.stringify({
        success: true,
        ai: aiResult,
        products,
    }, null, 2));

    return res.json({
        success: true,
        ai: aiResult,
        products,
    });

} catch (err) {

    console.log("========== AXIOS ERROR ==========");

    console.log("Message:", err.message);
    console.log("Code:", err.code);

    if (err.response) {
        console.log("Status:", err.response.status);
        console.log("Headers:", err.response.headers);
        console.log("Body:", err.response.data);
    }

    if (err.request) {
        console.log("No response received from AI service.");
    }

    throw err;
}
  })
);
module.exports = router;