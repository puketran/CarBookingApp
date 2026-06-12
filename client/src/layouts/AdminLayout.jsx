import { Layout, Menu, Typography, Button } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../i18n';
import FeedbackButton from '../components/FeedbackButton';
import NotificationBell from '../components/NotificationBell';
import LanguageSelector from '../components/LanguageSelector';

// Desktop console shell: dark sidebar + header. Sidebar collapses on small screens.
const ITEMS = [
  { key: '/admin/dashboard', labelKey: 'nav.dashboard' },
  { key: '/admin', labelKey: 'nav.bookings' },
  { key: '/admin/vehicles', labelKey: 'nav.vehicles' },
  { key: '/admin/calendar', labelKey: 'nav.calendar' },
  { key: '/admin/users', labelKey: 'nav.users' },
  { key: '/admin/reports', labelKey: 'nav.reports' },
  { key: '/admin/feedback', labelKey: 'nav.feedback' },
  { key: '/admin/settings', labelKey: 'nav.settings' },
];

export default function AdminLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { t } = useLang();
  const items = ITEMS.map((i) => ({ key: i.key, label: t(i.labelKey) }));

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Sider breakpoint="lg" collapsedWidth="0">
        <div style={{ color: '#fff', fontWeight: 700, padding: 16 }}>{t('app.carBooking')}</div>
        <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]} items={items} onClick={(e) => navigate(e.key)} />
      </Layout.Sider>
      <Layout>
        <Layout.Header style={{ display: 'flex', alignItems: 'center', gap: 12, paddingInline: 16 }}>
          <div style={{ flex: 1 }} />
          <LanguageSelector />
          <Typography.Text style={{ color: '#fff' }}>{user.name} ({user.role})</Typography.Text>
          <NotificationBell />
          <FeedbackButton />
          <Button size="small" onClick={() => { logout(); navigate('/login'); }}>{t('common.logout')}</Button>
        </Layout.Header>
        <Layout.Content style={{ padding: 24, maxWidth: 1200, width: '100%', margin: '0 auto' }}>{children}</Layout.Content>
      </Layout>
    </Layout>
  );
}
