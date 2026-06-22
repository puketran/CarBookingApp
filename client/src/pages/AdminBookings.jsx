import { useEffect, useState } from 'react';
import { Card, Table, Button, Select, Space, Segmented, Tag, Modal, Alert, Empty, App } from 'antd';
import api from '../api/axios';
import StatusBadge from '../components/StatusBadge';
import { useLang } from '../i18n';

const STATUSES = ['pending', 'approved', 'rejected', 'completed', 'cancelled'];

// Quick tabs → query params for GET /bookings.
const TABS = {
  needs_action: { status: 'pending', sort: 'priority' },
  next2: { within: 2, sort: 'priority' },
  all: {},
};

export default function AdminBookings() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('needs_action');
  const [status, setStatus] = useState();
  // Full-day approval review: { booking, conflicts, loading }
  const [review, setReview] = useState(null);
  const { message } = App.useApp();
  const { t } = useLang();

  const load = async () => {
    setLoading(true);
    try {
      const params = { ...TABS[tab], limit: 100 };
      if (tab === 'all' && status) params.status = status;
      const res = await api.get('/bookings', { params });
      setData(res.data.data);
    } catch {
      message.error(t('admin.bookingsLoadErr'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, status]);

  const setBookingStatus = async (id, next) => {
    try {
      await api.patch(`/bookings/${id}/status`, { status: next });
      message.success(t('admin.bookingUpdated', { id, status: t(`status.${next}`) }));
      return true;
    } catch {
      message.error(t('admin.actionNotAllowed'));
      return false;
    }
  };

  const refreshAfter = async (id, next) => { if (await setBookingStatus(id, next)) load(); };

  // Full-day approval opens a review modal listing same-day conflicts to resolve first.
  const openFullDayReview = async (booking) => {
    setReview({ booking, conflicts: [], loading: true });
    try {
      const res = await api.get(`/bookings/${booking.booking_id}/conflicts`);
      setReview({ booking, conflicts: res.data, loading: false });
    } catch {
      setReview({ booking, conflicts: [], loading: false });
      message.error(t('admin.conflictsLoadErr'));
    }
  };

  const rejectConflict = async (id) => {
    if (await setBookingStatus(id, 'rejected')) {
      setReview((r) => (r ? { ...r, conflicts: r.conflicts.filter((c) => c.booking_id !== id) } : r));
      load();
    }
  };

  const confirmApprove = async () => {
    if (await setBookingStatus(review.booking.booking_id, 'approved')) { setReview(null); load(); }
  };

  const typeTag = (r) => (r.booking_type === 'full_day' ? <Tag color="purple">{t('book.fullDay')}</Tag> : <Tag>{t('admin.typeSlot')}</Tag>);

  const columns = [
    { title: t('f.date'), dataIndex: 'booking_date', render: (d) => d?.slice(0, 10) },
    { title: t('admin.colType'), render: (_, r) => typeTag(r) },
    { title: t('f.slot'), render: (_, r) => (r.booking_type === 'full_day' ? t('book.fullDay') : `${r.slot_start}–${r.slot_end}`) },
    { title: t('f.vehicle'), dataIndex: 'vehicle_name' },
    { title: t('f.employee'), dataIndex: 'employee_name' },
    { title: t('f.department'), dataIndex: 'department' },
    { title: t('f.destination'), dataIndex: 'destination' },
    { title: t('f.status'), dataIndex: 'status', render: (s) => <StatusBadge status={s} /> },
    {
      title: t('admin.colActions'),
      render: (_, r) => (
        <Space>
          {r.status === 'pending' && (
            <>
              <Button
                type="primary"
                size="small"
                onClick={() => (r.booking_type === 'full_day' ? openFullDayReview(r) : refreshAfter(r.booking_id, 'approved'))}
              >
                {t('admin.approve')}
              </Button>
              <Button danger size="small" onClick={() => refreshAfter(r.booking_id, 'rejected')}>
                {t('admin.reject')}
              </Button>
            </>
          )}
          {r.status === 'approved' && (
            <Button size="small" onClick={() => refreshAfter(r.booking_id, 'completed')}>
              {t('admin.complete')}
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const tabOptions = [
    { value: 'needs_action', label: t('admin.tabNeedsAction') },
    { value: 'next2', label: t('admin.tabNext2') },
    { value: 'all', label: t('my.tabAll') },
  ];

  return (
    <Card
      title={t('nav.manageBookings')}
      extra={
        <Space wrap>
          <Segmented options={tabOptions} value={tab} onChange={setTab} />
          {tab === 'all' && (
            <Select
              allowClear
              placeholder={t('admin.filterStatus')}
              style={{ width: 160 }}
              value={status}
              onChange={setStatus}
              options={STATUSES.map((s) => ({ value: s, label: t(`status.${s}`) }))}
            />
          )}
          <Button onClick={load}>{t('common.refresh')}</Button>
        </Space>
      }
    >
      <Table rowKey="booking_id" columns={columns} dataSource={data} loading={loading} pagination={{ pageSize: 20 }} scroll={{ x: 'max-content' }} />

      <Modal
        title={t('admin.approveFullDay')}
        open={!!review}
        onCancel={() => setReview(null)}
        onOk={confirmApprove}
        okText={t('admin.approveFullDayOk')}
        confirmLoading={review?.loading}
      >
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 12 }}
          message={t('admin.fullDayAlertMsg')}
          description={t('admin.fullDayAlertDesc')}
        />
        {review?.conflicts?.length ? (
          <Table
            rowKey="booking_id"
            size="small"
            pagination={false}
            dataSource={review.conflicts}
            columns={[
              { title: t('f.slot'), render: (_, c) => (c.booking_type === 'full_day' ? t('book.fullDay') : `${c.slot_start}–${c.slot_end}`) },
              { title: t('f.employee'), dataIndex: 'employee_name' },
              { title: t('f.phone'), dataIndex: 'contact_number', render: (p) => p || '—' },
              { title: t('f.status'), dataIndex: 'status', render: (s) => <StatusBadge status={s} /> },
              { title: '', render: (_, c) => <Button size="small" danger onClick={() => rejectConflict(c.booking_id)}>{t('admin.reject')}</Button> },
            ]}
          />
        ) : (
          !review?.loading && <Empty description={t('admin.noConflicts')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </Modal>
    </Card>
  );
}
