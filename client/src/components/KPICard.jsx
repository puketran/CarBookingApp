import { Card, Typography } from 'antd';

// Dashboard KPI tile. Optional `icon` (emoji) + `accent` (hex) render a coloured
// icon chip and a subtle tinted background; `delta` shows a %-change line.
export default function KPICard({ title, value, suffix, sub, delta, icon, accent = '#1d4ed8' }) {
  return (
    <Card
      styles={{ body: { padding: 16 } }}
      style={{
        height: '100%',
        borderTop: `3px solid ${accent}`,
        background: `linear-gradient(135deg, ${accent}0f 0%, #ffffff 60%)`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
        <div style={{ minWidth: 0 }}>
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
        </div>
        {icon && (
          <div style={{
            flex: 'none', width: 40, height: 40, borderRadius: 10, fontSize: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `${accent}1a`,
          }}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
