import { Tag } from 'antd';
import { STATUS_COLOR } from '../theme';

export default function StatusBadge({ status }) {
  return (
    <Tag color={STATUS_COLOR[status] || 'default'} style={{ textTransform: 'capitalize', margin: 0 }}>
      {status}
    </Tag>
  );
}
