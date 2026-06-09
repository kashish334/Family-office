import { Outlet } from 'react-router-dom';
import Sidebar from '../components/ui/Sidebar';

export default function DashboardLayout() {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <main style={{
        marginLeft: 'var(--sidebar-w)',
        flex: 1,
        overflowY: 'auto',
        background: 'var(--cream)',
      }}>
        <Outlet />
      </main>
    </div>
  );
}
