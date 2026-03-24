import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ROLE_CONFIG } from '../../utils/statusHelpers';
import api from '../../utils/api';
import {
  LayoutDashboard, FileText, PlusCircle, Users, Bell,
  LogOut, User, Menu, X, ChevronRight, Zap
} from 'lucide-react';
import styles from './Layout.module.css';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/requests', icon: FileText, label: 'Requests' },
  { to: '/requests/new', icon: PlusCircle, label: 'New Request', roles: ['marketplace'] },
  { to: '/users', icon: Users, label: 'Team', roles: ['admin', 'mis'] },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await api.get('/notifications?unreadOnly=true&limit=1');
        setUnread(res.data.unreadCount);
      } catch {}
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  const roleConf = ROLE_CONFIG[user?.role] || {};
  const filteredNav = NAV_ITEMS.filter(item => !item.roles || item.roles.includes(user?.role));

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.open : styles.collapsed}`}>
        {/* Logo */}
        <div className={styles.logo}>
          <div className={styles.logoIcon}><Zap size={18} /></div>
          {sidebarOpen && <span className={styles.logoText}>BrandFlow</span>}
        </div>

        {/* User chip */}
        {sidebarOpen && (
          <div className={styles.userChip}>
            <div className={styles.avatar}>{user?.name?.[0]?.toUpperCase()}</div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user?.name}</span>
              <span className={styles.userRole} style={{ color: roleConf.color }}>{roleConf.label}</span>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className={styles.nav}>
          {filteredNav.map(({ to, icon: Icon, label, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) => `${styles.navItem} ${isActive ? styles.active : ''}`}
            >
              <span className={styles.navIcon}>
                <Icon size={18} />
                {label === 'Notifications' && unread > 0 && (
                  <span className={styles.badge}>{unread > 9 ? '9+' : unread}</span>
                )}
              </span>
              {sidebarOpen && <span className={styles.navLabel}>{label}</span>}
              {sidebarOpen && <ChevronRight size={14} className={styles.navArrow} />}
            </NavLink>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className={styles.sidebarBottom}>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={18} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className={styles.main}>
        {/* Topbar */}
        <header className={styles.topbar}>
          <button className={styles.menuBtn} onClick={() => setSidebarOpen(v => !v)}>
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className={styles.topbarRight}>
            <span className={styles.roleTag} style={{ background: roleConf.bg, color: roleConf.color }}>
              {roleConf.label}
            </span>
          </div>
        </header>

        {/* Content */}
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
