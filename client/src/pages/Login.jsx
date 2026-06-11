import { useState } from 'react';
import { Card, Input, Button, Form, Typography, App } from 'antd';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth, isAdmin } from '../context/AuthContext';

const landing = (role) => (isAdmin(role) ? '/admin' : role === 'driver' ? '/driver' : '/book');

export default function Login() {
  const [mode, setMode] = useState('login'); // 'login' | 'request' | 'reset'
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { message } = App.useApp();

  const doLogin = async ({ email: e, password }) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email: e, password });
      login(data.token, data.user);
      navigate(landing(data.user.role), { replace: true });
    } catch {
      message.error('Wrong email or password.');
    } finally { setLoading(false); }
  };

  const requestCode = async ({ email: e }) => {
    setLoading(true);
    try {
      await api.post('/auth/request-otp', { email: e });
      setEmail(e);
      setMode('reset');
      message.success('If the email is valid, a code was sent. (Dev: check the server console.)');
    } catch {
      message.error('Something went wrong.');
    } finally { setLoading(false); }
  };

  const setPw = async ({ code, password }) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/set-password', { email, code, password });
      login(data.token, data.user);
      navigate(landing(data.user.role), { replace: true });
    } catch {
      message.error('Invalid or expired code.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <Card style={{ width: 380 }} title="🚗 Office Car Booking">
        {mode === 'login' && (
          <Form layout="vertical" onFinish={doLogin}>
            <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
              <Input placeholder="you@company.com" autoFocus />
            </Form.Item>
            <Form.Item name="password" label="Password" rules={[{ required: true }]}>
              <Input.Password placeholder="Your password" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>Sign in</Button>
            <Button type="link" block onClick={() => setMode('request')}>Set / forgot password</Button>
          </Form>
        )}

        {mode === 'request' && (
          <Form layout="vertical" onFinish={requestCode}>
            <Typography.Paragraph type="secondary">
              Enter your email to receive a one-time code. New here? This also registers you.
            </Typography.Paragraph>
            <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
              <Input placeholder="you@company.com" autoFocus />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>Send code</Button>
            <Button type="link" block onClick={() => setMode('login')}>Back to sign in</Button>
          </Form>
        )}

        {mode === 'reset' && (
          <Form layout="vertical" onFinish={setPw}>
            <Typography.Paragraph type="secondary">
              We sent a 6-digit code to <b>{email}</b>. (Dev: check the server console.) Enter it and choose a password.
            </Typography.Paragraph>
            <Form.Item name="code" label="6-digit code" rules={[{ required: true, len: 6 }]}>
              <Input placeholder="123456" maxLength={6} autoFocus />
            </Form.Item>
            <Form.Item name="password" label="New password" rules={[{ required: true, min: 8 }]}>
              <Input.Password placeholder="At least 8 characters" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>Set password &amp; sign in</Button>
            <Button type="link" block onClick={() => setMode('login')}>Back to sign in</Button>
          </Form>
        )}
      </Card>
    </div>
  );
}
