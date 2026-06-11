import { Card, Typography } from 'antd';

// Dashboard KPI tile (used in M3). Optional %-delta vs yesterday.
export default function KPICard({ title, value, suffix, sub, delta }) {
  return (
    <Card styles={{ body: { padding: 16 } }}>
      <Typography.Text type="secondary">{title}</Typography.Text>
      <div style={{ fontSize: 28, fontWeight: 700, lineHeight: 1.2 }}>
        {value}
        {suffix}
      </div>
      {sub && (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {sub}
        </Typography.Text>
      )}
      {delta != null && (
        <div style={{ color: delta >= 0 ? '#16a34a' : '#dc2626', fontSize: 12 }}>
          {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}% vs yesterday
        </div>
      )}
    </Card>
  );
}
