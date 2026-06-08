const express = require('express');
const router = express.Router();
const Product = require('../models/Product');

// @route   GET api/products
// @desc    Get all products
router.get('/', async (req, res) => {
  try {
    const products = await Product.find({});
    // Format products to map MongoDB _id to id
    const formattedProducts = products.map(product => ({
      id: product._id,
      name: product.name,
      description: product.description,
      price: product.price,
      image_url: product.image_url,
      category: product.category,
      stock: product.stock,
      created_at: product.created_at
    }));
    res.json(formattedProducts);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving products.', error: err.message });
  }
});

// @route   GET api/products/:id
// @desc    Get a single product
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    res.json({
      id: product._id,
      name: product.name,
      description: product.description,
      price: product.price,
      image_url: product.image_url,
      category: product.category,
      stock: product.stock,
      created_at: product.created_at
    });
  } catch (err) {
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid product ID.' });
    }
    res.status(500).json({ message: 'Error retrieving product.', error: err.message });
  }
});

module.exports = router;
