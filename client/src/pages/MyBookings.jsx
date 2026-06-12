import { useEffect, useMemo, useState } from 'react';
import { Card, Tabs, Empty, Spin, Drawer, Descriptions, Button, Switch, Space, Typography, App } from 'antd';
import dayjs from 'dayjs';
import api from '../api/axios';
import BookingCard from '../components/BookingCard';
import StatusBadge from '../components/StatusBadge';
import { useLang } from '../i18n';

const FILTERS = {
  all: () => true,
  upcoming: (b) => b.booking_date.slice(0, 10) >= dayjs().format('YYYY-MM-DD') && ['pending', 'approved'].includes(b.status),
  past: (b) => b.booking_date.slice(0, 10) < dayjs().format('YYYY-MM-DD') || b.status === 'completed',
  cancelled: (b) => ['cancelled', 'rejected'].includes(b.status),
};

export default function MyBookings() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('upcoming');
  const [groupByDay, setGroupByDay] = useState(false);
  const [detail, setDetail] = useState(null);
  const { message } = App.useApp();
  const { t } = useLang();

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/bookings', { params: { limit: 100 } });
      setData(res.data.data);
    } catch {
      message.error(t('my.loadErr'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const cancel = async (id) => {
    try {
      await api.patch(`/bookings/${id}/status`, { status: 'cancelled' });
      message.success(t('my.cancelled'));
      setDetail(null);
      load();
    } catch {
      message.error(t('my.cancelErr'));
    }
  };

  const filtered = useMemo(() => data.filter(FILTERS[tab]), [data, tab]);

  return (
    <Card
      title={t('my.title')}
      extra={
        <Space>
          <span style={{ fontSize: 12, color: '#666' }}>{t('my.groupByDay')}</span>
          <Switch size="small" checked={groupByDay} onChange={setGroupByDay} />
          <Button onClick={load}>{t('common.refresh')}</Button>
        </Space>
      }
      styles={{ body: { padding: 12 } }}
    >
      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          { key: 'all', label: t('my.tabAll') },
          { key: 'upcoming', label: t('my.tabUpcoming') },
          { key: 'past', label: t('my.tabPast') },
          { key: 'cancelled', label: t('my.tabCancelled') },
        ]}
      />
      {loading ? (
        <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>
      ) : filtered.length === 0 ? (
        <Empty description={t('my.none')} />
      ) : groupByDay ? (
        Object.entries(
          filtered.reduce((acc, b) => { (acc[b.booking_date.slice(0, 10)] ||= []).push(b); return acc; }, {}),
        )
          .sort((a, b) => (a[0] < b[0] ? 1 : -1))
          .map(([day, list]) => (
            <div key={day}>
              <Typography.Text strong style={{ display: 'block', margin: '8px 0 4px' }}>{day}</Typography.Text>
              {list.map((b) => <BookingCard key={b.booking_id} booking={b} onCancel={cancel} onClick={() => setDetail(b)} />)}
            </div>
          ))
      ) : (
        filtered.map((b) => (
          <BookingCard key={b.booking_id} booking={b} onCancel={cancel} onClick={() => setDetail(b)} />
        ))
      )}

      <Drawer title={detail?.code} open={!!detail} onClose={() => setDetail(null)} width={360}>
        {detail && (
          <>
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label={t('f.status')}><StatusBadge status={detail.status} /></Descriptions.Item>
              <Descriptions.Item label={t('f.date')}>{detail.booking_date?.slice(0, 10)}</Descriptions.Item>
              <Descriptions.Item label={t('f.slot')}>{detail.slot_start}–{detail.slot_end}</Descriptions.Item>
              <Descriptions.Item label={t('f.vehicle')}>{detail.vehicle_name}</Descriptions.Item>
              <Descriptions.Item label={t('f.destination')}>{detail.destination}</Descriptions.Item>
              <Descriptions.Item label={t('f.purpose')}>{detail.purpose || '—'}</Descriptions.Item>
              <Descriptions.Item label={t('f.passengers')}>{detail.passenger_count}</Descriptions.Item>
              <Descriptions.Item label={t('f.phone')}>{detail.contact_number || '—'}</Descriptions.Item>
            </Descriptions>
            {detail.status === 'pending' && (
              <Button danger block style={{ marginTop: 16 }} onClick={() => cancel(detail.booking_id)}>
                {t('my.cancelBooking')}
              </Button>
            )}
          </>
        )}
      </Drawer>
    </Card>
  );
}
