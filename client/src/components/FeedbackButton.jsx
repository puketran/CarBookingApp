import { useState } from 'react';
import { Button, Modal, Form, Select, Input, App } from 'antd';
import { useLocation } from 'react-router-dom';
import api from '../api/axios';

// A lightweight feedback launcher shown in the header for any logged-in user.
// Captures the current page automatically so triage knows where it came from.
export default function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();
  const location = useLocation();
  const [form] = Form.useForm();

  const submit = async (values) => {
    setLoading(true);
    try {
      await api.post('/feedback', { ...values, page: location.pathname });
      message.success('Thanks for the feedback!');
      setOpen(false);
      form.resetFields();
    } catch {
      message.error('Could not send feedback. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button size="small" ghost onClick={() => setOpen(true)}>
        Feedback
      </Button>
      <Modal
        title="Send feedback"
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={loading}
        okText="Send"
      >
        <Form layout="vertical" form={form} onFinish={submit} initialValues={{ category: 'idea' }}>
          <Form.Item name="category" label="Type">
            <Select
              options={[
                { value: 'bug', label: '🐞 Bug' },
                { value: 'idea', label: '💡 Idea / request' },
                { value: 'question', label: '❓ Question' },
                { value: 'other', label: 'Other' },
              ]}
            />
          </Form.Item>
          <Form.Item name="message" label="Message" rules={[{ required: true, message: 'Please describe it' }]}>
            <Input.TextArea rows={4} placeholder="What happened, or what would you like to see?" maxLength={2000} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
