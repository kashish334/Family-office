import { useNavigate } from 'react-router-dom';

interface Tab { label: string; path: string; }
interface NavbarProps { title: string; tabs?: Tab[]; activeTab?: string; }

export default function Navbar({ title, tabs, activeTab }: NavbarProps) {
  const navigate = useNavigate();
  return (
    <div style={{ background: 'var(--warm-white)', borderBottom: '1px solid var(--border)', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 24, height: 56 }}>
      <div style={{ fontWeight: 600, fontSize: 16 }}>{title}</div>
      {tabs && (
        <div style={{ display: 'flex', gap: 4 }}>
          {tabs.map(tab => (
            <button key={tab.label} onClick={() => navigate(tab.path)}
              style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: activeTab === tab.label ? 'var(--sage)' : 'transparent', color: activeTab === tab.label ? 'white' : 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', fontWeight: activeTab === tab.label ? 500 : 400 }}>
              {tab.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}