import Navbar from '../components/ui/Navbar';
import { recurringIncome, monthlyData } from '../data/mockData';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus } from 'lucide-react';

export default function Income() {
  return (
    <div>
      <Navbar title="Financial Analysis" tabs={[{ label: 'Overview', path: '/dashboard' }, { label: 'Analytics', path: '/transactions' }]} activeTab="Analytics" />
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Wealth Flow</div>
            <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 36, fontWeight: 500 }}>Income Management</h1>
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'var(--sage)', border: 'none', borderRadius: 8, color: 'white', fontSize: 13, fontWeight: 500 }}>
            <Plus size={14} /> Add Income Source
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
          {[
            { label: 'Total Income', value: '$142,500.00', sub: '+12.4%', note: 'Fiscal Year 2024' },
            { label: 'Forecasted Income', value: '$168,200.00', sub: 'Steady', note: 'Estimated projection' },
            { label: 'Recurring Income', value: '$12,450.00', sub: null, note: 'Monthly stable flow' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--warm-white)', borderRadius: 12, padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{s.label}</div>
                {s.sub && <span style={{ fontSize: 12, fontWeight: 600, color: s.sub === 'Steady' ? 'var(--gold)' : 'var(--sage)' }}>{s.sub}</span>}
              </div>
              <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 30, fontWeight: 500, marginBottom: 6 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.note}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, marginBottom: 20 }}>
          {/* Chart */}
          <div style={{ background: 'var(--warm-white)', borderRadius: 12, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontWeight: 600 }}>Income Trend Analytics</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {['6M', '1Y'].map((t, i) => (
                  <button key={t} style={{ padding: '4px 12px', borderRadius: 6, border: 'none', background: i === 1 ? 'var(--sage)' : 'var(--cream)', color: i === 1 ? 'white' : 'var(--text-secondary)', fontSize: 12 }}>{t}</button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={monthlyData}>
                <XAxis dataKey="month" axisLine={false} tickLine={false} style={{ fontSize: 11 }} />
                <YAxis hide />
                <Tooltip formatter={(v: any) => `$${v.toLocaleString()}`} />
                <Area type="monotone" dataKey="income" stroke="var(--sage)" fill="#e8f0e9" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Source Breakdown */}
          <div style={{ background: 'var(--warm-white)', borderRadius: 12, padding: 24 }}>
            <div style={{ fontWeight: 600, marginBottom: 20 }}>Source Breakdown</div>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <svg width="140" height="140" viewBox="0 0 140 140">
                <circle cx="70" cy="70" r="55" fill="none" stroke="var(--sage)" strokeWidth="22" strokeDasharray={`${0.72 * 345} 345`} strokeLinecap="round" transform="rotate(-90 70 70)" />
                <circle cx="70" cy="70" r="55" fill="none" stroke="var(--gold)" strokeWidth="22" strokeDasharray={`${0.24 * 345} 345`} strokeLinecap="round" transform={`rotate(${-90 + 0.72 * 360} 70 70)`} />
                <circle cx="70" cy="70" r="55" fill="none" stroke="#dddbd5" strokeWidth="22" strokeDasharray={`${0.14 * 345} 345`} strokeLinecap="round" transform={`rotate(${-90 + 0.96 * 360} 70 70)`} />
                <circle cx="70" cy="70" r="33" fill="white" />
                <text x="70" y="67" textAnchor="middle" fontSize="18" fontWeight="700" fill="var(--text-primary)">72%</text>
                <text x="70" y="82" textAnchor="middle" fontSize="11" fill="var(--text-muted)">Portfolio</text>
              </svg>
            </div>
            {[
              { name: 'Salary & Bonus', pct: 62, color: 'var(--sage)' },
              { name: 'Dividends', pct: 24, color: 'var(--gold)' },
              { name: 'Real Estate', pct: 14, color: '#dddbd5' },
            ].map(s => (
              <div key={s.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, marginBottom: 8 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, display: 'inline-block' }} />{s.name}
                </span>
                <span style={{ fontWeight: 600 }}>{s.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recurring Income Sources */}
        <div style={{ background: 'var(--warm-white)', borderRadius: 12, padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontWeight: 600, fontSize: 16 }}>Recurring Income Sources</div>
            <a href="#" style={{ fontSize: 13, color: 'var(--sage)' }}>View All History →</a>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 140px 100px 80px', gap: 12, fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 0 10px', borderBottom: '1px solid var(--border)' }}>
            <span>Source Name</span><span>Frequency</span><span>Next Expected</span><span style={{ textAlign: 'right' }}>Amount</span><span style={{ textAlign: 'center' }}>Status</span>
          </div>
          {recurringIncome.map(r => (
            <div key={r.source} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 140px 100px 80px', gap: 12, padding: '16px 0', borderBottom: '1px solid var(--border-light)', alignItems: 'center', fontSize: 13 }}>
              <div>
                <div style={{ fontWeight: 500 }}>{r.source}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.subtitle}</div>
              </div>
              <span style={{ color: 'var(--text-secondary)' }}>{r.frequency}</span>
              <span style={{ color: 'var(--text-secondary)' }}>{r.next}</span>
              <span style={{ textAlign: 'right', fontWeight: 600 }}>${r.amount.toLocaleString()}.00</span>
              <span style={{ textAlign: 'center' }}>
                <span style={{ background: r.status === 'Active' ? '#e8f0e9' : '#f5edd8', color: r.status === 'Active' ? 'var(--sage)' : 'var(--gold)', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
                  {r.status}
                </span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
