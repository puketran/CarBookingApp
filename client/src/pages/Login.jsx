import { useState } from 'react';
import { Card, Input, Button, Form, Typography, App } from 'antd';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth, isAdmin } from '../context/AuthContext';

export default function Login() {
  const [step, setStep] = useState('email'); // 'email' | 'otp'
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { message } = App.useApp();

  const requestOtp = async ({ email: e }) => {
    setLoading(true);
    try {
      await api.post('/auth/request-otp', { email: e });
      setEmail(e);
      setStep('otp');
      message.success('If the email is valid, an OTP was sent. (Dev: read it in the server console.)');
    } catch {
      message.error('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async ({ code }) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/verify-otp', { email, code });
      login(data.token, data.user);
      navigate(isAdmin(data.user.role) ? '/admin' : '/book', { replace: true });
    } catch {
      message.error('Invalid or expired code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
      <Card style={{ width: 380 }} title="🚗 Office Car Booking">
        {step === 'email' ? (
          <Form layout="vertical" onFinish={requestOtp}>
            <Typography.Paragraph type="secondary">
              Enter your company email to receive a one-time code.
            </Typography.Paragraph>
            <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
              <Input placeholder="you@company.com" autoFocus />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Send code
            </Button>
          </Form>
        ) : (
          <Form layout="vertical" onFinish={verifyOtp}>
            <Typography.Paragraph type="secondary">
              We sent a 6-digit code to <b>{email}</b>. (Dev: check the server console.)
            </Typography.Paragraph>
            <Form.Item name="code" label="6-digit code" rules={[{ required: true, len: 6 }]}>
              <Input placeholder="123456" maxLength={6} autoFocus />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              Verify &amp; sign in
            </Button>
            <Button type="link" block onClick={() => setStep('email')}>
              Use a different email
            </Button>
          </Form>
        )}
      </Card>
    </div>
  );
}
