// frontend/src/pages/Dashboard.tsx
// KEY FIX: topCategories now ONLY reads from data.category_breakdown (API response
// scoped to selected month/year). The old code checked recentTx.length > 0 first
// and derived categories from it — but recentTx has no date filter so it always
// showed the same stale data regardless of which month was selected.

import { useEffect, useState } from 'react';
import { api, DashboardData, Transaction, Budget } from '../services/api';
import { getFamilyId } from '../services/api';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, CartesianGrid,
} from 'recharts';
import { TrendingUp, TrendingDown, Plus, RefreshCw, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useDashboardFilters } from '../hooks/useDashboardFilters';

const catColors: Record<string, string> = {
  Grocery: '#e8f0e9', Transport: '#f0ede8', Investment: '#e8f5f0',
  Entertainment: '#f5e8e8', Income: '#e8f0e9', Food: '#f0ede8',
  Medical: '#f5e8e8', Travel: '#e8eaf5', Shopping: '#f5f0e8',
};

// ── Small reusable components ────────────────────────────────────────────────

function StatCard({ label, value, sub, trend }: {
  label: string; value: string; sub?: string; trend?: 'up' | 'down';
}) {
  return (
    <div style={{ background: 'var(--warm-white)', borderRadius: 12, padding: '20px 24px', flex: 1 }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: 'DM Serif Display', fontSize: 32, fontWeight: 500, marginBottom: 6 }}>{value}</div>
      {sub && (
        <div style={{ fontSize: 12, color: trend === 'down' ? 'var(--red)' : 'var(--sage)', display: 'flex', alignItems: 'center', gap: 4 }}>
          {trend === 'down' ? <TrendingDown size={12} /> : <TrendingUp size={12} />} {sub}
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon, message, action, onAction }: {
  icon: string; message: string; action?: string; onAction?: () => void;
}) {
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

const ChartTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--warm-white)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 6 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: 2, background: p.fill, display: 'inline-block' }} />
          <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{p.name}:</span>
          <span style={{ fontWeight: 600 }}>₹{Number(p.value).toLocaleString('en-IN')}</span>
        </div>
      ))}
    </div>
  );
};

// ── Filter bar ───────────────────────────────────────────────────────────────

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => currentYear - 5 + i);

function FilterBar({ year, month, monthLabel, isCurrentMonth, onPrev, onNext, onMonthSelect, onYearSelect }: {
  year: number; month: number; monthLabel: string; isCurrentMonth: boolean;
  onPrev: () => void; onNext: () => void;
  onMonthSelect: (m: number) => void; onYearSelect: (y: number) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--cream)', borderRadius: 10, padding: '8px 14px', border: '1px solid var(--border)' }}>
      <Calendar size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
      <button onClick={onPrev} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', color: 'var(--text-secondary)' }}>
        <ChevronLeft size={16} />
      </button>
      <div style={{ display: 'flex', gap: 4 }}>
        {MONTHS.map((m, i) => (
          <button key={m} onClick={() => onMonthSelect(i + 1)} style={{
            padding: '4px 8px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12,
            fontWeight: month === i + 1 ? 600 : 400,
            background: month === i + 1 ? 'var(--sage)' : 'transparent',
            color: month === i + 1 ? 'white' : 'var(--text-secondary)',
            transition: 'background 0.15s',
          }}>{m}</button>
        ))}
      </div>
      <button onClick={onNext} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, display: 'flex', color: 'var(--text-secondary)' }}>
        <ChevronRight size={16} />
      </button>
      <div style={{ width: 1, height: 20, background: 'var(--border)', flexShrink: 0 }} />
      <select value={year} onChange={e => onYearSelect(Number(e.target.value))}
        style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', outline: 'none' }}>
        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
      </select>
      {!isCurrentMonth && (
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', marginLeft: 4 }}>
          viewing {monthLabel}
        </span>
      )}
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

