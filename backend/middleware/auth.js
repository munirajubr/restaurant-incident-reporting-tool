const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { UserFallback } = require('../services/dbFallback');

// Protect routes - Verify JWT Token
const protect = async (req, res, next) => {
  let token;

  // Read header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route. Token missing.'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // Fetch user from appropriate database driver
    if (process.env.USE_MOCK_DB === 'true') {
      req.user = await UserFallback.findById(decoded.id);
    } else {
      req.user = await User.findById(decoded.id).select('+password');
    }

    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not found in system.'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Not authorized to access this route. Invalid or expired token.'
    });
  }
};

// Grant access to specific roles (e.g., 'manager')
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `User role '${req.user ? req.user.role : 'guest'}' is not authorized to access this route.`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
