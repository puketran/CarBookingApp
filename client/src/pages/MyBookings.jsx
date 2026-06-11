import { useEffect, useMemo, useState } from 'react';
import { Card, Tabs, Empty, Spin, Drawer, Descriptions, Button, Switch, Space, Typography, App } from 'antd';
import dayjs from 'dayjs';
import api from '../api/axios';
import BookingCard from '../components/BookingCard';
import StatusBadge from '../components/StatusBadge';

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

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/bookings', { params: { limit: 100 } });
      setData(res.data.data);
    } catch {
      message.error('Could not load your bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const cancel = async (id) => {
    try {
      await api.patch(`/bookings/${id}/status`, { status: 'cancelled' });
      message.success('Booking cancelled.');
      setDetail(null);
      load();
    } catch {
      message.error('Could not cancel (only pending bookings can be cancelled).');
    }
  };

  const filtered = useMemo(() => data.filter(FILTERS[tab]), [data, tab]);

  return (
    <Card
      title="My Bookings"
      extra={
        <Space>
          <span style={{ fontSize: 12, color: '#666' }}>Group by day</span>
          <Switch size="small" checked={groupByDay} onChange={setGroupByDay} />
          <Button onClick={load}>Refresh</Button>
        </Space>
      }
      styles={{ body: { padding: 12 } }}
    >
      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          { key: 'all', label: 'All' },
          { key: 'upcoming', label: 'Upcoming' },
          { key: 'past', label: 'Past' },
          { key: 'cancelled', label: 'Cancelled' },
        ]}
      />
      {loading ? (
        <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>
      ) : filtered.length === 0 ? (
        <Empty description="No bookings here" />
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
              <Descriptions.Item label="Status"><StatusBadge status={detail.status} /></Descriptions.Item>
              <Descriptions.Item label="Date">{detail.booking_date?.slice(0, 10)}</Descriptions.Item>
              <Descriptions.Item label="Slot">{detail.slot_start}–{detail.slot_end}</Descriptions.Item>
              <Descriptions.Item label="Vehicle">{detail.vehicle_name}</Descriptions.Item>
              <Descriptions.Item label="Destination">{detail.destination}</Descriptions.Item>
              <Descriptions.Item label="Purpose">{detail.purpose || '—'}</Descriptions.Item>
              <Descriptions.Item label="Passengers">{detail.passenger_count}</Descriptions.Item>
              <Descriptions.Item label="Contact">{detail.contact_number || '—'}</Descriptions.Item>
            </Descriptions>
            {detail.status === 'pending' && (
              <Button danger block style={{ marginTop: 16 }} onClick={() => cancel(detail.booking_id)}>
                Cancel booking
              </Button>
            )}
          </>
        )}
      </Drawer>
    </Card>
  );
}
