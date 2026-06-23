// frontend/src/pages/Settings.tsx  (NEW FILE — replaces ComingSoon stub in App.tsx)
//
// Sections:
//  1. Profile      — edit full name + phone, saved to PATCH /auth/me
//  2. Security     — change password via POST /auth/change-password
//  3. Appearance   — dark / light mode toggle (ThemeContext already wired)
//  4. Family       — show current family ID, rename family
//  5. Data         — export transactions as CSV (client-side, no backend needed)
//  6. Account      — danger zone: sign out

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useThemeContext } from '../context/ThemeContext';
import { api, getFamilyId, FamilyMemberRow } from '../services/api';
import {
  User, Lock, Palette, Users, Download, LogOut,
  Check, X, Eye, EyeOff, ChevronRight, Moon, Sun,
  UserPlus, Trash2, Shield, Crown,
} from 'lucide-react';

// ── tiny helpers ──────────────────────────────────────────────────────────────
function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--warm-white)', borderRadius: 12, overflow: 'hidden', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderBottom: '1px solid var(--border)', background: 'var(--cream)' }}>
        <Icon size={15} color="var(--sage)" />
        <span style={{ fontWeight: 600, fontSize: 14 }}>{title}</span>
      </div>
      <div style={{ padding: '4px 0' }}>{children}</div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--border-light)' }}>
      <span style={{ fontSize: 13, color: 'var(--text-secondary)', minWidth: 140 }}>{label}</span>
      <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10 }}>{children}</div>
    </div>
  );
}

const inp = {
  padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8,
  background: 'var(--cream)', fontSize: 13, outline: 'none',
  color: 'var(--text-primary)', minWidth: 220,
};

