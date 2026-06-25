import { useEffect, useState } from 'react';
import { Modal, Descriptions, Space, Button, Spin, Tag, App } from 'antd';
import api from '../api/axios';
import StatusBadge from './StatusBadge';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../i18n';

// Shared booking detail popup used from the notification bell and the calendar.
// Shows the full booking and, for admins, the actions valid for its current status.
export default function BookingDetailModal({ bookingId, onClose, onChanged }) {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [acting, setActing] = useState(false);
  const { user } = useAuth();
  const { t } = useLang();
  const { message } = App.useApp();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (!bookingId) { setBooking(null); return; }
    setLoading(true);
    api.get(`/bookings/${bookingId}`)
      .then((res) => setBooking(res.data))
      .catch(() => { message.error(t('admin.bookingsLoadErr')); onClose(); })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  const act = async (next) => {
    setActing(true);
    try {
      await api.patch(`/bookings/${booking.booking_id}/status`, { status: next });
      message.success(t('admin.bookingUpdated', { id: booking.booking_id, status: t(`status.${next}`) }));
      onChanged && onChanged();
      onClose();
    } catch {
      message.error(t('admin.actionNotAllowed'));
    } finally {
      setActing(false);
    }
  };

  const isFullDay = booking?.booking_type === 'full_day';
  const multiDay = booking?.group_days > 1;

  const actions = [];
  if (isAdmin && booking) {
    if (booking.status === 'pending') {
      actions.push(<Button key="a" type="primary" loading={acting} onClick={() => act('approved')}>{t('admin.approve')}</Button>);
      actions.push(<Button key="r" danger loading={acting} onClick={() => act('rejected')}>{t('admin.reject')}</Button>);
    } else if (booking.status === 'approved') {
      actions.push(<Button key="c" loading={acting} onClick={() => act('completed')}>{t('admin.complete')}</Button>);
      actions.push(<Button key="r" danger loading={acting} onClick={() => act('rejected')}>{t('admin.reject')}</Button>);
    }
  }

  return (
    <Modal
      open={!!bookingId}
      onCancel={onClose}
      title={booking ? booking.code : t('detail.title')}
      footer={<Space>{actions.length ? actions : null}<Button onClick={onClose}>{t('admin.close')}</Button></Space>}
    >
      {loading || !booking ? (
        <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div>
      ) : (
        <Descriptions size="small" column={1} bordered>
          <Descriptions.Item label={t('f.status')}><StatusBadge status={booking.status} /></Descriptions.Item>
          <Descriptions.Item label={t('admin.colType')}>
            {isFullDay ? <Tag color="purple">{t('book.fullDay')}</Tag> : <Tag>{t('admin.typeSlot')}</Tag>}
            {multiDay && <Tag color="geekblue">{t('detail.multiDay', { n: booking.group_days })}</Tag>}
          </Descriptions.Item>
          <Descriptions.Item label={t('f.date')}>{booking.booking_date}</Descriptions.Item>
          <Descriptions.Item label={t('f.slot')}>{isFullDay ? t('book.fullDay') : `${booking.slot_start}–${booking.slot_end}`}</Descriptions.Item>
          <Descriptions.Item label={t('f.vehicle')}>{booking.vehicle_name}</Descriptions.Item>
          <Descriptions.Item label={t('f.employee')}>{booking.employee_name}</Descriptions.Item>
          <Descriptions.Item label={t('f.department')}>{booking.department || '—'}</Descriptions.Item>
          <Descriptions.Item label={t('f.destination')}>{booking.destination || '—'}</Descriptions.Item>
          <Descriptions.Item label={t('book.purpose')}>{booking.purpose || '—'}</Descriptions.Item>
          <Descriptions.Item label={t('book.passengers')}>{booking.passenger_count ?? '—'}</Descriptions.Item>
          <Descriptions.Item label={t('f.phone')}>{booking.contact_number || '—'}</Descriptions.Item>
        </Descriptions>
      )}
    </Modal>
  );
}
