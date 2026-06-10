import { useEffect, useState } from 'react';
import Navbar from '../components/ui/Navbar';
import { api, Budget, Category } from '../services/api';
import { Plus, X } from 'lucide-react';

const CATEGORIES: Category[] = [
  { id: '3875194e-65d4-41b4-9f79-3fece6939adf', name: 'Education', type: 'expense' },
  { id: '24dc12c8-465f-4234-8707-d41f828f4c6e', name: 'Entertainment', type: 'expense' },
  { id: '589622bd-2447-4a22-b232-6db4e21579bd', name: 'Food & Dining', type: 'expense' },
  { id: '0fb5e64b-3b91-411e-9fa0-2a3772075fa8', name: 'Healthcare', type: 'expense' },
  { id: 'f9ed6e71-6d2a-4384-adff-1ca63b6b6e83', name: 'Housing', type: 'expense' },
  { id: '9066c449-e73b-4c94-8a6d-5b601ca57088', name: 'Insurance', type: 'expense' },
  { id: '7d6209ac-aeb7-40f4-9db9-d0315b1664ea', name: 'Memberships', type: 'expense' },
  { id: '69bd7f76-5b6c-4a32-be7e-48e43fed1dba', name: 'Philanthropy', type: 'expense' },
  { id: 'a64ade11-5b5b-4bac-a0a0-a56f4f373eae', name: 'Shopping', type: 'expense' },
  { id: '5c739ee7-a624-4407-92c1-a2300968d975', name: 'Staff & Services', type: 'expense' },
  { id: '91fc0c66-020b-4159-bda1-6fc70456702d', name: 'Transport', type: 'expense' },
  { id: '320264e1-36f3-453e-9a85-6c6b56c7d712', name: 'Travel', type: 'expense' },
  { id: 'dcffcf2f-9dec-45eb-a674-2c2b36fe7518', name: 'Utilities', type: 'expense' },
  { id: '0b03561f-a958-4d2b-9829-86ca43f989ab', name: 'Business Income', type: 'income' },
  { id: 'fe1b64f8-4bb7-4fe8-9d6b-9e2d117169cd', name: 'Dividends', type: 'income' },
  { id: 'ccd6f852-7eec-4403-ba1b-21bb0934f0c1', name: 'Interest', type: 'income' },
  { id: '688e6f42-f862-4ebb-b32c-172034951439', name: 'Rental Income', type: 'income' },
  { id: '7503d0de-789b-400b-a85b-79e671c90ec6', name: 'Salary & Bonus', type: 'income' },
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
    const now = new Date();
    api.budgets.list(now.getFullYear(), now.getMonth() + 1)
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
      await api.budgets.create({
        category_id: form.category_id,
        limit_amount: parseFloat(form.monthly_limit),
        month: form.month,
        year: form.year,
      });
      setShowModal(false);
      setForm({ category_id: '', monthly_limit: '', month: new Date().getMonth() + 1, year: new Date().getFullYear() });
      load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const inp = { width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--cream)', fontSize: 13, outline: 'none', color: 'var(--text-primary)', boxSizing: 'border-box' as const };

  const totalBudget = budgets.reduce((s, b) => s + (b.monthly_limit || (b as any).limit_amount || 0), 0);
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
              const pct = ((b as any).limit_amount || b.monthly_limit || 0) > 0 ? Math.min(((b.spent || (b as any).spent_amount || 0) / ((b as any).limit_amount || b.monthly_limit || 1)) * 100, 100) : 0;
              const remaining = ((b as any).limit_amount || b.monthly_limit || 0) - (b.spent || (b as any).spent_amount || 0);
              const catInfo = CATEGORIES.find(c => c.id === String(b.category_id));
              const catName = b.category?.name || catInfo?.name || (b as any).category_name || '—';
              return (
                <div key={b.id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 120px 180px', gap: 16, padding: '18px 24px', borderBottom: '1px solid var(--border-light)', alignItems: 'center' }}>
                  <span style={{ fontWeight: 500 }}>{catName}</span>
                  <span>₹{((b as any).limit_amount || b.monthly_limit || 0).toLocaleString('en-IN')}</span>
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