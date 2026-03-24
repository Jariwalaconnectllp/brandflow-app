import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { StatusBadge, PriorityBadge } from '../components/common/StatusBadge';
import { STATUS_CONFIG, BRANDING_TYPES } from '../utils/statusHelpers';
import { formatDistanceToNow } from 'date-fns';
import { Search, Filter, Plus, MapPin, Calendar, ChevronRight, X } from 'lucide-react';
import styles from './RequestsPage.module.css';

const STATUSES = Object.keys(STATUS_CONFIG);

export default function RequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ status: '', city: '', search: '', priority: '' });
  const [showFilters, setShowFilters] = useState(false);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 15, ...filters };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const res = await api.get('/requests', { params });
      setRequests(res.data.requests);
      setTotal(res.data.total);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const clearFilters = () => setFilters({ status: '', city: '', search: '', priority: '' });
  const activeFilters = Object.values(filters).filter(Boolean).length;

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Branding Requests</h1>
          <p className={styles.subtitle}>{total} total requests</p>
        </div>
        {user?.role === 'marketplace' && (
          <Link to="/requests/new" className="btn-primary">
            <Plus size={16} /> New Request
          </Link>
        )}
      </div>

      {/* Search & filters bar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} />
          <input
            placeholder="Search by request number, title, or location…"
            value={filters.search}
            onChange={e => { setFilters(f => ({ ...f, search: e.target.value })); setPage(1); }}
            className={styles.searchInput}
          />
          {filters.search && (
            <button className={styles.clearBtn} onClick={() => setFilters(f => ({ ...f, search: '' }))}>
              <X size={14} />
            </button>
          )}
        </div>
        <button
          className={`btn-secondary ${showFilters ? styles.filterActive : ''}`}
          onClick={() => setShowFilters(v => !v)}
        >
          <Filter size={16} />
          Filters
          {activeFilters > 0 && <span className={styles.filterBadge}>{activeFilters}</span>}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className={`${styles.filterPanel} card fade-in`}>
          <div className={styles.filterGrid}>
            <div>
              <label>Status</label>
              <select value={filters.status} onChange={e => { setFilters(f => ({ ...f, status: e.target.value })); setPage(1); }}>
                <option value="">All Statuses</option>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
              </select>
            </div>
            <div>
              <label>City</label>
              <input placeholder="e.g. Surat" value={filters.city}
                onChange={e => { setFilters(f => ({ ...f, city: e.target.value })); setPage(1); }} />
            </div>
            <div>
              <label>Priority</label>
              <select value={filters.priority} onChange={e => { setFilters(f => ({ ...f, priority: e.target.value })); setPage(1); }}>
                <option value="">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          {activeFilters > 0 && (
            <button className="btn-secondary btn-sm" style={{ marginTop: 12 }} onClick={clearFilters}>
              <X size={14} /> Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div className={styles.loadWrap}><div className="spinner" /></div>
        ) : requests.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📭</div>
            <p>No requests found</p>
            <span>Try adjusting your filters</span>
          </div>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Request</th>
                  <th>Location</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Updated</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {requests.map(req => (
                  <tr key={req._id} className={styles.row}>
                    <td>
                      <div className={styles.reqCell}>
                        <span className="font-mono text-xs text-accent">{req.requestNumber}</span>
                        <span className={styles.reqTitle}>{req.title}</span>
                        <span className="text-xs text-muted">{req.createdBy?.name}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.locationCell}>
                        <MapPin size={12} style={{ color: 'var(--text-muted)' }} />
                        <span>{req.location?.city}, {req.location?.state}</span>
                      </div>
                    </td>
                    <td><span className={styles.typeChip}>{req.brandingType}</span></td>
                    <td><StatusBadge status={req.status} size="sm" /></td>
                    <td><PriorityBadge priority={req.priority} /></td>
                    <td>
                      <div className={styles.dateCell}>
                        <Calendar size={11} style={{ color: 'var(--text-muted)' }} />
                        <span>{formatDistanceToNow(new Date(req.updatedAt), { addSuffix: true })}</span>
                      </div>
                    </td>
                    <td>
                      <Link to={`/requests/${req._id}`} className={styles.viewBtn}>
                        <ChevronRight size={16} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > 15 && (
        <div className={styles.pagination}>
          <button className="btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span className="text-sm text-secondary">Page {page} of {Math.ceil(total / 15)}</span>
          <button className="btn-secondary btn-sm" disabled={page >= Math.ceil(total / 15)} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
