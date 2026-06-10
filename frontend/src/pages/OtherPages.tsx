import Navbar from '../components/ui/Navbar';

const members = [
  { name: 'Julian Sterling', role: 'Primary Account Holder', initials: 'JS', color: '#5a7a5e', email: 'julian@sterling.com', since: 'Member since 2019' },
  { name: 'Clarissa Sterling', role: 'Spouse', initials: 'CS', color: '#c9a96e', email: 'clarissa@sterling.com', since: 'Member since 2019' },
  { name: 'Arthur Sterling', role: 'Dependent', initials: 'AS', color: '#9a9a90', email: 'arthur@sterling.com', since: 'Member since 2022' },
];

export function Members() {
  return (
    <div>
      <Navbar title="Family Members" />
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'DM Serif Display', fontSize: 32, fontWeight: 500 }}>Family Members</h1>
          <button style={{ padding: '10px 20px', background: 'var(--sage)', border: 'none', borderRadius: 8, color: 'white', fontSize: 13, fontWeight: 500 }}>+ Invite Member</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {members.map(m => (
            <div key={m.name} style={{ background: 'var(--warm-white)', borderRadius: 12, padding: 24, textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: m.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700, margin: '0 auto 16px' }}>{m.initials}</div>
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{m.name}</div>
              <div style={{ fontSize: 13, color: 'var(--sage)', marginBottom: 8 }}>{m.role}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>{m.email}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{m.since}</div>
              <button style={{ marginTop: 16, padding: '8px 20px', border: '1px solid var(--border)', borderRadius: 8, background: 'none', fontSize: 13, color: 'var(--text-secondary)', width: '100%' }}>Manage Permissions</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Bills() {
  const bills = [
    { date: 'OCT 28', name: 'Concierge Service', category: 'Lifestyle', amount: 250, status: 'Upcoming', overdue: false },
    { date: 'OCT 30', name: 'Insurance Premium', category: 'Insurance', amount: 1840, status: 'Overdue', overdue: true },
    { date: 'NOV 05', name: 'Yacht Club Dues', category: 'Membership', amount: 4500, status: 'Upcoming', overdue: false },
    { date: 'NOV 12', name: 'Property Management', category: 'Real Estate', amount: 2200, status: 'Upcoming', overdue: false },
    { date: 'NOV 15', name: 'School Tuition', category: 'Education', amount: 5800, status: 'Upcoming', overdue: false },
  ];
  return (
    <div>
      <Navbar title="Bills & Reminders" />
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <h1 style={{ fontFamily: 'DM Serif Display', fontSize: 32, fontWeight: 500 }}>Bills & Reminders</h1>
          <button style={{ padding: '10px 20px', background: 'var(--sage)', border: 'none', borderRadius: 8, color: 'white', fontSize: 13, fontWeight: 500 }}>+ Add Bill</button>
        </div>
        <div style={{ background: 'var(--warm-white)', borderRadius: 12, overflow: 'hidden' }}>
          {bills.map(b => (
            <div key={b.name} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 24px', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ background: b.overdue ? '#fef2f2' : 'var(--cream)', borderRadius: 8, padding: '8px 10px', textAlign: 'center', minWidth: 52 }}>
                <div style={{ fontSize: 9, color: b.overdue ? 'var(--red)' : 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', fontWeight: 700 }}>{b.date.split(' ')[0]}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: b.overdue ? 'var(--red)' : 'var(--text-primary)' }}>{b.date.split(' ')[1]}</div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 500, fontSize: 14 }}>{b.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{b.category}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 600, fontSize: 15 }}>${b.amount.toLocaleString()}.00</div>
                <span style={{ background: b.overdue ? '#fef2f2' : '#e8f0e9', color: b.overdue ? 'var(--red)' : 'var(--sage)', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 500 }}>{b.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Settings() {
  return (
    <div>
      <Navbar title="Settings" />
      <div style={{ padding: 24, maxWidth: 700 }}>
        <h1 style={{ fontFamily: 'DM Serif Display', fontSize: 32, fontWeight: 500, marginBottom: 24 }}>Account Settings</h1>
        {[
          { section: 'Profile', fields: [{ label: 'Full Name', value: 'Julian Sterling' }, { label: 'Email', value: 'julian@sterling.com' }, { label: 'Phone', value: '+1 (415) 555-0100' }] },
          { section: 'Security', fields: [{ label: 'Password', value: '••••••••••••' }, { label: 'Two-Factor Auth', value: 'Enabled' }] },
          { section: 'Notifications', fields: [{ label: 'Email Alerts', value: 'On' }, { label: 'Push Notifications', value: 'On' }, { label: 'Weekly Summary', value: 'On' }] },
        ].map(s => (
          <div key={s.section} style={{ background: 'var(--warm-white)', borderRadius: 12, padding: 24, marginBottom: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 16 }}>{s.section}</div>
            {s.fields.map(f => (
              <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
                <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{f.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 14, fontWeight: 500 }}>{f.value}</span>
                  <button style={{ border: 'none', background: 'none', color: 'var(--sage)', fontSize: 13, cursor: 'pointer' }}>Edit</button>
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function NotFound() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--cream)', textAlign: 'center' }}>
      <div style={{ fontFamily: 'DM Serif Display', fontSize: 80, fontWeight: 300, color: 'var(--sage)', lineHeight: 1 }}>404</div>
      <h2 style={{ fontFamily: 'DM Serif Display', fontSize: 28, fontWeight: 500, marginBottom: 12 }}>Page Not Found</h2>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>The page you're looking for doesn't exist.</p>
      <a href="/dashboard" style={{ padding: '12px 24px', background: 'var(--sage)', color: 'white', borderRadius: 8, fontSize: 14, fontWeight: 500 }}>Return to Dashboard</a>
    </div>
  );
}
