import { Card, Tag, Form, Input, Button, App } from 'antd';
import { useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../i18n';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { t } = useLang();
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const { message } = App.useApp();
  const [pwForm] = Form.useForm();
  if (!user) return null;

  const saveProfile = async (vals) => {
    setSavingProfile(true);
    try {
      const { data } = await api.patch('/auth/profile', vals);
      updateUser({ name: data.name, department: data.department });
      message.success(t('profile.updated'));
    } catch {
      message.error(t('profile.updateErr'));
    } finally { setSavingProfile(false); }
  };

  const changePassword = async ({ password }) => {
    setSavingPw(true);
    try {
      await api.patch('/auth/password', { password });
      message.success(t('profile.pwChanged'));
      pwForm.resetFields();
    } catch {
      message.error(t('profile.pwErr'));
    } finally { setSavingPw(false); }
  };

  return (
    <>
      <Card title={t('profile.title')} style={{ marginBottom: 16 }}>
        <Form layout="vertical" initialValues={{ name: user.name, department: user.department }} onFinish={saveProfile} style={{ maxWidth: 360 }}>
          <Form.Item label={t('profile.email')}><Input value={user.email} disabled /></Form.Item>
          <Form.Item label={t('profile.role')}><Tag color="blue" style={{ textTransform: 'capitalize' }}>{user.role}</Tag></Form.Item>
          <Form.Item name="name" label={t('profile.name')} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="department" label={t('profile.department')}><Input /></Form.Item>
          <Button type="primary" htmlType="submit" loading={savingProfile}>{t('profile.save')}</Button>
        </Form>
      </Card>

      <Card title={t('profile.changePassword')}>
        <Form layout="vertical" form={pwForm} onFinish={changePassword} style={{ maxWidth: 360 }}>
          <Form.Item name="password" label={t('profile.newPassword')} rules={[{ required: true, min: 8, message: t('login.min8') }]}>
            <Input.Password placeholder={t('login.min8')} />
          </Form.Item>
          <Form.Item name="confirm" label={t('profile.confirmPassword')} dependencies={['password']} rules={[
            { required: true },
            ({ getFieldValue }) => ({ validator: (_, v) => (!v || v === getFieldValue('password') ? Promise.resolve() : Promise.reject(new Error(t('profile.mismatch')))) }),
          ]}>
            <Input.Password placeholder={t('profile.reenter')} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={savingPw}>{t('profile.changePassword')}</Button>
        </Form>
      </Card>
    </>
  );
}
