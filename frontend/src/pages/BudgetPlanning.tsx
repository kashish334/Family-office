import { useEffect, useState } from 'react';
import Navbar from '../components/ui/Navbar';
import { api, Budget, Category } from '../services/api';
import { Plus, X } from 'lucide-react';

const CATEGORIES: Category[] = [
  { id: 'expense-grocery', name: 'Grocery', type: 'expense' },
  { id: 'expense-transport', name: 'Transport', type: 'expense' },
  { id: 'expense-food', name: 'Food', type: 'expense' },
  { id: 'expense-medical', name: 'Medical', type: 'expense' },
  { id: 'expense-entertainment', name: 'Entertainment', type: 'expense' },
  { id: 'expense-travel', name: 'Travel', type: 'expense' },
  { id: 'expense-shopping', name: 'Shopping', type: 'expense' },
  { id: 'expense-utilities', name: 'Utilities', type: 'expense' },
  { id: 'expense-other', name: 'Other Expense', type: 'expense' },
];

export default function BudgetPlanning() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ category_id: '', monthly_limit: '', month: new Date().getMonth() + 1, year: new Date().getFullYear() });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    api.budgets.list()
      .then(setBudgets)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async () => {
    if (!form.category_id || !form.monthly_limit) { setError('Category and limit are required'); return; }
    setSaving(true); setError('');
    try {
      // Find category name from hardcoded list
      const cat = CATEGORIES.find(c => c.id === form.category_id);
      await api.budgets.create({
        monthly_limit: parseFloat(form.monthly_limit),
        month: form.month,
        year: form.year,
        category_name: cat?.name,
      });
      setShowModal(false);
      setForm({ category_id: '', monthly_limit: '', month: new Date().getMonth() + 1, year: new Date().getFullYear() });
      load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const inp = { width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--cream)', fontSize: 13, outline: 'none', color: 'var(--text-primary)', boxSizing: 'border-box' as const };

  const totalBudget = budgets.reduce((s, b) => s + b.monthly_limit, 0);
  const totalSpent = budgets.reduce((s, b) => s + (b.spent || 0), 0);

  return (
    <div>
      <Navbar title="Budget Planning" />
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 500 }}>Budget Planning</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Set and track monthly spending limits</p>
          </div>
          <button onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', background: 'var(--sage)', border: 'none', borderRadius: 8, fontSize: 13, color: 'white', fontWeight: 500, cursor: 'pointer' }}>
            <Plus size={14} /> New Budget
          </button>
        </div>

        {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#dc2626' }}>{error}</div>}

        {/* Summary */}
        {budgets.length > 0 && (
          <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Total Budget', value: `₹${totalBudget.toLocaleString('en-IN')}` },
              { label: 'Total Spent', value: `₹${totalSpent.toLocaleString('en-IN')}` },
              { label: 'Remaining', value: `₹${(totalBudget - totalSpent).toLocaleString('en-IN')}`, color: totalBudget - totalSpent >= 0 ? 'var(--sage)' : 'var(--red)' },
            ].map(s => (
              <div key={s.label} style={{ background: 'var(--warm-white)', borderRadius: 12, padding: '16px 20px', flex: 1 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 500, color: s.color || 'var(--text-primary)' }}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading budgets…</div>
        ) : budgets.length === 0 ? (
          <div style={{ background: 'var(--warm-white)', borderRadius: 16, padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>💰</div>
            <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 8 }}>No budgets set</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>Create budgets to track your spending limits.</div>
            <button onClick={() => setShowModal(true)} style={{ padding: '10px 20px', background: 'var(--sage)', border: 'none', borderRadius: 8, color: 'white', fontSize: 14, cursor: 'pointer' }}>
              Create First Budget
            </button>
          </div>
        ) : (
          <div style={{ background: 'var(--warm-white)', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 120px 180px', gap: 16, padding: '12px 24px', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>
              <span>Category</span><span>Limit</span><span>Spent</span><span>Remaining</span><span>Progress</span>
            </div>
            {budgets.map(b => {
              const pct = b.monthly_limit > 0 ? Math.min(((b.spent || 0) / b.monthly_limit) * 100, 100) : 0;
              const remaining = b.monthly_limit - (b.spent || 0);
              const catName = b.category?.name || (b as any).category_name || '—';
              return (
                <div key={b.id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 120px 180px', gap: 16, padding: '18px 24px', borderBottom: '1px solid var(--border-light)', alignItems: 'center' }}>
                  <span style={{ fontWeight: 500 }}>{catName}</span>
                  <span>₹{b.monthly_limit.toLocaleString('en-IN')}</span>
                  <span style={{ color: pct > 90 ? 'var(--red)' : 'var(--text-primary)' }}>₹{(b.spent || 0).toLocaleString('en-IN')}</span>
                  <span style={{ color: remaining < 0 ? 'var(--red)' : 'var(--sage)', fontWeight: 500 }}>₹{remaining.toLocaleString('en-IN')}</span>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                      <span style={{ color: 'var(--text-muted)' }}>{pct.toFixed(0)}% used</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: pct > 90 ? 'var(--red)' : pct > 70 ? 'var(--gold)' : 'var(--sage)', borderRadius: 3 }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 32, width: '100%', maxWidth: 440, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 600 }}>New Budget</h2>
              <button onClick={() => { setShowModal(false); setError(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#dc2626' }}>{error}</div>}

            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Category *</label>
            <select style={{ ...inp, marginBottom: 16 }} value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
              <option value="">Select category…</option>
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>

            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Monthly Limit (₹) *</label>
            <input style={{ ...inp, marginBottom: 16 }} placeholder="0.00" type="number" min="0" value={form.monthly_limit} onChange={e => setForm(f => ({ ...f, monthly_limit: e.target.value }))} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Month</label>
                <select style={inp} value={form.month} onChange={e => setForm(f => ({ ...f, month: parseInt(e.target.value) }))}>
                  {['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Year</label>
                <input style={inp} type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: parseInt(e.target.value) }))} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => { setShowModal(false); setError(''); }} style={{ flex: 1, padding: '11px', background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleAdd} disabled={saving} style={{ flex: 1, padding: '11px', background: saving ? '#9ab89d' : 'var(--sage)', border: 'none', borderRadius: 8, fontSize: 14, color: 'white', fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Saving…' : 'Create Budget'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}