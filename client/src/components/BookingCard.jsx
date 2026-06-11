import { Card, Button, Popconfirm } from 'antd';
import StatusBadge from './StatusBadge';
import { STATUS_HEX } from '../theme';

// Booking summary card for the employee My Bookings list.
export default function BookingCard({ booking, onCancel, onClick }) {
  const { booking_id, vehicle_name, booking_date, slot_start, slot_end, status, image_url, passenger_count } = booking;
  const code = booking.code || `BK-${String(booking_id).padStart(4, '0')}`;

  return (
    <Card
      size="small"
      hoverable={!!onClick}
      onClick={onClick}
      style={{ borderLeft: `4px solid ${STATUS_HEX[status] || '#d9d9d9'}`, marginBottom: 10, cursor: onClick ? 'pointer' : 'default' }}
      styles={{ body: { padding: 12 } }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {image_url ? (
          <img src={image_url} alt="" style={{ width: 56, height: 38, objectFit: 'contain' }} />
        ) : (
          <div style={{ fontSize: 28, width: 56, textAlign: 'center' }}>🚗</div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <b>{code}</b>
          <div style={{ color: '#666', fontSize: 13 }}>
            {booking_date?.slice(0, 10)} · {slot_start}–{slot_end}
          </div>
          <div style={{ color: '#666', fontSize: 13 }}>
            {vehicle_name}
            {passenger_count ? ` · ${passenger_count} pax` : ''}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <StatusBadge status={status} />
          {status === 'pending' && onCancel && (
            <div style={{ marginTop: 6 }} onClick={(e) => e.stopPropagation()}>
              <Popconfirm title="Cancel this booking?" onConfirm={() => onCancel(booking_id)}>
                <Button danger size="small">Cancel</Button>
              </Popconfirm>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
