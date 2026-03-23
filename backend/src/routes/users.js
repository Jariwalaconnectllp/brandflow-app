const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/users - list users (admin/mis)
router.get('/', authenticate, authorize('admin', 'mis'), async (req, res) => {
  const { role } = req.query;
  const filter = { isActive: true };
  if (role) filter.role = role;
  const users = await User.find(filter).select('-password').sort({ name: 1 });
  res.json({ users });
});

// PUT /api/users/:id - update user (admin)
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  const { name, phone, isActive, vendorDetails, notifications } = req.body;
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { name, phone, isActive, vendorDetails, notifications },
    { new: true, select: '-password' }
  );
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

// GET /api/users/recce-team
router.get('/recce-team', authenticate, authorize('mis', 'admin'), async (req, res) => {
  const team = await User.find({ role: 'recce', isActive: true }).select('name email phone');
  res.json({ team });
});

module.exports = router;
