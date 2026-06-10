import { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Select, Space, App } from 'antd';
import api from '../api/axios';

const STATUS_COLOR = {
  pending: 'gold',
  approved: 'green',
  rejected: 'red',
  completed: 'blue',
  cancelled: 'default',
};
const STATUSES = ['pending', 'approved', 'rejected', 'completed', 'cancelled'];

export default function AdminBookings() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState();
  const { message } = App.useApp();

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/bookings', { params: { status, limit: 100 } });
      setData(res.data.data);
    } catch {
      message.error('Could not load bookings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const setBookingStatus = async (id, next) => {
    try {
      await api.patch(`/bookings/${id}/status`, { status: next });
      message.success(`Booking #${id} ${next}.`);
      load();
    } catch {
      message.error('Action not allowed for this booking.');
    }
  };

  const columns = [
    { title: 'Date', dataIndex: 'booking_date', render: (d) => d?.slice(0, 10) },
    { title: 'Slot', render: (_, r) => `${r.slot_start}–${r.slot_end}` },
    { title: 'Vehicle', dataIndex: 'vehicle_name' },
    { title: 'Employee', dataIndex: 'employee_name' },
    { title: 'Dept', dataIndex: 'department' },
    { title: 'Destination', dataIndex: 'destination' },
    { title: 'Status', dataIndex: 'status', render: (s) => <Tag color={STATUS_COLOR[s]}>{s}</Tag> },
    {
      title: 'Actions',
      render: (_, r) => (
        <Space>
          {r.status === 'pending' && (
            <>
              <Button type="primary" size="small" onClick={() => setBookingStatus(r.booking_id, 'approved')}>
                Approve
              </Button>
              <Button danger size="small" onClick={() => setBookingStatus(r.booking_id, 'rejected')}>
                Reject
              </Button>
            </>
          )}
          {r.status === 'approved' && (
            <Button size="small" onClick={() => setBookingStatus(r.booking_id, 'completed')}>
              Complete
            </Button>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="Manage Bookings"
      extra={
        <Space>
          <Select
            allowClear
            placeholder="Filter status"
            style={{ width: 160 }}
            value={status}
            onChange={setStatus}
            options={STATUSES.map((s) => ({ value: s, label: s }))}
          />
          <Button onClick={load}>Refresh</Button>
        </Space>
      }
    >
      <Table rowKey="booking_id" columns={columns} dataSource={data} loading={loading} pagination={{ pageSize: 20 }} />
    </Card>
  );
}
