const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { authenticate } = require('../middleware/auth');

// GET /api/notifications
router.get('/', authenticate, async (req, res) => {
  const { page = 1, limit = 20, unreadOnly } = req.query;
  const filter = { recipient: req.user._id };
  if (unreadOnly === 'true') filter.isRead = false;

  const [notifications, unreadCount] = await Promise.all([
    Notification.find(filter)
      .populate('relatedRequest', 'requestNumber title status')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit)),
    Notification.countDocuments({ recipient: req.user._id, isRead: false })
  ]);

  res.json({ notifications, unreadCount });
});

// PUT /api/notifications/read-all
router.put('/read-all', authenticate, async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true, readAt: new Date() }
  );
  res.json({ message: 'All notifications marked as read' });
});

// PUT /api/notifications/:id/read
router.put('/:id/read', authenticate, async (req, res) => {
  await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { isRead: true, readAt: new Date() }
  );
  res.json({ message: 'Notification marked as read' });
});

module.exports = router;
