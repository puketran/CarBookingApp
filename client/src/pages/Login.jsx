import { useState } from 'react';
import { Card, Input, Button, Form, Typography, Space, App } from 'antd';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth, isAdmin } from '../context/AuthContext';
import { useLang } from '../i18n';
import LanguageSelector from '../components/LanguageSelector';

const landing = (role) => (isAdmin(role) ? '/admin' : role === 'driver' ? '/driver' : '/book');

export default function Login() {
  const [mode, setMode] = useState('login'); // 'login' | 'request' | 'reset'
  const [purpose, setPurpose] = useState('reset'); // 'register' | 'reset'
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const { message } = App.useApp();

  const doLogin = async ({ email: e, password }) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email: e, password });
      login(data.token, data.user);
      navigate(landing(data.user.role), { replace: true });
    } catch {
      message.error(t('login.wrongCreds'));
    } finally { setLoading(false); }
  };

  const requestCode = async ({ email: e }) => {
    setLoading(true);
    try {
      await api.post('/auth/request-otp', { email: e, purpose });
      setEmail(e);
      setMode('reset');
      message.success(t('login.codeSent'));
    } catch (err) {
      // Registering an email that already has an account is rejected up-front.
      if (err.response?.status === 409) { message.error(t('login.emailExists')); setMode('login'); }
      else message.error(t('login.error'));
    } finally { setLoading(false); }
  };

  const setPw = async ({ code, password }) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/set-password', { email, code, password, purpose });
      login(data.token, data.user);
      navigate(landing(data.user.role), { replace: true });
    } catch (err) {
      const s = err.response?.status;
      if (s === 409) message.error(t('login.emailExists'));
      else if (s === 404) message.error(t('login.noAccount'));
      else message.error(t('login.invalidCode'));
    } finally { setLoading(false); }
  };

  const goRequest = (p) => { setPurpose(p); setMode('request'); };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <Card
        style={{ width: 380 }}
        title={t('app.title')}
        extra={<LanguageSelector />}
      >
        {mode === 'login' && (
          <Form layout="vertical" onFinish={doLogin}>
            <Form.Item name="email" label={t('login.email')} rules={[{ required: true, type: 'email' }]}>
              <Input placeholder="you@company.com" autoFocus />
            </Form.Item>
            <Form.Item name="password" label={t('login.password')} rules={[{ required: true }]}>
              <Input.Password />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>{t('login.signIn')}</Button>
            <Button type="link" block onClick={() => goRequest('register')}>{t('login.register')}</Button>
            <Button type="link" block onClick={() => goRequest('reset')}>{t('login.forgot')}</Button>
          </Form>
        )}

        {mode === 'request' && (
          <Form layout="vertical" onFinish={requestCode}>
            <Typography.Paragraph type="secondary">{t(purpose === 'register' ? 'login.registerHint' : 'login.forgotHint')}</Typography.Paragraph>
            <Form.Item name="email" label={t('login.email')} rules={[{ required: true, type: 'email' }]}>
              <Input placeholder="you@company.com" autoFocus />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>{t('login.sendCode')}</Button>
            <Button type="link" block onClick={() => setMode('login')}>{t('login.backToSignIn')}</Button>
          </Form>
        )}

        {mode === 'reset' && (
          <Form layout="vertical" onFinish={setPw}>
            <Typography.Paragraph type="secondary">{t('login.resetHint', { email })}</Typography.Paragraph>
            <Form.Item name="code" label={t('login.code')} rules={[{ required: true, len: 6 }]}>
              <Input placeholder="123456" maxLength={6} autoFocus />
            </Form.Item>
            <Form.Item name="password" label={t('login.newPassword')} rules={[{ required: true, min: 8 }]}>
              <Input.Password placeholder={t('login.min8')} />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>{t('login.setAndSignIn')}</Button>
            <Button type="link" block onClick={() => setMode('login')}>{t('login.backToSignIn')}</Button>
          </Form>
        )}
      </Card>
    </div>
  );
}
