import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { ROLE_CONFIG } from '../utils/statusHelpers';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { User, Lock, Save } from 'lucide-react';
import styles from './ProfilePage.module.css';

export default function ProfilePage() {
  const { user, setUser } = useAuth();
  const [passForm, setPassForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const rc = ROLE_CONFIG[user?.role] || {};

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirm) return toast.error('Passwords do not match');
    if (passForm.newPassword.length < 6) return toast.error('Password must be at least 6 characters');
    setLoading(true);
    try {
      await api.put('/auth/change-password', { currentPassword: passForm.currentPassword, newPassword: passForm.newPassword });
      toast.success('Password updated!');
      setPassForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update password');
    } finally { setLoading(false); }
  };

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>My Profile</h1>

      {/* Profile card */}
      <div className="card">
        <div className={styles.profileTop}>
          <div className={styles.avatar} style={{ background: rc.bg, color: rc.color }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div>
            <h2 className={styles.name}>{user?.name}</h2>
            <p className={styles.email}>{user?.email}</p>
            {user?.phone && <p className={styles.phone}>📱 {user.phone}</p>}
            <span className="badge" style={{ background: rc.bg, color: rc.color, marginTop: 8 }}>{rc.label}</span>
          </div>
        </div>

        <div className="divider" />

        <div className="grid-3" style={{ gap: 16, marginTop: 4 }}>
          <div>
            <p className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Member Since</p>
            <p className="text-sm">{user?.createdAt ? format(new Date(user.createdAt), 'dd MMMM yyyy') : '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Last Login</p>
            <p className="text-sm">{user?.lastLogin ? format(new Date(user.lastLogin), 'dd MMM yyyy, HH:mm') : '—'}</p>
          </div>
          <div>
            <p className="text-xs text-muted" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Status</p>
            <span className="badge" style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>Active</span>
          </div>
        </div>

        {user?.vendorDetails?.companyName && (
          <>
            <div className="divider" />
            <h3 className={styles.sectionTitle}>Vendor Details</h3>
            <div className="grid-3" style={{ gap: 16 }}>
              <div>
                <p className="text-xs text-muted" style={{ marginBottom: 4 }}>Company</p>
                <p className="text-sm font-semibold">{user.vendorDetails.companyName}</p>
              </div>
              <div>
                <p className="text-xs text-muted" style={{ marginBottom: 4 }}>Rating</p>
                <p className="text-sm">⭐ {user.vendorDetails.rating || 0}/5</p>
              </div>
              <div>
                <p className="text-xs text-muted" style={{ marginBottom: 4 }}>Completed Jobs</p>
                <p className="text-sm font-semibold">{user.vendorDetails.completedJobs || 0}</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Change password */}
      <div className="card">
        <h2 className={styles.sectionTitle}><Lock size={16} /> Change Password</h2>
        <form onSubmit={handleChangePassword} className={styles.passForm}>
          <div>
            <label>Current Password</label>
            <input type="password" value={passForm.currentPassword} onChange={e => setPassForm(f => ({ ...f, currentPassword: e.target.value }))} required />
          </div>
          <div>
            <label>New Password</label>
            <input type="password" placeholder="Min. 6 characters" value={passForm.newPassword} onChange={e => setPassForm(f => ({ ...f, newPassword: e.target.value }))} required />
          </div>
          <div>
            <label>Confirm New Password</label>
            <input type="password" value={passForm.confirm} onChange={e => setPassForm(f => ({ ...f, confirm: e.target.value }))} required />
          </div>
          <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }} disabled={loading}>
            {loading ? <div className="spinner" style={{ width: 16, height: 16 }} /> : <><Save size={15} /> Update Password</>}
          </button>
        </form>
      </div>
    </div>
  );
}
