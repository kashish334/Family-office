import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Users, ArrowRight, Mail } from 'lucide-react';

export default function FamilySetup() {
  const { createFamily, user } = useAuth();
  const navigate = useNavigate();
  const [familyName, setFamilyName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<'create' | 'join'>('create');

  const handleCreate = async () => {
    if (!familyName.trim()) { setError('Please enter a family name.'); return; }
    setCreating(true);
    setError('');
    try {
      await createFamily(familyName.trim());
      navigate('/dashboard', { replace: true });
    } catch (e: any) {
      setError(e.message || 'Could not create family. Please try again.');
    } finally {
      setCreating(false);
    }
  };

  const card: React.CSSProperties = {
    background: 'var(--warm-white)',
    border: '1px solid var(--border)',
    borderRadius: 16,
    padding: '28px 32px',
    cursor: 'pointer',
    transition: 'box-shadow 0.15s',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--cream)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 460 }}>
        {/* Logo / header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16,
            background: 'var(--sage)', display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center', marginBottom: 16,
          }}>
            <Users size={26} color="white" />
          </div>
          <h1 style={{ fontFamily: 'DM Serif Display', fontSize: 28, color: 'var(--text-primary)', margin: 0 }}>
            Welcome, {user?.full_name?.split(' ')[0] || 'there'}!
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 8 }}>
            Let's get your family office set up.
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', background: 'var(--warm-white)',
          border: '1px solid var(--border)', borderRadius: 12, padding: 4, marginBottom: 24,
        }}>
          {(['create', 'join'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setError(''); }}
              style={{
                flex: 1, padding: '9px 0', border: 'none', borderRadius: 9, cursor: 'pointer',
                fontFamily: 'DM Sans', fontSize: 13, fontWeight: 500,
                background: tab === t ? 'var(--sage)' : 'transparent',
                color: tab === t ? 'white' : 'var(--text-secondary)',
                transition: 'all 0.15s',
              }}>
              {t === 'create' ? '✦ Create a Family' : '✉ Join via Invite'}
            </button>
          ))}
        </div>

        {/* Create tab */}
        {tab === 'create' && (
          <div style={card}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 6px' }}>
              Name your family
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '0 0 20px' }}>
              This is your private family office workspace. You can invite members later from Settings.
            </p>
            <input
              autoFocus
              placeholder="e.g. The Sharma Family"
              value={familyName}
              onChange={e => { setFamilyName(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: 10,
                border: `1.5px solid ${error ? 'var(--red)' : 'var(--border)'}`,
                fontFamily: 'DM Sans', fontSize: 14, color: 'var(--text-primary)',
                background: 'var(--cream)', outline: 'none', boxSizing: 'border-box',
                marginBottom: error ? 8 : 20,
              }}
            />
            {error && <p style={{ color: 'var(--red)', fontSize: 12, margin: '0 0 16px' }}>{error}</p>}
            <button
              onClick={handleCreate}
              disabled={creating}
              style={{
                width: '100%', padding: '11px 0', borderRadius: 10, border: 'none',
                background: creating ? 'var(--sage-dark)' : 'var(--sage)',
                color: 'white', fontFamily: 'DM Sans', fontSize: 14, fontWeight: 600,
                cursor: creating ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'background 0.15s',
              }}>
              {creating ? 'Creating…' : <><span>Create Family</span><ArrowRight size={15} /></>}
            </button>
          </div>
        )}

        {/* Join tab */}
        {tab === 'join' && (
          <div style={card}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, background: 'var(--cream)',
              border: '1px solid var(--border)', display: 'flex',
              alignItems: 'center', justifyContent: 'center', marginBottom: 16,
            }}>
              <Mail size={20} color="var(--sage)" />
            </div>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 10px' }}>
              Waiting to be added?
            </h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 20px' }}>
              Ask your family admin to go to <strong>Settings → Family Members</strong> and add your email address (<strong>{user?.email}</strong>).
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              Once they add you, <strong>log out and log back in</strong> — you'll automatically join their family workspace.
            </p>
            <div style={{
              marginTop: 20, padding: '12px 16px', background: 'var(--cream)',
              border: '1px solid var(--border)', borderRadius: 10,
              fontSize: 12, color: 'var(--text-muted)',
            }}>
              💡 Or switch to "Create a Family" if you want to start your own workspace now.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}