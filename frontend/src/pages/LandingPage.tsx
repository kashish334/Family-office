import { useNavigate } from 'react-router-dom';
import { Play, Check, TrendingUp, Shield, Brain } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const growthData = [
  { m: 'Jan', v: 148000 }, { m: 'Mar', v: 165000 }, { m: 'Jun', v: 190000 },
  { m: 'Sep', v: 220000 }, { m: 'Dec', v: 248500 },
];

const features = [
  { icon: Brain, title: 'Smart AI Insights', desc: 'Our proprietary AI analyzes your spending patterns across all members to identify hidden leaks and growth opportunities.' },
  { icon: Shield, title: 'Collaborative Budgeting', desc: 'Connect partner and dependent accounts with granular privacy controls. Manage the family treasury together in real-time.' },
  { icon: TrendingUp, title: 'Automated Tracking', desc: 'Direct integration with 15,000+ banks. Transactions are automatically categorized and tagged by family member.' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  return (
    <div style={{ background: 'var(--warm-white)', minHeight: '100vh', fontFamily: 'DM Sans, sans-serif' }}>
      {/* Nav */}
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 48px', borderBottom: '1px solid var(--border)', background: 'var(--warm-white)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, fontWeight: 600 }}>Family Office</div>
        <div style={{ display: 'flex', gap: 28 }}>
          {['Overview', 'Analytics', 'Pricing'].map(l => (
            <a key={l} href="#" style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: l === 'Overview' ? 500 : 400 }}>{l}</a>
          ))}
        </div>
        <button
          onClick={() => navigate('/login')}
          style={{ padding: '9px 20px', background: 'var(--sage)', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500 }}
        >Get Started</button>
      </nav>

      {/* Hero */}
      <section style={{ padding: '72px 48px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center', maxWidth: 1100, margin: '0 auto' }}>
        <div>
          <div style={{ display: 'inline-block', background: '#e8f0e9', color: 'var(--sage)', fontSize: 11, fontWeight: 600, padding: '4px 12px', borderRadius: 20, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 24 }}>The New Standard of Wealth</div>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 52, fontWeight: 500, lineHeight: 1.1, marginBottom: 20 }}>Manage Your Family Finances with AI-Powered Insights</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, lineHeight: 1.7, marginBottom: 32 }}>The elegant way to secure your family's financial future. Experience professional-grade wealth management tailored for the modern home.</p>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => navigate('/login')} style={{ padding: '12px 24px', background: 'var(--sage)', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500 }}>Get Started</button>
            <button style={{ padding: '12px 24px', background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Play size={14} /> Watch Demo
            </button>
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <div style={{ background: 'var(--charcoal)', borderRadius: 16, padding: 20, color: 'white' }}>
            <div style={{ fontSize: 12, color: '#aaa', marginBottom: 4 }}>Total Balance</div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 500 }}>$142,400.00</div>
            <div style={{ marginTop: 12, fontSize: 12, color: '#aaa' }}>Monthly Savings: $4,250.00</div>
          </div>
          <div style={{ background: 'white', borderRadius: 12, padding: 16, marginTop: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 500 }}>Recent Spend</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
              <span>Whole Foods</span><span style={{ color: 'var(--red)' }}>-$242.10</span>
            </div>
          </div>
          <div style={{ position: 'absolute', top: -12, right: -12, background: 'white', borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Brain size={13} color="var(--sage)" />
              <span style={{ fontWeight: 600 }}>AI Insight</span>
            </div>
            <div style={{ color: 'var(--text-secondary)' }}>Move $1,280 to High-Fund Savings</div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '72px 48px', background: 'var(--cream)', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 38, fontWeight: 500, marginBottom: 12 }}>Sophisticated Tools for Modern Families</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 460, margin: '0 auto 48px' }}>Our features are designed to handle the complexity of family wealth while maintaining the simplicity of a personal app.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24, maxWidth: 900, margin: '0 auto' }}>
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} style={{ background: 'var(--warm-white)', borderRadius: 12, padding: 24, textAlign: 'left' }}>
              <div style={{ width: 40, height: 40, background: '#e8f0e9', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Icon size={20} color="var(--sage)" />
              </div>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>{title}</div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Intelligence Section */}
      <section style={{ background: 'var(--charcoal)', padding: '72px 48px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center', maxWidth: '100%' }}>
        <div style={{ color: 'white' }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 40, fontWeight: 400, marginBottom: 16 }}>Intelligence that works for you.</h2>
          <p style={{ color: '#aaa', fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>Stop wondering where the money went. Family Office provides actionable advice based on your real-world behavior.</p>
          {['Weekly spending summaries via secure push', 'Predictive forecasting for the next quarter'].map(t => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#ccc', fontSize: 14, marginBottom: 10 }}>
              <div style={{ background: 'var(--sage)', borderRadius: '50%', padding: 3 }}><Check size={12} color="white" /></div>{t}
            </div>
          ))}
        </div>
        <div style={{ background: 'white', borderRadius: 16, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 28, height: 28, background: '#fef3f2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⚠️</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Budget Alert</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Spending Trend Detected</div>
            </div>
          </div>
          <div style={{ background: 'var(--cream)', borderRadius: 8, padding: 14, marginBottom: 16, fontSize: 13, color: 'var(--text-secondary)' }}>
            Food expenses increased <strong>18%</strong> this month.<br />
            <em>"Higher than usual dining out transactions recorded on weekends."</em>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, fontSize: 14 }}>
            <span style={{ color: 'var(--text-secondary)' }}>Recommended Adjustment:</span>
            <span style={{ color: 'var(--sage)', fontWeight: 600 }}>-$200.00</span>
          </div>
          <button style={{ width: '100%', padding: '12px', background: 'var(--charcoal)', color: 'white', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 500 }}>Apply to Next Month</button>
        </div>
      </section>

      {/* Growth Chart */}
      <section style={{ padding: '72px 48px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 38, fontWeight: 500, marginBottom: 8 }}>Watch Your Future Grow</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 40 }}>Visualize your path to financial freedom with our intuitive analytics engine.</p>
        <div style={{ background: 'white', borderRadius: 16, padding: 24, maxWidth: 800, margin: '0 auto' }}>
          <div style={{ textAlign: 'left', marginBottom: 16 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Savings Growth</div>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32 }}>$248,500.00</div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={growthData}>
              <XAxis dataKey="m" axisLine={false} tickLine={false} style={{ fontSize: 12 }} />
              <YAxis hide />
              <Tooltip formatter={(v: any) => "$" + Number(v).toLocaleString()} />
              <Area type="monotone" dataKey="v" stroke="var(--sage)" fill="#e8f0e9" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: '72px 48px', background: 'var(--cream)' }}>
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 38, fontWeight: 500, marginBottom: 40 }}>Trusted by Families Who Value Precision.</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, maxWidth: 800 }}>
          {[
            { q: "Finally a budget app that feels like it belongs in a boardroom. We've managed to cut our household waste by 12% in the first quarter alone.", name: 'The Andersons, Palo Alto' },
            { q: "The AI insights are spooky accurate. It caught a subscription leak that had been running for three years. It's paid for itself ten times over.", name: 'Marcus Chen, London' },
          ].map(t => (
            <div key={t.name} style={{ background: 'var(--warm-white)', borderRadius: 12, padding: 24 }}>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, marginBottom: 16, fontStyle: 'italic' }}>"{t.q}"</p>
              <div style={{ fontWeight: 500, fontSize: 13 }}>— {t.name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '72px 48px', textAlign: 'center', background: 'var(--cream-dark)' }}>
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 42, fontWeight: 500, marginBottom: 16 }}>Secure Your Family's Legacy</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>Join over 50,000 premium families managing their wealth with the highest standard of elegance and security.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={() => navigate('/login')} style={{ padding: '14px 28px', background: 'var(--sage)', color: 'white', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 500 }}>Get Started for Free</button>
          <button style={{ padding: '14px 28px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, fontSize: 15, color: 'var(--text-secondary)' }}>Schedule a Consultation</button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '24px 48px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
        <div>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>Family Office</div>
          <div>© 2024 Family Office Premium Fintech. All rights reserved.</div>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          {['Privacy Policy', 'Terms of Service', 'Contact Support', 'Security'].map(l => <a key={l} href="#">{l}</a>)}
        </div>
      </footer>
    </div>
  );
}
