import { Card, Typography } from 'antd';

export default function ComingSoon({ title, note }) {
  return (
    <Card title={title}>
      <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
        🛠️ Coming soon{note ? ` — ${note}` : ''}.
      </Typography.Paragraph>
    </Card>
  );
}
