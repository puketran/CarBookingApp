import { useEffect, useState } from 'react';
import { Modal, Table, Button, Switch, Space, Popconfirm, TimePicker, Alert, App } from 'antd';
import dayjs from 'dayjs';
import api from '../api/axios';
import { useLang } from '../i18n';

const TIME_FMT = 'HH:mm';

// Per-driver time-slots editor. `driver` = { user_id, name, email }.
// Slots are keyed by driver_user_id on the backend (`/admin/users/:id/slots`),
// so this works whether opened from a user row or a vehicle's assigned driver.
export default function SlotsModal({ driver, onClose }) {
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [range, setRange] = useState([null, null]);
  const { message } = App.useApp();
  const { t } = useLang();
  const open = !!driver;

  const load = async () => {
    if (!driver) return;
    setLoading(true);
    try { setInfo((await api.get(`/admin/users/${driver.user_id}/slots`)).data); }
    catch { message.error(t('admin.slotsLoadErr')); }
    finally { setLoading(false); }
  };
  useEffect(() => { if (driver) { setRange([null, null]); load(); } }, [driver]); // eslint-disable-line react-hooks/exhaustive-deps

  const patchSlot = async (slotId, body) => {
    try { await api.patch(`/admin/slots/${slotId}`, body); load(); }
    catch (e) { message.error(e.response?.data?.message || t('admin.slotUpdateErr')); }
  };
  const removeSlot = async (slotId) => {
    try { await api.delete(`/admin/slots/${slotId}`); message.success(t('admin.slotRemoved')); load(); }
    catch { message.error(t('admin.slotRemoveErr')); }
  };
  const addSlot = async () => {
    const [s, e] = range;
    if (!s || !e) { message.warning(t('admin.slotPickTimes')); return; }
    try {
      await api.post(`/admin/users/${driver.user_id}/slots`, { slot_start: s.format(TIME_FMT), slot_end: e.format(TIME_FMT) });
      message.success(t('admin.slotAdded'));
      setRange([null, null]);
      load();
    } catch (err) { message.error(err.response?.data?.message || t('admin.slotAddErr')); }
  };

  const columns = [
    {
      title: t('admin.slotStart'), dataIndex: 'slot_start', width: 110,
      render: (v, r) => <TimePicker size="small" format={TIME_FMT} minuteStep={30} allowClear={false} value={dayjs(v, TIME_FMT)} onChange={(time) => time && patchSlot(r.slot_id, { slot_start: time.format(TIME_FMT) })} />,
    },
    {
      title: t('admin.slotEnd'), dataIndex: 'slot_end', width: 110,
      render: (v, r) => <TimePicker size="small" format={TIME_FMT} minuteStep={30} allowClear={false} value={dayjs(v, TIME_FMT)} onChange={(time) => time && patchSlot(r.slot_id, { slot_end: time.format(TIME_FMT) })} />,
    },
    {
      title: t('status.active'), dataIndex: 'is_active', width: 70,
      render: (a, r) => <Switch size="small" checked={!!a} onChange={(val) => patchSlot(r.slot_id, { is_active: val })} />,
    },
    {
      title: '', width: 50,
      render: (_, r) => <Popconfirm title={t('admin.slotRemoveConfirm')} onConfirm={() => removeSlot(r.slot_id)}><Button size="small" danger type="text">✕</Button></Popconfirm>,
    },
  ];

  return (
    <Modal title={`${t('admin.slotsTitle')} — ${driver?.name || driver?.email || ''}`} open={open} onCancel={onClose} footer={<Button onClick={onClose}>{t('admin.close')}</Button>}>
      {info?.using_defaults && (
        <Alert type="info" showIcon style={{ marginBottom: 12 }} message={t('admin.slotsUsingDefaults')} />
      )}
      <Table rowKey="slot_id" size="small" columns={columns} dataSource={info?.slots || []} loading={loading} pagination={false}
        locale={{ emptyText: t('admin.slotsEmpty') }} />
      <Space style={{ marginTop: 12 }}>
        <TimePicker format={TIME_FMT} minuteStep={30} placeholder={t('admin.slotStart')} value={range[0]} onChange={(time) => setRange([time, range[1]])} />
        <TimePicker format={TIME_FMT} minuteStep={30} placeholder={t('admin.slotEnd')} value={range[1]} onChange={(time) => setRange([range[0], time])} />
        <Button type="primary" onClick={addSlot}>{t('admin.slotAdd')}</Button>
      </Space>
    </Modal>
  );
}
