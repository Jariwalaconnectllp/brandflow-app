export const BRANDING_TYPES = ['Hoarding','Flex Banner','LED Signage','Wall Painting','Glow Sign Board','Standee','Vehicle Wrap','Digital Display','Neon Sign','Other'];

export const STATUS_CONFIG = {
  created:           { label: 'Created',              color: '#8890b5', bg: 'rgba(136,144,181,0.12)', icon: '🆕' },
  assigned_to_recce: { label: 'Assigned to Recce',   color: '#4f8ef7', bg: 'rgba(79,142,247,0.12)',  icon: '📋' },
  recce_in_progress: { label: 'Recce In Progress',   color: '#f6ad55', bg: 'rgba(246,173,85,0.12)',  icon: '🔍' },
  recce_completed:   { label: 'Recce Completed',     color: '#b794f4', bg: 'rgba(183,148,244,0.12)', icon: '✅' },
  awaiting_approval: { label: 'Awaiting Approval',   color: '#e8c547', bg: 'rgba(232,197,71,0.12)',  icon: '⏳' },
  approved:          { label: 'Approved',             color: '#3ecf8e', bg: 'rgba(62,207,142,0.12)', icon: '✔️' },
  rejected:          { label: 'Rejected',             color: '#f56565', bg: 'rgba(245,101,101,0.12)', icon: '❌' },
  assigned_to_vendor:{ label: 'Assigned to Vendor',  color: '#4fd1c5', bg: 'rgba(79,209,197,0.12)', icon: '🏭' },
  work_in_progress:  { label: 'Work In Progress',    color: '#f6ad55', bg: 'rgba(246,173,85,0.12)',  icon: '🔨' },
  work_completed:    { label: 'Work Completed',      color: '#3ecf8e', bg: 'rgba(62,207,142,0.12)', icon: '🎉' },
};

export const PRIORITY_CONFIG = {
  low:    { label: 'Low',    color: '#8890b5', bg: 'rgba(136,144,181,0.12)' },
  medium: { label: 'Medium', color: '#4f8ef7', bg: 'rgba(79,142,247,0.12)' },
  high:   { label: 'High',   color: '#f6ad55', bg: 'rgba(246,173,85,0.12)' },
  urgent: { label: 'Urgent', color: '#f56565', bg: 'rgba(245,101,101,0.12)' },
};

export const ROLE_CONFIG = {
  admin:       { label: 'Admin',           color: '#e8c547', bg: 'rgba(232,197,71,0.12)'  },
  marketplace: { label: 'Marketplace',    color: '#4f8ef7', bg: 'rgba(79,142,247,0.12)'  },
  mis:         { label: 'MIS Team',       color: '#b794f4', bg: 'rgba(183,148,244,0.12)' },
  recce:       { label: 'Recce Team',     color: '#4fd1c5', bg: 'rgba(79,209,197,0.12)'  },
  vendor:      { label: 'Vendor',         color: '#3ecf8e', bg: 'rgba(62,207,142,0.12)'  },
};

export const WORKFLOW_STEPS = [
  { key: 'created',            label: 'Request\nCreated',       role: 'Marketplace' },
  { key: 'assigned_to_recce',  label: 'Assigned\nto Recce',     role: 'MIS Team' },
  { key: 'recce_in_progress',  label: 'Recce In\nProgress',     role: 'Recce Team' },
  { key: 'awaiting_approval',  label: 'Awaiting\nApproval',     role: 'Admin' },
  { key: 'approved',           label: 'Approved',               role: 'Admin' },
  { key: 'assigned_to_vendor', label: 'Assigned\nto Vendor',    role: 'MIS Team' },
  { key: 'work_completed',     label: 'Work\nCompleted',        role: 'Vendor' },
];

export const getStatusConfig = (status) => STATUS_CONFIG[status] || { label: status, color: '#8890b5', bg: 'rgba(136,144,181,0.12)', icon: '•' };
export const getPriorityConfig = (priority) => PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.medium;

export const formatCurrency = (amount, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount || 0);

export const getStepIndex = (status) => {
  const order = ['created', 'assigned_to_recce', 'recce_in_progress', 'awaiting_approval', 'approved', 'assigned_to_vendor', 'work_in_progress', 'work_completed'];
  return order.indexOf(status);
};
