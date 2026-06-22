import { useEffect, useState } from 'react';
import { Card, Form, InputNumber, Button, Spin, App } from 'antd';
import api from '../api/axios';
import { useLang } from '../i18n';

const FIELDS = [
  { key: 'booking_weeks', labelKey: 'admin.setBookingWeeks', min: 1, max: 8 },
  { key: 'bookings_per_week', labelKey: 'admin.setBookingsPerWeek', min: 1, max: 7 },
  { key: 'noshow_limit', labelKey: 'admin.setNoshowLimit', min: 1, max: 10 },
  { key: 'ban_months', labelKey: 'admin.setBanMonths', min: 1, max: 12 },
];

export default function AdminSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { message } = App.useApp();
  const { t } = useLang();
  const [form] = Form.useForm();

  useEffect(() => {
    (async () => {
      try { form.setFieldsValue((await api.get('/admin/settings')).data); }
      catch { message.error(t('admin.settingsLoadErr')); }
      finally { setLoading(false); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async (vals) => {
    setSaving(true);
    try { form.setFieldsValue((await api.patch('/admin/settings', vals)).data); message.success(t('admin.settingsSaved')); }
    catch { message.error(t('admin.settingsSaveErr')); }
    finally { setSaving(false); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 48 }}><Spin /></div>;

  return (
    <Card title={t('nav.settings')} style={{ maxWidth: 520 }}>
      <Form layout="vertical" form={form} onFinish={save}>
        {FIELDS.map((f) => (
          <Form.Item key={f.key} name={f.key} label={t(f.labelKey)} rules={[{ required: true }]}>
            <InputNumber min={f.min} max={f.max} style={{ width: 160 }} />
          </Form.Item>
        ))}
        <Button type="primary" htmlType="submit" loading={saving}>{t('admin.saveSettings')}</Button>
      </Form>
    </Card>
  );
}
