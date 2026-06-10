import { useEffect, useState } from 'react';
import { api, DashboardData, Transaction, Budget } from '../services/api';
import { getFamilyId } from '../services/api';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Plus, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const catColors: Record<string, string> = {
  Grocery: '#e8f0e9', Transport: '#f0ede8', Investment: '#e8f5f0',
  Entertainment: '#f5e8e8', Income: '#e8f0e9', Food: '#f0ede8',
  Medical: '#f5e8e8', Travel: '#e8eaf5', Shopping: '#f5f0e8',
};

function StatCard({ label, value, sub, trend }: { label: string; value: string; sub?: string; trend?: 'up' | 'down' }) {
  return (
    <div style={{ background: 'var(--warm-white)', borderRadius: 12, padding: '20px 24px', flex: 1 }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 500, marginBottom: 6 }}>{value}</div>
      {sub && (
        <div style={{ fontSize: 12, color: trend === 'down' ? 'var(--red)' : 'var(--sage)', display: 'flex', alignItems: 'center', gap: 4 }}>
          {trend === 'down' ? <TrendingDown size={12} /> : <TrendingUp size={12} />} {sub}
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon, message, action, onAction }: { icon: string; message: string; action?: string; onAction?: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: 28, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 13, marginBottom: action ? 12 : 0 }}>{message}</div>
      {action && onAction && (
        <button onClick={onAction} style={{ padding: '7px 16px', background: 'var(--sage)', border: 'none', borderRadius: 8, color: 'white', fontSize: 13, cursor: 'pointer', marginTop: 4 }}>
          {action}
        </button>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recentTx, setRecentTx] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const { user } = useAuth();
  const navigate = useNavigate();
  const hasFam = !!getFamilyId();

  useEffect(() => {
    if (!hasFam) { setLoading(false); return; }
    setLoading(true);
    setError('');
    api.analytics.dashboard()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
    api.transactions.list({ page: '1', per_page: '5' })
      .then(res => setRecentTx(res.items))
      .catch(() => {});
    const now = new Date();
    api.budgets.list(now.getFullYear(), now.getMonth() + 1)
      .then(setBudgets)
      .catch(() => {});
  }, [hasFam, refreshKey]);

  const totalIncome = Number(data?.total_income ?? 0);
  const totalExpenses = Number(data?.total_expenses ?? 0);
  const netSavings = Number(data?.net_savings ?? 0);
  const savingsRate = Number(data?.savings_rate ?? 0);

  const chartData = (() => {
    const trends = (data as any)?.monthly_trends ?? data?.monthly_data ?? [];
    return trends.map((t: any) => ({
      month: t.month ? new Date(t.month + '-01').toLocaleString('default', { month: 'short', year: '2-digit' }) : t.month,
      income: Number(t.income ?? 0),
      expenses: Number(t.expenses ?? 0),
    }));
  })();

  const topCategories = (() => {
    if (recentTx.length > 0) {
      const map: Record<string, number> = {};
      let total = 0;
      recentTx.filter((t: any) => t.type === 'expense').forEach((t: any) => {
        const name = t.category?.name || t.merchant_name || 'Uncategorized';
        map[name] = (map[name] || 0) + Number(t.amount);
        total += Number(t.amount);
      });
      return Object.entries(map).map(([name, amount]) => ({
        name, amount,
        percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
      })).sort((a, b) => b.amount - a.amount);
    }
    return ((data as any)?.category_breakdown ?? []).map((c: any) => ({
      name: c.category_name && c.category_name !== 'None' ? c.category_name : 'Uncategorized',
      amount: Number(c.total ?? 0),
      percentage: Number(c.percentage ?? 0),
    })).filter((c: any) => c.amount > 0);
  })();

  const PIE_COLORS = ['#5c7a5e', '#8faa91', '#c9b99a', '#7a8fa6', '#a67a7a', '#7a9ca6'];

  return (
    <div>
      {/* Navbar */}
      <div style={{ background: 'var(--warm-white)', borderBottom: '1px solid var(--border)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontWeight: 600 }}>Dashboard</span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: 'var(--sage)', color: 'white', fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>Overview</button>
            <button onClick={() => navigate('/transactions')} style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: 'transparent', color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer' }}>Analytics</button>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button onClick={() => setRefreshKey(k => k + 1)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--cream)', fontSize: 12, cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <RefreshCw size={12} /> Refresh
          </button>
          {user && <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Welcome, <strong>{user.full_name}</strong></div>}
        </div>
      </div>

      <div style={{ padding: 24 }}>
        {loading && <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading your dashboard…</div>}
        {!loading && error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 12, padding: 24, marginBottom: 20, color: '#dc2626', fontSize: 13 }}>
            Failed to load dashboard: {error}
          </div>
        )}

        {!loading && !error && (
          <>
            <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
              <StatCard label="Total Income" value={`₹${totalIncome.toLocaleString('en-IN')}`} sub={totalIncome > 0 ? 'This period' : 'No income yet'} trend="up" />
              <StatCard label="Total Expenses" value={`₹${totalExpenses.toLocaleString('en-IN')}`} sub={totalExpenses > 0 ? 'This period' : 'No expenses yet'} trend="down" />
              <StatCard label="Net Savings" value={`₹${netSavings.toLocaleString('en-IN')}`} sub={netSavings >= 0 ? 'Positive balance' : 'Deficit'} trend={netSavings >= 0 ? 'up' : 'down'} />
              <StatCard label="Savings Rate" value={`${savingsRate.toFixed(1)}%`} sub="Of income saved" trend="up" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Monthly Chart */}
                <div style={{ background: 'var(--warm-white)', borderRadius: 12, padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 16 }}>Monthly Overview</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Income vs Expenses Analysis</div>
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--sage)', display: 'inline-block' }} />Income</span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--gold)', display: 'inline-block' }} />Expenses</span>
                    </div>
                  </div>
                  {chartData.length ? (
                    <ResponsiveContainer width="100%" height={220}>
                      <AreaChart data={chartData}>
                        <XAxis dataKey="month" axisLine={false} tickLine={false} style={{ fontSize: 11 }} />
                        <YAxis axisLine={false} tickLine={false} style={{ fontSize: 11 }} tickFormatter={(v: any) => '₹' + Number(v).toLocaleString('en-IN')} width={80} />
                        <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString('en-IN')}`} />
                        <Area type="monotone" dataKey="income" stroke="var(--sage)" fill="#e8f0e9" strokeWidth={2} dot={{ r: 5, fill: 'var(--sage)' }} activeDot={{ r: 7 }} />
                        <Area type="monotone" dataKey="expenses" stroke="var(--gold)" fill="#f5edd8" strokeWidth={2} dot={{ r: 5, fill: 'var(--gold)' }} activeDot={{ r: 7 }} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState icon="📈" message="Add transactions to see your monthly trends." action="Add Transaction" onAction={() => navigate('/transactions')} />
                  )}
                </div>

                {/* Bottom grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div style={{ background: 'var(--warm-white)', borderRadius: 12, padding: 20 }}>
                    <div style={{ fontWeight: 600, marginBottom: 16 }}>Top Spending Categories</div>
                    {topCategories.length ? (
                      <>
                        <ResponsiveContainer width="100%" height={180}>
                          <PieChart>
                            <Pie data={topCategories.slice(0, 6)} dataKey="amount" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={30}>
                              {topCategories.slice(0, 6).map((_: any, i: number) => (
                                <Cell key={i} fill={PIE_COLORS[i % 6]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString('en-IN')}`} />
                          </PieChart>
                        </ResponsiveContainer>
                        {topCategories.slice(0, 6).map((cat: any, i: number) => (
                          <div key={cat.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, marginBottom: 4 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ width: 10, height: 10, borderRadius: '50%', background: PIE_COLORS[i % 6], display: 'inline-block' }} />
                              {cat.name}
                            </span>
                            <span style={{ fontWeight: 600 }}>{cat.percentage}%</span>
                          </div>
                        ))}
                      </>
                    ) : <EmptyState icon="🏷️" message="No spending data yet." />}
                  </div>

                  <div style={{ background: 'var(--warm-white)', borderRadius: 12, padding: 20 }}>
                    <div style={{ fontWeight: 600, marginBottom: 16 }}>Budget Utilization</div>
                    {budgets.length > 0 ? budgets.slice(0, 4).map((b: any) => {
                      const limit = Number(b.limit_amount || b.monthly_limit || 0);
                      const spent = Number(b.spent || b.spent_amount || 0);
                      const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
                      const catName = b.category?.name || b.category_name || 'Budget';
                      return (
                        <div key={b.id} style={{ marginBottom: 14 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                            <span>{catName}</span>
                            <span style={{ fontWeight: 600, color: pct > 90 ? 'var(--red)' : 'var(--text-primary)' }}>
                              ₹{spent.toLocaleString('en-IN')} / ₹{limit.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: pct > 90 ? 'var(--red)' : pct > 70 ? 'var(--gold)' : 'var(--sage)', borderRadius: 3 }} />
                          </div>
                        </div>
                      );
                    }) : <EmptyState icon="💰" message="No budgets set yet." action="Set Budget" onAction={() => navigate('/budget')} />}
                  </div>
                </div>

                {/* Recent Transactions */}
                <div style={{ background: 'var(--warm-white)', borderRadius: 12, padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>Recent Transactions</div>
                    <button onClick={() => navigate('/transactions')} style={{ fontSize: 13, color: 'var(--sage)', background: 'none', border: 'none', cursor: 'pointer' }}>View All History →</button>
                  </div>
                  {recentTx.length ? (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 130px 110px', gap: 12, fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                        <span>Date</span><span>Description</span><span>Category</span><span style={{ textAlign: 'right' }}>Amount</span>
                      </div>
                      {recentTx.slice(0, 5).map((t: Transaction) => (
                        <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 130px 110px', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border-light)', fontSize: 13, alignItems: 'center' }}>
                          <span style={{ color: 'var(--text-muted)' }}>{new Date((t as any).transaction_date || t.date).toLocaleDateString()}</span>
                          <span style={{ fontWeight: 500 }}>{t.description}</span>
                          <span><span style={{ background: catColors[t.category?.name || ''] || 'var(--cream)', padding: '2px 10px', borderRadius: 20, fontSize: 12 }}>{t.category?.name || (t as any).merchant_name || '—'}</span></span>
                          <span style={{ textAlign: 'right', fontWeight: 600, color: t.type === 'income' ? 'var(--success)' : 'var(--red)' }}>
                            {t.type === 'income' ? '+' : '-'}₹{Math.abs(Number(t.amount)).toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                    </>
                  ) : (
                    <EmptyState icon="💳" message="No transactions yet. Add your first transaction to get started." action="Add Transaction" onAction={() => navigate('/transactions')} />
                  )}
                </div>
              </div>

              {/* Right Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: 'var(--sage)', borderRadius: 12, padding: 20, color: 'white' }}>
                  <div style={{ fontWeight: 600, marginBottom: 12 }}>Quick Actions</div>
                  <button onClick={() => navigate('/transactions')} style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, color: 'white', fontSize: 13, cursor: 'pointer', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Plus size={14} /> Add Transaction
                  </button>
                  <button onClick={() => navigate('/savings')} style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, color: 'white', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Plus size={14} /> Create Savings Goal
                  </button>
                </div>

                <div style={{ background: 'var(--warm-white)', borderRadius: 12, padding: 20 }}>
                  <div style={{ fontWeight: 600, marginBottom: 16 }}>Financial Summary</div>
                  {[
                    { label: 'Total Income', value: `₹${totalIncome.toLocaleString('en-IN')}`, color: 'var(--sage)' },
                    { label: 'Total Expenses', value: `₹${totalExpenses.toLocaleString('en-IN')}`, color: 'var(--red)' },
                    { label: 'Net Balance', value: `₹${netSavings.toLocaleString('en-IN')}`, color: netSavings >= 0 ? 'var(--sage)' : 'var(--red)' },
                    { label: 'Savings Rate', value: `${savingsRate.toFixed(1)}%`, color: 'var(--text-primary)' },
                  ].map(item => (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-light)', fontSize: 14 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                      <span style={{ fontWeight: 600, color: item.color }}>{item.value}</span>
                    </div>
                  ))}
                </div>

                <div style={{ background: 'var(--charcoal)', borderRadius: 12, padding: 20, color: 'white' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <span>🤖</span><span style={{ fontWeight: 600 }}>AI Insights</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#ccc', lineHeight: 1.6, marginBottom: 12 }}>
                    {totalIncome > 0 ? 'Your financial data is ready for AI analysis. Ask me anything about your spending patterns.' : 'Add transactions to receive personalized AI insights about your finances.'}
                  </p>
                  <button onClick={() => navigate('/ai')} style={{ width: '100%', padding: '10px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, color: 'white', fontSize: 13, cursor: 'pointer' }}>
                    Open AI Advisor →
                  </button>
                </div>

                <div style={{ background: 'var(--warm-white)', borderRadius: 12, padding: 20 }}>
                  <div style={{ fontWeight: 600, marginBottom: 12 }}>Savings Goals</div>
                  <button onClick={() => navigate('/savings')} style={{ width: '100%', padding: '10px', background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>
                    Manage Goals →
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}