import { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Select, Switch, Space, Modal, Form, Input, Popconfirm, App } from 'antd';
import dayjs from 'dayjs';
import api from '../api/axios';
import { useLang } from '../i18n';

const ROLES = ['employee', 'driver', 'admin'];

export default function AdminUsers() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null); // user being edited
  const { message } = App.useApp();
  const { t } = useLang();
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try { setData((await api.get('/admin/users')).data); }
    catch { message.error(t('admin.usersLoadErr')); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const patch = async (id, body, ok) => {
    try { await api.patch(`/admin/users/${id}`, body); message.success(ok || t('admin.updated')); load(); }
    catch (e) { message.error(e.response?.status === 409 ? (e.response.data?.message || t('admin.conflict')) : t('admin.updateErr')); }
  };

  const addUser = async (vals) => {
    try { await api.post('/admin/users', vals); message.success(t('admin.userAdded')); setAdding(false); form.resetFields(); load(); }
    catch (e) { message.error(e.response?.status === 409 ? t('admin.emailExists') : t('admin.userAddErr')); }
  };

  const saveEdit = async (vals) => {
    await patch(editing.user_id, vals, t('admin.userUpdated'));
    setEditing(null);
  };

  const removeUser = async (u) => {
    try { await api.delete(`/admin/users/${u.user_id}`); message.success(t('admin.userDeleted')); load(); }
    catch (e) { message.error(e.response?.data?.message || t('admin.userDeleteErr')); }
  };

  const openEdit = (u) => { setEditing(u); editForm.setFieldsValue({ name: u.name, department: u.department, email: u.email }); };

  const isBlocked = (u) => u.booking_blocked_until && u.booking_blocked_until >= dayjs().format('YYYY-MM-DD');

  const columns = [
    { title: t('profile.name'), dataIndex: 'name' },
    { title: t('profile.email'), dataIndex: 'email' },
    { title: t('f.department'), dataIndex: 'department' },
    {
      title: t('profile.role'),
      dataIndex: 'role',
      render: (r, u) => (
        <Select size="small" value={r} style={{ width: 110 }} options={ROLES.map((x) => ({ value: x, label: t(`role.${x}`) }))} onChange={(v) => patch(u.user_id, { role: v }, t('admin.roleUpdated'))} />
      ),
    },
    {
      title: t('admin.colActive'),
      dataIndex: 'is_active',
      render: (a, u) => <Switch size="small" checked={!!a} onChange={(v) => patch(u.user_id, { is_active: v }, v ? t('admin.activated') : t('admin.deactivated'))} />,
    },
    { title: t('admin.colNoShows'), dataIndex: 'noshow_this_month', render: (n) => <Tag color={n >= 3 ? 'red' : n > 0 ? 'gold' : 'default'}>{n}</Tag> },
    {
      title: t('admin.colBooking'),
      render: (_, u) => (isBlocked(u)
        ? <Space><Tag color="red">{t('admin.blockedUntil', { date: u.booking_blocked_until })}</Tag><Button size="small" onClick={() => patch(u.user_id, { booking_blocked_until: null }, t('admin.unblocked'))}>{t('admin.unblock')}</Button></Space>
        : <Tag color="green">{t('admin.ok')}</Tag>),
    },
    {
      title: t('admin.colActions'),
      render: (_, u) => (
        <Space>
          <Button size="small" onClick={() => openEdit(u)}>{t('admin.edit')}</Button>
          <Popconfirm title={t('admin.deleteUserConfirm')} description={t('admin.cannotUndo')} okText={t('admin.delete')} okButtonProps={{ danger: true }} onConfirm={() => removeUser(u)}>
            <Button size="small" danger>{t('admin.delete')}</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Card title={t('nav.users')} extra={<Space><Button onClick={load}>{t('common.refresh')}</Button><Button type="primary" onClick={() => setAdding(true)}>{t('admin.addUser')}</Button></Space>}>
      <Table rowKey="user_id" columns={columns} dataSource={data} loading={loading} pagination={false} scroll={{ x: 'max-content' }} />

      <Modal title={t('admin.addUser')} open={adding} onCancel={() => setAdding(false)} onOk={() => form.submit()} okText={t('admin.add')}>
        <Form layout="vertical" form={form} onFinish={addUser} initialValues={{ role: 'employee' }}>
          <Form.Item name="email" label={t('profile.email')} rules={[{ required: true, type: 'email' }]}><Input placeholder="name@company.com" /></Form.Item>
          <Form.Item name="name" label={t('profile.name')}><Input /></Form.Item>
          <Form.Item name="department" label={t('f.department')}><Input /></Form.Item>
          <Form.Item name="role" label={t('profile.role')}><Select options={ROLES.map((x) => ({ value: x, label: t(`role.${x}`) }))} /></Form.Item>
          <Form.Item name="password" label={t('admin.password')} extra={t('admin.passwordHint')} rules={[{ min: 6, message: t('admin.passwordMin') }]}><Input.Password autoComplete="new-password" /></Form.Item>
        </Form>
      </Modal>

      <Modal title={t('admin.editUser')} open={!!editing} onCancel={() => setEditing(null)} onOk={() => editForm.submit()} okText={t('common.save')}>
        <Form layout="vertical" form={editForm} onFinish={saveEdit}>
          <Form.Item name="name" label={t('profile.name')}><Input /></Form.Item>
          <Form.Item name="email" label={t('profile.email')} rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
          <Form.Item name="department" label={t('f.department')}><Input /></Form.Item>
          <Form.Item name="password" label={t('admin.setPassword')} extra={t('admin.setPasswordHint')} rules={[{ min: 6, message: t('admin.passwordMin') }]}><Input.Password autoComplete="new-password" /></Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
