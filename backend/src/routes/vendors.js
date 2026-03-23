const express = require('express');
const router = express.Router();
const BrandingRequest = require('../models/BrandingRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadVendor: uploadVendorImages, getFileUrl } = require('../middleware/upload');

// GET /api/vendors - list all vendors (MIS/Admin)
router.get('/', authenticate, authorize('mis', 'admin'), async (req, res) => {
  const vendors = await User.find({ role: 'vendor', isActive: true })
    .select('name email phone vendorDetails createdAt')
    .sort({ 'vendorDetails.rating': -1 });
  res.json({ vendors });
});

// PUT /api/vendors/:requestId/start - Vendor starts work
router.put('/:requestId/start', authenticate, authorize('vendor', 'admin'), async (req, res) => {
  const request = await BrandingRequest.findById(req.params.requestId);
  if (!request) return res.status(404).json({ error: 'Request not found' });
  if (String(request.assignedVendor) !== String(req.user._id) && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Not assigned to this request' });
  }
  if (request.status !== 'assigned_to_vendor') {
    return res.status(400).json({ error: 'Work cannot be started in current status' });
  }

  request.status = 'work_in_progress';
  request.vendorWork = { startedAt: new Date() };
  request.activities.push({
    action: 'Vendor started branding work',
    performedBy: req.user._id,
    performedByName: req.user.name,
    performedByRole: req.user.role,
    fromStatus: 'assigned_to_vendor',
    toStatus: 'work_in_progress',
    timestamp: new Date()
  });

  await request.save();
  res.json({ request, message: 'Work started' });
});

// PUT /api/vendors/:requestId/complete - Vendor completes work
router.put('/:requestId/complete', authenticate, authorize('vendor', 'admin'),
  uploadVendorImages.array('images', 15),
  async (req, res) => {
    const request = await BrandingRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (!['assigned_to_vendor', 'work_in_progress'].includes(request.status)) {
      return res.status(400).json({ error: 'Invalid status for work completion' });
    }
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'At least one completion image is required' });
    }

    const { notes, actualCost } = req.body;
    const fromStatus = request.status;
    request.status = 'work_completed';
    request.sla.workCompletedAt = new Date();
    request.vendorWork = {
      ...request.vendorWork,
      completedAt: new Date(), notes, actualCost: actualCost ? parseFloat(actualCost) : undefined,
      images: req.files.map(f => ({
        url: getFileUrl(f), key: f.key || f.filename,
        caption: f.originalname, uploadedBy: req.user._id
      }))
    };

    request.activities.push({
      action: 'Branding work completed by vendor',
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      fromStatus, toStatus: 'work_completed',
      timestamp: new Date()
    });

    // Notify requester and admin
    const notifyIds = [request.createdBy, request.assignedMIS].filter(Boolean);
    await Notification.insertMany(notifyIds.map(uid => ({
      recipient: uid,
      type: 'work_completed',
      title: `Work Completed: ${request.requestNumber}`,
      message: `The branding work for request ${request.requestNumber} has been completed.`,
      relatedRequest: request._id,
      priority: 'high'
    })));

    // Update vendor stats
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'vendorDetails.completedJobs': 1 }
    });

    await request.save();
    res.json({ request, message: 'Work completed successfully' });
  }
);

module.exports = router;
