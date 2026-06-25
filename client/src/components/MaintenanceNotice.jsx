import { useEffect, useState } from 'react';
import { Alert } from 'antd';
import api from '../api/axios';
import { useLang } from '../i18n';

// App-wide banner: vehicles a driver has put into maintenance, with their message.
// Shown to employees and admins so they know a car is unavailable when they open the app.
export default function MaintenanceNotice() {
  const [notices, setNotices] = useState([]);
  const { t } = useLang();

  useEffect(() => {
    (async () => {
      try { setNotices((await api.get('/maintenance-notices')).data); }
      catch { /* non-critical banner — stay silent on failure */ }
    })();
  }, []);

  if (!notices.length) return null;

  return (
    <Alert
      type="warning"
      showIcon
      style={{ marginBottom: 12 }}
      message={t('maint.bannerTitle')}
      description={
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {notices.map((n, i) => (
            <li key={i}><b>{n.vehicle_name}</b>: {n.maintenance_note}</li>
          ))}
        </ul>
      }
    />
  );
}
