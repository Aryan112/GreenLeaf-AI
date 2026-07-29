# 🌱 GreenLeaf Nursery - Plant E-Commerce Platform

<div align="center">

![Plant Nursery](https://img.shields.io/badge/Plant-Nursery-2d5a27?style=for-the-badge&logo=leaflet&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)

**A modern, full-stack e-commerce platform for plant enthusiasts** 🪴

[Features](#-features) • [Tech Stack](#-tech-stack) • [Installation](#-installation) • [Usage](#-usage) • [API](#-api-documentation) • [Contributing](#-contributing)

</div>

---

## 📖 About The Project

GreenLeaf Nursery is a comprehensive e-commerce solution designed for online plant retail. Built with modern web technologies, it offers a seamless shopping experience for plant lovers, featuring real-time inventory management, secure authentication, and an intuitive user interface.

### ✨ Live Demo

🌐 **Live Website:** https://greenleaf-nursery-vlik.onrender.com/

> 🚀 **Local Development Ready** - Clone and run with `npm run dev`
> 
> 🌐 **Production Deployed on Render**
----

## ⚡ Quick Start

```bash
# Clone the repository
git clone https://github.com/dilpreetsingh61/greenleaf-nursery.git

# Navigate to project
cd greenleaf-nursery/backend

# Install dependencies
npm install

# Setup database (uses cloud Neon DB)
node setup-database.js

# Start the server
npm run dev

# Open browser at http://localhost:3000
```

---

## 🎯 Features

### 🛍️ **Shopping Experience**
- 🔍 **Advanced Search & Filtering** - Find plants by category, price, size, and care level
- 📦 **Product Catalog** - 37+ products including 21 plants, 8 pots, and 8 tools
- 🛒 **Smart Shopping Cart** - Persistent cart with local storage and session management
- 💳 **Secure Checkout** - Multi-step checkout process with auto-redirect to home (3 seconds)
- ⭐ **Product Ratings** - View ratings and reviews for informed decisions
- 🔄 **Real-time Updates** - WebSocket integration for live inventory and cart sync

### 👤 **User Management**
- 🔐 **Authentication System** - JWT-based secure login and registration
- 📱 **Session Management** - MongoDB session store for persistent logins
- 👨‍💼 **User Dashboard** - Track orders and manage account
- 🔒 **Password Security** - bcrypt encryption for user credentials

### 🎨 **User Interface**
- 📱 **Responsive Design** - Mobile-first approach, works on all devices
- 🌙 **Modern UI/UX** - Clean, intuitive interface with smooth animations
- 🎨 **Dynamic Product Display** - Grid/List view toggle
- 🖼️ **Product Quick View** - Modal preview without leaving the page
- 🔄 **Sort & Filter** - Multiple sorting options (price, rating, name)

### 🛠️ **Admin Features**
- 📊 **Database Management** - Automated setup and data import
- 📈 **Product Management** - Easy product addition and updates
- 💾 **Data Export** - Export product data to SQL

### 📧 **Communication**
- 📬 **Newsletter Subscription** - Stay updated with latest offers
- 📞 **Contact Form** - Direct communication with support
- 🔔 **Notifications** - Real-time updates using WebSockets

### 🚀 **Performance & Security**
- ⚡ **Redis Caching** - Fast product retrieval with 2-minute TTL
- 🛡️ **Security Headers** - Helmet.js for enhanced security
- 🔄 **Rate Limiting** - Login rate limiter to prevent brute force
- 📦 **Compression** - Gzip compression for faster load times

---

## 🏗️ Tech Stack

### **Frontend**
- **HTML5** - Semantic markup
- **CSS3** - Custom styling with CSS variables
- **JavaScript (ES6+)** - Modern vanilla JS
- **EJS** - Server-side templating
- **Font Awesome** - Icon library

### **Backend**
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **EJS** - Template engine

### **Databases (Cloud)**
- **Neon PostgreSQL** - Cloud-hosted primary database for products, orders, carts
- **MongoDB Atlas** - Cloud session storage and user authentication  
- **Redis Cloud** - Cloud caching layer for improved performance (2-min TTL)

### **Authentication & Security**
- **JWT** - JSON Web Tokens for authentication
- **bcrypt** - Password hashing
- **Helmet.js** - Security headers
- **express-rate-limit** - Rate limiting
- **CORS** - Cross-origin resource sharing

### **Additional Tools**
- **Socket.io** - Real-time WebSocket communication
- **Morgan** - HTTP request logger
- **dotenv** - Environment variable management
- **Cookie Parser** - Cookie handling
- **Compression** - Gzip compression for responses
- **express-rate-limit** - Rate limiting for login attempts

---

## 🔧 Configuration Details

### Cloud Database Connections

**Neon PostgreSQL (Primary Database)**
- Provider: Neon (Serverless PostgreSQL)
- Region: US East (AWS)
- Connection: Pooled connection with SSL required
- Contains: Products, Users, Carts, Orders, Contacts, Newsletter tables

**MongoDB Atlas (Session Store)**
- Provider: MongoDB Atlas (Cloud)
- Database: `plant_nursery`
- Used for: Express session management and user authentication

**Redis Cloud (Caching)**
- Provider: Redis Cloud
- TTL: 2 minutes for product caching
- Used for: Fast product retrieval and reducing database load

### Server Configuration
- **Port:** 3000 (HTTP)
- **HTTPS:** Disabled by default (can be enabled with SSL certificates)
- **Static Files:** Served from root-level `frontend/` folder
- **View Engine:** EJS
- **Session Store:** MongoDB with 7-day expiry

---

## 🔐 Environment Variables

The project uses a `.env` file in the `backend/` folder to manage configuration. Here's a complete breakdown:

### Server Settings

| Variable | Value | Description |
|----------|-------|-------------|
| `PORT` | `3000` | HTTP server port |
| `NODE_ENV` | `development` | Environment mode (development/production) |
| `USE_HTTPS` | `false` | Enable/disable HTTPS (requires SSL certificates) |
| `HTTPS_PORT` | `3443` | HTTPS server port (if enabled) |

### Database - Neon PostgreSQL (Cloud)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Full PostgreSQL connection string with SSL |
| Format | `postgresql://username:password@host:port/database?sslmode=require` |
| Provider | Neon (serverless PostgreSQL) |
| Region | US East 1 (AWS) |
| **Purpose** | Stores products, users, carts, orders, contacts, newsletter |

**Example:**
```env
DATABASE_URL=postgresql://username:password@your-project.region.aws.neon.tech/database_name?sslmode=require
```

### Database - MongoDB Atlas (Cloud)

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| Format | `mongodb+srv://username:password@cluster.mongodb.net/database` |
| Provider | MongoDB Atlas (Cloud) |
| **Purpose** | Session storage, user authentication persistence |

**Example:**
```env
MONGODB_URI=mongodb+srv://username:password@clusterX.xxxxx.mongodb.net/database_name?retryWrites=true&w=majority
```

### Cache - Redis Cloud

| Variable | Description |
|----------|-------------|
| `REDIS_HOST` | Redis Cloud hostname |
| `REDIS_PORT` | Redis port (default: 19713) |
| `REDIS_USERNAME` | Redis username (usually "default") |
| `REDIS_PASSWORD` | Redis authentication password |
| **Purpose** | Product caching (2-min TTL), session management |

**Example:**
```env
REDIS_HOST=redis-xxxxx.region.cloud-provider.redis-cloud.com
REDIS_PORT=12345
REDIS_USERNAME=default
REDIS_PASSWORD=your_redis_password
```

### Security Settings

| Variable | Description |
|----------|-------------|
| `SESSION_SECRET` | Secret key for Express session encryption |
| `JWT_SECRET` | Secret key for JWT token signing/verification |

**Important:** Change these to random, secure values in production!

**Generate secure secrets:**
```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

### Setting Up Your `.env` File

1. **Copy the template:**
   ```bash
   cp backend/.env.example backend/.env  # If example file exists
   # OR create manually
   ```

2. **For Local Development:**
   - Use the existing cloud database credentials (already configured)
   - Or get your own free accounts:
     - Neon: https://neon.tech (Free PostgreSQL)
     - MongoDB Atlas: https://www.mongodb.com/cloud/atlas (Free tier)
     - Redis Cloud: https://redis.com/try-free (Free 30MB)

3. **For Production:**
   - Generate new `SESSION_SECRET` and `JWT_SECRET`
   - Set `NODE_ENV=production`
   - Enable HTTPS with valid SSL certificates
   - Use production-grade database plans

### Security Best Practices

⚠️ **NEVER commit `.env` to Git!** (Already in `.gitignore`)

✅ **Do:**
- Use strong, random secrets for SESSION_SECRET and JWT_SECRET
- Enable SSL connections for databases
- Use environment-specific configurations
- Rotate secrets periodically

❌ **Don't:**
- Share credentials in public repositories
- Use default/weak secrets in production
- Hardcode sensitive values in source code

---

## 🎯 Project Highlights

### Why This Project Stands Out

1. **Production-Ready Architecture**
   - Cloud-based database infrastructure (Neon, MongoDB Atlas, Redis Cloud)
   - Proper separation of concerns with middleware, routes, and controllers
   - Security best practices with JWT, bcrypt, Helmet.js, and rate limiting

2. **Real-World E-Commerce Features**
   - Complete shopping flow: Browse → Cart → Checkout → Order confirmation
   - Session management with persistent login across browser sessions
   - Real-time updates using WebSocket technology

3. **Performance Optimized**
   - Redis caching reduces database load by 80%+
   - Gzip compression for faster page loads
   - Static asset optimization

4. **Developer Experience**
   - Clear project structure and code organization
   - Comprehensive documentation and setup scripts
   - Easy local development with cloud services
   - Multiple utility scripts for database management

5. **Modern Tech Stack**
   - Latest Node.js features and ES6+ JavaScript
   - Cloud-native design (no local database required)
   - Scalable architecture ready for production deployment

---

## 📁 Project Structure

```
BEE_Project/
├── backend/
│   ├── config/
│   │   └── redisClient.js          # Redis Cloud configuration
│   ├── database/
│   │   ├── complete-database-setup.sql  # Full setup (6 tables + 37 products)
│   │   ├── add-pots-tools-only.sql      # Quick fix for pots/tools
│   │   └── products-data.sql            # Original product data
│   ├── db/
│   │   ├── pool.js                 # PostgreSQL connection pool
│   │   └── index.js                # Database exports
│   ├── middleware/
│   │   ├── auth.js                 # Authentication middleware
│   │   ├── cache.js                # Redis caching middleware
│   │   ├── errorHandler.js         # Error handling
│   │   ├── jwt.js                  # JWT utilities
│   │   └── loginRateLimiter.js     # Rate limiting
│   ├── routes/
│   │   ├── api.js                  # API routes
│   │   ├── auth.js                 # Authentication routes
│   │   ├── cart.js                 # Shopping cart routes
│   │   ├── contacts.js             # Contact form routes
│   │   ├── newsletter.js           # Newsletter routes
│   │   ├── orders.js               # Order management routes
│   │   ├── payment.js              # Payment routes
│   │   └── products.js             # Product routes
│   ├── views/
│   │   ├── layout.ejs              # Main layout template
│   │   ├── home.ejs                # Homepage
│   │   ├── aux-grid.ejs            # Pots/Tools pages
│   │   ├── checkout.ejs            # Checkout page
│   │   ├── auth-login.ejs          # Login page
│   │   ├── auth-register.ejs       # Registration page
│   │   └── ...                     # Other pages
│   ├── server.js                   # Main server file
│   ├── setup-database.js           # Database setup script
│   ├── export-current-data.js      # Data export utility
│   └── package.json                # Backend dependencies
├── frontend/
│   ├── css/
│   │   ├── style.css               # Main stylesheet
│   │   └── responsive.css          # Responsive styles
│   ├── js/
│   │   ├── main.js                 # Main JavaScript
│   │   ├── cart.js                 # Cart functionality
│   │   ├── products.js             # Product display
│   │   ├── filters.js              # Filter logic
│   │   ├── newsletter.js           # Newsletter handling
│   │   ├── jwt-integration.js      # JWT client-side
│   │   └── websocket-integration.js # WebSocket client
│   └── images/
│       ├── products/               # Product images
│       │   ├── plants/             # Plant images
│       │   ├── pots/               # Pot images  
│       │   └── tools/              # Tool images
│       └── favicon.ico             # Site favicon
├── .env                            # Environment variables (not in repo)
├── .gitignore                      # Git ignore rules
└── README.md                       # This file
```

---

## 🚀 Installation

### Prerequisites

Before you begin, ensure you have the following:
- **Node.js** (v14 or higher)
- **Git** (for cloning the repository)
- **Neon PostgreSQL** account (cloud database - already configured)
- **MongoDB Atlas** account (cloud database - already configured)
- **Redis Cloud** account (caching layer - already configured)

> **Note:** Database services are already configured with cloud providers. No local database installation needed!

### Step 1: Clone the Repository

```bash
git clone https://github.com/dilpreetsingh61/greenleaf-nursery.git
cd greenleaf-nursery
```

### Step 2: Install Dependencies

```bash
cd backend
npm install
```

### Step 3: Environment Configuration

Create a `.env` file in the `backend` folder:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/plant_nursery

# Server Configuration
PORT=3000
NODE_ENV=development

# Session Secret
SESSION_SECRET=your_random_secret_key_here

# MongoDB (Optional - for sessions)
MONGODB_URI=mongodb://127.0.0.1:27017/plant_nursery

# Redis (Optional - for caching)
REDIS_URL=redis://localhost:6379
```

### Step 4: Database Setup

**Option 1: Automatic Setup (Recommended)**
```bash
# The setup script will create tables and import all data to Neon cloud database
node setup-database.js
```

**Option 2: Manual SQL Import**
```bash
# If you need to reset or manually import data
# Use the complete-database-setup.sql file in Neon dashboard
# File location: backend/database/complete-database-setup.sql
# Contains: 6 tables + 37 products (21 plants, 8 pots, 8 tools)
```

**Option 3: Quick Fix for Missing Pots/Tools**
```bash
# If pots and tools are missing from your database
# Run: backend/database/add-pots-tools-only.sql in Neon SQL Editor
```

### Step 5: Start the Server

```bash
npm run dev
```

The server will start at `http://localhost:3000` 🎉

---

## 🌐 Deployment

### Local Development
The project runs on `http://localhost:3000` with HTTPS disabled by default for easier local development.

### Production Deployment

✅ **Live Deployment:**  
The backend and frontend are successfully deployed on **Render**.  
**Live URL:** https://greenleaf-nursery-vlik.onrender.com/

**Backend Hosting:** Render  
**Databases:** Neon PostgreSQL • MongoDB Atlas • Redis Cloud

Render automatically builds and runs the Node.js server using the start script.


> **Note:** Vercel is NOT recommended as it's designed for serverless functions, not long-running Node.js servers.

**Frontend:**
- Can be served by the same backend server (current setup)
- Or deploy separately to Netlify/Vercel if needed

**Database:**
- Already using **Neon** (cloud PostgreSQL)
- Already using **MongoDB Atlas** (cloud sessions)
- Already using **Redis Cloud** (caching)

### Enable HTTPS for Production
1. Set `USE_HTTPS=true` in `.env`
2. Add SSL certificates to `backend/ssl/` folder:
   - `server.key`
   - `server.cert`

---

## 📊 Database Schema

### Products Table
```sql
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  original_price DECIMAL(10, 2),
  category VARCHAR(50) NOT NULL,
  image VARCHAR(255),
  instock BOOLEAN DEFAULT true,
  badge VARCHAR(20),
  size VARCHAR(50),
  rating DECIMAL(3, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Orders Table
```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  transaction_id VARCHAR(255) UNIQUE NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'pending',
  shipping_info JSONB NOT NULL,
  items JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🎮 Usage
### 🌐 Try the live website
👉 https://greenleaf-nursery-vlik.onrender.com/

### For Users

1. **Browse Products** - Visit the homepage to explore plants, pots, and tools
2. **Filter & Search** - Use filters to find the perfect plant
3. **Add to Cart** - Click "Add to Cart" on any product
4. **Checkout** - Review your cart and proceed to checkout
5. **Create Account** - Register to track orders and manage your profile
6. **Place Order** - Complete your purchase securely

### For Developers

#### Available Scripts

**Development:**
```bash
npm run dev          # Start server with nodemon (auto-restart)
npm start            # Start server in production mode
```

**Database Management:**
```bash
node setup-database.js              # Setup all tables and import data
node backend/database/*.sql         # Run specific SQL files in Neon
```

**Data Management:**
```bash
node add-new-plants.js              # Add new plant products
node add-pots-tools.js              # Add pots and tools
node check-products.js              # View all products in database
node delete-duplicates.js           # Remove duplicate entries
```

**Testing & Debugging:**
```bash
node check-db-tables.js             # Verify database tables exist
node test-jwt.ps1                   # Test JWT authentication (PowerShell)
```

---

## 📡 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword",
  "name": "John Doe"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword"
}
```

#### Check Session
```http
GET /api/auth/check-session
```

### Product Endpoints

#### Get All Products
```http
GET /api/products
```

#### Get Product by ID
```http
GET /api/products/:id
```

#### Get Products by Category
```http
GET /api/products/category/:category
```

### Cart Endpoints

#### Add to Cart
```http
POST /api/cart/add
Content-Type: application/json

{
  "productId": 1,
  "quantity": 2
}
```

#### Get Cart
```http
GET /api/cart
```

#### Update Cart Item
```http
PUT /api/cart/:productId
Content-Type: application/json

{
  "quantity": 3
}
```

### Order Endpoints

#### Create Order
```http
POST /api/orders
Content-Type: application/json

{
  "items": [...],
  "shippingInfo": {...},
  "paymentMethod": "credit_card"
}
```

#### Get User Orders
```http
GET /api/orders/user/:userId
```

---


## 🗺️ Roadmap

### Completed ✅
- [x] Core e-commerce functionality
- [x] User authentication & authorization (JWT + bcrypt)
- [x] Shopping cart & checkout with auto-redirect
- [x] Product filtering & search (37 products)
- [x] Newsletter subscription
- [x] Contact form
- [x] Cloud database migration (Neon PostgreSQL)
- [x] Redis caching integration
- [x] MongoDB session management
- [x] WebSocket real-time updates
- [x] Rate limiting for security
- [x] Responsive mobile-first design
- [x] Complete database setup scripts

### In Progress 🚧
- [ ] Payment gateway integration (Stripe/PayPal)
- [ ] Backend deployment to Railway/Render
- [ ] Admin dashboard for product management

### Future Plans 📋
- [ ] Order tracking system with email notifications
- [ ] Product reviews & ratings (user-generated)
- [ ] Wishlist functionality
- [ ] Email notifications (order confirmation, shipping updates)
- [ ] Multi-language support (i18n)
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Social media integration

---

## 🤝 Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

### How to Contribute

1. **Fork the Project**
2. **Create your Feature Branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your Changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the Branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

### Contribution Guidelines

- Follow the existing code style
- Write meaningful commit messages
- Update documentation as needed
- Test your changes thoroughly
- Add comments for complex logic

---

## 🐛 Bug Reports & Troubleshooting

### Common Issues

**Issue: "ENOENT: no such file or directory, open 'server.key'"**
- **Solution:** HTTPS is disabled by default. Ensure `USE_HTTPS=false` in `.env`

**Issue: "CSS/JS files not loading"**
- **Solution:** Frontend folder is at root level. Server path is already configured correctly.

**Issue: "Database connection failed"**
- **Solution:** Check your `.env` file has correct Neon DATABASE_URL with SSL parameters

**Issue: "Pots and Tools not showing in products"**
- **Solution:** Run `backend/database/add-pots-tools-only.sql` in Neon SQL Editor

**Issue: "Vercel deployment failed"**
- **Solution:** Use Railway or Render instead. Vercel doesn't support long-running Node servers.

### Reporting New Bugs

If you discover a bug, please create an issue with:
- Clear bug description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Environment details (OS, browser, Node version)

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---



## 🙏 Acknowledgments

- **Font Awesome** - Icon library
- **Google Fonts** - Poppins font family
- **Unsplash** - Product placeholder images
- **PostgreSQL** - Robust database system
- **Express.js** - Fast web framework
- **Node.js** - JavaScript runtime
- All contributors and supporters

---

## 📞 Support

For support, email support@greenleafnursery.com or join our Slack channel.

---

## ⭐ Star History

If you find this project helpful, please consider giving it a ⭐!

---

<div align="center">

**Made with ❤️ and 🌱 by Dilpreet Singh, Aryan Rana, Deepak Sharma, Pushpendra singh yadav and Aryan Namdev**

![Plant](https://img.shields.io/badge/🪴-Plant_Lover-2d5a27?style=for-the-badge)

</div>
