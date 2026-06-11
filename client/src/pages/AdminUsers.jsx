import { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Select, Switch, Space, Modal, Form, Input, App } from 'antd';
import dayjs from 'dayjs';
import api from '../api/axios';

const ROLES = ['employee', 'driver', 'admin'];

export default function AdminUsers() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const { message } = App.useApp();
  const [form] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try { setData((await api.get('/admin/users')).data); }
    catch { message.error('Could not load users.'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const patch = async (id, body, ok = 'Updated.') => {
    try { await api.patch(`/admin/users/${id}`, body); message.success(ok); load(); }
    catch { message.error('Could not update.'); }
  };

  const addUser = async (vals) => {
    try { await api.post('/admin/users', vals); message.success('User added.'); setAdding(false); form.resetFields(); load(); }
    catch (e) { message.error(e.response?.status === 409 ? 'Email already exists.' : 'Could not add user.'); }
  };

  const isBlocked = (u) => u.booking_blocked_until && u.booking_blocked_until >= dayjs().format('YYYY-MM-DD');

  const columns = [
    { title: 'Name', dataIndex: 'name' },
    { title: 'Email', dataIndex: 'email' },
    { title: 'Dept', dataIndex: 'department' },
    {
      title: 'Role',
      dataIndex: 'role',
      render: (r, u) => (
        <Select size="small" value={r} style={{ width: 110 }} options={ROLES.map((x) => ({ value: x }))} onChange={(v) => patch(u.user_id, { role: v }, 'Role updated.')} />
      ),
    },
    {
      title: 'Active',
      dataIndex: 'is_active',
      render: (a, u) => <Switch size="small" checked={!!a} onChange={(v) => patch(u.user_id, { is_active: v }, v ? 'Activated.' : 'Deactivated.')} />,
    },
    { title: 'No-shows (mo.)', dataIndex: 'noshow_this_month', render: (n) => <Tag color={n >= 3 ? 'red' : n > 0 ? 'gold' : 'default'}>{n}</Tag> },
    {
      title: 'Booking',
      render: (_, u) => (isBlocked(u)
        ? <Space><Tag color="red">Blocked → {u.booking_blocked_until}</Tag><Button size="small" onClick={() => patch(u.user_id, { booking_blocked_until: null }, 'Unblocked.')}>Unblock</Button></Space>
        : <Tag color="green">OK</Tag>),
    },
  ];

  return (
    <Card title="Users" extra={<Space><Button onClick={load}>Refresh</Button><Button type="primary" onClick={() => setAdding(true)}>Add user</Button></Space>}>
      <Table rowKey="user_id" columns={columns} dataSource={data} loading={loading} pagination={false} />

      <Modal title="Add user" open={adding} onCancel={() => setAdding(false)} onOk={() => form.submit()} okText="Add">
        <Form layout="vertical" form={form} onFinish={addUser} initialValues={{ role: 'employee' }}>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}><Input placeholder="name@company.com" /></Form.Item>
          <Form.Item name="name" label="Name"><Input /></Form.Item>
          <Form.Item name="department" label="Department"><Input /></Form.Item>
          <Form.Item name="role" label="Role"><Select options={ROLES.map((x) => ({ value: x }))} /></Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
