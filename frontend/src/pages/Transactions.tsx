import { useEffect, useState } from 'react';
import { api, Transaction, Category } from '../services/api';
import { Download, Plus, ChevronLeft, ChevronRight, X, Pencil } from 'lucide-react';

const catColors: Record<string, string> = {
  Grocery: '#e8f0e9', Transport: '#f0ede8', Investment: '#d8f0e8',
  Entertainment: '#f5e8e8', Income: '#d8f0e8', Food: '#f0ede8',
  Medical: '#f5e8e8', Travel: '#e8eaf5', Shopping: '#f5f0e8',
};

const CATEGORIES: Category[] = [
  { id: 'income-salary', name: 'Salary', type: 'income' },
  { id: 'income-freelance', name: 'Freelance', type: 'income' },
  { id: 'income-investment', name: 'Investment Returns', type: 'income' },
  { id: 'income-rental', name: 'Rental Income', type: 'income' },
  { id: 'income-business', name: 'Business Income', type: 'income' },
  { id: 'income-other', name: 'Other Income', type: 'income' },
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

interface Props { defaultType?: 'income' | 'expense'; }

const freshForm = (defaultType?: 'income' | 'expense') => ({
  description: '',
  amount: '',
  type: defaultType || 'expense',
  category_id: '',
  transaction_date: new Date().toISOString().split('T')[0],
  notes: '',
});

export default function Transactions({ defaultType }: Props) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [typeFilter, setTypeFilter] = useState<string>(defaultType || 'all');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(freshForm(defaultType));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const perPage = 10;

  const title = defaultType === 'income' ? 'Income' : defaultType === 'expense' ? 'Expenses' : 'Transactions';

  useEffect(() => {
    setTypeFilter(defaultType || 'all');
    setPage(1);
    setForm(freshForm(defaultType));
  }, [defaultType]);

  const load = (currentPage = page, currentFilter = typeFilter) => {
    setLoading(true);
    const params: Record<string, string> = { page: String(currentPage), per_page: String(perPage) };
    if (currentFilter !== 'all') params.type = currentFilter;
    api.transactions.list(params)
      .then(res => { setTransactions(res.items); setTotal(res.total); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(page, typeFilter); }, [page, typeFilter]);

  const openAdd = () => {
    setEditingId(null);
    setForm(freshForm(defaultType));
    setError('');
    setShowModal(true);
  };

  const openEdit = (t: Transaction) => {
    setEditingId(t.id);
    setForm({
      description: t.description,
      amount: String(t.amount),
      type: t.type,
      category_id: '',
      transaction_date: (t.transaction_date || t.date || '').split('T')[0],
      notes: t.notes || '',
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.description || !form.amount) { setError('Please fill description and amount'); return; }
    setSaving(true); setError('');
    try {
      if (editingId) {
        const selectedCat2 = CATEGORIES.find(c => c.id === form.category_id);
        await api.transactions.update(editingId, {
          description: form.description,
          amount: parseFloat(form.amount),
          transaction_date: new Date(form.transaction_date).toISOString(),
          notes: form.notes ? form.notes : undefined,
          merchant_name: selectedCat2 ? selectedCat2.name : undefined,
        });
      } else {
        await api.transactions.create({
          description: form.description,
          amount: parseFloat(form.amount),
          type: form.type as 'income' | 'expense',
          transaction_date: new Date(form.transaction_date).toISOString(),
          notes: form.notes || undefined,
          currency: 'USD',
        });
      }
      setShowModal(false);
      setEditingId(null);
      setForm(freshForm(defaultType));
      load(page, typeFilter);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const pages = Math.ceil(total / perPage);
  const inp = {
    width: '100%', padding: '9px 12px', border: '1px solid var(--border)',
    borderRadius: 8, background: 'var(--cream)', fontSize: 13, outline: 'none',
    color: 'var(--text-primary)', boxSizing: 'border-box' as const,
  };

  return (
    <div>
      {/* Navbar */}
      <div style={{ background: 'var(--warm-white)', borderBottom: '1px solid var(--border)', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontWeight: 600 }}>{title}</span>
          {!defaultType && (
            <div style={{ display: 'flex', gap: 4 }}>
              {['all', 'income', 'expense'].map(t => (
                <button key={t} onClick={() => { setTypeFilter(t); setPage(1); }}
                  style={{ padding: '5px 12px', borderRadius: 6, border: 'none', background: typeFilter === t ? 'var(--sage)' : 'transparent', color: typeFilter === t ? 'white' : 'var(--text-secondary)', fontSize: 12, fontWeight: typeFilter === t ? 500 : 400, cursor: 'pointer', textTransform: 'capitalize' }}>
                  {t === 'all' ? 'All' : t === 'income' ? 'Income' : 'Expenses'}
                </button>
              ))}
            </div>
          )}
        </div>
        <button onClick={openAdd}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'var(--sage)', border: 'none', borderRadius: 8, fontSize: 13, color: 'white', fontWeight: 500, cursor: 'pointer' }}>
          <Plus size={14} /> New Entry
        </button>
      </div>

      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 500 }}>Recent Activity</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>{title} — {total} records total</p>
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', background: 'var(--warm-white)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <Download size={14} /> Export Statement
          </button>
        </div>

        {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#dc2626' }}>{error}</div>}

        <div style={{ background: 'var(--warm-white)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 130px 110px 40px', gap: 16, padding: '12px 24px', fontSize: 11, color: 'var(--text-muted)', letterSpacing: '0.08em', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>
            <span>Date</span><span>Description</span><span>Category</span><span style={{ textAlign: 'right' }}>Amount</span><span></span>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Loading…</div>
          ) : transactions.length === 0 ? (
            <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>💳</div>
              <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 8 }}>No {title.toLowerCase()} yet</div>
              <div style={{ fontSize: 13, marginBottom: 16 }}>Click "New Entry" to add your first one.</div>
              <button onClick={openAdd} style={{ padding: '9px 20px', background: 'var(--sage)', border: 'none', borderRadius: 8, color: 'white', fontSize: 13, cursor: 'pointer' }}>
                + New Entry
              </button>
            </div>
          ) : transactions.map(t => (
            <div key={t.id}
              style={{ display: 'grid', gridTemplateColumns: '120px 1fr 130px 110px 40px', gap: 16, padding: '18px 24px', borderBottom: '1px solid var(--border-light)', alignItems: 'center' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--cream)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {new Date(t.transaction_date || t.date).toLocaleDateString()}
              </span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{t.description}</div>
                {t.notes && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{t.notes}</div>}
              </div>
              <span style={{ background: catColors[t.category?.name || ''] || 'var(--cream)', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>
                {t.category?.name || t.merchant_name || '—'}
              </span>
              <span style={{ textAlign: 'right', fontWeight: 600, fontSize: 14, color: t.type === 'income' ? 'var(--success)' : 'var(--red)' }}>
                {t.type === 'income' ? '+' : '-'}₹{Math.abs(t.amount).toFixed(2)}
              </span>
              <button onClick={() => openEdit(t)}
                style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '5px 7px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Edit">
                <Pencil size={13} />
              </button>
            </div>
          ))}

          {total > perPage && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' }}>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} of {total}</span>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: Math.min(pages, 5) }, (_, i) => i + 1).map(n => (
                  <button key={n} onClick={() => setPage(n)}
                    style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: page === n ? 'var(--sage)' : 'none', color: page === n ? 'white' : 'var(--text-primary)', fontSize: 13, cursor: 'pointer' }}>
                    {n}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages}
                  style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 32, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 600 }}>
                {editingId ? 'Edit Entry' : `New ${defaultType ? (defaultType === 'income' ? 'Income' : 'Expense') : 'Transaction'}`}
              </h2>
              <button onClick={() => { setShowModal(false); setEditingId(null); setError(''); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#dc2626' }}>{error}</div>}

            {/* Type toggle — only for new entries on /transactions page */}
            {!editingId && !defaultType && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                {['expense', 'income'].map(t => (
                  <button key={t} onClick={() => setForm(f => ({ ...f, type: t, category_id: '' }))}
                    style={{ flex: 1, padding: '9px', borderRadius: 8, border: '1px solid var(--border)', background: form.type === t ? (t === 'income' ? 'var(--sage)' : '#dc2626') : 'var(--cream)', color: form.type === t ? 'white' : 'var(--text-secondary)', fontSize: 13, fontWeight: 500, cursor: 'pointer', textTransform: 'capitalize' }}>
                    {t}
                  </button>
                ))}
              </div>
            )}

            {/* Locked type badge */}
            {(defaultType || editingId) && (
              <div style={{ marginBottom: 20, padding: '8px 14px', background: form.type === 'income' ? '#d8f0e8' : '#fef2f2', borderRadius: 8, fontSize: 13, fontWeight: 500, color: form.type === 'income' ? '#2d6a4f' : '#dc2626', display: 'inline-block' }}>
                {form.type === 'income' ? '↑ Income Entry' : '↓ Expense Entry'}
              </div>
            )}

            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Description *</label>
            <input style={{ ...inp, marginBottom: 16 }} placeholder="e.g. Monthly salary" value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Amount *</label>
                <input style={inp} placeholder="0.00" type="number" min="0" step="0.01" value={form.amount}
                  onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Date *</label>
                <input style={inp} type="date" value={form.transaction_date}
                  onChange={e => setForm(f => ({ ...f, transaction_date: e.target.value }))} />
              </div>
            </div>

            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Category (optional)</label>
            <select style={{ ...inp, marginBottom: 16 }} value={form.category_id}
              onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}>
              <option value="">Select category…</option>
              {CATEGORIES.filter(c => c.type === form.type).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Notes (optional)</label>
            <input style={{ ...inp, marginBottom: 24 }} placeholder="Any additional notes…" value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => { setShowModal(false); setEditingId(null); setError(''); }}
                style={{ flex: 1, padding: '11px', background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                style={{ flex: 1, padding: '11px', background: saving ? '#9ab89d' : 'var(--sage)', border: 'none', borderRadius: 8, fontSize: 14, color: 'white', fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Transaction'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}