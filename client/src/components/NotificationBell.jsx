import { useEffect, useState } from 'react';
import { Badge, Dropdown, Button, List, Empty } from 'antd';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useLang } from '../i18n';
import BookingDetailModal from './BookingDetailModal';

// A booking notification's link carries the booking id as ?focus=<id>.
function bookingIdFromLink(link) {
  const m = /[?&]focus=(\d+)/.exec(link || '');
  return m ? Number(m[1]) : null;
}

export default function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState([]);
  const [detailId, setDetailId] = useState(null);
  const navigate = useNavigate();
  const { t } = useLang();

  const pollCount = async () => {
    try { setUnread((await api.get('/notifications/unread-count')).data.unread); } catch { /* ignore */ }
  };

  useEffect(() => {
    pollCount();
    const t = setInterval(() => { if (!document.hidden) pollCount(); }, 30000);
    return () => clearInterval(t);
  }, []);

  const loadList = async (open) => {
    if (!open) return;
    try {
      const { data } = await api.get('/notifications');
      setItems(data.items);
      setUnread(data.unread);
    } catch { /* ignore */ }
  };

  const openItem = async (n) => {
    try { if (!n.is_read) await api.patch(`/notifications/${n.id}/read`); } catch { /* ignore */ }
    pollCount();
    // Booking notifications open an actionable detail popup in place; others navigate.
    const id = n.type?.startsWith('booking_') ? bookingIdFromLink(n.link) : null;
    if (id) setDetailId(id);
    else navigate(n.link || '/notifications');
  };

  const dropdownRender = () => (
    <div style={{ width: 320, background: '#fff', borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}>
      {items.length === 0 ? (
        <div style={{ padding: 16 }}><Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('notif.none')} /></div>
      ) : (
        <List
          size="small"
          style={{ maxHeight: 360, overflow: 'auto' }}
          dataSource={items.slice(0, 8)}
          renderItem={(n) => (
            <List.Item style={{ padding: '8px 12px', cursor: 'pointer', background: n.is_read ? '#fff' : '#f0f6ff' }} onClick={() => openItem(n)}>
              <div>
                <div style={{ fontSize: 13 }}>{n.message}</div>
                <div style={{ fontSize: 11, color: '#999' }}>{n.created_at?.slice(0, 16).replace('T', ' ')}</div>
              </div>
            </List.Item>
          )}
        />
      )}
      <div style={{ borderTop: '1px solid #f0f0f0', padding: 8, textAlign: 'center' }}>
        <Button type="link" size="small" onClick={() => navigate('/notifications')}>{t('notif.viewAll')}</Button>
      </div>
    </div>
  );

  return (
    <>
      <Dropdown trigger={['click']} onOpenChange={loadList} popupRender={dropdownRender}>
        <Badge count={unread} size="small">
          <Button ghost size="small">🔔</Button>
        </Badge>
      </Dropdown>
      <BookingDetailModal bookingId={detailId} onClose={() => setDetailId(null)} onChanged={pollCount} />
    </>
  );
}
