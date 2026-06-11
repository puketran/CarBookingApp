import { Layout, Menu, Typography, Button } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FeedbackButton from '../components/FeedbackButton';
import NotificationBell from '../components/NotificationBell';

// Desktop console shell: dark sidebar + header. Sidebar collapses on small screens.
const ITEMS = [
  { key: '/admin/dashboard', label: 'Dashboard' },
  { key: '/admin', label: 'Bookings' },
  { key: '/admin/vehicles', label: 'Vehicles' },
  { key: '/admin/calendar', label: 'Calendar' },
  { key: '/admin/users', label: 'Users' },
  { key: '/admin/reports', label: 'Reports' },
  { key: '/admin/feedback', label: 'Feedback' },
  { key: '/admin/settings', label: 'Settings' },
];

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Sider breakpoint="lg" collapsedWidth="0">
        <div style={{ color: '#fff', fontWeight: 700, padding: 16 }}>🚗 Car Booking</div>
        <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]} items={ITEMS} onClick={(e) => navigate(e.key)} />
      </Layout.Sider>
      <Layout>
        <Layout.Header style={{ display: 'flex', alignItems: 'center', gap: 12, paddingInline: 16 }}>
          <div style={{ flex: 1 }} />
          <Typography.Text style={{ color: '#fff' }}>{user.name} ({user.role})</Typography.Text>
          <NotificationBell />
          <FeedbackButton />
          <Button size="small" onClick={() => { logout(); navigate('/login'); }}>Logout</Button>
        </Layout.Header>
        <Layout.Content style={{ padding: 24, maxWidth: 1200, width: '100%', margin: '0 auto' }}>{children}</Layout.Content>
      </Layout>
    </Layout>
  );
}
