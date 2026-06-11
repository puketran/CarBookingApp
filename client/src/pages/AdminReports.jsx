import { useState } from 'react';
import { Card, DatePicker, Button, Space, Typography, App } from 'antd';
import api from '../api/axios';

const { RangePicker } = DatePicker;

export default function AdminReports() {
  const [range, setRange] = useState(null);
  const [busy, setBusy] = useState('');
  const { message } = App.useApp();

  const params = () =>
    range && range[0] && range[1]
      ? { from: range[0].format('YYYY-MM-DD'), to: range[1].format('YYYY-MM-DD') }
      : {};

  const download = async (path, filename) => {
    setBusy(path);
    try {
      const res = await api.get(path, { params: params(), responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      message.error('Export failed.');
    } finally {
      setBusy('');
    }
  };

  return (
    <Card title="Reports & Export">
      <Typography.Paragraph type="secondary">
        Pick an optional date range, then download an Excel report.
      </Typography.Paragraph>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <RangePicker value={range} onChange={setRange} />
        <Space wrap>
          <Button loading={busy === '/export/bookings'} onClick={() => download('/export/bookings', 'booking-summary.xlsx')}>
            Booking summary
          </Button>
          <Button loading={busy === '/export/utilisation'} onClick={() => download('/export/utilisation', 'utilisation.xlsx')}>
            Utilisation report
          </Button>
          <Button loading={busy === '/export/monthly'} onClick={() => download('/export/monthly', 'monthly-report.xlsx')}>
            Monthly report
          </Button>
        </Space>
      </Space>
    </Card>
  );
}
