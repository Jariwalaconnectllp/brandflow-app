import { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { ROLE_CONFIG } from '../utils/statusHelpers';
import { Users, Search, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import styles from './UsersPage.module.css';

export default function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'marketplace',
    phone: '',
    vendorDetails: { companyName: '' }
  });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data.users);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filtered = users.filter(u => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const isAdmin = user?.role === 'admin';

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        phone: form.phone
      };

      if (form.role === 'vendor' && form.vendorDetails.companyName.trim()) {
        payload.vendorDetails = { companyName: form.vendorDetails.companyName.trim() };
      }

      await api.post('/auth/register', payload);
      toast.success('User created successfully');
      setForm({
        name: '',
        email: '',
        password: '',
        role: 'marketplace',
        phone: '',
        vendorDetails: { companyName: '' }
      });
      await loadUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Team Members</h1>
          <p className={styles.subtitle}>{users.length} total members</p>
        </div>
      </div>

      {isAdmin && (
        <form className={`card ${styles.createCard}`} onSubmit={handleCreateUser}>
          <div className={styles.createHeader}>
            <h2 className={styles.sectionTitle}><UserPlus size={16} /> Create Team User</h2>
            <p className={styles.createHint}>Add Marketplace, MIS, Recce, Vendor, or Admin accounts.</p>
          </div>
          <div className={styles.formGrid}>
            <div>
              <label>Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div>
              <label>Email</label>
              <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
            </div>
            <div>
              <label>Password</label>
              <input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} minLength={6} required />
            </div>
            <div>
              <label>Role</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                {Object.entries(ROLE_CONFIG).map(([key, value]) => (
                  <option key={key} value={key}>{value.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Phone</label>
              <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            {form.role === 'vendor' && (
              <div>
                <label>Vendor Company</label>
                <input value={form.vendorDetails.companyName} onChange={e => setForm(f => ({ ...f, vendorDetails: { ...f.vendorDetails, companyName: e.target.value } }))} />
              </div>
            )}
          </div>
          <div className={styles.createActions}>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? <div className="spinner" style={{ width: 16, height: 16 }} /> : <><UserPlus size={16} /> Create User</>}
            </button>
          </div>
        </form>
      )}

      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={15} className={styles.searchIcon} />
          <input type="text" placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} style={{ width: 160 }}>
          <option value="">All Roles</option>
          {Object.entries(ROLE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className={styles.loadWrap}><div className="spinner" style={{ width: 28, height: 28 }} /></div>
      ) : (
        <div className={styles.grid}>
          {filtered.map(u => {
            const rc = ROLE_CONFIG[u.role] || {};
            return (
              <div key={u._id} className={`card ${styles.userCard}`}>
                <div className={styles.avatar} style={{ background: rc.bg, color: rc.color }}>
                  {u.name[0].toUpperCase()}
                </div>
                <div className={styles.info}>
                  <h3 className={styles.name}>{u.name}</h3>
                  <p className={styles.email}>{u.email}</p>
                  {u.phone && <p className={styles.phone}>{u.phone}</p>}
                  <span className="badge" style={{ background: rc.bg, color: rc.color, marginTop: 8 }}>{rc.label}</span>
                  {u.vendorDetails?.companyName && (
                    <p className={styles.company}>{u.vendorDetails.companyName}</p>
                  )}
                  {u.vendorDetails?.rating > 0 && (
                    <p className={styles.rating}>⭐ {u.vendorDetails.rating} · {u.vendorDetails.completedJobs} jobs</p>
                  )}
                </div>
                <div className={styles.joined}>Joined {format(new Date(u.createdAt), 'MMM yyyy')}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
