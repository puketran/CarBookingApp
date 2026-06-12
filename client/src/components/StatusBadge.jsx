import { Tag } from 'antd';
import { STATUS_COLOR } from '../theme';
import { useLang } from '../i18n';

export default function StatusBadge({ status }) {
  const { t } = useLang();
  return (
    <Tag color={STATUS_COLOR[status] || 'default'} style={{ margin: 0 }}>
      {t(`status.${status}`)}
    </Tag>
  );
}
