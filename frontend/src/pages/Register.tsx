import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handleRegister = async () => {
    if (!fullName || !email || !password) { setError('All fields are required'); return; }
    setLoading(true); setError('');
    try {
      await api.auth.register({ email, password, full_name: fullName });
      await login(email, password);
      navigate('/dashboard');
    } catch (e: any) {
      setError(e.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontFamily: 'DM Serif Display', fontSize: 36, fontWeight: 500 }}>Family Office</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>Create your account</div>
      </div>

      <div style={{ background: 'white', borderRadius: 16, padding: 32, width: '100%', maxWidth: 440, boxShadow: '0 4px 32px rgba(0,0,0,0.06)' }}>
        <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6 }}>Get started</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 28 }}>Create your Family Office account.</p>

        {error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#dc2626' }}>
            <AlertCircle size={14} /> {error}
          </div>
        )}

        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Full Name</label>
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <User size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input style={inp} placeholder="John Smith" value={fullName} onChange={e => setFullName(e.target.value)} />
        </div>

        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Email Address</label>
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input style={inp} placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} type="email" />
        </div>

        <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Password</label>
        <div style={{ position: 'relative', marginBottom: 24 }}>
          <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input style={inp} placeholder="••••••••" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        </div>

        <button onClick={handleRegister} disabled={loading}
          style={{ width: '100%', padding: '13px', background: loading ? '#9ab89d' : 'var(--sage)', color: 'white', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 500, marginBottom: 16, cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Creating account…' : 'Create Account'}
        </button>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <span onClick={() => navigate('/login')} style={{ color: 'var(--sage)', cursor: 'pointer', fontWeight: 500 }}>Login</span>
        </p>
      </div>
    </div>
  );
}