# 🛒 Apex Hardware - Premium Tech & Gear Store

Welcome to **Apex Hardware**, a modern, fully functional, and visually striking e-commerce store. This application is built as a full-stack web application utilizing **HTML5, CSS3, ES6+ JavaScript, Node.js, Express, and SQLite**.

---

## ✨ Features

### 💻 Frontend (Client Side)
- **Stunning Design System**: Clean, premium dark/glassmorphic aesthetics featuring curated accent gradients, rich hover effects, and modern typography.
- **Dynamic Product Catalog**: Staff picks, categories, filter listings, and dynamic search/navigation.
- **Product Detail Views**: Individual detail pages displaying specific specifications, pricing, stock tracking, and images.
- **Interactive Shopping Cart**: Fully featured cart with item persistence (backed by `localStorage`), dynamic totals calculation, and quantity adjustments.
- **Secure Checkout System**: Complete checkout flow that generates transactions linked to user accounts.
- **User Authentication Hub**: Interactive registration, secure login screens, and personalized persistent dashboards with past order histories.
- **Micro-Animations & Toast Alerts**: Built-in visual cues and notification toasts for cart updates, authentication events, and order confirmations.

### ⚙️ Backend (Server Side)
- **Node.js & Express REST API**: Structured routing, JSON controllers, static site hosting, and secure endpoints.
- **SQLite Database Integration**: Flat-file database (`ecommerce.db`) with relational schemas for users, products, orders, and individual order line items.
- **Automatic DB Seeding**: Self-healing SQLite initializer that seeds 8 premium hardware products (mechanical keyboards, mice, audio gears, chairs) on the first start.
- **Secure Password Hashing**: Passwords stored safely using `bcryptjs` encryption.
- **JWT-Based Authentication**: Secure session control using JSON Web Tokens (JWT) verified via middleware.

---

## 🛠️ Tech Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | Vanilla HTML5, Vanilla CSS3 (Custom Variables, Flexbox/Grid), Modern ES6+ JavaScript |
| **Backend** | Node.js, Express.js |
| **Database** | SQLite (`sqlite3` library) |
| **Security & Auth** | JSON Web Tokens (`jsonwebtoken`), Password Hashing (`bcryptjs`) |
| **Development** | Nodemon, Localhost Dev Server |

---

## 📂 Project Structure

```text
Simple E-commerce Store/
├── backend/
│   ├── config/
│   │   └── db.js                 # SQLite database initialization & seeding script
│   ├── middleware/
│   │   └── authMiddleware.js     # Express JWT verification middleware
│   ├── models/
│   │   ├── User.js               # Database model/queries for users
│   │   ├── Product.js            # Database queries for products
│   │   └── Order.js              # Relational database queries for orders & items
│   ├── routes/
│   │   ├── authRoutes.js         # Endpoints for login and registration
│   │   ├── productRoutes.js      # Endpoints for getting product list & details
│   │   └── orderRoutes.js        # Protected endpoints for checkout and order history
│   ├── ecommerce.db              # SQLite Database file (Auto-created on start)
│   └── server.js                 # App entry point, middleware configs, static hosting
├── frontend/
│   ├── images/                   # Product asset images
│   ├── index.html                # Landing page with Staff Picks & User Order History
│   ├── products.html             # Full store catalogue with category filtering
│   ├── product.html              # Individual product details screen
│   ├── cart.html                 # Interactive cart overview & order placement
│   ├── login.html                # User login form page
│   ├── register.html             # User registration form page
│   ├── script.js                 # Frontend business logic, state sync, API calls
│   └── style.css                 # Universal design tokens and components styling
├── package.json                  # Dependencies & start scripts
└── README.md                     # Documentation
```

---

## 🔌 API Endpoints

### 🔐 Authentication (`/api/auth`)
* `POST /api/auth/register` - Registers a new user. Body: `{ username, email, password }`
* `POST /api/auth/login` - Authenticates user. Body: `{ email, password }`. Returns JWT token and user details.

### 📦 Products (`/api/products`)
* `GET /api/products` - Returns all products in the database.
* `GET /api/products/:id` - Returns detailed information for a single product by ID.

### 🧾 Orders (`/api/orders`) - *Protected (Requires Auth Header)*
* `POST /api/orders` - Place a new order. Header: `Authorization: Bearer <TOKEN>`. Body: `{ items: [{ productId, quantity, price }], totalAmount }`
* `GET /api/orders/my-orders` - Returns purchase history for the logged-in user. Header: `Authorization: Bearer <TOKEN>`.

---

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v16+ recommended).

### Installation

1. **Clone or locate the project directory**:
   ```bash
   cd "Simple E-commerce Store"
   ```

2. **Install dependencies**:
   This will install all necessary production modules (`express`, `sqlite3`, `bcryptjs`, `jsonwebtoken`, `cors`) and development tools (`nodemon`).
   ```bash
   npm install
   ```

3. **Run the application**:
   - For **production/normal start**:
     ```bash
     npm start
     ```
   - For **development mode** (starts with nodemon to auto-restart on changes):
     ```bash
     npm run dev
     ```

4. **Access the application**:
   Open your browser and navigate to:
   ```text
   http://localhost:5005
   ```
   *Note: On startup, `backend/ecommerce.db` is created automatically, and the default products are seeded. You can start browsing, registering accounts, adding items to the cart, and placing orders right away!*

---

## 🛡️ License
This project is licensed under the **ISC License**.
