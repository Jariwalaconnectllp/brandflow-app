const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const BrandingRequest = require('../models/BrandingRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { authenticate, authorize } = require('../middleware/auth');
const { uploadAttachments: uploadRequestAttachments, getFileUrl } = require('../middleware/upload');
const { sendNotificationEmail } = require('../services/emailService');

// Helper: add activity and send notifications
async function addActivity(request, action, user, options = {}) {
  const activity = {
    action,
    performedBy: user._id,
    performedByName: user.name,
    performedByRole: user.role,
    fromStatus: options.fromStatus,
    toStatus: options.toStatus,
    comment: options.comment,
    timestamp: new Date()
  };
  request.activities.push(activity);

  // Create in-app notification
  if (options.notifyUsers && options.notifyUsers.length > 0) {
    const notifs = options.notifyUsers.map(uid => ({
      recipient: uid,
      type: options.notifType || 'status_change',
      title: options.notifTitle || `Request ${request.requestNumber} Updated`,
      message: options.notifMessage || action,
      relatedRequest: request._id
    }));
    await Notification.insertMany(notifs);
  }
}

// GET /api/requests - list with filters
router.get('/', authenticate, async (req, res) => {
  const { status, city, dateFrom, dateTo, assignedTeam, search, page = 1, limit = 20 } = req.query;
  const filter = {};

  // Role-based filtering
  if (req.user.role === 'marketplace') filter.createdBy = req.user._id;
  else if (req.user.role === 'recce') filter.assignedRecce = req.user._id;
  else if (req.user.role === 'vendor') filter.assignedVendor = req.user._id;

  if (status) filter.status = status;
  if (city) filter['location.city'] = new RegExp(city, 'i');
  if (dateFrom || dateTo) {
    filter.createdAt = {};
    if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
    if (dateTo) filter.createdAt.$lte = new Date(dateTo);
  }
  if (search) {
    filter.$or = [
      { requestNumber: new RegExp(search, 'i') },
      { title: new RegExp(search, 'i') },
      { 'location.address': new RegExp(search, 'i') }
    ];
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const [requests, total] = await Promise.all([
    BrandingRequest.find(filter)
      .populate('createdBy', 'name email role')
      .populate('assignedRecce', 'name email')
      .populate('assignedVendor', 'name email vendorDetails')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    BrandingRequest.countDocuments(filter)
  ]);

  res.json({ requests, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
});

// POST /api/requests - create request
router.post('/', authenticate, authorize('marketplace', 'admin'),
  uploadRequestAttachments.array('attachments', 5),
  [
    body('title').notEmpty().trim(),
    body('brandingType').notEmpty(),
    body('location.address').notEmpty(),
    body('location.city').notEmpty(),
    body('location.state').notEmpty(),
    body('requirements').notEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const data = {
      ...req.body,
      location: typeof req.body.location === 'string' ? JSON.parse(req.body.location) : req.body.location,
      createdBy: req.user._id
    };

    if (req.files && req.files.length > 0) {
      data.attachments = req.files.map(f => ({
        url: getFileUrl(f),
        key: f.key || f.filename,
        caption: f.originalname,
        uploadedBy: req.user._id
      }));
    }

    const request = new BrandingRequest(data);
    await addActivity(request, 'Request created', req.user, {
      toStatus: 'created',
      notifType: 'request_created'
    });

    // Notify MIS team
    const misTeam = await User.find({ role: 'mis', isActive: true }).select('_id email name');
    await addActivity(request, 'Request created', req.user, {
      notifyUsers: misTeam.map(u => u._id),
      notifType: 'request_created',
      notifTitle: `New Branding Request: ${data.title}`,
      notifMessage: `A new branding request has been created by ${req.user.name}. Please review and assign.`
    });

    await request.save();
    await request.populate('createdBy', 'name email role');

    // Send email notifications
    for (const misUser of misTeam) {
      sendNotificationEmail(misUser.email, 'New Branding Request', `
        A new branding request "${data.title}" has been created.
        Request Number: ${request.requestNumber}
        City: ${data.location?.city}
      `).catch(console.error);
    }

    res.status(201).json({ request });
  }
);

// GET /api/requests/:id - get single request
router.get('/:id', authenticate, async (req, res) => {
  const request = await BrandingRequest.findById(req.params.id)
    .populate('createdBy', 'name email role phone')
    .populate('assignedMIS', 'name email')
    .populate('assignedRecce', 'name email phone')
    .populate('assignedVendor', 'name email phone vendorDetails')
    .populate('activities.performedBy', 'name email role');

  if (!request) return res.status(404).json({ error: 'Request not found' });
  res.json({ request });
});

// PUT /api/requests/:id/assign-recce - MIS assigns to recce team
router.put('/:id/assign-recce', authenticate, authorize('mis', 'admin'), async (req, res) => {
  const { recceUserId, misNotes } = req.body;
  const request = await BrandingRequest.findById(req.params.id);
  if (!request) return res.status(404).json({ error: 'Request not found' });
  if (!['created', 'assigned_to_recce'].includes(request.status)) {
    return res.status(400).json({ error: 'Request cannot be assigned in current status' });
  }

  const recceUser = await User.findOne({ _id: recceUserId, role: 'recce', isActive: true });
  if (!recceUser) return res.status(404).json({ error: 'Recce team member not found' });

  const fromStatus = request.status;
  request.assignedRecce = recceUserId;
  request.assignedMIS = req.user._id;
  request.status = 'assigned_to_recce';
  request.misNotes = misNotes;
  request.sla.assignedToRecceAt = new Date();

  await addActivity(request, `Assigned to Recce Team: ${recceUser.name}`, req.user, {
    fromStatus, toStatus: 'assigned_to_recce',
    notifyUsers: [recceUserId, request.createdBy],
    notifTitle: 'Request Assigned to You',
    notifMessage: `Request ${request.requestNumber} has been assigned to you for site recce.`
  });

  await request.save();
  res.json({ request, message: 'Assigned to recce team successfully' });
});

// PUT /api/requests/:id/approve - Admin approves/rejects
router.put('/:id/approve', authenticate, authorize('admin'), async (req, res) => {
  const { decision, comment, finalBudget } = req.body;
  if (!['approved', 'rejected'].includes(decision)) {
    return res.status(400).json({ error: 'Decision must be approved or rejected' });
  }

  const request = await BrandingRequest.findById(req.params.id);
  if (!request) return res.status(404).json({ error: 'Request not found' });
  if (request.status !== 'awaiting_approval') {
    return res.status(400).json({ error: 'Request is not awaiting approval' });
  }

  const fromStatus = request.status;
  request.status = decision;
  request.sla.approvalDecisionAt = new Date();

  if (decision === 'approved') {
    request.approval = { approvedBy: req.user._id, approvedAt: new Date(), comment, finalBudget };
  } else {
    request.approval = { rejectedBy: req.user._id, rejectedAt: new Date(), comment };
  }

  const notifyUsers = [request.createdBy, request.assignedMIS, request.assignedRecce].filter(Boolean);
  await addActivity(request, `Request ${decision} by Admin`, req.user, {
    fromStatus, toStatus: decision, comment,
    notifyUsers,
    notifType: decision,
    notifTitle: `Request ${decision.toUpperCase()}`,
    notifMessage: `Request ${request.requestNumber} has been ${decision}. ${comment || ''}`
  });

  await request.save();
  res.json({ request, message: `Request ${decision} successfully` });
});

// PUT /api/requests/:id/assign-vendor - MIS assigns to vendor after approval
router.put('/:id/assign-vendor', authenticate, authorize('mis', 'admin'), async (req, res) => {
  const { vendorId } = req.body;
  const request = await BrandingRequest.findById(req.params.id);
  if (!request) return res.status(404).json({ error: 'Request not found' });
  if (request.status !== 'approved') {
    return res.status(400).json({ error: 'Only approved requests can be assigned to vendor' });
  }

  const vendor = await User.findOne({ _id: vendorId, role: 'vendor', isActive: true });
  if (!vendor) return res.status(404).json({ error: 'Vendor not found' });

  const fromStatus = request.status;
  request.assignedVendor = vendorId;
  request.status = 'assigned_to_vendor';
  request.sla.assignedToVendorAt = new Date();

  await addActivity(request, `Assigned to Vendor: ${vendor.name}`, req.user, {
    fromStatus, toStatus: 'assigned_to_vendor',
    notifyUsers: [vendorId, request.createdBy],
    notifTitle: 'Work Order Assigned',
    notifMessage: `You have been assigned work order ${request.requestNumber}. Please proceed with the branding work.`
  });

  await request.save();
  res.json({ request, message: 'Assigned to vendor successfully' });
});

module.exports = router;
