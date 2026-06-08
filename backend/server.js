const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const db = require('./config/db'); // Triggers db connections & initialization

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');

const app = express();
const PORT = process.env.PORT || 5005;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

// Serve Static Frontend
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Fallback to index.html for single page routing logic if needed (or basic request routing)
app.get('*', (req, res, next) => {
  // If request is an API request, do not serve html
  if (req.url.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`===================================================`);
  console.log(` E-Commerce Store Server is running on port ${PORT}`);
  console.log(` URL: http://localhost:${PORT}`);
  console.log(`===================================================`);
});
