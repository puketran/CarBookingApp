import { useEffect, useState } from 'react';
import { Card, Table, Tag, Select, Space, Button, App } from 'antd';
import api from '../api/axios';

const CATEGORY_COLOR = { bug: 'red', idea: 'blue', question: 'gold', other: 'default' };
const STATUS_COLOR = { new: 'magenta', triaged: 'geekblue', done: 'green', wontfix: 'default' };
const STATUSES = ['new', 'triaged', 'done', 'wontfix'];

export default function AdminFeedback() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState();
  const { message } = App.useApp();

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/feedback', { params: { status } });
      setData(res.data);
    } catch {
      message.error('Could not load feedback.');
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
      message.error('Could not update.');
    }
  };

  const columns = [
    { title: '#', dataIndex: 'id', width: 56 },
    { title: 'Type', dataIndex: 'category', render: (c) => <Tag color={CATEGORY_COLOR[c]}>{c}</Tag> },
    { title: 'Message', dataIndex: 'message' },
    { title: 'From', dataIndex: 'email' },
    { title: 'Page', dataIndex: 'page' },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (s, r) => (
        <Select
          size="small"
          value={s}
          style={{ width: 120 }}
          onChange={(v) => setItemStatus(r.id, v)}
          options={STATUSES.map((x) => ({ value: x, label: <Tag color={STATUS_COLOR[x]}>{x}</Tag> }))}
        />
      ),
    },
  ];

  return (
    <Card
      title="Feedback"
      extra={
        <Space>
          <Select
            allowClear
            placeholder="Filter status"
            style={{ width: 150 }}
            value={status}
            onChange={setStatus}
            options={STATUSES.map((s) => ({ value: s, label: s }))}
          />
          <Button onClick={load}>Refresh</Button>
        </Space>
      }
    >
      <Table rowKey="id" columns={columns} dataSource={data} loading={loading} pagination={{ pageSize: 20 }} />
    </Card>
  );
}
