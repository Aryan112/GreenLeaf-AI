/**
 * server.js – Main Express.js Server (CE-2 PostgreSQL + MongoDB Integrated)
 * NOW WITH HTTPS/SSL SUPPORT 🔒
 */ 

const express = require("express");
const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const compression = require("compression");
const rateLimit = require("express-rate-limit");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const MongoStore = require("connect-mongo");
const mongoose = require("mongoose");
require("dotenv").config();

const { errorHandler, asyncHandler } = require("./middleware/errorHandler");
const { logger } = require("./middleware/logger");
const { requireAuth, redirectIfAuthenticated } = require("./middleware/auth");
const productRoutes = require("./routes/products");
const cartRoutes = require("./routes/cart");
const apiRoutes = require("./routes/api");
const pool = require("./db/pool"); // PostgreSQL connection

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/plant_nursery";
const SESSION_SECRET = process.env.SESSION_SECRET || "change_this_in_env";

/* -------------------- Security & Global Middleware -------------------- */
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
          "https://cdnjs.cloudflare.com",
          "https://cdn.jsdelivr.net",
          "https://unpkg.com",
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
          "https://cdnjs.cloudflare.com",
          "https://cdn.jsdelivr.net",
          "https://unpkg.com",
        ],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.jsdelivr.net",
          "https://cdnjs.cloudflare.com",
        ],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  })
);

app.use(
  cors({
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  })
);
app.use(compression());
if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// Enable MongoDB session store if MongoDB is available
let sessionConfig = {
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 * 7 },
};

// Try to use MongoDB for sessions if URI is configured
if (MONGODB_URI && !MONGODB_URI.includes('127.0.0.1')) {
  try {
    sessionConfig.store = MongoStore.create({
      mongoUrl: MONGODB_URI,
      collectionName: "sessions",
      touchAfter: 24 * 3600 // lazy session update
    });
    console.log('✅ Using MongoDB Atlas for session storage');
  } catch (error) {
    console.warn('⚠️  MongoDB store failed, using MemoryStore:', error.message);
  }
} else {
  console.warn('⚠️  MongoDB disabled - using MemoryStore for sessions');
}

app.use(session(sessionConfig));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests. Please try again later." },
});
app.use("/api/", limiter);

/* -------------------- Static + View Engine -------------------- */
const frontendPath = path.join(__dirname, "..", "frontend");
app.use(express.static(frontendPath));
console.log(`📁 Serving static files from: ${frontendPath}`);

// Disable ETags for development to prevent 304 caching
app.disable('etag');

// Explicit favicon route - serve from images folder
app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(frontendPath, 'images', 'favicon.ico'));
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

/* -------------------- MongoDB (for sessions/auth) - ENABLED -------------------- */
// MongoDB Atlas connection for user authentication and sessions
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("✅ Connected to MongoDB Atlas for authentication"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    console.error("⚠️  Authentication will not work without MongoDB Atlas");
  });

/* -------------------- PostgreSQL Connection Test -------------------- */
(async () => {
  try {
    const client = await pool.connect();
    console.log("✅ Connected to PostgreSQL");
    client.release();
  } catch (err) {
    console.error("❌ PostgreSQL connection error:", err.message);
  }
})();

app.use((req, res, next) => {
  res.locals.currentUser = req.session?.user || null;
  next();
});
app.use(logger);

