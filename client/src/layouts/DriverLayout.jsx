import { Layout, Typography, Button } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FeedbackButton from '../components/FeedbackButton';
import NotificationBell from '../components/NotificationBell';

// Driver shell — mobile-first, like the employee one but driver-specific tabs.
const TABS = [
  { key: '/driver', label: 'My Trips', icon: '🚐' },
  { key: '/profile', label: 'Profile', icon: '👤' },
];

export default function DriverLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f7fb' }}>
      <Layout.Header style={{ display: 'flex', alignItems: 'center', gap: 8, paddingInline: 16 }}>
        <Typography.Text style={{ color: '#fff', fontWeight: 600, flex: 1 }}>🚗 Driver</Typography.Text>
        <NotificationBell />
        <FeedbackButton />
        <Button size="small" onClick={() => { logout(); navigate('/login'); }}>Logout</Button>
      </Layout.Header>

      <div style={{ flex: 1, padding: 16, paddingBottom: 84 }}>{children}</div>

      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: 480, margin: '0 auto', background: '#fff', borderTop: '1px solid #eee', display: 'flex', boxShadow: '0 -1px 8px rgba(0,0,0,0.05)' }}>
        {TABS.map((t) => {
          const active = location.pathname === t.key;
          return (
            <button
              key={t.key}
              onClick={() => navigate(t.key)}
              style={{ flex: 1, border: 'none', background: 'none', padding: '10px 0', color: active ? '#1d4ed8' : '#8c8c8c', fontWeight: active ? 600 : 400, cursor: 'pointer' }}
            >
              <div style={{ fontSize: 18 }}>{t.icon}</div>
              <div style={{ fontSize: 11 }}>{t.label}</div>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
