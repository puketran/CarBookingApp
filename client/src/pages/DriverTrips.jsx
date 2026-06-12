import { useEffect, useState } from 'react';
import { Card, Button, Space, Switch, Segmented, Empty, Spin, Tag, Drawer, Descriptions, Modal, Input, Typography, App } from 'antd';
import dayjs from 'dayjs';
import api from '../api/axios';
import StatusBadge from '../components/StatusBadge';
import { useLang } from '../i18n';

const today = () => dayjs().format('YYYY-MM-DD');
// Lower rank = higher priority (pending first, terminal states last).
const RANK = { pending: 0, approved: 1, completed: 2, no_show: 3, rejected: 4, cancelled: 5 };
const byPriority = (a, b) => (RANK[a.status] - RANK[b.status]) || a.booking_date.localeCompare(b.booking_date);

export default function DriverTrips() {
  const [trips, setTrips] = useState([]);
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [declineFor, setDeclineFor] = useState(null);
  const [reason, setReason] = useState('');
  const [filter, setFilter] = useState('pending'); // 'pending' (default) | 'all'
  const [grouped, setGrouped] = useState(false);
  const { message } = App.useApp();
  const { t } = useLang();

  const load = async () => {
    setLoading(true);
    try {
      const [tripsRes, vehRes] = await Promise.all([api.get('/driver/trips'), api.get('/driver/vehicles')]);
      setTrips(tripsRes.data);
      setVehicle(vehRes.data[0] || null);
    } catch {
      message.error(t('driver.loadErr'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const act = async (id, action, extra = {}) => {
    const verb = { confirm: t('driver.confirm'), decline: t('driver.deny'), complete: t('driver.markCompleted'), no_show: t('driver.noShow') }[action];
    try {
      await api.patch(`/driver/trips/${id}`, { action, ...extra });
      message.success(`${verb} ✓`);
      load();
    } catch (e) {
      message.error(e.response?.data?.message || t('driver.actionErr'));
    }
  };

  const sendDecline = async () => {
    await act(declineFor, 'decline', { reason });
    setDeclineFor(null);
    setReason('');
  };

  const toggleMaintenance = async (checked) => {
    try {
      await api.patch(`/driver/vehicles/${vehicle.vehicle_id}/status`, { status: checked ? 'maintenance' : 'active' });
      message.success(checked ? t('status.maintenance') : t('status.active'));
      load();
    } catch {
      message.error(t('driver.vehErr'));
    }
  };

  const renderTrip = (tr) => {
    const isToday = tr.booking_date === today();
    const canConfirm = (tr.status === 'pending' || tr.status === 'approved') && tr.driver_confirmed == null;
    const canRun = tr.status === 'approved' && tr.driver_confirmed === 1;
    return (
      <Card key={tr.booking_id} size="small" style={{ marginBottom: 10 }} styles={{ body: { padding: 12 } }} hoverable onClick={() => setDetail(tr)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div>
            <b>{tr.code}</b>
            <div style={{ color: '#666', fontSize: 13 }}>{tr.booking_date} · {tr.slot_start}–{tr.slot_end}</div>
            <div style={{ color: '#666', fontSize: 13 }}>{tr.destination} · {tr.passenger_count} {t('f.passengers')}</div>
            <div style={{ color: '#666', fontSize: 13 }}>{tr.employee_name}{tr.contact_number ? ` · 📞 ${tr.contact_number}` : ''}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <StatusBadge status={tr.status} />
            {tr.driver_confirmed === 1 && <Tag color="green" style={{ marginInlineEnd: 0 }}>{t('driver.confirmed')}</Tag>}
          </div>
        </div>

        {(canConfirm || canRun) && (
          <div onClick={(e) => e.stopPropagation()} style={{ marginTop: 10 }}>
            {canConfirm && (
              <Space size="middle" style={{ width: '100%' }}>
                <Button type="primary" size="large" block onClick={() => act(tr.booking_id, 'confirm')}>{t('driver.confirm')}</Button>
                <Button danger size="large" block onClick={() => { setDeclineFor(tr.booking_id); setReason(''); }}>{t('driver.deny')}</Button>
              </Space>
            )}
            {canRun && (
              <Space size="middle" style={{ width: '100%' }}>
                <Button size="large" block disabled={!isToday} onClick={() => act(tr.booking_id, 'complete')}>{t('driver.markCompleted')}</Button>
                <Button danger size="large" block disabled={!isToday} onClick={() => act(tr.booking_id, 'no_show')}>{t('driver.noShow')}</Button>
              </Space>
            )}
            {canRun && !isToday && <Typography.Text type="secondary" style={{ fontSize: 12 }}>{t('driver.availableOn', { date: tr.booking_date })}</Typography.Text>}
          </div>
        )}
      </Card>
    );
  };

  const visible = filter === 'pending' ? trips.filter((tr) => tr.status === 'pending') : trips;
  const todays = visible.filter((tr) => tr.booking_date === today()).sort(byPriority);
  const rest = visible.filter((tr) => tr.booking_date !== today()).sort(byPriority);
  const restGroups = Object.entries(
    rest.reduce((acc, tr) => { (acc[tr.booking_date] ||= []).push(tr); return acc; }, {}),
  ).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <>
      {vehicle && (
        <Card size="small" style={{ marginBottom: 12 }}>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <span><b>{vehicle.vehicle_name}</b> · {vehicle.parking_location || '—'} <Tag color={vehicle.status === 'active' ? 'green' : 'orange'}>{t(`status.${vehicle.status}`)}</Tag></span>
            <Space size={6}><span style={{ fontSize: 12, color: '#666' }}>{t('driver.maintenance')}</span><Switch checked={vehicle.status === 'maintenance'} onChange={toggleMaintenance} /></Space>
          </Space>
        </Card>
      )}

      <Card
        title={t('nav.myTrips')}
        extra={
          <Space wrap>
            <Segmented
              size="small"
              value={filter}
              onChange={setFilter}
              options={[{ label: t('driver.filterPending'), value: 'pending' }, { label: t('driver.filterAll'), value: 'all' }]}
            />
            <span style={{ fontSize: 12, color: '#666' }}>{t('driver.groupDay')}</span>
            <Switch size="small" checked={grouped} onChange={setGrouped} />
            <Button onClick={load}>{t('common.refresh')}</Button>
          </Space>
        }
        styles={{ body: { padding: 12 } }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>
        ) : visible.length === 0 ? (
          <Empty description={filter === 'pending' ? t('driver.noPending') : t('driver.noTrips')} />
        ) : (
          <>
            <Typography.Title level={5} style={{ margin: '4px 0 8px' }}>{t('driver.today')}</Typography.Title>
            {todays.length ? todays.map(renderTrip) : <Typography.Text type="secondary">{t('driver.noToday')}</Typography.Text>}
            {rest.length > 0 && (
              <>
                <Typography.Title level={5} style={{ margin: '16px 0 8px' }}>{t('driver.upcomingOther')}</Typography.Title>
                {grouped
                  ? restGroups.map(([day, list]) => (
                    <div key={day}>
                      <Typography.Text strong style={{ display: 'block', margin: '8px 0 4px' }}>{day}</Typography.Text>
                      {list.map(renderTrip)}
                    </div>
                  ))
                  : rest.map(renderTrip)}
              </>
            )}
          </>
        )}
      </Card>

      <Drawer title={detail?.code} open={!!detail} onClose={() => setDetail(null)} width={360}>
        {detail && (
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label={t('f.status')}><StatusBadge status={detail.status} /></Descriptions.Item>
            <Descriptions.Item label={t('f.date')}>{detail.booking_date}</Descriptions.Item>
            <Descriptions.Item label={t('f.slot')}>{detail.slot_start}–{detail.slot_end}</Descriptions.Item>
            <Descriptions.Item label={t('f.employee')}>{detail.employee_name}</Descriptions.Item>
            <Descriptions.Item label={t('f.phone')}>{detail.contact_number || '—'}</Descriptions.Item>
            <Descriptions.Item label={t('f.department')}>{detail.department || '—'}</Descriptions.Item>
            <Descriptions.Item label={t('f.destination')}>{detail.destination}</Descriptions.Item>
            <Descriptions.Item label={t('f.purpose')}>{detail.purpose || '—'}</Descriptions.Item>
            <Descriptions.Item label={t('f.passengers')}>{detail.passenger_count}</Descriptions.Item>
          </Descriptions>
        )}
      </Drawer>

      <Modal title={t('driver.denyTitle')} open={!!declineFor} onCancel={() => setDeclineFor(null)} onOk={sendDecline} okText={t('common.send')} cancelText={t('common.cancel')} okButtonProps={{ danger: true }}>
        <Typography.Paragraph type="secondary">{t('driver.denyHint')}</Typography.Paragraph>
        <Input.TextArea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t('driver.reasonPh')} maxLength={500} />
      </Modal>
    </>
  );
}
