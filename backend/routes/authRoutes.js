const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_ecommerce_2026';

// @route   POST api/auth/register
// @desc    Register a user
router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Please enter all fields.' });
  }

  // Check email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Please enter a valid email address.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'A user with this email already exists.' });
    }

    // Check if username is already taken
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ message: 'Username is already taken.' });
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const newUser = new User({
      username,
      email: email.toLowerCase(),
      password: passwordHash
    });

    const savedUser = await newUser.save();

    // Generate JWT
    jwt.sign(
      { id: savedUser._id, username: savedUser.username, email: savedUser.email },
      JWT_SECRET,
      { expiresIn: '24h' },
      (jwtErr, token) => {
        if (jwtErr) {
          return res.status(500).json({ message: 'Error generating token.', error: jwtErr.message });
        }
        res.status(201).json({
          token,
          user: {
            id: savedUser._id,
            username: savedUser.username,
            email: savedUser.email
          }
        });
      }
    );
  } catch (err) {
    res.status(500).json({ message: 'Server error during registration.', error: err.message });
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user and get token
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter all fields.' });
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    // Generate JWT
    jwt.sign(
      { id: user._id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' },
      (jwtErr, token) => {
        if (jwtErr) {
          return res.status(500).json({ message: 'Error generating token.' });
        }
        res.json({
          token,
          user: {
            id: user._id,
            username: user.username,
            email: user.email
          }
        });
      }
    );
  } catch (err) {
    res.status(500).json({ message: 'Server error during login.', error: err.message });
  }
});

// @route   GET api/auth/me
// @desc    Get current user details
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User profile not found.' });
    }
    // Format response to match the fields returned by SQLite SELECT statement
    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      created_at: user.created_at
    });
  } catch (err) {
    res.status(500).json({ message: 'Database query error.', error: err.message });
  }
});

module.exports = router;
