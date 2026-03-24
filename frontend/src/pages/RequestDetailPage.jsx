import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, PriorityBadge } from '../components/common/StatusBadge';
import WorkflowTracker from '../components/common/WorkflowTracker';
import { formatCurrency } from '../utils/statusHelpers';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';
import {
  MapPin, Calendar, User, ArrowLeft, Clock, DollarSign,
  Image, FileText, CheckCircle, XCircle, Send, Camera, ChevronDown, ChevronUp
} from 'lucide-react';
import styles from './RequestDetailPage.module.css';

export default function RequestDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activePanel, setActivePanel] = useState(null);
  const [recceTeam, setRecceTeam] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [showTimeline, setShowTimeline] = useState(true);

  // Action form states
  const [assignRecceForm, setAssignRecceForm] = useState({ recceUserId: '', misNotes: '' });
  const [recceForm, setRecceForm] = useState({ notes: '', estimatedCost: '', siteCondition: '', feasibility: '' });
  const [recceImages, setRecceImages] = useState([]);
  const [approvalForm, setApprovalForm] = useState({ decision: '', comment: '', finalBudget: '' });
  const [assignVendorForm, setAssignVendorForm] = useState({ vendorId: '' });
  const [vendorForm, setVendorForm] = useState({ notes: '', actualCost: '' });
  const [vendorImages, setVendorImages] = useState([]);

  const fetchRequest = useCallback(async () => {
    try {
      const res = await api.get(`/requests/${id}`);
      setRequest(res.data.request);
    } catch (err) {
      toast.error('Request not found');
      navigate('/requests');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchRequest();
    if (['mis', 'admin'].includes(user?.role)) {
      api.get('/users/recce-team').then(r => setRecceTeam(r.data.team)).catch(() => {});
      api.get('/vendors').then(r => setVendors(r.data.vendors)).catch(() => {});
    }
  }, [fetchRequest, user?.role]);

  const handleAssignRecce = async () => {
    if (!assignRecceForm.recceUserId) return toast.error('Please select a recce team member');
    setActionLoading(true);
    try {
      await api.put(`/requests/${id}/assign-recce`, assignRecceForm);
      toast.success('Assigned to recce team!');
      setActivePanel(null);
      fetchRequest();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to assign');
    } finally { setActionLoading(false); }
  };

  const handleRecceComplete = async () => {
    if (!recceForm.estimatedCost) return toast.error('Estimated cost is required');
    setActionLoading(true);
    try {
      const fd = new FormData();
      Object.entries(recceForm).forEach(([k, v]) => fd.append(k, v));
      recceImages.forEach(f => fd.append('images', f));
      await api.put(`/recce/${id}/complete`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Recce submitted for approval!');
      setActivePanel(null);
      fetchRequest();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit recce');
    } finally { setActionLoading(false); }
  };

  const handleApproval = async () => {
    if (!approvalForm.decision) return toast.error('Please select a decision');
    setActionLoading(true);
    try {
      await api.put(`/requests/${id}/approve`, approvalForm);
      toast.success(`Request ${approvalForm.decision}!`);
      setActivePanel(null);
      fetchRequest();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit decision');
    } finally { setActionLoading(false); }
  };

  const handleAssignVendor = async () => {
    if (!assignVendorForm.vendorId) return toast.error('Please select a vendor');
    setActionLoading(true);
    try {
      await api.put(`/requests/${id}/assign-vendor`, assignVendorForm);
      toast.success('Assigned to vendor!');
      setActivePanel(null);
      fetchRequest();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to assign vendor');
    } finally { setActionLoading(false); }
  };

  const handleVendorComplete = async () => {
    if (vendorImages.length === 0) return toast.error('At least one completion image is required');
    setActionLoading(true);
    try {
      const fd = new FormData();
      Object.entries(vendorForm).forEach(([k, v]) => fd.append(k, v));
      vendorImages.forEach(f => fd.append('images', f));
      await api.put(`/vendors/${id}/complete`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Work marked as completed!');
      setActivePanel(null);
      fetchRequest();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to complete');
    } finally { setActionLoading(false); }
  };

  const handleVendorStart = async () => {
    setActionLoading(true);
    try {
      await api.put(`/vendors/${id}/start`);
      toast.success('Work started!');
      fetchRequest();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally { setActionLoading(false); }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>;
  if (!request) return null;

  const canAssignRecce = ['mis', 'admin'].includes(user?.role) && ['created', 'assigned_to_recce'].includes(request.status);
  const canCompleteRecce = user?.role === 'recce' && ['assigned_to_recce', 'recce_in_progress'].includes(request.status)
    && String(request.assignedRecce?._id) === String(user._id);
  const canApprove = user?.role === 'admin' && request.status === 'awaiting_approval';
  const canAssignVendor = ['mis', 'admin'].includes(user?.role) && request.status === 'approved';
  const canStartWork = user?.role === 'vendor' && request.status === 'assigned_to_vendor';
  const canCompleteWork = user?.role === 'vendor' && ['assigned_to_vendor', 'work_in_progress'].includes(request.status);

  return (
    <div className={styles.page}>
      {/* Back */}
      <Link to="/requests" className={styles.back}><ArrowLeft size={16} /> All Requests</Link>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span className="font-mono text-accent" style={{ fontSize: 13 }}>{request.requestNumber}</span>
            <StatusBadge status={request.status} />
            <PriorityBadge priority={request.priority} />
          </div>
          <h1 className={styles.title}>{request.title}</h1>
          <div className={styles.meta}>
            <span><User size={13} /> {request.createdBy?.name}</span>
            <span><MapPin size={13} /> {request.location?.city}, {request.location?.state}</span>
            <span><Calendar size={13} /> {format(new Date(request.createdAt), 'dd MMM yyyy')}</span>
            <span><Clock size={13} /> {formatDistanceToNow(new Date(request.updatedAt), { addSuffix: true })}</span>
          </div>
        </div>
      </div>

      {/* Workflow tracker */}
      <div className="card">
        <h3 className={styles.sectionTitle}>Workflow Progress</h3>
        <WorkflowTracker status={request.status} />
      </div>

      <div className={styles.grid}>
        {/* Left column */}
        <div className={styles.mainCol}>

          {/* Details */}
          <div className="card">
            <h3 className={styles.sectionTitle}><FileText size={15} /> Request Details</h3>
            <div className={styles.detailGrid}>
              <DetailRow label="Branding Type" value={request.brandingType} />
              <DetailRow label="Address" value={request.location?.address} />
              <DetailRow label="City" value={`${request.location?.city}, ${request.location?.state} ${request.location?.pincode || ''}`} />
              {request.location?.landmark && <DetailRow label="Landmark" value={request.location.landmark} />}
              {request.targetDate && <DetailRow label="Target Date" value={format(new Date(request.targetDate), 'dd MMM yyyy')} />}
            </div>
            <div className={styles.requirements}>
              <label>Requirements</label>
              <p>{request.requirements}</p>
            </div>
          </div>

          {/* Recce Details */}
          {request.recce?.notes && (
            <div className="card">
              <h3 className={styles.sectionTitle}><Camera size={15} /> Recce Report</h3>
              <div className={styles.detailGrid}>
                <DetailRow label="Estimated Cost" value={formatCurrency(request.recce.estimatedCost)} highlight />
                {request.recce.siteCondition && <DetailRow label="Site Condition" value={request.recce.siteCondition} />}
                {request.recce.feasibility && <DetailRow label="Feasibility" value={request.recce.feasibility?.replace(/_/g, ' ')} />}
                {request.recce.completedAt && <DetailRow label="Recce Date" value={format(new Date(request.recce.completedAt), 'dd MMM yyyy')} />}
              </div>
              {request.recce.notes && (
                <div className={styles.requirements}>
                  <label>Site Notes</label>
                  <p>{request.recce.notes}</p>
                </div>
              )}
              {request.recce.images?.length > 0 && (
                <div className={styles.imageGrid}>
                  <label style={{ display: 'block', marginBottom: 8 }}>Recce Images ({request.recce.images.length})</label>
                  <div className={styles.images}>
                    {request.recce.images.map((img, i) => (
                      <a key={i} href={img.url} target="_blank" rel="noreferrer">
                        <div className={styles.imgThumb} style={{ backgroundImage: `url(${img.url})` }} />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Approval */}
          {request.approval?.approvedAt && (
            <div className="card" style={{ borderColor: 'rgba(62,207,142,0.3)' }}>
              <h3 className={styles.sectionTitle}><CheckCircle size={15} style={{ color: 'var(--green)' }} /> Approval Details</h3>
              <div className={styles.detailGrid}>
                <DetailRow label="Decision" value="✅ Approved" highlight />
                {request.approval.finalBudget && <DetailRow label="Approved Budget" value={formatCurrency(request.approval.finalBudget)} highlight />}
                <DetailRow label="Approved On" value={format(new Date(request.approval.approvedAt), 'dd MMM yyyy HH:mm')} />
              </div>
              {request.approval.comment && (
                <div className={styles.requirements}><label>Comment</label><p>{request.approval.comment}</p></div>
              )}
            </div>
          )}

          {request.approval?.rejectedAt && (
            <div className="card" style={{ borderColor: 'rgba(245,101,101,0.3)' }}>
              <h3 className={styles.sectionTitle}><XCircle size={15} style={{ color: 'var(--red)' }} /> Rejection Details</h3>
              <div className={styles.requirements}><label>Reason</label><p>{request.approval.comment || 'No reason provided'}</p></div>
            </div>
          )}

          {/* Vendor Work */}
          {request.vendorWork?.completedAt && (
            <div className="card" style={{ borderColor: 'rgba(62,207,142,0.3)' }}>
              <h3 className={styles.sectionTitle}><CheckCircle size={15} style={{ color: 'var(--green)' }} /> Work Completion</h3>
              <div className={styles.detailGrid}>
                {request.vendorWork.actualCost && <DetailRow label="Actual Cost" value={formatCurrency(request.vendorWork.actualCost)} highlight />}
                <DetailRow label="Completed On" value={format(new Date(request.vendorWork.completedAt), 'dd MMM yyyy')} />
              </div>
              {request.vendorWork.notes && (
                <div className={styles.requirements}><label>Notes</label><p>{request.vendorWork.notes}</p></div>
              )}
              {request.vendorWork.images?.length > 0 && (
                <div className={styles.imageGrid}>
                  <label style={{ display: 'block', marginBottom: 8 }}>Final Images ({request.vendorWork.images.length})</label>
                  <div className={styles.images}>
                    {request.vendorWork.images.map((img, i) => (
                      <a key={i} href={img.url} target="_blank" rel="noreferrer">
                        <div className={styles.imgThumb} style={{ backgroundImage: `url(${img.url})` }} />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Action Panels */}
          {canAssignRecce && (
            <ActionCard title="Assign to Recce Team" icon={<Send size={15} />}
              open={activePanel === 'recce'} onToggle={() => setActivePanel(p => p === 'recce' ? null : 'recce')}>
              <div>
                <label>Select Recce Team Member</label>
                <select value={assignRecceForm.recceUserId} onChange={e => setAssignRecceForm(f => ({ ...f, recceUserId: e.target.value }))}>
                  <option value="">-- Choose member --</option>
                  {recceTeam.map(m => <option key={m._id} value={m._id}>{m.name} ({m.email})</option>)}
                </select>
              </div>
              <div>
                <label>MIS Notes (optional)</label>
                <textarea rows={3} placeholder="Add any notes for the recce team..." value={assignRecceForm.misNotes}
                  onChange={e => setAssignRecceForm(f => ({ ...f, misNotes: e.target.value }))} />
              </div>
              <button className="btn-primary" onClick={handleAssignRecce} disabled={actionLoading}>
                {actionLoading ? <div className="spinner" style={{ width: 16, height: 16 }} /> : <><Send size={14} /> Assign</>}
              </button>
            </ActionCard>
          )}

          {canCompleteRecce && (
            <ActionCard title="Submit Recce Report" icon={<Camera size={15} />}
              open={activePanel === 'complete-recce'} onToggle={() => setActivePanel(p => p === 'complete-recce' ? null : 'complete-recce')}>
              <div className="grid-2">
                <div>
                  <label>Site Condition</label>
                  <select value={recceForm.siteCondition} onChange={e => setRecceForm(f => ({ ...f, siteCondition: e.target.value }))}>
                    <option value="">Select...</option>
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
                <div>
                  <label>Feasibility</label>
                  <select value={recceForm.feasibility} onChange={e => setRecceForm(f => ({ ...f, feasibility: e.target.value }))}>
                    <option value="">Select...</option>
                    <option value="feasible">Feasible</option>
                    <option value="feasible_with_changes">Feasible with Changes</option>
                    <option value="not_feasible">Not Feasible</option>
                  </select>
                </div>
              </div>
              <div>
                <label>Estimated Cost (₹) *</label>
                <input type="number" placeholder="e.g. 85000" value={recceForm.estimatedCost}
                  onChange={e => setRecceForm(f => ({ ...f, estimatedCost: e.target.value }))} />
              </div>
              <div>
                <label>Site Notes *</label>
                <textarea rows={3} placeholder="Describe site conditions, access, observations..."
                  value={recceForm.notes} onChange={e => setRecceForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div>
                <label>Site Images</label>
                <input type="file" multiple accept="image/*" onChange={e => setRecceImages(Array.from(e.target.files))} />
                {recceImages.length > 0 && <p className="text-xs text-muted mt-1">{recceImages.length} file(s) selected</p>}
              </div>
              <button className="btn-primary" onClick={handleRecceComplete} disabled={actionLoading}>
                {actionLoading ? <div className="spinner" style={{ width: 16, height: 16 }} /> : <><CheckCircle size={14} /> Submit Recce Report</>}
              </button>
            </ActionCard>
          )}

          {canApprove && (
            <ActionCard title="Approve / Reject Request" icon={<CheckCircle size={15} />}
              open={activePanel === 'approve'} onToggle={() => setActivePanel(p => p === 'approve' ? null : 'approve')}>
              <div className={styles.approvalBtns}>
                <button
                  className={`${styles.decisionBtn} ${approvalForm.decision === 'approved' ? styles.approvedSelected : ''}`}
                  onClick={() => setApprovalForm(f => ({ ...f, decision: 'approved' }))}>
                  <CheckCircle size={16} /> Approve
                </button>
                <button
                  className={`${styles.decisionBtn} ${styles.rejectBtn} ${approvalForm.decision === 'rejected' ? styles.rejectedSelected : ''}`}
                  onClick={() => setApprovalForm(f => ({ ...f, decision: 'rejected' }))}>
                  <XCircle size={16} /> Reject
                </button>
              </div>
              {approvalForm.decision === 'approved' && (
                <div>
                  <label>Approved Budget (₹)</label>
                  <input type="number" placeholder={request.recce?.estimatedCost || '0'}
                    value={approvalForm.finalBudget} onChange={e => setApprovalForm(f => ({ ...f, finalBudget: e.target.value }))} />
                </div>
              )}
              <div>
                <label>Comment</label>
                <textarea rows={3} placeholder="Add feedback or reason..."
                  value={approvalForm.comment} onChange={e => setApprovalForm(f => ({ ...f, comment: e.target.value }))} />
              </div>
              <button className={approvalForm.decision === 'rejected' ? 'btn-danger' : 'btn-primary'} onClick={handleApproval} disabled={actionLoading || !approvalForm.decision}>
                {actionLoading ? <div className="spinner" style={{ width: 16, height: 16 }} /> : `Submit ${approvalForm.decision || 'Decision'}`}
              </button>
            </ActionCard>
          )}

          {canAssignVendor && (
            <ActionCard title="Assign to Vendor" icon={<Send size={15} />}
              open={activePanel === 'vendor'} onToggle={() => setActivePanel(p => p === 'vendor' ? null : 'vendor')}>
              <div>
                <label>Select Vendor</label>
                <select value={assignVendorForm.vendorId} onChange={e => setAssignVendorForm({ vendorId: e.target.value })}>
                  <option value="">-- Choose vendor --</option>
                  {vendors.map(v => <option key={v._id} value={v._id}>{v.vendorDetails?.companyName || v.name} ★{v.vendorDetails?.rating || 0}</option>)}
                </select>
              </div>
              <button className="btn-primary" onClick={handleAssignVendor} disabled={actionLoading}>
                {actionLoading ? <div className="spinner" style={{ width: 16, height: 16 }} /> : <><Send size={14} /> Assign to Vendor</>}
              </button>
            </ActionCard>
          )}

          {canStartWork && (
            <div className="card" style={{ borderColor: 'rgba(79,209,197,0.3)' }}>
              <p className="text-sm text-secondary" style={{ marginBottom: 12 }}>You have been assigned this work order. Click to start working.</p>
              <button className="btn-success" onClick={handleVendorStart} disabled={actionLoading}>
                {actionLoading ? <div className="spinner" style={{ width: 16, height: 16 }} /> : '🔨 Start Work'}
              </button>
            </div>
          )}

          {canCompleteWork && (
            <ActionCard title="Mark Work as Completed" icon={<CheckCircle size={15} />}
              open={activePanel === 'vendor-complete'} onToggle={() => setActivePanel(p => p === 'vendor-complete' ? null : 'vendor-complete')}>
              <div>
                <label>Actual Cost (₹)</label>
                <input type="number" placeholder="Actual cost incurred" value={vendorForm.actualCost}
                  onChange={e => setVendorForm(f => ({ ...f, actualCost: e.target.value }))} />
              </div>
              <div>
                <label>Completion Notes</label>
                <textarea rows={3} placeholder="Describe the completed work..."
                  value={vendorForm.notes} onChange={e => setVendorForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div>
                <label>Final Images * (required)</label>
                <input type="file" multiple accept="image/*" onChange={e => setVendorImages(Array.from(e.target.files))} />
                {vendorImages.length > 0 && <p className="text-xs text-muted mt-1">{vendorImages.length} file(s) selected</p>}
              </div>
              <button className="btn-success" onClick={handleVendorComplete} disabled={actionLoading}>
                {actionLoading ? <div className="spinner" style={{ width: 16, height: 16 }} /> : <><CheckCircle size={14} /> Mark as Completed</>}
              </button>
            </ActionCard>
          )}
        </div>

        {/* Right sidebar */}
        <div className={styles.sideCol}>
          {/* Assignments */}
          <div className="card">
            <h3 className={styles.sectionTitle}>Assignments</h3>
            <div className={styles.assignList}>
              <AssignRow label="Requester" user={request.createdBy} color="var(--blue)" />
              {request.assignedMIS && <AssignRow label="MIS" user={request.assignedMIS} color="var(--purple)" />}
              {request.assignedRecce && <AssignRow label="Recce" user={request.assignedRecce} color="var(--teal)" />}
              {request.assignedVendor && <AssignRow label="Vendor" user={request.assignedVendor} color="var(--green)" />}
            </div>
          </div>

          {/* SLA */}
          {request.sla && (
            <div className="card">
              <h3 className={styles.sectionTitle}><Clock size={14} /> SLA Timeline</h3>
              <div className={styles.slaList}>
                {[
                  ['Created', request.sla.createdAt],
                  ['Assigned to Recce', request.sla.assignedToRecceAt],
                  ['Recce Completed', request.sla.recceCompletedAt],
                  ['Approval Decision', request.sla.approvalDecisionAt],
                  ['Assigned to Vendor', request.sla.assignedToVendorAt],
                  ['Work Completed', request.sla.workCompletedAt],
                ].filter(([, d]) => d).map(([label, date]) => (
                  <div key={label} className={styles.slaRow}>
                    <span className={styles.slaLabel}>{label}</span>
                    <span className={styles.slaDate}>{format(new Date(date), 'dd MMM, HH:mm')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activity Timeline */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 className={styles.sectionTitle} style={{ marginBottom: 0 }}>Activity Log</h3>
              <button style={{ background: 'none', color: 'var(--text-muted)', padding: 4 }} onClick={() => setShowTimeline(v => !v)}>
                {showTimeline ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
            {showTimeline && (
              <div className={styles.timeline}>
                {[...request.activities].reverse().map((act, i) => (
                  <div key={i} className={styles.timelineItem}>
                    <div className={styles.timelineDot} />
                    <div className={styles.timelineContent}>
                      <p className={styles.timelineAction}>{act.action}</p>
                      <p className={styles.timelineMeta}>
                        <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{act.performedByName}</span>
                        {' · '}{formatDistanceToNow(new Date(act.timestamp), { addSuffix: true })}
                      </p>
                      {act.comment && <p className={styles.timelineComment}>{act.comment}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value, highlight }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 14, color: highlight ? 'var(--accent)' : 'var(--text-primary)', fontWeight: highlight ? 600 : 400 }}>{value || '—'}</span>
    </div>
  );
}

function AssignRow({ label, user, color }) {
  if (!user) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ width: 30, height: 30, borderRadius: '50%', background: `${color}22`, color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
        {user.name?.[0]?.toUpperCase()}
      </div>
      <div>
        <p style={{ fontSize: 13, fontWeight: 500 }}>{user.name}</p>
        <p style={{ fontSize: 11, color: 'var(--text-muted)' }}>{label}</p>
      </div>
    </div>
  );
}

function ActionCard({ title, icon, open, onToggle, children }) {
  return (
    <div className="card" style={{ borderColor: open ? 'rgba(232,197,71,0.3)' : undefined }}>
      <button style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', background: 'none', color: 'var(--text-primary)', padding: 0 }} onClick={onToggle}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600, color: 'var(--accent)' }}>
          {icon} {title}
        </span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {open && <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>{children}</div>}
    </div>
  );
}
