// frontend/src/pages/BudgetPlanning.tsx
// CHANGED:
//  1. Removed hardcoded CATEGORIES with fake IDs — now fetches real categories
//     from GET /api/v1/categories/ (same pattern as Transactions.tsx fix).
//  2. Added an Edit (pencil) button on each budget row — opens the same modal
//     pre-filled with that budget's category/limit/month/year. Saving calls
//     the same PUT endpoint, which the backend treats as an upsert, so it
//     updates the existing budget instead of creating a duplicate.
//  3. Added a month/year selector at the top so you can view & edit budgets
//     for any month, not just the current one.
//  4. Modal title and button text adapt ("New Budget" vs "Edit Budget").

import { useEffect, useState } from 'react';
import Navbar from '../components/ui/Navbar';
import { api, Budget, Category } from '../services/api';
import { Plus, X, Pencil } from 'lucide-react';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 6 }, (_, i) => currentYear - 5 + i);

const freshForm = (month: number, year: number) => ({
  category_id: '',
  monthly_limit: '',
  month,
  year,
});

export default function BudgetPlanning() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // ── NEW: viewing period (defaults to current month/year) ───────────────────
  const now = new Date();
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);
  const [viewYear, setViewYear] = useState(now.getFullYear());
  // ─────────────────────────────────────────────────────────────────────────

  const [form, setForm] = useState(freshForm(viewMonth, viewYear));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // ── CHANGED: fetch real categories from the API ────────────────────────────
  useEffect(() => {
    api.categories.list().then(setCategories).catch(() => {});
  }, []);
  // ─────────────────────────────────────────────────────────────────────────

  const load = () => {
    setLoading(true);
    api.budgets.list(viewYear, viewMonth)
      .then(setBudgets)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [viewYear, viewMonth]);

  const openAdd = () => {
    setEditingId(null);
    setForm(freshForm(viewMonth, viewYear));
    setError('');
    setShowModal(true);
  };

  // ── NEW: open modal pre-filled with an existing budget's data ──────────────
  const openEdit = (b: Budget) => {
    setEditingId(b.id);
    setForm({
      category_id: String(b.category_id),
      monthly_limit: String((b as any).limit_amount ?? b.monthly_limit ?? ''),
      month: (b as any).month ?? viewMonth,
      year: (b as any).year ?? viewYear,
    });
    setError('');
    setShowModal(true);
  };
  // ─────────────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!form.category_id || !form.monthly_limit) { setError('Category and limit are required'); return; }
    setSaving(true); setError('');
    try {
      // PUT is an upsert on the backend — same category+month+year updates
      // the existing row, so this works for both create AND edit.
      await api.budgets.create({
        category_id: form.category_id,
        limit_amount: parseFloat(form.monthly_limit),
        month: form.month,
        year: form.year,
      });
      setShowModal(false);
      setEditingId(null);
      setForm(freshForm(viewMonth, viewYear));
      load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const inp = { width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--cream)', fontSize: 13, outline: 'none', color: 'var(--text-primary)', boxSizing: 'border-box' as const };

  const totalBudget = budgets.reduce((s, b) => s + Number((b as any).limit_amount ?? b.monthly_limit ?? 0), 0);
  const totalSpent = budgets.reduce((s, b) => s + Number((b as any).spent_amount ?? b.spent ?? 0), 0);

  // ── CHANGED: categories filtered to expense type (budgets are spending limits) ──
  const expenseCategories = categories.filter(c => c.type === 'expense');

  const periodLabel = `${MONTH_NAMES[viewMonth - 1]} ${viewYear}`;

  return (
    <div>
      <Navbar title="Budget Planning" />
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: 'DM Serif Display', fontSize: 32, fontWeight: 500 }}>Budget Planning</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Set and track monthly spending limits — {periodLabel}</p>
          </div>
          <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', background: 'var(--sage)', border: 'none', borderRadius: 8, fontSize: 13, color: 'white', fontWeight: 500, cursor: 'pointer' }}>
            <Plus size={14} /> New Budget
          </button>
        </div>

        {/* ── NEW: month / year selector ──────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <select value={viewMonth} onChange={e => setViewMonth(Number(e.target.value))}
            style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--warm-white)', fontSize: 13, cursor: 'pointer' }}>
            {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <select value={viewYear} onChange={e => setViewYear(Number(e.target.value))}
            style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--warm-white)', fontSize: 13, cursor: 'pointer' }}>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        {/* ──────────────────────────────────────────────────────────────────── */}

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
                <div style={{ fontFamily: 'DM Serif Display', fontSize: 28, fontWeight: 500, color: s.color || 'var(--text-primary)' }}>{s.value}</div>
              </div>
            ))}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading budgets…</div>
        ) : budgets.length === 0 ? (
          <div style={{ background: 'var(--warm-white)', borderRadius: 16, padding: 60, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>💰</div>
            <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 8 }}>No budgets set for {periodLabel}</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>Create budgets to track your spending limits.</div>
            <button onClick={openAdd} style={{ padding: '10px 20px', background: 'var(--sage)', border: 'none', borderRadius: 8, color: 'white', fontSize: 14, cursor: 'pointer' }}>
              Create First Budget
            </button>
          </div>
        ) : (
          <div style={{ background: 'var(--warm-white)', borderRadius: 12, overflow: 'hidden' }}>
            {/* ── CHANGED: added column for edit button ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 120px 180px 50px', gap: 16, padding: '12px 24px', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>
              <span>Category</span><span>Limit</span><span>Spent</span><span>Remaining</span><span>Progress</span><span></span>
            </div>
            {budgets.map(b => {
              const limit = Number((b as any).limit_amount ?? b.monthly_limit ?? 0);
              const spent = Number((b as any).spent_amount ?? b.spent ?? 0);
              const pct = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0;
              const remaining = limit - spent;
              const catName = b.category?.name || (b as any).category_name || '—';
              return (
                <div key={b.id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px 120px 180px 50px', gap: 16, padding: '18px 24px', borderBottom: '1px solid var(--border-light)', alignItems: 'center' }}>
                  <span style={{ fontWeight: 500 }}>{catName}</span>
                  <span>₹{limit.toLocaleString('en-IN')}</span>
                  <span style={{ color: pct > 90 ? 'var(--red)' : 'var(--text-primary)' }}>₹{spent.toLocaleString('en-IN')}</span>
                  <span style={{ color: remaining < 0 ? 'var(--red)' : 'var(--sage)', fontWeight: 500 }}>₹{remaining.toLocaleString('en-IN')}</span>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                      <span style={{ color: 'var(--text-muted)' }}>{pct.toFixed(0)}% used</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: pct > 90 ? 'var(--red)' : pct > 70 ? 'var(--gold)' : 'var(--sage)', borderRadius: 3 }} />
                    </div>
                  </div>
                  {/* ── NEW: edit button ── */}
                  <button onClick={() => openEdit(b)}
                    style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 7px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30 }}
                    title="Edit budget">
                    <Pencil size={13} />
                  </button>
                  {/* ──────────────────────── */}
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
              {/* ── CHANGED: title adapts to add vs edit ── */}
              <h2 style={{ fontSize: 20, fontWeight: 600 }}>{editingId ? 'Edit Budget' : 'New Budget'}</h2>
              <button onClick={() => { setShowModal(false); setEditingId(null); setError(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#dc2626' }}>{error}</div>}

            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Category *</label>
            {/* ── CHANGED: disable category select when editing (category+period define the row) ── */}
            <select style={{ ...inp, marginBottom: 16 }} value={form.category_id}
              disabled={!!editingId}
              onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
              <option value="">Select category…</option>
              {expenseCategories.map(c => (
                <option key={c.id} value={c.id}>{c.icon ? `${c.icon} ${c.name}` : c.name}</option>
              ))}
            </select>

            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Monthly Limit (₹) *</label>
            <input style={{ ...inp, marginBottom: 16 }} placeholder="0.00" type="number" min="0" value={form.monthly_limit} onChange={e => setForm(f => ({ ...f, monthly_limit: e.target.value }))} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Month</label>
                {/* ── CHANGED: disable period selects when editing ── */}
                <select style={inp} value={form.month} disabled={!!editingId} onChange={e => setForm(f => ({ ...f, month: parseInt(e.target.value) }))}>
                  {MONTH_NAMES.map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Year</label>
                <input style={inp} type="number" value={form.year} disabled={!!editingId} onChange={e => setForm(f => ({ ...f, year: parseInt(e.target.value) }))} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => { setShowModal(false); setEditingId(null); setError(''); }} style={{ flex: 1, padding: '11px', background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '11px', background: saving ? '#9ab89d' : 'var(--sage)', border: 'none', borderRadius: 8, fontSize: 14, color: 'white', fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create Budget'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}