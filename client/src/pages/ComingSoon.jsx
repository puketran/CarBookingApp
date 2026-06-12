import { Card, Typography } from 'antd';
import { useLang } from '../i18n';

export default function ComingSoon({ title, note }) {
  const { t } = useLang();
  return (
    <Card title={title}>
      <Typography.Paragraph type="secondary" style={{ margin: 0 }}>
        🛠️ {t('common.comingSoon')}{note ? ` — ${note}` : ''}.
      </Typography.Paragraph>
    </Card>
  );
}
