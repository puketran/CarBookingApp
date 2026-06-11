import { useEffect, useState } from 'react';
import { Card, Button, Space, Switch, Empty, Spin, Tag, App } from 'antd';
import api from '../api/axios';
import StatusBadge from '../components/StatusBadge';

export default function DriverTrips() {
  const [trips, setTrips] = useState([]);
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();

  const load = async () => {
    setLoading(true);
    try {
      const [t, v] = await Promise.all([api.get('/driver/trips'), api.get('/driver/vehicles')]);
      setTrips(t.data);
      setVehicle(v.data[0] || null);
    } catch {
      message.error('Could not load your trips.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const act = async (id, action) => {
    try {
      await api.patch(`/driver/trips/${id}`, { action });
      message.success(`Trip ${action}ed.`);
      load();
    } catch {
      message.error('Action not allowed.');
    }
  };

  const toggleMaintenance = async (checked) => {
    try {
      await api.patch(`/driver/vehicles/${vehicle.vehicle_id}/status`, { status: checked ? 'maintenance' : 'active' });
      message.success(checked ? 'Vehicle set to maintenance.' : 'Vehicle active.');
      load();
    } catch {
      message.error('Could not update vehicle.');
    }
  };

  return (
    <>
      {vehicle && (
        <Card size="small" style={{ marginBottom: 12 }}>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <span>
              <b>{vehicle.vehicle_name}</b> · {vehicle.parking_location || '—'}{' '}
              <Tag color={vehicle.status === 'active' ? 'green' : 'orange'}>{vehicle.status}</Tag>
            </span>
            <Space size={6}>
              <span style={{ fontSize: 12, color: '#666' }}>Maintenance</span>
              <Switch checked={vehicle.status === 'maintenance'} onChange={toggleMaintenance} />
            </Space>
          </Space>
        </Card>
      )}

      <Card title="My Trips" extra={<Button onClick={load}>Refresh</Button>} styles={{ body: { padding: 12 } }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>
        ) : trips.length === 0 ? (
          <Empty description="No trips assigned" />
        ) : (
          trips.map((t) => (
            <Card key={t.booking_id} size="small" style={{ marginBottom: 10 }} styles={{ body: { padding: 12 } }}>
              <Space style={{ width: '100%', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <b>{t.code}</b>
                  <div style={{ color: '#666', fontSize: 13 }}>{t.booking_date} · {t.slot_start}–{t.slot_end}</div>
                  <div style={{ color: '#666', fontSize: 13 }}>{t.destination} · {t.passenger_count} pax · {t.employee_name}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <StatusBadge status={t.status} />
                  {t.driver_confirmed === 1 && <div><Tag color="green" style={{ marginTop: 4 }}>confirmed</Tag></div>}
                </div>
              </Space>
              {t.status === 'approved' && (
                <Space style={{ marginTop: 10 }}>
                  {t.driver_confirmed == null && (
                    <>
                      <Button type="primary" size="small" onClick={() => act(t.booking_id, 'confirm')}>Confirm</Button>
                      <Button danger size="small" onClick={() => act(t.booking_id, 'decline')}>Decline</Button>
                    </>
                  )}
                  <Button size="small" onClick={() => act(t.booking_id, 'complete')}>Mark completed</Button>
                  <Button size="small" danger onClick={() => act(t.booking_id, 'no_show')}>No-show</Button>
                </Space>
              )}
            </Card>
          ))
        )}
      </Card>
    </>
  );
}
