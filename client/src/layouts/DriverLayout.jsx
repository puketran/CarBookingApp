import { Layout, Typography, Button } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../i18n';
import FeedbackButton from '../components/FeedbackButton';
import NotificationBell from '../components/NotificationBell';
import LanguageSelector from '../components/LanguageSelector';
import { useGuidelines } from '../components/GuidelinesModal';

// Driver shell — mobile-first, like the employee one but driver-specific tabs.
const TABS = [
  { key: '/driver', labelKey: 'nav.myTrips', icon: '🚐' },
  { key: '/profile', labelKey: 'nav.profile', icon: '👤' },
];

export default function DriverLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { t } = useLang();
  const { show: showGuidelines } = useGuidelines();

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#f5f7fb' }}>
      <Layout.Header style={{ display: 'flex', alignItems: 'center', gap: 8, paddingInline: 12 }}>
        <Typography.Text style={{ color: '#fff', fontWeight: 600, flex: 1 }}>{t('app.driver')}</Typography.Text>
        <LanguageSelector />
        <NotificationBell />
        <FeedbackButton />
        <Button size="small" title={t('guide.help')} onClick={showGuidelines}>?</Button>
        <Button size="small" onClick={() => { logout(); navigate('/login'); }}>{t('common.logout')}</Button>
      </Layout.Header>

      <div style={{ flex: 1, padding: 16, paddingBottom: 84 }}>{children}</div>

      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: 480, margin: '0 auto', background: '#fff', borderTop: '1px solid #eee', display: 'flex', boxShadow: '0 -1px 8px rgba(0,0,0,0.05)' }}>
        {TABS.map((tab) => {
          const active = location.pathname === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => navigate(tab.key)}
              style={{ flex: 1, border: 'none', background: 'none', padding: '10px 0', color: active ? '#1d4ed8' : '#8c8c8c', fontWeight: active ? 600 : 400, cursor: 'pointer' }}
            >
              <div style={{ fontSize: 18 }}>{tab.icon}</div>
              <div style={{ fontSize: 11 }}>{t(tab.labelKey)}</div>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
