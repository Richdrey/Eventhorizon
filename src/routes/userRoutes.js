const express = require('express');
const router = express.Router();
const { register, verifyEmail, login } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const User = require('../models/userModel');

router.post('/auth/register', register);
router.get('/auth/verify-email', verifyEmail);
router.post('/auth/login', login);

router.get('/user/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
