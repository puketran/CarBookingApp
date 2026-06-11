import { Card, Descriptions, Tag, Form, Input, Button, App } from 'antd';
import { useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const { message } = App.useApp();
  const [form] = Form.useForm();
  if (!user) return null;

  const changePassword = async ({ password }) => {
    setSaving(true);
    try {
      await api.patch('/auth/password', { password });
      message.success('Password changed.');
      form.resetFields();
    } catch {
      message.error('Could not change password.');
    } finally { setSaving(false); }
  };

  return (
    <>
      <Card title="Profile" style={{ marginBottom: 16 }}>
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Name">{user.name || '—'}</Descriptions.Item>
          <Descriptions.Item label="Email">{user.email || '—'}</Descriptions.Item>
          <Descriptions.Item label="Department">{user.department || '—'}</Descriptions.Item>
          <Descriptions.Item label="Role"><Tag color="blue" style={{ textTransform: 'capitalize' }}>{user.role}</Tag></Descriptions.Item>
        </Descriptions>
      </Card>

      <Card title="Change password">
        <Form layout="vertical" form={form} onFinish={changePassword} style={{ maxWidth: 360 }}>
          <Form.Item name="password" label="New password" rules={[{ required: true, min: 8, message: 'At least 8 characters' }]}>
            <Input.Password placeholder="At least 8 characters" />
          </Form.Item>
          <Form.Item name="confirm" label="Confirm password" dependencies={['password']} rules={[
            { required: true },
            ({ getFieldValue }) => ({ validator: (_, v) => (!v || v === getFieldValue('password') ? Promise.resolve() : Promise.reject(new Error('Passwords do not match'))) }),
          ]}>
            <Input.Password placeholder="Re-enter password" />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={saving}>Change password</Button>
        </Form>
      </Card>
    </>
  );
}
