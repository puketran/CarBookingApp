import { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Space, Modal, Form, Input, InputNumber, Select, Popconfirm, App } from 'antd';
import api from '../api/axios';
import { useLang } from '../i18n';
import SlotsModal from '../components/SlotsModal';

const STATUS_COLOR = { active: 'green', maintenance: 'orange', inactive: 'default' };
const IMAGES = ['/vehicles/sedan.svg', '/vehicles/suv.svg', '/vehicles/van.svg'];

export default function AdminVehicles() {
  const [data, setData] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null); // vehicle | {} (new) | null
  const [slotsFor, setSlotsFor] = useState(null); // driver whose slots are open
  const { message } = App.useApp();
  const { t } = useLang();
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const [v, u] = await Promise.all([api.get('/vehicles'), api.get('/admin/users')]);
      setData(v.data);
      setDrivers(u.data.filter((x) => x.role === 'driver'));
    } catch {
      message.error(t('admin.vehiclesLoadErr'));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openEdit = (v) => { setEditing(v || {}); setTimeout(() => form.setFieldsValue(v || { status: 'active', transmission: 'auto', capacity: 4 }), 0); };

  const save = async (vals) => {
    try {
      if (editing.vehicle_id) await api.put(`/vehicles/${editing.vehicle_id}`, vals);
      else await api.post('/vehicles', vals);
      message.success(t('admin.saved'));
      setEditing(null);
      load();
    } catch {
      message.error(t('admin.vehicleSaveErr'));
    }
  };

  const deactivate = async (id) => {
    try { await api.delete(`/vehicles/${id}`); message.success(t('admin.vehicleDeactivated')); load(); }
    catch { message.error(t('admin.vehicleDeactivateErr')); }
  };

  const columns = [
    { title: t('profile.name'), dataIndex: 'vehicle_name' },
    { title: t('admin.colPlate'), dataIndex: 'license_plate' },
    { title: t('admin.colSeats'), dataIndex: 'capacity', width: 64 },
    { title: t('admin.colTransmission'), dataIndex: 'transmission', width: 80 },
    { title: t('admin.colParking'), dataIndex: 'parking_location' },
    { title: t('admin.colDriver'), dataIndex: 'driver_account', render: (d) => d || '—' },
    { title: t('f.status'), dataIndex: 'status', render: (s) => <Tag color={STATUS_COLOR[s]}>{t(`status.${s}`)}</Tag> },
    {
      title: '',
      render: (_, v) => (
        <Space>
          <Button size="small" onClick={() => openEdit(v)}>{t('admin.edit')}</Button>
          {v.driver_user_id && <Button size="small" onClick={() => setSlotsFor({ user_id: v.driver_user_id, name: v.driver_account })}>{t('admin.slots')}</Button>}
          {v.status !== 'inactive' && (
            <Popconfirm title={t('admin.deactivateConfirm')} onConfirm={() => deactivate(v.vehicle_id)}>
              <Button size="small" danger>{t('admin.deactivate')}</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card title={t('nav.vehicles')} extra={<Space><Button onClick={load}>{t('common.refresh')}</Button><Button type="primary" onClick={() => openEdit(null)}>{t('admin.addVehicle')}</Button></Space>}>
      <Table rowKey="vehicle_id" columns={columns} dataSource={data} loading={loading} pagination={false} scroll={{ x: 'max-content' }} />

      <Modal title={editing?.vehicle_id ? t('admin.editVehicle') : t('admin.addVehicle')} open={!!editing} onCancel={() => setEditing(null)} onOk={() => form.submit()} okText={t('common.save')}>
        <Form layout="vertical" form={form} onFinish={save}>
          <Form.Item name="vehicle_name" label={t('profile.name')} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="license_plate" label={t('admin.colPlate')}><Input /></Form.Item>
          <Form.Item name="capacity" label={t('book.passengers')} rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="transmission" label={t('admin.colTransmission')}><Select options={[{ value: 'auto' }, { value: 'manual' }]} /></Form.Item>
          <Form.Item name="parking_location" label={t('admin.colParking')}><Input /></Form.Item>
          <Form.Item name="driver_user_id" label={t('admin.driverAccount')}><Select allowClear options={drivers.map((d) => ({ value: d.user_id, label: `${d.name} (${d.email})` }))} /></Form.Item>
          <Form.Item name="image_url" label={t('admin.image')}><Select allowClear options={IMAGES.map((i) => ({ value: i, label: i.split('/').pop() }))} /></Form.Item>
          <Form.Item name="status" label={t('f.status')}><Select options={['active', 'maintenance', 'inactive'].map((s) => ({ value: s, label: t(`status.${s}`) }))} /></Form.Item>
          <Form.Item name="notes" label={t('admin.notes')}><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>

      <SlotsModal driver={slotsFor} onClose={() => setSlotsFor(null)} />
    </Card>
  );
}