function SaveBtn({ onClick, saving }: { onClick: () => void; saving: boolean }) {
  return (
    <button onClick={onClick} disabled={saving}
      style={{ padding: '7px 16px', background: saving ? '#9ab89d' : 'var(--sage)', border: 'none', borderRadius: 8, color: 'white', fontSize: 13, fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
      {saving ? 'Saving…' : <><Check size={13} /> Save</>}
    </button>
  );
}

function Toast({ msg, type }: { msg: string; type: 'success' | 'error' }) {
  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, background: type === 'success' ? 'var(--sage)' : 'var(--red)', color: 'white', padding: '12px 20px', borderRadius: 10, fontSize: 13, fontWeight: 500, zIndex: 9999, boxShadow: '0 4px 20px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: 8 }}>
      {type === 'success' ? <Check size={14} /> : <X size={14} />} {msg}
    </div>
  );
}

// ── Toggle switch ─────────────────────────────────────────────────────────────
function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} style={{ width: 44, height: 24, borderRadius: 12, border: 'none', background: on ? 'var(--sage)' : 'var(--border)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', padding: 0 }}>
      <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: on ? 23 : 3, transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
    </button>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function Settings() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useThemeContext();
  const navigate = useNavigate();

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── 1. Profile ─────────────────────────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({ full_name: user?.full_name || '', phone: '' });
  const [profileSaving, setProfileSaving] = useState(false);

  useEffect(() => {
    // Fetch fresh user data to get phone
    api.auth.me().then((me: any) => {
      setProfileForm({ full_name: me.full_name || '', phone: me.phone || '' });
    }).catch(() => {});
  }, []);

  const saveProfile = async () => {
    setProfileSaving(true);
    try {
      await api.auth.updateProfile({ full_name: profileForm.full_name, phone: profileForm.phone });
      showToast('Profile updated successfully');
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setProfileSaving(false);
    }
  };

  // ── 2. Change password ─────────────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  const savePassword = async () => {
    if (pwForm.newPw !== pwForm.confirm) { showToast('New passwords do not match', 'error'); return; }
    if (pwForm.newPw.length < 8) { showToast('Password must be at least 8 characters', 'error'); return; }
    setPwSaving(true);
    try {
      await api.auth.changePassword(pwForm.current, pwForm.newPw);
      showToast('Password changed successfully');
      setPwForm({ current: '', newPw: '', confirm: '' });
    } catch (e: any) {
      showToast(e.message || 'Current password is incorrect', 'error');
    } finally {
      setPwSaving(false);
    }
  };

  // ── 3. Family ──────────────────────────────────────────────────────────────
  const [familyName, setFamilyName] = useState('');
  const [familySaving, setFamilySaving] = useState(false);
  const familyId = getFamilyId();

  useEffect(() => {
    if (familyId) {
      api.families.get(familyId).then((f: any) => setFamilyName(f.name || '')).catch(() => {});
    }
  }, [familyId]);

  const saveFamily = async () => {
    if (!familyId) return;
    setFamilySaving(true);
    try {
      await api.families.update(familyId, { name: familyName });
      showToast('Family name updated');
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setFamilySaving(false);
    }
  };

  // ── 4. Members ─────────────────────────────────────────────────────────────
  const [members, setMembers] = useState<FamilyMemberRow[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'dependent' | 'advisor' | 'admin'>('member');
  const [inviting, setInviting] = useState(false);

  const isAdmin = (user?.role || '').toLowerCase() === 'admin' ||
    members.find(m => m.user_id === user?.id)?.role === 'admin';

  const loadMembers = async () => {
    if (!familyId) return;
    setMembersLoading(true);
    try {
      const list = await api.families.listMembers(familyId);
      setMembers(list);
    } catch (e: any) {
      // Non-admins may still be able to list members depending on backend rules;
      // fail quietly if not.
    } finally {
      setMembersLoading(false);
    }
  };

  useEffect(() => { loadMembers(); }, [familyId]);

  const sendInvite = async () => {
    if (!familyId) return;
    if (!inviteEmail.trim()) { showToast('Enter an email address', 'error'); return; }
    setInviting(true);
    try {
      await api.families.inviteMember({ email: inviteEmail.trim(), role: inviteRole }, familyId);
      showToast('Member added to family');
      setInviteEmail('');
      await loadMembers();
    } catch (e: any) {
      showToast(e.message || 'Could not add member', 'error');
    } finally {
      setInviting(false);
    }
  };

  const removeMember = async (userId: string) => {
    if (!familyId) return;
    try {
      await api.families.removeMember(userId, familyId);
      showToast('Member removed');
      await loadMembers();
    } catch (e: any) {
      showToast(e.message || 'Could not remove member', 'error');
    }
  };

  // ── 5. Export ──────────────────────────────────────────────────────────────
  const exportCSV = async () => {
    try {
      const res = await api.transactions.list({ page: '1', per_page: '1000' });
      const txs = res.items;
      const header = 'Date,Description,Type,Category,Amount,Notes\n';
      const rows = txs.map((t: any) =>
        [
          new Date(t.transaction_date || t.date).toLocaleDateString(),
          `"${t.description}"`,
          t.type,
          t.category?.name || '—',
          (t.type === 'income' ? '' : '-') + t.amount,
          `"${t.notes || ''}"`,
        ].join(',')
      ).join('\n');
      const blob = new Blob([header + rows], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `family-office-transactions-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Transactions exported as CSV');
    } catch (e: any) {
      showToast('Export failed: ' + e.message, 'error');
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Navbar */}
      <div style={{ background: 'var(--warm-white)', borderBottom: '1px solid var(--border)', padding: '0 24px', display: 'flex', alignItems: 'center', height: 56 }}>
        <span style={{ fontWeight: 600, fontSize: 15 }}>Settings</span>
      </div>

      <div style={{ padding: 24, maxWidth: 680 }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 32, fontWeight: 500 }}>Account Settings</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Manage your profile, security, and preferences</p>
        </div>

        {/* ── SECTION 1: Profile ── */}
        <Section icon={User} title="Profile">
          <Row label="Full Name">
            <input style={inp} value={profileForm.full_name}
              onChange={e => setProfileForm(f => ({ ...f, full_name: e.target.value }))} />
          </Row>
          <Row label="Email">
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{user?.email}</span>
            <span style={{ fontSize: 11, background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 20, padding: '2px 10px', color: 'var(--text-muted)' }}>Cannot change</span>
          </Row>
          <Row label="Phone">
            <input style={inp} placeholder="+91 98765 43210" value={profileForm.phone}
              onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} />
          </Row>
          <Row label="Role">
            <span style={{ fontSize: 13, background: 'var(--sage)', color: 'white', borderRadius: 20, padding: '3px 12px', fontWeight: 500, textTransform: 'capitalize' }}>{user?.role?.toLowerCase().replace('_', ' ') || 'member'}</span>
          </Row>
          <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'flex-end' }}>
            <SaveBtn onClick={saveProfile} saving={profileSaving} />
          </div>
        </Section>

        {/* ── SECTION 2: Security ── */}
        <Section icon={Lock} title="Security">
          <Row label="Current Password">
            <div style={{ position: 'relative' }}>
              <input style={{ ...inp, paddingRight: 36 }} type={showPw ? 'text' : 'password'}
                placeholder="Enter current password" value={pwForm.current}
                onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))} />
              <button onClick={() => setShowPw(v => !v)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </Row>
          <Row label="New Password">
            <input style={inp} type={showPw ? 'text' : 'password'}
              placeholder="Min. 8 characters" value={pwForm.newPw}
              onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))} />
          </Row>
          <Row label="Confirm Password">
            <input style={inp} type={showPw ? 'text' : 'password'}
              placeholder="Repeat new password" value={pwForm.confirm}
              onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} />
          </Row>
          <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'flex-end' }}>
            <SaveBtn onClick={savePassword} saving={pwSaving} />
          </div>
        </Section>

        {/* ── SECTION 3: Appearance ── */}
        <Section icon={Palette} title="Appearance">
          <Row label="Theme">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Sun size={14} color={theme === 'light' ? 'var(--gold)' : 'var(--text-muted)'} />
              <Toggle on={theme === 'dark'} onChange={toggleTheme} />
              <Moon size={14} color={theme === 'dark' ? 'var(--sage)' : 'var(--text-muted)'} />
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', marginLeft: 4 }}>
                {theme === 'dark' ? 'Dark mode' : 'Light mode'}
              </span>
            </div>
          </Row>
          <Row label="Currency">
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>₹ Indian Rupee (INR)</span>
            <span style={{ fontSize: 11, background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 20, padding: '2px 10px', color: 'var(--text-muted)' }}>Fixed</span>
          </Row>
          <Row label="Date Format">
            <span style={{ fontSize: 13 }}>{new Date().toLocaleDateString()}</span>
            <span style={{ fontSize: 11, background: 'var(--cream)', border: '1px solid var(--border)', borderRadius: 20, padding: '2px 10px', color: 'var(--text-muted)' }}>System default</span>
          </Row>
        </Section>

        {/* ── SECTION 4: Family ── */}
        <Section icon={Users} title="Family">
          <Row label="Family Name">
            <input style={inp} value={familyName}
              onChange={e => setFamilyName(e.target.value)} />
          </Row>
          <Row label="Family ID">
            <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'var(--text-muted)', background: 'var(--cream)', padding: '4px 10px', borderRadius: 6 }}>
              {familyId?.slice(0, 8)}…
            </span>
          </Row>
          <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'flex-end' }}>
            <SaveBtn onClick={saveFamily} saving={familySaving} />
          </div>
        </Section>

        {/* ── SECTION 4b: Family Members ── */}
        <Section icon={Users} title="Family Members">
          {isAdmin && (
            <Row label="Add Member">
              <input style={{ ...inp, minWidth: 200 }} placeholder="member@example.com" type="email"
                value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
              <select value={inviteRole} onChange={e => setInviteRole(e.target.value as any)}
                style={{ ...inp, minWidth: 110 }}>
                <option value="member">Member</option>
                <option value="dependent">Dependent</option>
                <option value="advisor">Advisor</option>
                <option value="admin">Admin</option>
              </select>
              <button onClick={sendInvite} disabled={inviting}
                style={{ padding: '7px 14px', background: inviting ? '#9ab89d' : 'var(--sage)', border: 'none', borderRadius: 8, color: 'white', fontSize: 13, fontWeight: 500, cursor: inviting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                <UserPlus size={13} /> {inviting ? 'Adding…' : 'Add'}
              </button>
            </Row>
          )}
          {!isAdmin && (
            <Row label="Add Member">
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Only family admins can add members.</span>
            </Row>
          )}
          <div style={{ padding: '12px 20px' }}>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
              The person must already have a Family Office account (have them register first), then add their email here. They'll see this family next time they log in.
            </p>
            {membersLoading ? (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Loading members…</span>
            ) : members.length === 0 ? (
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>No members found.</span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {members.map(m => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--cream)', borderRadius: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {m.role === 'admin' ? <Crown size={13} color="var(--gold)" /> : <Shield size={13} color="var(--text-muted)" />}
                      <span style={{ fontSize: 13 }}>{m.display_name || m.user_id.slice(0, 8) + '…'}</span>
                      <span style={{ fontSize: 11, background: 'white', border: '1px solid var(--border)', borderRadius: 20, padding: '2px 8px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{m.role}</span>
                    </div>
                    {isAdmin && m.user_id !== user?.id && (
                      <button onClick={() => removeMember(m.user_id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}>
                        <Trash2 size={13} /> Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Section>

        {/* ── SECTION 5: Data Export ── */}
        <Section icon={Download} title="Data & Export">
          <Row label="Export Transactions">
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Download all transactions as CSV</span>
            <button onClick={exportCSV}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'var(--warm-white)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <Download size={13} /> Export CSV
            </button>
          </Row>
          <Row label="Reports">
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>PDF and Excel reports</span>
            <button onClick={() => navigate('/reports')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'var(--warm-white)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 13, color: 'var(--text-secondary)', cursor: 'pointer' }}>
              Go to Reports <ChevronRight size={13} />
            </button>
          </Row>
        </Section>

        {/* ── SECTION 6: Danger Zone ── */}
        <Section icon={LogOut} title="Account">
          <Row label="Sign Out">
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Sign out of this device</span>
            <button onClick={() => { logout(); navigate('/login'); }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, fontSize: 13, color: 'var(--red)', fontWeight: 500, cursor: 'pointer' }}>
              <LogOut size={13} /> Sign Out
            </button>
          </Row>
        </Section>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </div>
  );
}