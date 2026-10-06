require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const tutorialRoutes = require('./routes/tutorialRoutes');
const productRoutes = require('./routes/productRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');

connectDB();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Module routes
app.use('/api/auth', authRoutes);         // User Management
app.use('/api/tutorials', tutorialRoutes); // DIY Tutorial Management
app.use('/api/products', productRoutes);   // Marketplace
app.use('/api/cart', cartRoutes);          // Shopping Cart
app.use('/api/orders', orderRoutes);       // Order Management
app.use('/api/admin', adminRoutes);        // Admin Panel

// Serve the frontend (public/index.html, style.css, script.js)
app.use(express.static(path.join(__dirname, 'public')));

// Any non-API route falls back to the SPA's index.html
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.use('/api', notFound); // 404 only applies to unmatched /api/* routes
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`CraftCircle API listening on port ${PORT}`);
});
