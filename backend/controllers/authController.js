const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { UserFallback } = require('../services/dbFallback');

// Helper to generate JWT Token
const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// @desc    Register a new user (staff or manager)
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, storeLocation } = req.body;

    // Validate inputs
    if (!name || !email || !password || !storeLocation) {
      return res.status(400).json({
        success: false,
        error: 'Please provide name, email, password, and store location'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    let existingUser;
    if (process.env.USE_MOCK_DB === 'true') {
      existingUser = await UserFallback.findOne({ email: normalizedEmail });
    } else {
      existingUser = await User.findOne({ email: normalizedEmail });
    }

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'User with this email already exists'
      });
    }

    // Create user
    let user;
    if (process.env.USE_MOCK_DB === 'true') {
      user = await UserFallback.create({
        name,
        email: normalizedEmail,
        password,
        role,
        storeLocation
      });
    } else {
      user = await User.create({
        name,
        email: normalizedEmail,
        password,
        role,
        storeLocation
      });
    }

    // Generate Token
    const token = generateToken(user._id);

    // Return response
    return res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        storeLocation: user.storeLocation
      }
    });

  } catch (error) {
    console.error('Registration Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Server error during registration'
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate inputs
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an email and password'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user and include password field
    let user;
    if (process.env.USE_MOCK_DB === 'true') {
      user = await UserFallback.findOne({ email: normalizedEmail });
    } else {
      user = await User.findOne({ email: normalizedEmail }).select('+password');
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Incorrect email or password'
      });
    }

    // Check if password matches
    let isMatch = false;
    if (process.env.USE_MOCK_DB === 'true') {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      isMatch = await user.comparePassword(password);
    }

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Incorrect email or password'
      });
    }

    // Generate Token
    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        storeLocation: user.storeLocation
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Server error during authentication'
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    // req.user is set by protect middleware
    return res.status(200).json({
      success: true,
      user: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        storeLocation: req.user.storeLocation
      }
    });
  } catch (error) {
    console.error('Get Me Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Server error retrieving profile'
    });
  }
};
