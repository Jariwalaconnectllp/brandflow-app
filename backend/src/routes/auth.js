const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, {
  expiresIn: process.env.JWT_EXPIRES_IN || '7d'
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user || !await user.comparePassword(password)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  if (!user.isActive) {
    return res.status(403).json({ error: 'Account deactivated. Contact admin.' });
  }

  user.lastLogin = new Date();
  await user.save();

  res.json({
    token: generateToken(user._id),
    user: user.toJSON()
  });
});

// POST /api/auth/register (admin only in production)
router.post('/register', [
  body('name').notEmpty().trim(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['marketplace', 'mis', 'recce', 'admin', 'vendor'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, email, password, role, phone, vendorDetails } = req.body;

  const existing = await User.findOne({ email });
  if (existing) return res.status(409).json({ error: 'Email already registered' });

  const user = await User.create({ name, email, password, role, phone, vendorDetails });

  res.status(201).json({
    token: generateToken(user._id),
    user: user.toJSON()
  });
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// PUT /api/auth/change-password
router.put('/change-password', authenticate, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
], async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);

  if (!await user.comparePassword(currentPassword)) {
    return res.status(400).json({ error: 'Current password is incorrect' });
  }

  user.password = newPassword;
  await user.save();
  res.json({ message: 'Password updated successfully' });
});

module.exports = router;
