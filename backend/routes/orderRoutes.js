const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');
const authMiddleware = require('../middleware/authMiddleware');

// @route   POST api/orders
// @desc    Create a new order
// @access  Private
router.post('/', authMiddleware, async (req, res) => {
  const { items } = req.body; // Expecting items array: [{ product_id, quantity, price }]
  const userId = req.user.id;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Order must contain at least one item.' });
  }

  // Pre-validate all items exist and have sufficient stock before attempting modifications
  let validatedTotalAmount = 0;
  try {
    for (const item of items) {
      if (!item.product_id || !item.quantity || !item.price) {
        return res.status(400).json({ message: 'Invalid item data. Each item requires product_id, quantity, and price.' });
      }

      const prod = await Product.findById(item.product_id);
      if (!prod) {
        return res.status(400).json({ message: `Product with ID ${item.product_id} not found.` });
      }
      if (prod.stock < item.quantity) {
        return res.status(400).json({ message: `Insufficient stock for product "${prod.name}". Available: ${prod.stock}, Requested: ${item.quantity}` });
      }

      // Use database price to prevent tamper
      item.price = prod.price;
      validatedTotalAmount += item.price * item.quantity;
    }

    // Atomically decrement stock for all items
    const updatedItems = [];
    try {
      for (const item of items) {
        const updatedProd = await Product.findOneAndUpdate(
          { _id: item.product_id, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { new: true }
        );

        if (!updatedProd) {
          throw new Error(`Insufficient stock checked at execution for product ID: ${item.product_id}`);
        }
        updatedItems.push({ product_id: item.product_id, quantity: item.quantity });
      }

      // Create and save the order in database
      const newOrder = new Order({
        user_id: userId,
        total_amount: validatedTotalAmount,
        status: 'Pending',
        items: items.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price
        }))
      });

      const savedOrder = await newOrder.save();

      res.status(201).json({
        message: 'Order created successfully.',
        orderId: savedOrder._id,
        totalAmount: validatedTotalAmount
      });

    } catch (execErr) {
      // Manual Rollback if one of the steps fails during multi-item execution
      for (const rolledBackItem of updatedItems) {
        await Product.findByIdAndUpdate(rolledBackItem.product_id, {
          $inc: { stock: rolledBackItem.quantity }
        });
      }
      throw execErr;
    }

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// @route   GET api/orders
// @desc    Get logged in user orders
// @access  Private
router.get('/', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    const orders = await Order.find({ user_id: userId })
      .populate('items.product_id')
      .sort({ created_at: -1 });

    // Format the response structure to match the frontend expectations
    const formattedOrders = orders.map(order => ({
      id: order._id,
      user_id: order.user_id,
      total_amount: order.total_amount,
      status: order.status,
      created_at: order.created_at,
      items: order.items.map(item => ({
        id: item._id,
        product_id: item.product_id?._id || item.product_id,
        product_name: item.product_id?.name || 'Unknown Product',
        quantity: item.quantity,
        price: item.price
      }))
    }));

    res.json(formattedOrders);
  } catch (err) {
    res.status(500).json({ message: 'Error retrieving order history.', error: err.message });
  }
});

module.exports = router;
