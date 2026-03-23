import { useState, useEffect } from 'react';
import api from '../utils/api';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Bell, CheckCheck, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import styles from './NotificationsPage.module.css';

const TYPE_COLORS = {
  request_created: 'var(--blue)',
  assigned: 'var(--teal)',
  recce_completed: 'var(--purple)',
  approved: 'var(--green)',
  rejected: 'var(--red)',
  assigned_to_vendor: 'var(--teal)',
  work_completed: 'var(--green)',
  comment: 'var(--accent)',
  status_change: 'var(--blue)',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications?limit=50');
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.unreadCount);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(n => n.map(notif => ({ ...notif, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch {}
  };

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(n => n.map(notif => notif._id === id ? { ...notif, isRead: true } : notif));
      setUnreadCount(c => Math.max(0, c - 1));
    } catch {}
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Notifications</h1>
          {unreadCount > 0 && <p className={styles.subtitle}>{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>}
        </div>
        {unreadCount > 0 && (
          <button className="btn-secondary btn-sm" onClick={markAllRead}>
            <CheckCheck size={15} /> Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className={styles.loadWrap}><div className="spinner" style={{ width: 28, height: 28 }} /></div>
      ) : notifications.length === 0 ? (
        <div className={styles.empty}>
          <Bell size={36} style={{ color: 'var(--text-muted)' }} />
          <p>No notifications yet</p>
        </div>
      ) : (
        <div className={styles.list}>
          {notifications.map(n => (
            <div
              key={n._id}
              className={`${styles.item} ${!n.isRead ? styles.unread : ''}`}
              onClick={() => !n.isRead && markRead(n._id)}
            >
              <div className={styles.dot} style={{ background: n.isRead ? 'var(--bg-secondary)' : TYPE_COLORS[n.type] || 'var(--accent)' }} />
              <div className={styles.content}>
                <p className={styles.notifTitle}>{n.title}</p>
                <p className={styles.notifMsg}>{n.message}</p>
                <div className={styles.notifMeta}>
                  <span>{formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}</span>
                  {n.relatedRequest && (
                    <Link to={`/requests/${n.relatedRequest._id}`} className={styles.viewLink} onClick={e => e.stopPropagation()}>
                      {n.relatedRequest.requestNumber} <ExternalLink size={11} />
                    </Link>
                  )}
                </div>
              </div>
              {!n.isRead && <div className={styles.unreadPip} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
