import { Card, Tag, Radio, Space } from 'antd';

// Selectable vehicle card used in the booking flow. Falls back to a 🚗 tile
// when image_url is empty.
export default function VehicleCard({ vehicle, selected, onSelect, nearest }) {
  const { vehicle_name, capacity, driver_name, image_url, transmission, parking_location, available_slots } = vehicle;
  const slotCount = available_slots?.length;

  return (
    <Card
      hoverable={!!onSelect}
      onClick={onSelect}
      style={{
        marginBottom: 10,
        borderColor: selected ? '#1d4ed8' : undefined,
        borderWidth: selected ? 2 : 1,
        cursor: onSelect ? 'pointer' : 'default',
      }}
      styles={{ body: { padding: 12 } }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {image_url ? (
          <img src={image_url} alt={vehicle_name} style={{ width: 76, height: 50, objectFit: 'contain' }} />
        ) : (
          <div style={{ fontSize: 36, width: 76, textAlign: 'center' }}>🚗</div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <Space size={6}>
            <b>{vehicle_name}</b>
            {nearest && <Tag color="blue">Nearest</Tag>}
          </Space>
          <div style={{ color: '#666', fontSize: 13 }}>🪑 {capacity} seats · ⚙️ {transmission || 'auto'}</div>
          <div style={{ color: '#666', fontSize: 13 }}>
            📍 {parking_location || '—'}{driver_name ? ` · 🧑‍✈️ ${driver_name}` : ''}
          </div>
          {slotCount != null && (
            <Tag color={slotCount ? 'green' : 'default'} style={{ marginTop: 4 }}>
              {slotCount} slot{slotCount === 1 ? '' : 's'} available
            </Tag>
          )}
        </div>
        {onSelect && <Radio checked={selected} />}
      </div>
    </Card>
  );
}
