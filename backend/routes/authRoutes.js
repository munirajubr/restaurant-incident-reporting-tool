const express = require('express');
const { register, login, getMe } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.post('/register', protect, authorize('manager'), register);
router.post('/login', login);

// Protected routes (requires valid JWT token)
router.get('/me', protect, getMe);

module.exports = router;
