import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Zap, Eye, EyeOff, LogIn } from 'lucide-react';
import styles from './LoginPage.module.css';

const DEMO_ACCOUNTS = [
  { role: 'Admin',       email: 'admin@branding.com',       label: 'Admin' },
  { role: 'Marketplace', email: 'marketplace@branding.com', label: 'Marketplace' },
  { role: 'MIS',         email: 'mis@branding.com',         label: 'MIS Team' },
  { role: 'Recce',       email: 'recce@branding.com',       label: 'Recce Team' },
  { role: 'Vendor',      email: 'vendor@branding.com',      label: 'Vendor' },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (email) => {
    setForm({ email, password: 'password123' });
    setLoading(true);
    try {
      await login(email, 'password123');
      toast.success('Logged in!');
      navigate('/');
    } catch (err) {
      toast.error('Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.bg} />
      <div className={styles.card} style={{animation: 'fadeIn 0.4s ease both'}}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.logoWrap}>
            <div className={styles.logoIcon}><Zap size={22} /></div>
            <span className={styles.logoText}>BrandFlow</span>
          </div>
          <h1 className={styles.title}>Welcome back</h1>
          <p className={styles.subtitle}>Sign in to manage branding requests</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <div>
            <label>Email address</label>
            <input
              type="email" placeholder="you@company.com" required
              value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div>
            <label>Password</label>
            <div className={styles.passWrap}>
              <input
                type={showPass ? 'text' : 'password'} placeholder="••••••••" required
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              />
              <button type="button" className={styles.eyeBtn} onClick={() => setShowPass(v => !v)}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={loading}>
            {loading ? <div className="spinner" style={{ width: 18, height: 18 }} /> : <><LogIn size={16} />Sign In</>}
          </button>
        </form>

        {/* Demo accounts */}
        <div className={styles.demo}>
          <p className={styles.demoLabel}>Quick Demo Login</p>
          <div className={styles.demoGrid}>
            {DEMO_ACCOUNTS.map(acc => (
              <button key={acc.email} className={styles.demoBtn} onClick={() => quickLogin(acc.email)} disabled={loading}>
                {acc.label}
              </button>
            ))}
          </div>
          <p className={styles.demoHint}>All use password: <code>password123</code></p>
        </div>
      </div>
    </div>
  );
}
