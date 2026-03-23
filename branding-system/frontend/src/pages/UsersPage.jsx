import { useState, useEffect } from 'react';
import api from '../utils/api';
import { ROLE_CONFIG } from '../utils/statusHelpers';
import { Users, Search } from 'lucide-react';
import { format } from 'date-fns';
import styles from './UsersPage.module.css';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  useEffect(() => {
    api.get('/users').then(res => setUsers(res.data.users)).finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u => {
    const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Team Members</h1>
          <p className={styles.subtitle}>{users.length} total members</p>
        </div>
      </div>

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
