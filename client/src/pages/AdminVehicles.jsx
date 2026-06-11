import { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Space, Modal, Form, Input, InputNumber, Select, Popconfirm, App } from 'antd';
import api from '../api/axios';

const STATUS_COLOR = { active: 'green', maintenance: 'orange', inactive: 'default' };
const IMAGES = ['/vehicles/sedan.svg', '/vehicles/suv.svg', '/vehicles/van.svg'];

export default function AdminVehicles() {
  const [data, setData] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(null); // vehicle | {} (new) | null
  const { message } = App.useApp();
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const [v, u] = await Promise.all([api.get('/vehicles'), api.get('/admin/users')]);
      setData(v.data);
      setDrivers(u.data.filter((x) => x.role === 'driver'));
    } catch {
      message.error('Could not load vehicles.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const openEdit = (v) => { setEditing(v || {}); setTimeout(() => form.setFieldsValue(v || { status: 'active', transmission: 'auto', capacity: 4 }), 0); };

  const save = async (vals) => {
    try {
      if (editing.vehicle_id) await api.put(`/vehicles/${editing.vehicle_id}`, vals);
      else await api.post('/vehicles', vals);
      message.success('Saved.');
      setEditing(null);
      load();
    } catch {
      message.error('Could not save the vehicle.');
    }
  };

  const deactivate = async (id) => {
    try { await api.delete(`/vehicles/${id}`); message.success('Vehicle deactivated.'); load(); }
    catch { message.error('Could not deactivate.'); }
  };

  const columns = [
    { title: 'Name', dataIndex: 'vehicle_name' },
    { title: 'Plate', dataIndex: 'license_plate' },
    { title: 'Seats', dataIndex: 'capacity', width: 64 },
    { title: 'Trans.', dataIndex: 'transmission', width: 80 },
    { title: 'Parking', dataIndex: 'parking_location' },
    { title: 'Driver', dataIndex: 'driver_account', render: (d) => d || '—' },
    { title: 'Status', dataIndex: 'status', render: (s) => <Tag color={STATUS_COLOR[s]}>{s}</Tag> },
    {
      title: '',
      render: (_, v) => (
        <Space>
          <Button size="small" onClick={() => openEdit(v)}>Edit</Button>
          {v.status !== 'inactive' && (
            <Popconfirm title="Deactivate this vehicle?" onConfirm={() => deactivate(v.vehicle_id)}>
              <Button size="small" danger>Deactivate</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card title="Vehicles" extra={<Space><Button onClick={load}>Refresh</Button><Button type="primary" onClick={() => openEdit(null)}>Add vehicle</Button></Space>}>
      <Table rowKey="vehicle_id" columns={columns} dataSource={data} loading={loading} pagination={false} />

      <Modal title={editing?.vehicle_id ? 'Edit vehicle' : 'Add vehicle'} open={!!editing} onCancel={() => setEditing(null)} onOk={() => form.submit()} okText="Save">
        <Form layout="vertical" form={form} onFinish={save}>
          <Form.Item name="vehicle_name" label="Name" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="license_plate" label="License plate"><Input /></Form.Item>
          <Form.Item name="capacity" label="Capacity" rules={[{ required: true }]}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="transmission" label="Transmission"><Select options={[{ value: 'auto' }, { value: 'manual' }]} /></Form.Item>
          <Form.Item name="parking_location" label="Parking"><Input /></Form.Item>
          <Form.Item name="driver_user_id" label="Driver account"><Select allowClear options={drivers.map((d) => ({ value: d.user_id, label: `${d.name} (${d.email})` }))} /></Form.Item>
          <Form.Item name="image_url" label="Image"><Select allowClear options={IMAGES.map((i) => ({ value: i, label: i.split('/').pop() }))} /></Form.Item>
          <Form.Item name="status" label="Status"><Select options={[{ value: 'active' }, { value: 'maintenance' }, { value: 'inactive' }]} /></Form.Item>
          <Form.Item name="notes" label="Notes"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
