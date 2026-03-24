export const BRANDING_TYPES = ['Hoarding', 'Flex Banner', 'LED Signage', 'Wall Painting', 'Glow Sign Board', 'Standee', 'Vehicle Wrap', 'Digital Display', 'Neon Sign', 'Other'];

export const STATUS_CONFIG = {
  created:            { label: 'Created',            color: '#758780', bg: 'rgba(117,135,128,0.14)', icon: '•' },
  assigned_to_recce:  { label: 'Assigned to Recce', color: '#88b7ff', bg: 'rgba(136,183,255,0.14)', icon: '→' },
  recce_in_progress:  { label: 'Recce In Progress', color: '#f2bb72', bg: 'rgba(242,187,114,0.14)', icon: '◌' },
  recce_completed:    { label: 'Recce Completed',   color: '#c7b6ff', bg: 'rgba(199,182,255,0.14)', icon: '✓' },
  awaiting_approval:  { label: 'Awaiting Approval', color: '#c7b6ff', bg: 'rgba(199,182,255,0.16)', icon: '…' },
  approved:           { label: 'Approved',          color: '#74d39f', bg: 'rgba(116,211,159,0.14)', icon: '+' },
  rejected:           { label: 'Rejected',          color: '#ff7f8f', bg: 'rgba(255,127,143,0.14)', icon: '×' },
  assigned_to_vendor: { label: 'Assigned to Vendor', color: '#7bd9c0', bg: 'rgba(123,217,192,0.14)', icon: '→' },
  work_in_progress:   { label: 'Work In Progress',  color: '#f2bb72', bg: 'rgba(242,187,114,0.14)', icon: '~' },
  work_completed:     { label: 'Work Completed',    color: '#74d39f', bg: 'rgba(116,211,159,0.14)', icon: '✓' },
};

export const PRIORITY_CONFIG = {
  low:    { label: 'Low',    color: '#758780', bg: 'rgba(117,135,128,0.14)' },
  medium: { label: 'Medium', color: '#88b7ff', bg: 'rgba(136,183,255,0.14)' },
  high:   { label: 'High',   color: '#f2bb72', bg: 'rgba(242,187,114,0.14)' },
  urgent: { label: 'Urgent', color: '#ff7f8f', bg: 'rgba(255,127,143,0.14)' },
};

export const ROLE_CONFIG = {
  admin:       { label: 'Admin',       color: '#c7b6ff', bg: 'rgba(199,182,255,0.16)' },
  marketplace: { label: 'Marketplace', color: '#88b7ff', bg: 'rgba(136,183,255,0.14)' },
  mis:         { label: 'MIS Team',    color: '#c7b6ff', bg: 'rgba(199,182,255,0.14)' },
  recce:       { label: 'Recce Team',  color: '#7bd9c0', bg: 'rgba(123,217,192,0.14)' },
  vendor:      { label: 'Vendor',      color: '#74d39f', bg: 'rgba(116,211,159,0.14)' },
};

export const WORKFLOW_STEPS = [
  { key: 'created',            label: 'Request\nCreated',    role: 'Marketplace' },
  { key: 'assigned_to_recce',  label: 'Assigned\nto Recce',  role: 'MIS Team' },
  { key: 'recce_in_progress',  label: 'Recce In\nProgress',  role: 'Recce Team' },
  { key: 'awaiting_approval',  label: 'Awaiting\nApproval',  role: 'Admin' },
  { key: 'approved',           label: 'Approved',            role: 'Admin' },
  { key: 'assigned_to_vendor', label: 'Assigned\nto Vendor', role: 'MIS Team' },
  { key: 'work_completed',     label: 'Work\nCompleted',     role: 'Vendor' },
];

export const getStatusConfig = (status) =>
  STATUS_CONFIG[status] || { label: status, color: '#758780', bg: 'rgba(117,135,128,0.14)', icon: '•' };

export const getPriorityConfig = (priority) => PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;

export const formatCurrency = (amount, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount || 0);

export const getStepIndex = (status) => {
  const order = ['created', 'assigned_to_recce', 'recce_in_progress', 'awaiting_approval', 'approved', 'assigned_to_vendor', 'work_in_progress', 'work_completed'];
  return order.indexOf(status);
};