const PIE_COLORS = ['#5c7a5e', '#8faa91', '#c9b99a', '#7a8fa6', '#a67a7a', '#7a9ca6'];

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

  const { filters, setMonth, setYear, stepMonth, isCurrentMonth, monthLabel } = useDashboardFilters();

  useEffect(() => {
    if (!hasFam) { setLoading(false); return; }
    setLoading(true);
    setError('');

    // Dashboard API — scoped to selected month/year
    api.analytics.dashboard(filters.year, filters.month)
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));

    // Recent transactions — used ONLY for the table at the bottom, NOT for categories
    api.transactions.list({ page: '1', per_page: '5' })
      .then(res => setRecentTx(res.items))
      .catch(() => {});

    // Budgets for selected month/year
    api.budgets.list(filters.year, filters.month)
      .then(setBudgets)
      .catch(() => {});

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasFam, refreshKey, filters.year, filters.month]);

  const totalIncome   = Number(data?.total_income   ?? 0);
  const totalExpenses = Number(data?.total_expenses ?? 0);
  const netSavings    = Number(data?.net_savings    ?? 0);
  const savingsRate   = Number(data?.savings_rate   ?? 0);

  // ── Monthly chart: all 12 months of selected year ───────────────────────
  const chartData = (() => {
    const trends = (data as any)?.monthly_trends ?? data?.monthly_data ?? [];
    return trends.map((t: any) => {
      const raw: string = typeof t.month === 'string' ? t.month : String(t.month);
      const [y, m] = raw.split('-');
      const label = new Date(Number(y), Number(m) - 1, 1).toLocaleString('default', { month: 'short' });
      return { month: label, income: Number(t.income ?? 0), expenses: Number(t.expenses ?? 0) };
    });
  })();

  // ── TOP CATEGORIES: read ONLY from category_breakdown in API response ───
  // This is already filtered by the selected month/year on the backend.
  // We do NOT derive this from recentTx — that list has no date scope applied.
  const topCategories = (() => {
    const breakdown = (data as any)?.category_breakdown ?? [];
    return breakdown
      .map((c: any) => ({
        name: (c.category_name && c.category_name !== 'None' && c.category_name !== 'null')
          ? c.category_name
          : 'Uncategorized',
        amount:     Number(c.total      ?? 0),
        percentage: Number(c.percentage ?? 0),
      }))
      .filter((c: any) => c.amount > 0)
      .sort((a: any, b: any) => b.amount - a.amount);
  })();
  // ────────────────────────────────────────────────────────────────────────

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
        {/* Filter bar */}
        <div style={{ marginBottom: 20 }}>
          <FilterBar
            year={filters.year} month={filters.month}
            monthLabel={monthLabel} isCurrentMonth={isCurrentMonth}
            onPrev={() => stepMonth(-1)} onNext={() => stepMonth(1)}
            onMonthSelect={setMonth} onYearSelect={setYear}
          />
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading dashboard…</div>
        )}
        {!loading && error && (
          <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 12, padding: 24, marginBottom: 20, color: '#dc2626', fontSize: 13 }}>
            Failed to load dashboard: {error}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Stat cards */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 20 }}>
              <StatCard label="Total Income"   value={`₹${totalIncome.toLocaleString('en-IN')}`}   sub={monthLabel} trend="up" />
              <StatCard label="Total Expenses" value={`₹${totalExpenses.toLocaleString('en-IN')}`} sub={monthLabel} trend="down" />
              <StatCard label="Net Savings"    value={`₹${netSavings.toLocaleString('en-IN')}`}    sub={netSavings >= 0 ? 'Positive balance' : 'Deficit'} trend={netSavings >= 0 ? 'up' : 'down'} />
              <StatCard label="Savings Rate"   value={`${savingsRate.toFixed(1)}%`}                sub="Of income saved" trend="up" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Monthly Overview — bar chart for full selected year */}
                <div style={{ background: 'var(--warm-white)', borderRadius: 12, padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 16 }}>Monthly Overview</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Income vs Expenses — Full year {filters.year}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--sage)', display: 'inline-block' }} />Income
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--gold)', display: 'inline-block' }} />Expenses
                      </span>
                    </div>
                  </div>
                  {chartData.length ? (
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={chartData} barCategoryGap="30%" barGap={4}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                        <XAxis
                          dataKey="month" axisLine={false} tickLine={false}
                          tick={(props: any) => {
                            const { x, y, payload } = props;
                            const isSelected = payload.value === MONTHS[filters.month - 1];
                            return (
                              <text x={x} y={y + 12} textAnchor="middle" fontSize={11}
                                fontWeight={isSelected ? 700 : 400}
                                fill={isSelected ? 'var(--sage)' : 'var(--text-muted)'}>
                                {payload.value}
                              </text>
                            );
                          }}
                        />
                        <YAxis axisLine={false} tickLine={false} style={{ fontSize: 11 }}
                          tickFormatter={(v: any) => '₹' + Number(v).toLocaleString('en-IN')} width={80} />
                        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
                        <Bar dataKey="income"   name="income"   fill="var(--sage)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="expenses" name="expenses" fill="var(--gold)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState icon="📈" message={`No data for ${filters.year}.`} action="Add Transaction" onAction={() => navigate('/transactions')} />
                  )}
                </div>

                {/* Bottom grid: Categories + Budget */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                  {/* Top Spending Categories — from category_breakdown ONLY */}
                  <div style={{ background: 'var(--warm-white)', borderRadius: 12, padding: 20 }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Top Spending Categories</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14 }}>{monthLabel}</div>
                    {topCategories.length ? (
                      <>
                        <ResponsiveContainer width="100%" height={180}>
                          <PieChart>
                            <Pie data={topCategories.slice(0, 6)} dataKey="amount" nameKey="name"
                              cx="50%" cy="50%" outerRadius={70} innerRadius={30}>
                              {topCategories.slice(0, 6).map((_: any, i: number) => (
                                <Cell key={i} fill={PIE_COLORS[i % 6]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(v: any) => `₹${Number(v).toLocaleString('en-IN')}`} />
                          </PieChart>
                        </ResponsiveContainer>
                        {topCategories.slice(0, 6).map((cat: any, i: number) => (
                          <div key={cat.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, marginBottom: 6 }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ width: 10, height: 10, borderRadius: '50%', background: PIE_COLORS[i % 6], display: 'inline-block' }} />
                              {cat.name}
                            </span>
                            <span style={{ display: 'flex', gap: 10 }}>
                              <span style={{ color: 'var(--text-muted)' }}>₹{Number(cat.amount).toLocaleString('en-IN')}</span>
                              <span style={{ fontWeight: 600, minWidth: 36, textAlign: 'right' }}>{cat.percentage}%</span>
                            </span>
                          </div>
                        ))}
                      </>
                    ) : (
                      <EmptyState icon="🏷️" message={`No expense data for ${monthLabel}.`} />
                    )}
                  </div>

                  {/* Budget Utilization */}
                  <div style={{ background: 'var(--warm-white)', borderRadius: 12, padding: 20 }}>
                    <div style={{ fontWeight: 600, marginBottom: 4 }}>Budget Utilization</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14 }}>{monthLabel}</div>
                    {budgets.length > 0 ? budgets.slice(0, 4).map((b: any) => {
                      const limit = Number(b.limit_amount || b.monthly_limit || 0);
                      const spent = Number(b.spent || b.spent_amount || 0);
                      const pct   = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
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
                            <div style={{ height: '100%', width: `${pct}%`, borderRadius: 3,
                              background: pct > 90 ? 'var(--red)' : pct > 70 ? 'var(--gold)' : 'var(--sage)' }} />
                          </div>
                        </div>
                      );
                    }) : (
                      <EmptyState icon="💰" message="No budgets set yet." action="Set Budget" onAction={() => navigate('/budget')} />
                    )}
                  </div>
                </div>

                {/* Recent Transactions table */}
                <div style={{ background: 'var(--warm-white)', borderRadius: 12, padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div style={{ fontWeight: 600, fontSize: 16 }}>Recent Transactions</div>
                    <button onClick={() => navigate('/transactions')}
                      style={{ fontSize: 13, color: 'var(--sage)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      View All History →
                    </button>
                  </div>
                  {recentTx.length ? (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr 130px 110px', gap: 12, fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                        <span>Date</span><span>Description</span><span>Category</span><span style={{ textAlign: 'right' }}>Amount</span>
                      </div>
                      {recentTx.slice(0, 5).map((t: Transaction) => (
                        <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '110px 1fr 130px 110px', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border-light)', fontSize: 13, alignItems: 'center' }}>
                          <span style={{ color: 'var(--text-muted)' }}>
                            {new Date((t as any).transaction_date || t.date).toLocaleDateString()}
                          </span>
                          <span style={{ fontWeight: 500 }}>{t.description}</span>
                          <span>
                            <span style={{ background: catColors[t.category?.name || ''] || 'var(--cream)', padding: '2px 10px', borderRadius: 20, fontSize: 12 }}>
                              {t.category?.name || '—'}
                            </span>
                          </span>
                          <span style={{ textAlign: 'right', fontWeight: 600, color: t.type === 'income' ? 'var(--success)' : 'var(--red)' }}>
                            {t.type === 'income' ? '+' : '-'}₹{Math.abs(Number(t.amount)).toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                    </>
                  ) : (
                    <EmptyState icon="💳" message="No recent transactions." action="Add Transaction" onAction={() => navigate('/transactions')} />
                  )}
                </div>
              </div>

              {/* Right sidebar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ background: 'var(--sage)', borderRadius: 12, padding: 20, color: 'white' }}>
                  <div style={{ fontWeight: 600, marginBottom: 12 }}>Quick Actions</div>
                  <button onClick={() => navigate('/transactions')}
                    style={{ width: '100%', padding: 10, background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 8, color: 'white', fontSize: 13, cursor: 'pointer', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Plus size={14} /> Add Transaction
                  </button>
                  <button onClick={() => navigate('/savings')}
                    style={{ width: '100%', padding: 10, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, color: 'white', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <Plus size={14} /> Create Savings Goal
                  </button>
                </div>

                <div style={{ background: 'var(--warm-white)', borderRadius: 12, padding: 20 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Financial Summary</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14 }}>{monthLabel}</div>
                  {[
                    { label: 'Total Income',   value: `₹${totalIncome.toLocaleString('en-IN')}`,   color: 'var(--sage)' },
                    { label: 'Total Expenses', value: `₹${totalExpenses.toLocaleString('en-IN')}`, color: 'var(--red)' },
                    { label: 'Net Balance',    value: `₹${netSavings.toLocaleString('en-IN')}`,    color: netSavings >= 0 ? 'var(--sage)' : 'var(--red)' },
                    { label: 'Savings Rate',   value: `${savingsRate.toFixed(1)}%`,                color: 'var(--text-primary)' },
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
                    {totalIncome > 0
                      ? 'Your financial data is ready for AI analysis.'
                      : 'Add transactions to receive personalized AI insights.'}
                  </p>
                  <button onClick={() => navigate('/ai')}
                    style={{ width: '100%', padding: 10, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 8, color: 'white', fontSize: 13, cursor: 'pointer' }}>
                    Open AI Advisor →
                  </button>
                </div>

                <div style={{ background: 'var(--warm-white)', borderRadius: 12, padding: 20 }}>
                  <div style={{ fontWeight: 600, marginBottom: 12 }}>Savings Goals</div>
                  <button onClick={() => navigate('/savings')}
                    style={{ width: '100%', padding: 10, background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer' }}>
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