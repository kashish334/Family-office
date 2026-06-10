import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, ArrowLeftRight, TrendingUp, TrendingDown,
  PiggyBank, Wallet, Bot, FileText, Users, Bell, Settings, LogOut, Plus
} from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: ArrowLeftRight, label: 'Transactions', path: '/transactions' },
  { icon: TrendingUp, label: 'Income', path: '/income' },
  { icon: TrendingDown, label: 'Expenses', path: '/expenses' },
  { icon: PiggyBank, label: 'Savings Goals', path: '/savings' },
  { icon: Wallet, label: 'Budget Planning', path: '/budget' },
  { icon: Bot, label: 'AI Insights', path: '/ai' },
  { icon: FileText, label: 'Reports', path: '/reports' },
];

const bottomNavItems = [
  { icon: Users, label: 'Members', path: '/members' },
  { icon: Bell, label: 'Bills & Reminders', path: '/bills' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => { logout(); navigate('/login'); };

  const NavBtn = ({ icon: Icon, label, path }: { icon: any; label: string; path: string }) => {
    const active = location.pathname === path;
    return (
      <button
        onClick={() => navigate(path)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 12px', borderRadius: 8, border: 'none',
          background: active ? 'var(--sage)' : 'transparent',
          color: active ? 'white' : 'var(--text-secondary)',
          fontSize: 13, fontWeight: active ? 500 : 400,
          cursor: 'pointer', marginBottom: 1, textAlign: 'left',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--cream)'; }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
      >
        <Icon size={15} />
        {label}
      </button>
    );
  };

  return (
    <aside style={{
      width: 210, background: 'var(--warm-white)',
      borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      flexShrink: 0, minHeight: '100vh',
    }}>
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontFamily: 'DM Serif Display', fontSize: 20, fontWeight: 500 }}>Family Office</div>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>Premium Wealth Management</div>
      </div>

      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
        {navItems.map(item => <NavBtn key={item.path} {...item} />)}
        <div style={{ height: 1, background: 'var(--border)', margin: '10px 4px' }} />
        <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 12px 6px' }}>Management</div>
        {bottomNavItems.map(item => <NavBtn key={item.path} {...item} />)}
      </nav>

      <div style={{ padding: '0 10px 12px' }}>
        <button onClick={() => navigate('/transactions')}
          style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '10px', background: 'var(--sage)', border: 'none', borderRadius: 8, color: 'white', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
          <Plus size={14} /> Add Transaction
        </button>
      </div>

      <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border)' }}>
        {user && (
          <div style={{ padding: '6px 12px', marginBottom: 4 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{user.full_name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user.email}</div>
          </div>
        )}
        <button onClick={handleLogout}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--text-muted)', fontSize: 13, cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
          <LogOut size={15} /> Sign Out
        </button>
      </div>
    </aside>
  );
}