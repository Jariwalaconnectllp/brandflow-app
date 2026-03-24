require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const BrandingRequest = require('../models/BrandingRequest');

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/branding_system');
  console.log('Connected to MongoDB');

  // Clear existing data
  await User.deleteMany({});
  await BrandingRequest.deleteMany({});

  // Create users
  const users = await User.create([
    { name: 'Admin User', email: 'admin@branding.com', password: 'password123', role: 'admin', phone: '9000000001' },
    { name: 'Priya Sharma', email: 'marketplace@branding.com', password: 'password123', role: 'marketplace', phone: '9000000002' },
    { name: 'Rahul Verma', email: 'mis@branding.com', password: 'password123', role: 'mis', phone: '9000000003' },
    { name: 'Amit Singh', email: 'recce@branding.com', password: 'password123', role: 'recce', phone: '9000000004' },
    {
      name: 'FastPrint Vendors', email: 'vendor@branding.com', password: 'password123', role: 'vendor', phone: '9000000005',
      vendorDetails: { companyName: 'FastPrint Solutions', serviceArea: ['Surat', 'Ahmedabad'], rating: 4.5, completedJobs: 23 }
    }
  ]);

  console.log('✅ Users created:');
  users.forEach(u => console.log(`  ${u.role}: ${u.email} / password123`));

  // Create sample requests
  const [admin, marketplace, mis, recce, vendor] = users;

  const req1 = new BrandingRequest({
    title: 'Hoarding at Ring Road Junction',
    brandingType: 'Hoarding',
    status: 'awaiting_approval',
    location: { address: 'Ring Road, Near Sarthana Junction', city: 'Surat', state: 'Gujarat', pincode: '395006' },
    requirements: 'Large 40x20 ft hoarding for product launch campaign. Illuminated preferred.',
    priority: 'high',
    createdBy: marketplace._id,
    assignedMIS: mis._id,
    assignedRecce: recce._id,
    recce: {
      notes: 'Site is accessible. Good visibility from both directions. Power connection available nearby.',
      estimatedCost: 85000,
      siteCondition: 'good',
      feasibility: 'feasible',
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      images: []
    },
    activities: [
      { action: 'Request created', performedBy: marketplace._id, performedByName: marketplace.name, performedByRole: 'marketplace', toStatus: 'created', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
      { action: 'Assigned to Recce Team', performedBy: mis._id, performedByName: mis.name, performedByRole: 'mis', fromStatus: 'created', toStatus: 'assigned_to_recce', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
      { action: 'Recce completed - submitted for approval', performedBy: recce._id, performedByName: recce.name, performedByRole: 'recce', fromStatus: 'recce_in_progress', toStatus: 'awaiting_approval', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }
    ]
  });
  req1.sla = { createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), assignedToRecceAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), recceCompletedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) };
  await req1.save();

  const req2 = new BrandingRequest({
    title: 'LED Signage for Mall Entrance',
    brandingType: 'LED Signage',
    status: 'assigned_to_recce',
    location: { address: 'VR Surat Mall, Dumas Road', city: 'Surat', state: 'Gujarat', pincode: '395007' },
    requirements: 'LED display board 10x6 ft at the main entrance. Full color with animation support.',
    priority: 'medium',
    createdBy: marketplace._id,
    assignedMIS: mis._id,
    assignedRecce: recce._id,
    activities: [
      { action: 'Request created', performedBy: marketplace._id, performedByName: marketplace.name, performedByRole: 'marketplace', toStatus: 'created', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
      { action: 'Assigned to Recce Team', performedBy: mis._id, performedByName: mis.name, performedByRole: 'mis', fromStatus: 'created', toStatus: 'assigned_to_recce', timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000) }
    ]
  });
  req2.sla = { createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), assignedToRecceAt: new Date(Date.now() - 6 * 60 * 60 * 1000) };
  await req2.save();

  const req3 = new BrandingRequest({
    title: 'Wall Painting - Citylight',
    brandingType: 'Wall Painting',
    status: 'work_completed',
    location: { address: 'Citylight, Parle Point', city: 'Surat', state: 'Gujarat', pincode: '395007' },
    requirements: 'Wall painting 20x15 ft, brand colors as per guidelines.',
    priority: 'low',
    createdBy: marketplace._id,
    assignedMIS: mis._id,
    assignedRecce: recce._id,
    assignedVendor: vendor._id,
    recce: { notes: 'Good wall condition.', estimatedCost: 35000, siteCondition: 'good', feasibility: 'feasible', completedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) },
    approval: { approvedBy: admin._id, approvedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), comment: 'Approved. Proceed with standard guidelines.', finalBudget: 35000 },
    vendorWork: { startedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), notes: 'Work completed as per specifications.', actualCost: 33000, images: [] },
    activities: [
      { action: 'Request created', performedBy: marketplace._id, performedByName: marketplace.name, performedByRole: 'marketplace', toStatus: 'created', timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) },
      { action: 'Assigned to Recce Team', performedBy: mis._id, performedByName: mis.name, performedByRole: 'mis', fromStatus: 'created', toStatus: 'assigned_to_recce', timestamp: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000) },
      { action: 'Recce completed', performedBy: recce._id, performedByName: recce.name, performedByRole: 'recce', fromStatus: 'recce_in_progress', toStatus: 'awaiting_approval', timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) },
      { action: 'Request approved', performedBy: admin._id, performedByName: admin.name, performedByRole: 'admin', fromStatus: 'awaiting_approval', toStatus: 'approved', timestamp: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000) },
      { action: 'Assigned to vendor', performedBy: mis._id, performedByName: mis.name, performedByRole: 'mis', fromStatus: 'approved', toStatus: 'assigned_to_vendor', timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
      { action: 'Work completed', performedBy: vendor._id, performedByName: vendor.name, performedByRole: 'vendor', fromStatus: 'work_in_progress', toStatus: 'work_completed', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) }
    ]
  });
  req3.sla = { createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), assignedToRecceAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000), recceCompletedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), approvalDecisionAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), assignedToVendorAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), workCompletedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) };
  await req3.save();

  console.log('\n✅ Sample requests created');
  console.log('\n🚀 Seed complete! Login credentials:');
  console.log('  Admin:       admin@branding.com / password123');
  console.log('  Marketplace: marketplace@branding.com / password123');
  console.log('  MIS:         mis@branding.com / password123');
  console.log('  Recce:       recce@branding.com / password123');
  console.log('  Vendor:      vendor@branding.com / password123\n');

  await mongoose.disconnect();
};

seed().catch(err => { console.error(err); process.exit(1); });
