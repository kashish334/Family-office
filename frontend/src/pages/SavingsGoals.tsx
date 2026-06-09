import { useEffect, useState } from 'react';
import Navbar from '../components/ui/Navbar';
import { api, SavingsGoal } from '../services/api';
import { Plus, X, Target, Pencil } from 'lucide-react';

const freshForm = () => ({ name: '', description: '', target_amount: '', current_amount: '', target_date: '', priority: 'medium' });

export default function SavingsGoals() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showContributeModal, setShowContributeModal] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState('');
  const [form, setForm] = useState(freshForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    api.savings.list()
      .then(setGoals)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditingId(null);
    setForm(freshForm());
    setError('');
    setShowModal(true);
  };

  const openEdit = (goal: SavingsGoal) => {
    setEditingId(goal.id);
    setForm({
      name: goal.name,
      description: goal.description || '',
      target_amount: String(goal.target_amount),
      current_amount: String(goal.current_amount),
      target_date: goal.target_date ? goal.target_date.split('T')[0] : '',
      priority: goal.priority,
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.target_amount) { setError('Name and target amount are required'); return; }
    setSaving(true); setError('');
    try {
      if (editingId) {
        await api.savings.update(editingId, {
          name: form.name,
          description: form.description,
          target_amount: parseFloat(form.target_amount),
          target_date: form.target_date || undefined,
          priority: form.priority,
        });
      } else {
        await api.savings.create({
          name: form.name,
          description: form.description,
          target_amount: parseFloat(form.target_amount),
          current_amount: parseFloat(form.current_amount || '0'),
          target_date: form.target_date || undefined,
          priority: form.priority,
        });
      }
      setShowModal(false);
      setEditingId(null);
      setForm(freshForm());
      load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const handleContribute = async (id: string) => {
    if (!contributeAmount) return;
    setSaving(true);
    try {
      await api.savings.contribute(id, parseFloat(contributeAmount));
      setShowContributeModal(null);
      setContributeAmount('');
      load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  const inp = { width: '100%', padding: '9px 12px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--cream)', fontSize: 13, outline: 'none', color: 'var(--text-primary)', boxSizing: 'border-box' as const };
  const priorityColor = (p: string) => p === 'high' ? '#dc2626' : p === 'medium' ? 'var(--gold)' : 'var(--sage)';

  return (
    <div>
      <Navbar title="Savings Goals" />
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 500 }}>Savings Goals</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Track your financial milestones</p>
          </div>
          <button onClick={openAdd} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 16px', background: 'var(--sage)', border: 'none', borderRadius: 8, fontSize: 13, color: 'white', fontWeight: 500, cursor: 'pointer' }}>
            <Plus size={14} /> New Goal
          </button>
        </div>

        {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#dc2626' }}>{error}</div>}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading goals…</div>
        ) : goals.length === 0 ? (
          <div style={{ background: 'var(--warm-white)', borderRadius: 16, padding: 60, textAlign: 'center' }}>
            <Target size={40} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
            <div style={{ fontSize: 18, fontWeight: 500, marginBottom: 8 }}>No savings goals yet</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24 }}>Create your first goal to start tracking your progress.</div>
            <button onClick={openAdd} style={{ padding: '10px 20px', background: 'var(--sage)', border: 'none', borderRadius: 8, color: 'white', fontSize: 14, cursor: 'pointer' }}>
              Create First Goal
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {goals.map(goal => {
              const pct = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
              return (
                <div key={goal.id} style={{ background: 'var(--warm-white)', borderRadius: 16, padding: 24 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{goal.name}</div>
                      {goal.description && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{goal.description}</div>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: `${priorityColor(goal.priority)}20`, color: priorityColor(goal.priority), fontWeight: 500, textTransform: 'capitalize' }}>
                        {goal.priority}
                      </span>
                      <button onClick={() => openEdit(goal)}
                        style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 6px', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                        title="Edit goal">
                        <Pencil size={12} />
                      </button>
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Progress</span>
                      <span style={{ fontWeight: 600 }}>{pct.toFixed(0)}%</span>
                    </div>
                    <div style={{ height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: pct >= 100 ? 'var(--success)' : 'var(--sage)', borderRadius: 4, transition: 'width 0.3s' }} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Saved</div>
                      <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 500 }}>₹{Number(goal.current_amount).toLocaleString('en-IN')}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Target</div>
                      <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 500 }}>₹{Number(goal.target_amount).toLocaleString('en-IN')}</div>
                    </div>
                  </div>

                  {goal.target_date && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
                      Target date: {new Date(goal.target_date).toLocaleDateString()}
                    </div>
                  )}

                  <button onClick={() => { setShowContributeModal(goal.id); setContributeAmount(''); }}
                    style={{ width: '100%', padding: '9px', background: pct >= 100 ? 'var(--cream)' : 'var(--sage)', border: 'none', borderRadius: 8, color: pct >= 100 ? 'var(--text-secondary)' : 'white', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                    {pct >= 100 ? '✓ Goal Reached!' : '+ Add Contribution'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Goal Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 32, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 600 }}>{editingId ? 'Edit Goal' : 'New Savings Goal'}</h2>
              <button onClick={() => { setShowModal(false); setEditingId(null); setError(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#dc2626' }}>{error}</div>}

            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Goal Name *</label>
            <input style={{ ...inp, marginBottom: 16 }} placeholder="e.g. Emergency Fund" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />

            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Description</label>
            <input style={{ ...inp, marginBottom: 16 }} placeholder="Optional description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Target Amount (₹) *</label>
                <input style={inp} placeholder="0.00" type="number" min="0" value={form.target_amount} onChange={e => setForm(f => ({ ...f, target_amount: e.target.value }))} />
              </div>
              {!editingId && (
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Initial Amount (₹)</label>
                  <input style={inp} placeholder="0.00" type="number" min="0" value={form.current_amount} onChange={e => setForm(f => ({ ...f, current_amount: e.target.value }))} />
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Target Date</label>
                <input style={inp} type="date" value={form.target_date} onChange={e => setForm(f => ({ ...f, target_date: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Priority</label>
                <select style={inp} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => { setShowModal(false); setEditingId(null); setError(''); }} style={{ flex: 1, padding: '11px', background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '11px', background: saving ? '#9ab89d' : 'var(--sage)', border: 'none', borderRadius: 8, fontSize: 14, color: 'white', fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer' }}>
                {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create Goal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contribute Modal */}
      {showContributeModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 32, width: '100%', maxWidth: 360, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 600 }}>Add Contribution</h2>
              <button onClick={() => setShowContributeModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>Amount (₹)</label>
            <input style={{ ...inp, marginBottom: 20 }} placeholder="0.00" type="number" min="0" step="0.01" value={contributeAmount} onChange={e => setContributeAmount(e.target.value)} />
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowContributeModal(null)} style={{ flex: 1, padding: '10px', background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => handleContribute(showContributeModal)} disabled={saving} style={{ flex: 1, padding: '10px', background: 'var(--sage)', border: 'none', borderRadius: 8, fontSize: 14, color: 'white', fontWeight: 500, cursor: 'pointer' }}>
                {saving ? 'Saving…' : 'Contribute'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}