import { useState } from 'react';
import { Card, Form, Input, Button, Alert, Modal, Space, Typography, App } from 'antd';
import api from '../api/axios';
import { useLang } from '../i18n';

// Admin-only AND password-gated (DEVELOPER_PASSWORD env). Holds destructive tools.
export default function AdminDeveloper() {
  const [unlocked, setUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [clearing, setClearing] = useState(false);
  const { message } = App.useApp();
  const { t } = useLang();

  const unlock = async () => {
    setVerifying(true);
    try {
      await api.post('/admin/dev/verify', { password });
      setUnlocked(true);
    } catch {
      message.error(t('dev.wrongPassword'));
    } finally {
      setVerifying(false);
    }
  };

  const clearAll = async () => {
    setClearing(true);
    try {
      const { data } = await api.post('/admin/dev/clear-bookings', { password });
      message.success(t('dev.cleared', { n: data.deleted }));
      setConfirm(false);
      setConfirmText('');
    } catch {
      message.error(t('dev.clearErr'));
    } finally {
      setClearing(false);
    }
  };

  if (!unlocked) {
    return (
      <Card title={t('nav.developer')} style={{ maxWidth: 420 }}>
        <Typography.Paragraph type="secondary">{t('dev.lockHint')}</Typography.Paragraph>
        <Form layout="vertical" onFinish={unlock}>
          <Form.Item label={t('dev.password')}>
            <Input.Password value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={verifying} disabled={!password}>{t('dev.unlock')}</Button>
        </Form>
      </Card>
    );
  }

  return (
    <Card title={t('nav.developer')} style={{ maxWidth: 600 }}>
      <Alert type="error" showIcon style={{ marginBottom: 16 }} message={t('dev.dangerZone')} description={t('dev.dangerDesc')} />
      <Space direction="vertical" style={{ width: '100%' }}>
        <Typography.Text strong>{t('dev.clearAllTitle')}</Typography.Text>
        <Typography.Text type="secondary">{t('dev.clearAllDesc')}</Typography.Text>
        <Button danger onClick={() => { setConfirm(true); setConfirmText(''); }}>{t('dev.clearAllBtn')}</Button>
      </Space>

      <Modal
        title={t('dev.clearAllTitle')}
        open={confirm}
        onCancel={() => setConfirm(false)}
        onOk={clearAll}
        okText={t('dev.clearAllBtn')}
        okButtonProps={{ danger: true, disabled: confirmText !== 'DELETE', loading: clearing }}
      >
        <Alert type="warning" showIcon style={{ marginBottom: 12 }} message={t('dev.confirmMsg')} />
        <Typography.Paragraph>{t('dev.confirmType')}</Typography.Paragraph>
        <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="DELETE" />
      </Modal>
    </Card>
  );
}
