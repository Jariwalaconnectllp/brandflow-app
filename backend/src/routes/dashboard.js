const express = require('express');
const router = express.Router();
const BrandingRequest = require('../models/BrandingRequest');
const User = require('../models/User');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, async (req, res) => {
  const { role, _id } = req.user;
  const baseFilter = {};

  if (role === 'marketplace') baseFilter.createdBy = _id;
  else if (role === 'recce') baseFilter.assignedRecce = _id;
  else if (role === 'vendor') baseFilter.assignedVendor = _id;

  const [statusCounts, recentRequests, totalRequests] = await Promise.all([
    BrandingRequest.aggregate([
      { $match: baseFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    BrandingRequest.find(baseFilter)
      .populate('createdBy', 'name')
      .populate('assignedVendor', 'name')
      .sort({ updatedAt: -1 })
      .limit(10)
      .lean(),
    BrandingRequest.countDocuments(baseFilter)
  ]);

  const statusMap = {};
  statusCounts.forEach(s => { statusMap[s._id] = s.count; });

  // Role-specific KPIs
  let kpis = {};
  if (role === 'admin' || role === 'mis') {
    const [pendingApproval, completedThisMonth, vendors, cityBreakdown] = await Promise.all([
      BrandingRequest.countDocuments({ status: 'awaiting_approval' }),
      BrandingRequest.countDocuments({
        status: 'work_completed',
        'sla.workCompletedAt': { $gte: new Date(new Date().setDate(1)) }
      }),
      User.countDocuments({ role: 'vendor', isActive: true }),
      BrandingRequest.aggregate([
        { $group: { _id: '$location.city', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ])
    ]);
    kpis = { pendingApproval, completedThisMonth, totalVendors: vendors, topCities: cityBreakdown };
  }

  // SLA analysis
  const slaData = await BrandingRequest.aggregate([
    { $match: { ...baseFilter, status: 'work_completed' } },
    {
      $project: {
        totalDays: {
          $divide: [
            { $subtract: ['$sla.workCompletedAt', '$sla.createdAt'] },
            1000 * 60 * 60 * 24
          ]
        }
      }
    },
    { $group: { _id: null, avgDays: { $avg: '$totalDays' }, minDays: { $min: '$totalDays' }, maxDays: { $max: '$totalDays' } } }
  ]);

  res.json({
    statusCounts: statusMap,
    recentRequests,
    totalRequests,
    kpis,
    sla: slaData[0] || { avgDays: 0, minDays: 0, maxDays: 0 }
  });
});

module.exports = router;
