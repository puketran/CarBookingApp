import { Card, Descriptions, Tag } from 'antd';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <Card title="Profile">
      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="Name">{user.name}</Descriptions.Item>
        <Descriptions.Item label="Email">{user.email || '—'}</Descriptions.Item>
        <Descriptions.Item label="Department">{user.department || '—'}</Descriptions.Item>
        <Descriptions.Item label="Role"><Tag color="blue" style={{ textTransform: 'capitalize' }}>{user.role}</Tag></Descriptions.Item>
      </Descriptions>
    </Card>
  );
}
