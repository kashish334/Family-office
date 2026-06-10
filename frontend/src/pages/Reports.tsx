import Navbar from '../components/ui/Navbar';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, BarChart2, TrendingUp } from 'lucide-react';

const wealthData = [
  { m: 'SEP', v: 1800000 }, { m: 'OCT', v: 1950000 }, { m: 'NOV', v: 1870000 },
  { m: 'DEC', v: 2100000 }, { m: 'JAN', v: 2050000 }, { m: 'FEB', v: 2400000 },
];

const reports = [
  { icon: '📄', title: 'Quarterly Tax Report', sub: 'Q4 2023 • Ready for filing', color: '#2a2a24' },
  { icon: '📊', title: 'Annual Spending PDF', sub: 'Full Year 2023 • 42 pages', color: '#5a7a5e' },
  { icon: '📑', title: 'Excel Export', sub: 'Raw Transaction Data • Custom CSV', color: '#c9a96e' },
];

export default function Reports() {
  return (
    <div>
      <Navbar title="Financial Analysis" tabs={[{ label: 'Overview', path: '/dashboard' }, { label: 'Analytics', path: '/transactions' }]} activeTab="Analytics" />
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: 'DM Serif Display', fontSize: 36, fontWeight: 500 }}>Intelligence & Reports</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Comprehensive overview of your wealth velocity and fiscal trajectory.</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <select style={{ padding: '9px 14px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--warm-white)', fontSize: 13, color: 'var(--text-primary)', outline: 'none' }}>
              <option>Last 12 Months</option>
              <option>Last 6 Months</option>
              <option>Last 3 Months</option>
            </select>
            <button style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', background: 'var(--charcoal)', border: 'none', borderRadius: 8, color: 'white', fontSize: 13, fontWeight: 500 }}>
              <Download size={14} /> Export All
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16, marginBottom: 16 }}>
          {/* Financial Health */}
          <div style={{ background: 'var(--warm-white)', borderRadius: 12, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontFamily: 'DM Serif Display', fontSize: 20, fontWeight: 600 }}>Financial Health</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Real-time vitality score</div>
              </div>
              <span style={{ background: '#e8f0e9', color: 'var(--sage)', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>+2.4% vs last mo</span>
            </div>
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <svg width="140" height="140" viewBox="0 0 140 140">
                <circle cx="70" cy="70" r="55" fill="none" stroke="var(--border)" strokeWidth="10" />
                <circle cx="70" cy="70" r="55" fill="none" stroke="var(--sage)" strokeWidth="10"
                  strokeDasharray={`${0.82 * 345} 345`} strokeLinecap="round" transform="rotate(-90 70 70)"
                  style={{ filter: 'drop-shadow(0 0 8px rgba(90,122,94,0.4))' }} />
                <text x="70" y="65" textAnchor="middle" fontSize="28" fontWeight="700" fill="var(--text-primary)">82</text>
                <text x="70" y="84" textAnchor="middle" fontSize="12" fill="var(--sage)" fontWeight="600">EXCELLENT</text>
              </svg>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '12px 0', borderTop: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Liquidity Ratio</span>
              <span style={{ fontWeight: 600 }}>1.42</span>
            </div>
            <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '75%', background: 'var(--sage)', borderRadius: 3 }} />
            </div>
          </div>

          {/* Wealth Velocity */}
          <div style={{ background: 'var(--warm-white)', borderRadius: 12, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <div style={{ fontWeight: 600 }}>Wealth Velocity</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Net worth growth & trajectory</div>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}><TrendingUp size={14} /></button>
                <button style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', cursor: 'pointer' }}><BarChart2 size={14} /></button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={wealthData}>
                <XAxis dataKey="m" axisLine={false} tickLine={false} style={{ fontSize: 11 }} />
                <YAxis hide />
                <Tooltip formatter={(v: any) => `$${(v/1000000).toFixed(2)}M`} />
                <Area type="monotone" dataKey="v" stroke="var(--sage)" fill="#e8f0e9" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Report Export Center */}
          <div style={{ background: 'var(--warm-white)', borderRadius: 12, padding: 24 }}>
            <div style={{ fontWeight: 600, marginBottom: 16 }}>Report Export Center</div>
            {reports.map(r => (
              <div key={r.title} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, background: 'var(--cream)', borderRadius: 10, marginBottom: 10 }}>
                <div style={{ width: 40, height: 40, borderRadius: 8, background: r.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{r.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: 14 }}>{r.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.sub}</div>
                </div>
                <button style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', padding: 6, cursor: 'pointer' }}><Download size={18} /></button>
              </div>
            ))}
          </div>

          {/* Predictive Insights */}
          <div style={{ background: 'var(--warm-white)', borderRadius: 12, padding: 24 }}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>Predictive Insights</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>AI-driven 12-month projections</div>
            {[
              { title: 'Wealth Acceleration Forecast', text: 'Based on current savings rate and 6.4% portfolio yield, your net worth is projected to exceed $2.4M by Q3 2025.' },
              { title: 'Tax Optimization Alert', text: 'Increasing your monthly capital contributions by 12% before June could reduce your year-end tax liability by approximately $14,200.' },
            ].map(p => (
              <div key={p.title} style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--sage)', flexShrink: 0, marginTop: 5 }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{p.title}</div>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{p.text}</p>
                </div>
              </div>
            ))}
            <div style={{ background: 'var(--cream)', borderRadius: 8, height: 80, marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <button style={{ padding: '10px 24px', background: 'var(--warm-white)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, fontWeight: 500, cursor: 'pointer' }}>View Full Simulation</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
