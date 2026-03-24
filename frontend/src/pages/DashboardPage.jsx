import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { StatusBadge, PriorityBadge } from '../components/common/StatusBadge';
import { formatCurrency, STATUS_CONFIG } from '../utils/statusHelpers';
import { formatDistanceToNow } from 'date-fns';
import {
  FileText, Clock, CheckCircle, AlertTriangle, TrendingUp,
  ArrowRight, MapPin, Calendar, Users
} from 'lucide-react';
import styles from './DashboardPage.module.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(res => setData(res.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className={styles.loadWrap}><div className="spinner" style={{ width: 32, height: 32 }} /></div>
  );

  const statusChartData = Object.entries(data?.statusCounts || {}).map(([status, count]) => ({
    name: STATUS_CONFIG[status]?.label || status,
    count,
    color: STATUS_CONFIG[status]?.color || '#758780'
  })).sort((a, b) => b.count - a.count);
  const maxStatusCount = Math.max(...statusChartData.map(item => item.count), 1);

  const kpis = data?.kpis || {};
  const sla = data?.sla || {};

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{getGreeting()}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className={styles.subtitle}>Here's what's happening with your branding operations</p>
        </div>
        {['marketplace', 'admin'].includes(user?.role) && (
          <Link to="/requests/new" className="btn-primary btn-lg">
            <FileText size={16} /> New Request
          </Link>
        )}
      </div>

      {/* KPI cards */}
      <div className={styles.kpiGrid}>
        <KPICard icon={<FileText size={20} />} label="Total Requests" value={data?.totalRequests || 0} color="blue" />
        <KPICard icon={<Clock size={20} />} label="Pending Approval" value={kpis.pendingApproval ?? data?.statusCounts?.awaiting_approval ?? 0} color="amber" />
        <KPICard icon={<CheckCircle size={20} />} label="Completed" value={data?.statusCounts?.work_completed || 0} color="green" />
        <KPICard icon={<TrendingUp size={20} />} label="Avg. Completion" value={sla.avgDays ? `${Math.round(sla.avgDays)}d` : 'N/A'} color="purple" />
        {user?.role === 'admin' && <>
          <KPICard icon={<Users size={20} />} label="Active Vendors" value={kpis.totalVendors || 0} color="teal" />
          <KPICard icon={<CheckCircle size={20} />} label="This Month" value={kpis.completedThisMonth || 0} color="green" />
        </>}
      </div>

      <div className={styles.content}>
        {/* Chart */}
        {statusChartData.length > 0 && (
          <div className="card" style={{ padding: 24 }}>
            <h2 className={styles.sectionTitle}>Requests by Status</h2>
            <div className={styles.chartList}>
              {statusChartData.map((entry) => (
                <div key={entry.name} className={styles.chartRow}>
                  <div className={styles.chartMeta}>
                    <span className={styles.chartLabel}>{entry.name}</span>
                    <span className={styles.chartValue}>{entry.count}</span>
                  </div>
                  <div className={styles.chartTrack}>
                    <div
                      className={styles.chartBar}
                      style={{ width: `${Math.max((entry.count / maxStatusCount) * 100, 8)}%`, background: entry.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Cities */}
        {kpis.topCities && kpis.topCities.length > 0 && (
          <div className="card" style={{ padding: 24 }}>
            <h2 className={styles.sectionTitle}><MapPin size={16} /> Top Cities</h2>
            <div className={styles.cityList}>
              {kpis.topCities.map((c, i) => (
                <div key={c._id} className={styles.cityRow}>
                  <span className={styles.cityRank}>#{i + 1}</span>
                  <span className={styles.cityName}>{c._id || 'Unknown'}</span>
                  <span className={styles.cityCount}>{c.count} requests</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recent Requests */}
      {data?.recentRequests?.length > 0 && (
        <div className="card" style={{ padding: 24, marginTop: 16 }}>
          <div className="flex justify-between items-center mb-4">
            <h2 className={styles.sectionTitle} style={{ marginBottom: 0 }}>Recent Requests</h2>
            <Link to="/requests" className={styles.viewAll}>View all <ArrowRight size={14} /></Link>
          </div>
          <div className={styles.requestList}>
            {data.recentRequests.slice(0, 5).map(req => (
              <Link to={`/requests/${req._id}`} key={req._id} className={styles.requestRow}>
                <div className={styles.reqLeft}>
                  <span className="font-mono text-xs text-accent">{req.requestNumber}</span>
                  <span className={styles.reqTitle}>{req.title}</span>
                  <span className="text-sm text-muted">
                    <MapPin size={11} style={{ display: 'inline', marginRight: 4 }} />
                    {req.location?.city}
                  </span>
                </div>
                <div className={styles.reqRight}>
                  <StatusBadge status={req.status} size="sm" />
                  <PriorityBadge priority={req.priority} />
                  <span className="text-xs text-muted">
                    <Calendar size={11} style={{ display: 'inline', marginRight: 4 }} />
                    {formatDistanceToNow(new Date(req.updatedAt), { addSuffix: true })}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function KPICard({ icon, label, value, color }) {
  const colors = {
    blue: { bg: 'var(--blue-dim)', c: 'var(--blue)' },
    amber: { bg: 'var(--accent-dim)', c: 'var(--accent)' },
    green: { bg: 'var(--green-dim)', c: 'var(--green)' },
    purple: { bg: 'var(--purple-dim)', c: 'var(--purple)' },
    teal: { bg: 'var(--teal-dim)', c: 'var(--teal)' },
    red: { bg: 'var(--red-dim)', c: 'var(--red)' },
  };
  const col = colors[color] || colors.blue;
  return (
    <div className="card fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>{label}</p>
          <p style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>{value}</p>
        </div>
        <div style={{ background: col.bg, color: col.c, padding: 10, borderRadius: 10 }}>{icon}</div>
      </div>
    </div>
  );
}
