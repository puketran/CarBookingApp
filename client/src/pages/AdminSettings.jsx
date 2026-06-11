import { useEffect, useState } from 'react';
import { Card, Form, InputNumber, Button, Spin, App } from 'antd';
import api from '../api/axios';

const FIELDS = [
  { key: 'booking_weeks', label: 'Booking window (weeks shown to employees)', min: 1, max: 8 },
  { key: 'bookings_per_week', label: 'Max bookings per user per week', min: 1, max: 7 },
  { key: 'noshow_limit', label: 'No-shows before a ban', min: 1, max: 10 },
  { key: 'ban_months', label: 'Ban length (months)', min: 1, max: 12 },
];

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { message } = App.useApp();
  const [form] = Form.useForm();

  useEffect(() => {
    (async () => {
      try { form.setFieldsValue((await api.get('/admin/settings')).data); }
      catch { message.error('Could not load settings.'); }
      finally { setLoading(false); }
    })();
  }, []);

  const save = async (vals) => {
    setSaving(true);
    try { form.setFieldsValue((await api.patch('/admin/settings', vals)).data); message.success('Settings saved.'); }
    catch { message.error('Could not save.'); }
    finally { setSaving(false); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 48 }}><Spin /></div>;

  return (
    <Card title="Settings" style={{ maxWidth: 520 }}>
      <Form layout="vertical" form={form} onFinish={save}>
        {FIELDS.map((f) => (
          <Form.Item key={f.key} name={f.key} label={f.label} rules={[{ required: true }]}>
            <InputNumber min={f.min} max={f.max} style={{ width: 160 }} />
          </Form.Item>
        ))}
        <Button type="primary" htmlType="submit" loading={saving}>Save settings</Button>
      </Form>
    </Card>
  );
}
