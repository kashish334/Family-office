import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/ui/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import SavingsGoals from './pages/SavingsGoals';
import BudgetPlanning from './pages/BudgetPlanning';
import AIAdvisor from './pages/AIAdvisor';

function ComingSoon({ title }: { title: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-muted)' }}>
      <div style={{ fontSize: 40, marginBottom: 16 }}>🚧</div>
      <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 28, fontWeight: 500, marginBottom: 8, color: 'var(--text-primary)' }}>{title}</div>
      <div style={{ fontSize: 14 }}>This page is coming soon.</div>
    </div>
  );
}

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)' }}>
      Loading…
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--cream)' }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto' }}>{children}</main>
    </div>
  );
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/dashboard" /> : <Register />} />

      {/* Main pages */}
      <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
      <Route path="/transactions" element={<ProtectedLayout><Transactions key="all" /></ProtectedLayout>} />
      <Route path="/savings" element={<ProtectedLayout><SavingsGoals /></ProtectedLayout>} />
      <Route path="/budget" element={<ProtectedLayout><BudgetPlanning /></ProtectedLayout>} />
      <Route path="/ai" element={<ProtectedLayout><AIAdvisor /></ProtectedLayout>} />

      {/* Sidebar pages — income/expenses reuse Transactions with filter hint */}
      <Route path="/income" element={<ProtectedLayout><Transactions key="income" defaultType="income" /></ProtectedLayout>} />
      <Route path="/expenses" element={<ProtectedLayout><Transactions key="expense" defaultType="expense" /></ProtectedLayout>} />

      {/* Coming soon pages */}
      <Route path="/reports" element={<ProtectedLayout><ComingSoon title="Reports" /></ProtectedLayout>} />
      <Route path="/members" element={<ProtectedLayout><ComingSoon title="Members" /></ProtectedLayout>} />
      <Route path="/bills" element={<ProtectedLayout><ComingSoon title="Bills & Reminders" /></ProtectedLayout>} />
      <Route path="/settings" element={<ProtectedLayout><ComingSoon title="Settings" /></ProtectedLayout>} />

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}