import { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Popconfirm, App } from 'antd';
import api from '../api/axios';

const STATUS_COLOR = {
  pending: 'gold',
  approved: 'green',
  rejected: 'red',
  completed: 'blue',
  cancelled: 'default',
};

export default function MyBookings() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    load();
  }, []);

  const cancel = async (id) => {
    try {
      await api.patch(`/bookings/${id}/status`, { status: 'cancelled' });
      message.success('Booking cancelled.');
      load();
    } catch {
      message.error('Could not cancel (only pending bookings can be cancelled).');
    }
  };

  const columns = [
    { title: 'Date', dataIndex: 'booking_date', render: (d) => d?.slice(0, 10) },
    { title: 'Slot', render: (_, r) => `${r.slot_start}–${r.slot_end}` },
    { title: 'Vehicle', dataIndex: 'vehicle_name' },
    { title: 'Destination', dataIndex: 'destination' },
    { title: 'Pax', dataIndex: 'passenger_count', width: 60 },
    { title: 'Status', dataIndex: 'status', render: (s) => <Tag color={STATUS_COLOR[s]}>{s}</Tag> },
    {
      title: '',
      render: (_, r) =>
        r.status === 'pending' ? (
          <Popconfirm title="Cancel this booking?" onConfirm={() => cancel(r.booking_id)}>
            <Button danger size="small">Cancel</Button>
          </Popconfirm>
        ) : null,
    },
  ];

  return (
    <Card title="My Bookings" extra={<Button onClick={load}>Refresh</Button>}>
      <Table rowKey="booking_id" columns={columns} dataSource={data} loading={loading} pagination={false} />
    </Card>
  );
}
