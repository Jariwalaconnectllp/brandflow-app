import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Eye, EyeOff, LogIn, ShieldCheck } from 'lucide-react';
import styles from './LoginPage.module.css';
import companyLogo from '../assets/jariwala-connect-logo.svg';

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

  return (
    <div className={styles.page}>
      <div className={styles.bg} />
      <div className={styles.card} style={{animation: 'fadeIn 0.4s ease both'}}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.logoWrap}>
            <img src={companyLogo} alt="Jariwala Connect LLP" className={styles.logoImage} />
          </div>
          <h1 className={styles.title}>Welcome back</h1>
          <p className={styles.subtitle}>Sign in to manage branding requests for Jariwala Connect LLP</p>
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

        <div className={styles.securityNote}>
          <div className={styles.securityIcon}>
            <ShieldCheck size={16} />
          </div>
          <div>
            <p className={styles.securityTitle}>Secure sign-in only</p>
            <p className={styles.securityText}>
              Demo shortcuts and exposed default credentials have been removed. Use your assigned account credentials to continue.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
