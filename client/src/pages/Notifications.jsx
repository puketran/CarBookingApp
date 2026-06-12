import { useEffect, useState } from 'react';
import { Card, List, Button, Tag, Empty, Spin, App } from 'antd';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useLang } from '../i18n';

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useLang();
  const { message } = App.useApp();

  const load = async () => {
    setLoading(true);
    try { setItems((await api.get('/notifications')).data.items); }
    catch { message.error(t('notif.title')); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const open = async (n) => {
    try { if (!n.is_read) await api.patch(`/notifications/${n.id}/read`); } catch { /* ignore */ }
    navigate(n.link || '/');
  };

  const readAll = async () => {
    try { await api.post('/notifications/read-all'); load(); } catch { /* ignore */ }
  };

  return (
    <Card title={t('notif.title')} extra={<Button onClick={readAll}>{t('notif.markAllRead')}</Button>} styles={{ body: { padding: 12 } }}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>
      ) : items.length === 0 ? (
        <Empty description={t('notif.none')} />
      ) : (
        <List
          dataSource={items}
          renderItem={(n) => (
            <List.Item style={{ cursor: 'pointer', background: n.is_read ? '#fff' : '#f0f6ff', padding: 12, borderRadius: 6 }} onClick={() => open(n)}>
              <List.Item.Meta
                title={<span>{n.message} {!n.is_read && <Tag color="blue">{t('notif.new')}</Tag>}</span>}
                description={n.created_at?.slice(0, 16).replace('T', ' ')}
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  );
}
