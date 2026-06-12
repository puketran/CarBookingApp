import { useState } from 'react';
import { Button, Modal, Form, Select, Input, App } from 'antd';
import { useLocation } from 'react-router-dom';
import api from '../api/axios';
import { useLang } from '../i18n';

export default function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();
  const { t } = useLang();
  const location = useLocation();
  const [form] = Form.useForm();

  const submit = async (values) => {
    setLoading(true);
    try {
      await api.post('/feedback', { ...values, page: location.pathname });
      message.success(t('fb.thanks'));
      setOpen(false);
      form.resetFields();
    } catch {
      message.error(t('fb.err'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button size="small" ghost onClick={() => setOpen(true)}>{t('fb.button')}</Button>
      <Modal title={t('fb.title')} open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()} confirmLoading={loading} okText={t('common.send')} cancelText={t('common.cancel')}>
        <Form layout="vertical" form={form} onFinish={submit} initialValues={{ category: 'idea' }}>
          <Form.Item name="category" label={t('fb.type')}>
            <Select
              options={[
                { value: 'bug', label: t('fb.bug') },
                { value: 'idea', label: t('fb.idea') },
                { value: 'question', label: t('fb.question') },
                { value: 'other', label: t('fb.other') },
              ]}
            />
          </Form.Item>
          <Form.Item name="message" label={t('fb.message')} rules={[{ required: true, message: t('fb.describe') }]}>
            <Input.TextArea rows={4} placeholder={t('fb.placeholder')} maxLength={2000} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
