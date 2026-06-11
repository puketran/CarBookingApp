import { useEffect, useState } from 'react';
import { Card, Button, Segmented, Space, Drawer, Spin, Tag, Empty, App } from 'antd';
import dayjs from 'dayjs';
import api from '../api/axios';
import StatusBadge from '../components/StatusBadge';

const LEGEND = [
  { label: 'Available', color: '#52c41a' },
  { label: 'Booked', color: '#1677ff' },
  { label: 'Full', color: '#722ed1' },
  { label: 'Maintenance', color: '#fa8c16' },
];

function cellStyle(bg) {
  return { background: bg, color: '#fff', borderRadius: 6, padding: '4px 6px', fontSize: 11, textAlign: 'center', cursor: 'pointer', minWidth: 64 };
}

export default function AdminCalendar() {
  const [month, setMonth] = useState(dayjs());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('Calendar');
  const [detail, setDetail] = useState(null); // {vehicle, date, bookings}
  const { message } = App.useApp();

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/calendar', { params: { month: month.format('YYYY-MM') } });
      setData(res.data);
    } catch {
      message.error('Could not load the calendar.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [month]);

  const openCell = async (vehicle, date) => {
    try {
      const res = await api.get('/bookings', { params: { vehicle_id: vehicle.vehicle_id, date, limit: 50 } });
      setDetail({ vehicle, date, bookings: res.data.data });
    } catch {
      message.error('Could not load that day.');
    }
  };

  const renderCell = (vehicle, date) => {
    if (vehicle.status === 'maintenance') return <div style={cellStyle('#fa8c16')}>Maint.</div>;
    const booked = vehicle.cells[date] || 0;
    const left = (data.slots_per_day || 5) - booked;
    if (booked === 0) return <div style={cellStyle('#52c41a')} onClick={() => openCell(vehicle, date)}>Available</div>;
    if (left <= 0) return <div style={cellStyle('#722ed1')} onClick={() => openCell(vehicle, date)}>Full</div>;
    return <div style={cellStyle('#1677ff')} onClick={() => openCell(vehicle, date)}>{booked} booked · {left} left</div>;
  };

  return (
    <Card
      title="Calendar"
      extra={
        <Space>
          <Button onClick={() => setMonth(month.subtract(1, 'month'))}>‹</Button>
          <b>{month.format('MMMM YYYY')}</b>
          <Button onClick={() => setMonth(month.add(1, 'month'))}>›</Button>
          <Segmented options={['Calendar', 'Timeline']} value={view} onChange={setView} />
        </Space>
      }
    >
      <Space style={{ marginBottom: 12 }} wrap>
        {LEGEND.map((l) => (
          <span key={l.label} style={{ fontSize: 12 }}>
            <span style={{ display: 'inline-block', width: 12, height: 12, background: l.color, borderRadius: 3, marginRight: 4, verticalAlign: 'middle' }} />
            {l.label}
          </span>
        ))}
      </Space>

      {view === 'Timeline' ? (
        <Empty description="Timeline view — coming soon" />
      ) : loading || !data ? (
        <div style={{ textAlign: 'center', padding: 32 }}><Spin /></div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'separate', borderSpacing: 4 }}>
            <thead>
              <tr>
                <th style={{ position: 'sticky', left: 0, background: '#fff', textAlign: 'left', padding: 4 }}>Vehicle</th>
                {data.days.map((d) => (
                  <th key={d} style={{ fontSize: 11, fontWeight: 500, color: '#888' }}>{d.slice(8)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.vehicles.map((v) => (
                <tr key={v.vehicle_id}>
                  <td style={{ position: 'sticky', left: 0, background: '#fff', whiteSpace: 'nowrap', padding: 4, fontSize: 13 }}>
                    {v.vehicle_name}
                  </td>
                  {data.days.map((d) => <td key={d}>{renderCell(v, d)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Drawer
        title={detail ? `${detail.vehicle.vehicle_name} · ${detail.date}` : ''}
        open={!!detail}
        onClose={() => setDetail(null)}
        width={380}
      >
        {detail?.bookings?.length ? (
          detail.bookings.map((b) => (
            <Card key={b.booking_id} size="small" style={{ marginBottom: 8 }}>
              <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                <span><b>{b.code}</b> · {b.slot_start}–{b.slot_end}</span>
                <StatusBadge status={b.status} />
              </Space>
              <div style={{ fontSize: 13, color: '#666' }}>{b.employee_name} → {b.destination}</div>
            </Card>
          ))
        ) : (
          <Empty description="No bookings" />
        )}
      </Drawer>
    </Card>
  );
}
