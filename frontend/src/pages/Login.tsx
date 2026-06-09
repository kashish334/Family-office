import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const inp = {
    width: '100%', padding: '10px 12px 10px 36px',
    border: '1px solid var(--border)', borderRadius: 8,
    background: 'var(--cream)', fontSize: 14, outline: 'none',
    color: 'var(--text-primary)', boxSizing: 'border-box' as const,
  };

  const handleLogin = async () => {
    if (!email || !password) { setError('Please enter email and password'); return; }
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (e: any) {
      setError(e.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, fontWeight: 500 }}>Family Office</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 14, letterSpacing: '0.04em' }}>Premium Wealth Management</div>
      </div>

      <div style={{ background: 'white', borderRadius: 16, padding: 32, width: '100%', maxWidth: 440, boxShadow: '0 4px 32px rgba(0,0,0,0.06)' }}>
        <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6 }}>Welcome back</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>Please enter your credentials to access your portal.</p>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#dc2626' }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Email Address</label>
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input style={inp} placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} type="email"
            onKeyDown={e => e.key === 'Enter' && handleLogin()} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <label style={{ fontSize: 13, fontWeight: 500 }}>Password</label>
        </div>
        <div style={{ position: 'relative', marginBottom: 24 }}>
          <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input style={inp} placeholder="••••••••" type={showPass ? 'text' : 'password'} value={password}
            onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          <button onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>

        <button onClick={handleLogin} disabled={loading}
          style={{ width: '100%', padding: '13px', background: loading ? '#9ab89d' : 'var(--sage)', color: 'white', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 500, marginBottom: 16, cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Signing in…' : 'Login'}
        </button>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
          Don't have an account?{' '}
          <span onClick={() => navigate('/register')} style={{ color: 'var(--sage)', cursor: 'pointer', fontWeight: 500 }}>Register</span>
        </p>
      </div>
    </div>
  );
}