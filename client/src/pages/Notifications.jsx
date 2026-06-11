import { useEffect, useState } from 'react';
import { Card, List, Button, Tag, Empty, Spin, App } from 'antd';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { message } = App.useApp();

  const load = async () => {
    setLoading(true);
    try { setItems((await api.get('/notifications')).data.items); }
    catch { message.error('Could not load notifications.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const open = async (n) => {
    try { if (!n.is_read) await api.patch(`/notifications/${n.id}/read`); } catch { /* ignore */ }
    navigate(n.link || '/');
  };

  const readAll = async () => {
    try { await api.post('/notifications/read-all'); load(); } catch { message.error('Failed.'); }
  };

  return (
    <Card title="Notifications" extra={<Button onClick={readAll}>Mark all read</Button>} styles={{ body: { padding: 12 } }}>
      {loading ? (
        <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>
      ) : items.length === 0 ? (
        <Empty description="No notifications" />
      ) : (
        <List
          dataSource={items}
          renderItem={(n) => (
            <List.Item
              style={{ cursor: 'pointer', background: n.is_read ? '#fff' : '#f0f6ff', padding: 12, borderRadius: 6 }}
              onClick={() => open(n)}
            >
              <List.Item.Meta
                title={<span>{n.message} {!n.is_read && <Tag color="blue">new</Tag>}</span>}
                description={n.created_at?.slice(0, 16).replace('T', ' ')}
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  );
}
