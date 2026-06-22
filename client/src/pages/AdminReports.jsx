import { useEffect, useState } from 'react';
import { Card, DatePicker, Button, Space, Segmented, Table, Typography, App } from 'antd';
import api from '../api/axios';
import { useLang } from '../i18n';

const { RangePicker } = DatePicker;

const REPORTS = [
  { value: 'bookings', file: 'booking-summary.xlsx' },
  { value: 'pending', file: 'pending-approvals.xlsx' },
  { value: 'utilisation', file: 'utilisation.xlsx' },
  { value: 'monthly', file: 'monthly-report.xlsx' },
];

export default function AdminReports() {
  const [report, setReport] = useState('bookings');
  const [range, setRange] = useState(null);
  const [preview, setPreview] = useState({ columns: [], rows: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { message } = App.useApp();
  const { t } = useLang();

  const params = () =>
    range && range[0] && range[1]
      ? { from: range[0].format('YYYY-MM-DD'), to: range[1].format('YYYY-MM-DD') }
      : {};

  const loadPreview = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/export/${report}/preview`, { params: params() });
      setPreview(res.data);
    } catch {
      message.error(t('admin.previewErr'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPreview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report, range]);

  const exportExcel = async () => {
    const file = REPORTS.find((r) => r.value === report)?.file || `${report}.xlsx`;
    setExporting(true);
    try {
      const res = await api.get(`/export/${report}`, { params: params(), responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      message.error(t('admin.exportErr'));
    } finally {
      setExporting(false);
    }
  };

  const reportOptions = REPORTS.map((r) => ({ value: r.value, label: t(`admin.report.${r.value}`) }));
  const columns = (preview.columns || []).map((c) => ({ title: c.title, dataIndex: c.key, key: c.key }));

  return (
    <Card title={t('nav.reports')}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Segmented options={reportOptions} value={report} onChange={setReport} />
        <Space wrap>
          <RangePicker value={range} onChange={setRange} />
          <Button type="primary" loading={exporting} onClick={exportExcel} disabled={!preview.rows?.length}>
            {t('admin.exportExcel')}
          </Button>
        </Space>
        <Typography.Text type="secondary">
          {t('admin.previewCount', { n: preview.total || 0 })}
        </Typography.Text>
        <Table
          rowKey={(_, i) => i}
          size="small"
          loading={loading}
          columns={columns}
          dataSource={preview.rows || []}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 'max-content' }}
        />
      </Space>
    </Card>
  );
}
