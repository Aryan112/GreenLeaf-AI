const express = require("express");
const router = express.Router();
const pool = require("../db/pool");

// Get orders for logged-in user
router.get("/my-orders", async (req, res) => {
  try {
    // Check if user is logged in
    if (!req.session || !req.session.user) {
      return res.status(401).json({
        success: false,
        error: "Please log in to view orders"
      });
    }

    const userEmail = req.session.user.email;

    // Fetch orders from database
    const result = await pool.query(
      `SELECT * FROM orders 
       WHERE user_email = $1 
       ORDER BY created_at DESC`,
      [userEmail]
    );

    res.json({
      success: true,
      orders: result.rows
    });

  } catch (error) {
    console.error("❌ Error fetching orders:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch orders"
    });
  }
});

// Get single order details
router.get("/:id", async (req, res) => {
  try {
    if (!req.session || !req.session.user) {
      return res.status(401).json({
        success: false,
        error: "Please log in to view order details"
      });
    }

    const orderId = req.params.id;
    const userEmail = req.session.user.email;

    const result = await pool.query(
      `SELECT * FROM orders 
       WHERE id = $1 AND user_email = $2`,
      [orderId, userEmail]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: "Order not found"
      });
    }

    res.json({
      success: true,
      order: result.rows[0]
    });

  } catch (error) {
    console.error("❌ Error fetching order:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch order details"
    });
  }
});

module.exports = router;
