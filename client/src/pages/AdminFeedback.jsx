import { useEffect, useState } from 'react';
import { Card, Table, Tag, Select, Space, Button, App } from 'antd';
import api from '../api/axios';
import { useLang } from '../i18n';

const CATEGORY_COLOR = { bug: 'red', idea: 'blue', question: 'gold', other: 'default' };
const STATUS_COLOR = { new: 'magenta', triaged: 'geekblue', done: 'green', wontfix: 'default' };
const STATUSES = ['new', 'triaged', 'done', 'wontfix'];

export default function AdminFeedback() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState();
  const { message } = App.useApp();
  const { t } = useLang();

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/feedback', { params: { status } });
      setData(res.data);
    } catch {
      message.error(t('admin.feedbackLoadErr'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const setItemStatus = async (id, next) => {
    try {
      await api.patch(`/feedback/${id}`, { status: next });
      load();
    } catch {
      message.error(t('admin.updateErr'));
    }
  };

  const columns = [
    { title: '#', dataIndex: 'id', width: 56 },
    { title: t('admin.colType'), dataIndex: 'category', render: (c) => <Tag color={CATEGORY_COLOR[c]}>{t(`admin.fbCat.${c}`)}</Tag> },
    { title: t('fb.message'), dataIndex: 'message' },
    { title: t('f.employee'), dataIndex: 'employee_name', render: (n) => n || '—' },
    { title: t('admin.colFrom'), dataIndex: 'email' },
    { title: t('admin.colPage'), dataIndex: 'page' },
    {
      title: t('f.status'),
      dataIndex: 'status',
      render: (s, r) => (
        <Select
          size="small"
          value={s}
          style={{ width: 120 }}
          onChange={(v) => setItemStatus(r.id, v)}
          options={STATUSES.map((x) => ({ value: x, label: <Tag color={STATUS_COLOR[x]}>{t(`admin.fbStatus.${x}`)}</Tag> }))}
        />
      ),
    },
  ];

  return (
    <Card
      title={t('nav.feedback')}
      extra={
        <Space>
          <Select
            allowClear
            placeholder={t('admin.filterStatus')}
            style={{ width: 150 }}
            value={status}
            onChange={setStatus}
            options={STATUSES.map((s) => ({ value: s, label: t(`admin.fbStatus.${s}`) }))}
          />
          <Button onClick={load}>{t('common.refresh')}</Button>
        </Space>
      }
    >
      <Table rowKey="id" columns={columns} dataSource={data} loading={loading} pagination={{ pageSize: 20 }} />
    </Card>
  );
}
