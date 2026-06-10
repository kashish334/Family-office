import Navbar from '../components/ui/Navbar';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const spendingByCategory = [
  { name: 'Housing', thisMonth: 5800, lastMonth: 5200 },
  { name: 'Travel', thisMonth: 4280, lastMonth: 3100 },
  { name: 'Dining', thisMonth: 2400, lastMonth: 1930 },
  { name: 'Education', thisMonth: 1800, lastMonth: 1800 },
];

const categoryBreakdown = [
  { name: 'Private Equity Capital Calls', amount: 124500, pct: 85 },
  { name: 'Real Estate Management', amount: 48200, pct: 65 },
  { name: 'Staff Payroll & Services', amount: 32000, pct: 55 },
  { name: 'Leisure & Travel', amount: 28500, pct: 45 },
  { name: 'Philanthropy', amount: 15000, pct: 30 },
];

export default function Expenses() {
  return (
    <div>
      <Navbar title="Financial Analysis" tabs={[{ label: 'Overview', path: '/dashboard' }, { label: 'Analytics', path: '/transactions' }]} activeTab="Analytics" />
      <div style={{ padding: 24 }}>
        <h1 style={{ fontFamily: 'DM Serif Display', fontSize: 32, fontWeight: 500, marginBottom: 6 }}>Deep Expense Analytics</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 24 }}>Visualizing your family office capital flow and spending patterns.</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, marginBottom: 20 }}>
          {/* Heatmap */}
          <div style={{ background: 'var(--warm-white)', borderRadius: 12, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontWeight: 600 }}>Daily Spending Intensity</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
                <span>Lower</span>
                {[0.15, 0.35, 0.55, 0.75, 0.95].map(a => (
                  <div key={a} style={{ width: 14, height: 14, borderRadius: 3, background: `rgba(90,122,94,${a})` }} />
                ))}
                <span>Higher</span>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
              {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                <div key={d} style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'center', marginBottom: 6 }}>{d}</div>
              ))}
              {Array.from({ length: 35 }).map((_, i) => {
                const intensity = [0.2,0.4,0.6,0.85,0.95,0.45,0.2,0.3,0.5,0.7,0.65,0.8,0.4,0.25,0.35,0.55,0.75,0.6,0.9,0.5,0.3,0.45,0.65,0.55,0.4,0.7,0.35,0.2][i % 28] || 0.3;
                return <div key={i} style={{ aspectRatio: 1, borderRadius: 4, background: `rgba(90,122,94,${intensity})` }} />;
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic' }}>
              <span>Peak spending observed on Friday, Week 3 ($1,450.00)</span>
              <button style={{ background: 'none', border: 'none', color: 'var(--sage)', fontSize: 12, cursor: 'pointer' }}>Download CSV ↓</button>
            </div>
          </div>

          {/* AI Insights */}
          <div style={{ background: 'var(--charcoal)', borderRadius: 12, padding: 20, color: 'white' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <span>🤖</span><span style={{ fontWeight: 600 }}>AI Insights</span>
            </div>
            {[
              { tag: 'SAVING OPPORTUNITY', text: 'You could save $50/mo by switching utility providers based on your current usage patterns.', cta: 'Review Providers →' },
              { tag: 'OVERSPENDING ALERT', text: 'Dining out is 24% higher than your 3-month average. Estimated overspend: $320.00', cta: null },
            ].map(i => (
              <div key={i.tag} style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 8, padding: 14, marginBottom: 10 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#a8c5a8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>{i.tag}</div>
                <div style={{ fontSize: 12, color: '#ddd', lineHeight: 1.6, marginBottom: i.cta ? 8 : 0 }}>{i.text}</div>
                {i.cta && <a href="#" style={{ fontSize: 12, color: 'var(--gold-light)', fontWeight: 500 }}>{i.cta}</a>}
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
          {/* Trend Chart */}
          <div style={{ background: 'var(--warm-white)', borderRadius: 12, padding: 24 }}>
            <div style={{ fontWeight: 600, marginBottom: 16 }}>Monthly Spending Trend</div>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={spendingByCategory}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} style={{ fontSize: 11 }} />
                <YAxis hide />
                <Tooltip formatter={(v: any) => `$${v.toLocaleString()}`} />
                <Bar dataKey="thisMonth" fill="var(--sage)" radius={[4,4,0,0]} />
                <Bar dataKey="lastMonth" fill="var(--gold)" radius={[4,4,0,0]} opacity={0.6} />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--text-muted)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--sage)', display: 'inline-block' }} />This Month</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--gold)', display: 'inline-block', opacity: 0.6 }} />Last Month</span>
            </div>
          </div>

          {/* Category Breakdown */}
          <div style={{ background: 'var(--warm-white)', borderRadius: 12, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontWeight: 600 }}>Category Breakdown</div>
              <span style={{ background: '#f5edd8', color: 'var(--gold)', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>+12% vs LY</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>Top 5 spending areas</div>
            {categoryBreakdown.map(c => (
              <div key={c.name} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span>{c.name}</span><span style={{ fontWeight: 600 }}>${c.amount.toLocaleString()}.00</span>
                </div>
                <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${c.pct}%`, background: 'var(--sage)', borderRadius: 3 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
          {[
            { icon: '📈', label: 'PROJECTED ROI', value: '8.4%' },
            { icon: '💰', label: 'DISPOSABLE SURPLUS', value: '$12,480' },
            { icon: '✅', label: 'COMPLIANCE SCORE', value: '98/100' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--warm-white)', borderRadius: 12, padding: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: '#e8f0e9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontFamily: 'DM Serif Display', fontSize: 26, fontWeight: 600 }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