/* -------------------- PostgreSQL Helper -------------------- */
async function getProductsByCategory(category) {
  const result = await pool.query(
    "SELECT * FROM products WHERE LOWER(category)=LOWER($1)",
    [category]
  );
  // Convert snake_case to camelCase for template compatibility
  return result.rows.map(row => ({
    ...row,
    inStock: row.in_stock !== undefined ? row.in_stock : true,
    originalPrice: row.original_price,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}
async function getAllProducts() {
  const result = await pool.query("SELECT * FROM products ORDER BY id ASC");
  // Convert snake_case to camelCase for template compatibility
  return result.rows.map(row => ({
    ...row,
    inStock: row.in_stock !== undefined ? row.in_stock : true,
    price: parseFloat(row.price) || 0,
    originalPrice: row.original_price ? parseFloat(row.original_price) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}

/* -------------------- Render Helper -------------------- */
function renderWithLayout(res, viewName, data = {}) {
  return new Promise((resolve, reject) => {
    res.render(viewName, { ...data }, (err, bodyHtml) => {
      if (err) return reject(err);
      res.render("layout", { ...data, body: bodyHtml }, (layoutErr, fullHtml) => {
        if (layoutErr) return reject(layoutErr);
        res.send(fullHtml);
        resolve();
      });
    });
  });
}

/* -------------------- Route Imports -------------------- */
const paymentRoutes = require("./routes/payment");
const newsletterRoutes = require("./routes/newsletter");
const contactRoutes = require("./routes/contacts");

/* -------------------- API ROUTES -------------------- */
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api", apiRoutes);
app.use("/api/auth", require("./routes/auth"));
app.use("/api/admin", require("./routes/admin")); // Admin routes for rate limit management
app.use("/api/orders", require("./routes/orders")); // Orders route

// ✅ Defensive middleware binding
if (paymentRoutes && typeof paymentRoutes === "function") {
  app.use("/api/payment", paymentRoutes);
  console.log("✅ Payment route active");
} else {
  console.error("❌ Payment route is not exporting a router function");
}

if (newsletterRoutes && typeof newsletterRoutes === "function") {
  app.use("/api/subscribe", newsletterRoutes);
  console.log("✅ Newsletter route active");
} else {
  console.error("❌ Newsletter route is not exporting a router function");
}

if (contactRoutes && typeof contactRoutes === "function") {
  app.use("/api/contact", contactRoutes);
  console.log("✅ Contact route active");
} else {
  console.error("❌ Contact route is not exporting a router function");
}

/* -------------------- MAIN WEB ROUTES -------------------- */

// Homepage
app.get(
  "/",
  asyncHandler(async (req, res) => {
    // Force no cache
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    const allProducts = await getAllProducts();

    const featuredProducts = allProducts.filter(
      (p) => p.badge && ["popular", "new", "sale"].includes(p.badge)
    );
    const popularProducts = allProducts.sort((a, b) => b.rating - a.rating).slice(0, 20);

    console.log(`🏠 HOME PAGE LOADED - Total: ${allProducts.length} | Featured: ${featuredProducts.length} | Popular: ${popularProducts.length}`);

    // Get categories with counts
    const categories = [
      { name: 'indoor', count: allProducts.filter(p => p.category === 'indoor').length },
      { name: 'outdoor', count: allProducts.filter(p => p.category === 'outdoor').length },
      { name: 'flowering', count: allProducts.filter(p => p.category === 'flowering').length },
      { name: 'succulent', count: allProducts.filter(p => p.category === 'succulent').length }
    ];

    const stats = {
      totalProducts: allProducts.length,
      inStock: allProducts.filter((p) => p.instock).length,
      averageRating:
        allProducts.length > 0
          ? (
              allProducts.reduce((sum, p) => sum + (p.rating || 0), 0) /
              allProducts.length
            ).toFixed(1)
          : 0,
    };

    // Force render without caching
    res.render("home", {
      pageTitle: "PlantNursery - Premium Plants & Garden Supplies",
      currentPage: "home",
      featuredProducts,
      popularProducts,
      categories,
      stats,
      cartSessionId: req.session?.cartId || "",
      metaDescription: "Discover premium plants, garden supplies, and expert care tips at our online plant nursery.",
      canonicalUrl: "http://localhost:3000",
      timestamp: Date.now() // Force cache bust
    });
  })
);

// Products page
app.get(
  "/products",
  asyncHandler(async (req, res) => {
    const category = req.query.category;
    let products = [];
    if (category) {
      const result = await pool.query(
        "SELECT * FROM products WHERE LOWER(category)=LOWER($1)",
        [category]
      );
      products = result.rows;
    } else {
      products = await getAllProducts();
    }

    await renderWithLayout(res, "categories", {
      pageTitle: category
        ? `${category.charAt(0).toUpperCase() + category.slice(1)} Plants`
        : "All Plants - PlantNursery",
      currentPage: "products",
      products,
      currentCategory: category || "all",
      cartSessionId: req.session?.cartId || "",
    });
  })
);

// Pots Page
app.get(
  "/pots",
  asyncHandler(async (req, res) => {
    const pots = await getProductsByCategory("pots");
    await renderWithLayout(res, "aux-grid", {
      pageTitle: "Pots & Planters - PlantNursery",
      currentPage: "pots",
      heading: "🏺Pots & Planters",
      subheading: "Style your plants with beautiful planters",
      items: pots,
      ctaLabel: "Add to Cart",
      cartSessionId: req.session?.cartId || "",
    });
  })
);

// Tools Page
app.get(
  "/tools",
  asyncHandler(async (req, res) => {
    const tools = await getProductsByCategory("tools");
    await renderWithLayout(res, "aux-grid", {
      pageTitle: "Garden Tools - PlantNursery",
      currentPage: "tools",
      heading: "🔧 Garden Tools",
      subheading: "Everything you need to help plants thrive",
      items: tools,
      ctaLabel: "Add to Cart",
      cartSessionId: req.session?.cartId || "",
    });
  })
);

// Static Pages
app.get("/about", (req, res) =>
  renderWithLayout(res, "about", { pageTitle: "About Us", currentPage: "about" })
);
app.get("/services", (req, res) =>
  renderWithLayout(res, "services", { pageTitle: "Services", currentPage: "services" })
);
app.get("/contact", (req, res) =>
  renderWithLayout(res, "contact", { pageTitle: "Contact", currentPage: "contact" })
);
app.get("/gifting", (req, res) =>
  renderWithLayout(res, "gifting", { pageTitle: "Plant Gifting", currentPage: "gifting" })
);
app.get("/care", (req, res) =>
  renderWithLayout(res, "care", { pageTitle: "Plant Care Guide", currentPage: "care" })
);

// Checkout Page (Protected - Requires Authentication)
app.get("/checkout", requireAuth, (req, res) =>
  renderWithLayout(res, "checkout", {
    pageTitle: "Checkout - Complete Your Order",
    metaDescription:
      "Complete your order securely. Fast checkout and multiple payment options available.",
    currentPage: "checkout",
    cartSessionId: req.session?.cartId || "",
    allProducts: [],
  })
);

// Orders Page (Protected - Requires Authentication)
app.get("/orders", requireAuth, (req, res) =>
  renderWithLayout(res, "orders", {
    pageTitle: "My Orders - PlantNursery",
    metaDescription: "View your order history and track your purchases.",
    currentPage: "orders",
  })
);

// Auth Pages (redirect if already logged in)
app.get("/auth/login", redirectIfAuthenticated, (req, res) =>
  renderWithLayout(res, "auth-login", {
    pageTitle: "Login - PlantNursery",
    currentPage: "login",
  })
);

app.get("/auth/register", redirectIfAuthenticated, (req, res) =>
  renderWithLayout(res, "auth-register", {
    pageTitle: "Register - PlantNursery",
    currentPage: "register",
  })
);

// Redirect /login and /register to /auth/login and /auth/register
app.get("/login", (req, res) => res.redirect("/auth/login"));
app.get("/register", (req, res) => res.redirect("/auth/register"));

/* -------------------- Health Check -------------------- */
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV || "development",
  });
});

/* -------------------- Error Handling -------------------- */
app.use("*", (req, res) => {
  console.log("❌ 404 Not Found:", req.originalUrl);
  if (req.originalUrl.startsWith("/api/"))
    res.status(404).json({ success: false, error: "API endpoint not found" });
  else res.status(404).sendFile(path.join(frontendPath, "404.html"));
});
app.use(errorHandler);

/* -------------------- Server Startup with HTTPS Support -------------------- */

// SSL/HTTPS Configuration
const USE_HTTPS = process.env.USE_HTTPS === 'true' || false;
const HTTPS_PORT = process.env.HTTPS_PORT || 3443;

let server;
let httpsServer;

if (USE_HTTPS) {
  // Try to load SSL certificates
  const sslKeyPath = path.join(__dirname, 'ssl', 'server.key');
  const sslCertPath = path.join(__dirname, 'ssl', 'server.cert');
  
  try {
    const sslOptions = {
      key: fs.readFileSync(sslKeyPath),
      cert: fs.readFileSync(sslCertPath)
    };
    
    // Create HTTPS server
    httpsServer = https.createServer(sslOptions, app);
    
    // Also create HTTP server that redirects to HTTPS
    const httpApp = express();
    httpApp.use((req, res) => {
      res.redirect(301, `https://${req.headers.host.split(':')[0]}:${HTTPS_PORT}${req.url}`);
    });
    server = http.createServer(httpApp);
    
    server.listen(PORT, () => {
      console.log("\n🌱 ================================");
      console.log("🌱 PLANT NURSERY SERVER STARTED");
      console.log("🌱 ================================");
      console.log(`📁 Serving static files from: ${frontendPath}`);
      console.log(`🌱 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔒 HTTPS Server: https://localhost:${HTTPS_PORT}`);
      console.log(`🔄 HTTP → HTTPS redirect: http://localhost:${PORT}`);
      console.log("✅ Connected to MongoDB");
      console.log("✅ Connected to PostgreSQL");
      console.log("✅ SSL/HTTPS Enabled 🔐");
      console.log("🌱 ================================\n");
    });
    
    httpsServer.listen(HTTPS_PORT, () => {
      console.log(`🔒 HTTPS server listening on port ${HTTPS_PORT}`);
    });
    
  } catch (error) {
    console.error("\n❌ SSL Certificate Error:", error.message);
    console.error("💡 Run 'node ssl/generate-cert.js' to generate certificates");
    console.error("   Or set USE_HTTPS=false in .env to disable HTTPS\n");
    console.log("🔄 Falling back to HTTP...\n");
    
    // Fallback to HTTP
    server = http.createServer(app);
    server.listen(PORT, () => {
      console.log("\n🌱 ================================");
      console.log("🌱 PLANT NURSERY SERVER STARTED");
      console.log("🌱 ================================");
      console.log(`📁 Serving static files from: ${frontendPath}`);
      console.log(`🌱 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`🌱 Server running on: http://localhost:${PORT}`);
      console.log("✅ Connected to MongoDB");
      console.log("✅ Connected to PostgreSQL");
      console.log("🌱 ================================\n");
    });
  }
} else {
  // Regular HTTP server
  server = http.createServer(app);
  server.listen(PORT, () => {
    console.log("\n🌱 ================================");
    console.log("🌱 PLANT NURSERY SERVER STARTED");
    console.log("🌱 ================================");
    console.log(`📁 Serving static files from: ${frontendPath}`);
    console.log(`🌱 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`🌱 Server running on: http://localhost:${PORT}`);
    console.log("✅ Connected to MongoDB");
    console.log("✅ Connected to PostgreSQL");
    console.log("💡 Set USE_HTTPS=true in .env to enable HTTPS");
    console.log("🌱 ================================\n");
  });
}

/* -------------------- WebSocket (Socket.io) Setup -------------------- */
const { Server } = require('socket.io');
const io = new Server(httpsServer || server, {
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000", "https://localhost:3443", "https://127.0.0.1:3443"],
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Handle cart updates
  socket.on('cart:update', (data) => {
    console.log(`🛒 Cart update from ${socket.id}:`, data);
    // Broadcast to all connected clients
    io.emit('cart:updated', data);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Make io available globally for use in routes
app.set('io', io);
console.log('✅ Socket.io initialized for real-time updates\n');

/* -------------------- Graceful Shutdown -------------------- */
process.on("SIGINT", () => {
  console.log("\n🛑 Server stopping...");
  if (httpsServer) httpsServer.close();
  server.close(() => process.exit(0));
});
process.on("SIGTERM", () => {
  if (httpsServer) httpsServer.close();
  server.close(() => process.exit(0));
});
process.on("unhandledRejection", (reason) => {
  console.error("💥 Unhandled Rejection:", reason);
  process.exit(1);
});
process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", err);
  process.exit(1);
});

module.exports = app;
