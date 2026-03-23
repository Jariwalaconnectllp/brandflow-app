const express = require('express');
const router = express.Router();
const BrandingRequest = require('../models/BrandingRequest');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadRecce, getFileUrl } = require('../middleware/upload');
const Notification = require('../models/Notification');
const User = require('../models/User');

router.put('/:requestId/update', authenticate, authorize('recce', 'admin'),
  uploadRecce.array('images', 10),
  async (req, res) => {
    const request = await BrandingRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (String(request.assignedRecce) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not assigned to this request' });
    }
    const { notes, estimatedCost, siteCondition, feasibility } = req.body;
    if (request.status === 'assigned_to_recce') {
      request.status = 'recce_in_progress';
    }
    request.recce = {
      ...request.recce,
      notes: notes || request.recce?.notes,
      estimatedCost: estimatedCost ? parseFloat(estimatedCost) : request.recce?.estimatedCost,
      siteCondition: siteCondition || request.recce?.siteCondition,
      feasibility: feasibility || request.recce?.feasibility
    };
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(f => ({
        url: getFileUrl(f), key: f.key || f.filename,
        caption: f.originalname, uploadedBy: req.user._id
      }));
      request.recce.images = [...(request.recce.images || []), ...newImages];
    }
    request.activities.push({
      action: 'Recce progress updated', performedBy: req.user._id,
      performedByName: req.user.name, performedByRole: req.user.role,
      toStatus: request.status, timestamp: new Date()
    });
    await request.save();
    res.json({ request, message: 'Recce updated successfully' });
  }
);

router.put('/:requestId/complete', authenticate, authorize('recce', 'admin'),
  uploadRecce.array('images', 10),
  async (req, res) => {
    const request = await BrandingRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (!['assigned_to_recce', 'recce_in_progress'].includes(request.status)) {
      return res.status(400).json({ error: 'Invalid status for recce completion' });
    }
    const { notes, estimatedCost, siteCondition, feasibility } = req.body;
    if (!estimatedCost) return res.status(400).json({ error: 'Estimated cost is required' });
    const fromStatus = request.status;
    request.status = 'awaiting_approval';
    request.recce = {
      notes, estimatedCost: parseFloat(estimatedCost),
      siteCondition, feasibility, completedAt: new Date(),
      images: request.recce?.images || []
    };
    request.sla.recceCompletedAt = new Date();
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(f => ({
        url: getFileUrl(f), key: f.key || f.filename,
        caption: f.originalname, uploadedBy: req.user._id
      }));
      request.recce.images = [...request.recce.images, ...newImages];
    }
    request.activities.push({
      action: 'Recce completed - submitted for approval', performedBy: req.user._id,
      performedByName: req.user.name, performedByRole: req.user.role,
      fromStatus, toStatus: 'awaiting_approval', timestamp: new Date()
    });
    const admins = await User.find({ role: 'admin', isActive: true }).select('_id');
    await Notification.insertMany(admins.map(a => ({
      recipient: a._id, type: 'recce_completed',
      title: `Recce Completed: ${request.requestNumber}`,
      message: `Site inspection completed. Estimated cost: ₹${estimatedCost}. Awaiting your approval.`,
      relatedRequest: request._id
    })));
    await request.save();
    res.json({ request, message: 'Recce submitted for approval' });
  }
);

module.exports = router;
