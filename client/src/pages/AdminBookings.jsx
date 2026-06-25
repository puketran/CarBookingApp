import { useEffect, useMemo, useState } from 'react';
import { Card, Table, Button, Select, Space, Segmented, Tag, Modal, Alert, Empty, Switch, Popover, Checkbox, App } from 'antd';
import dayjs from 'dayjs';
import api from '../api/axios';
import StatusBadge from '../components/StatusBadge';
import { useLang } from '../i18n';

const STATUSES = ['pending', 'approved', 'rejected', 'completed', 'cancelled'];
const INACTIVE_STATUSES = ['completed', 'cancelled', 'rejected', 'no_show'];

// Quick tabs → query params for GET /bookings.
const TABS = {
  needs_action: { status: 'pending', sort: 'priority' },
  next2: { within: 2, sort: 'priority' },
  all: {},
};

// Master column list. `key` is stable and used for the persisted show/hide+order prefs.
// `def` is true for columns shown the first time a user opens the page.
const COLUMN_KEYS = [
  { key: 'date', def: true },
  { key: 'type', def: true },
  { key: 'slot', def: true },
  { key: 'vehicle', def: true },
  { key: 'employee', def: true },
  { key: 'department', def: true },
  { key: 'destination', def: true },
  { key: 'purpose', def: false },
  { key: 'passengers', def: false },
  { key: 'contact', def: false },
  { key: 'code', def: false },
  { key: 'status', def: true },
  { key: 'actions', def: true },
];
const PREFS_KEY = 'adminBookingsCols';

// Load saved prefs, reconciled with COLUMN_KEYS (new keys appended with their default visibility).
function loadColPrefs() {
  let saved = [];
  try { saved = JSON.parse(localStorage.getItem(PREFS_KEY)) || []; } catch { saved = []; }
  const known = new Set(COLUMN_KEYS.map((c) => c.key));
  const result = saved.filter((p) => known.has(p.key));
  const seen = new Set(result.map((p) => p.key));
  for (const c of COLUMN_KEYS) if (!seen.has(c.key)) result.push({ key: c.key, visible: c.def });
  return result;
}

export default function AdminBookings() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('needs_action');
  const [status, setStatus] = useState();
  const [groupByDay, setGroupByDay] = useState(false);
  const [hideOld, setHideOld] = useState(false);
  const [colPrefs, setColPrefs] = useState(loadColPrefs);
  // Full-day approval review: { booking, conflicts, loading }
  const [review, setReview] = useState(null);
  const { message } = App.useApp();
  const { t } = useLang();

  useEffect(() => { localStorage.setItem(PREFS_KEY, JSON.stringify(colPrefs)); }, [colPrefs]);

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

  const typeTag = (r) => (
    <Space size={4}>
      {r.booking_type === 'full_day' ? <Tag color="purple">{t('book.fullDay')}</Tag> : <Tag>{t('admin.typeSlot')}</Tag>}
      {r.group_days > 1 && <Tag color="geekblue">{t('detail.multiDay', { n: r.group_days })}</Tag>}
    </Space>
  );

  // Column definitions keyed by COLUMN_KEYS.key.
  const COL_DEFS = {
    code: { title: t('admin.colCode'), dataIndex: 'code' },
    date: { title: t('f.date'), dataIndex: 'booking_date', render: (d) => d?.slice(0, 10) },
    type: { title: t('admin.colType'), render: (_, r) => typeTag(r) },
    slot: { title: t('f.slot'), render: (_, r) => (r.booking_type === 'full_day' ? t('book.fullDay') : `${r.slot_start}–${r.slot_end}`) },
    vehicle: { title: t('f.vehicle'), dataIndex: 'vehicle_name' },
    employee: { title: t('f.employee'), dataIndex: 'employee_name' },
    department: { title: t('f.department'), dataIndex: 'department' },
    destination: { title: t('f.destination'), dataIndex: 'destination' },
    purpose: { title: t('book.purpose'), dataIndex: 'purpose', render: (p) => p || '—' },
    passengers: { title: t('book.passengers'), dataIndex: 'passenger_count' },
    contact: { title: t('f.phone'), dataIndex: 'contact_number', render: (p) => p || '—' },
    status: { title: t('f.status'), dataIndex: 'status', render: (s) => <StatusBadge status={s} /> },
    actions: {
      title: t('admin.colActions'),
      render: (_, r) => (
        <Space>
          {r.status === 'pending' && (
            <>
              <Button type="primary" size="small" onClick={() => (r.booking_type === 'full_day' ? openFullDayReview(r) : refreshAfter(r.booking_id, 'approved'))}>
                {t('admin.approve')}
              </Button>
              <Button danger size="small" onClick={() => refreshAfter(r.booking_id, 'rejected')}>{t('admin.reject')}</Button>
            </>
          )}
          {r.status === 'approved' && (
            <Space>
              <Button size="small" onClick={() => refreshAfter(r.booking_id, 'completed')}>{t('admin.complete')}</Button>
              <Button danger size="small" onClick={() => refreshAfter(r.booking_id, 'rejected')}>{t('admin.reject')}</Button>
            </Space>
          )}
        </Space>
      ),
    },
  };

  const colLabel = (key) => COL_DEFS[key]?.title || key;

  // Client-side view: hide-old filter + (when grouping) sort by day.
  const today = dayjs().format('YYYY-MM-DD');
  const view = useMemo(() => {
    let rows = data;
    if (hideOld) rows = rows.filter((r) => r.booking_date >= today && !INACTIVE_STATUSES.includes(r.status));
    if (groupByDay) {
      rows = [...rows].sort((a, b) => (a.booking_date < b.booking_date ? -1 : a.booking_date > b.booking_date ? 1 : (a.slot_start || '').localeCompare(b.slot_start || '')));
    }
    return rows;
  }, [data, hideOld, groupByDay, today]);

  // Row-span map so the date column merges consecutive same-day rows when grouping.
  const spanByDate = useMemo(() => {
    const m = {};
    if (!groupByDay) return m;
    for (let i = 0; i < view.length; i += 1) {
      const d = view[i].booking_date;
      if (i > 0 && view[i - 1].booking_date === d) { m[view[i].booking_id] = 0; continue; }
      let n = 1;
      while (i + n < view.length && view[i + n].booking_date === d) n += 1;
      m[view[i].booking_id] = n;
    }
    return m;
  }, [view, groupByDay]);

  const columns = colPrefs
    .filter((p) => p.visible)
    .map((p) => {
      const def = { key: p.key, ...COL_DEFS[p.key] };
      if (p.key === 'date' && groupByDay) {
        def.onCell = (record) => ({ rowSpan: spanByDate[record.booking_id] ?? 1 });
      }
      return def;
    });

  // Column manager: toggle visibility + reorder.
  const move = (idx, dir) => {
    const next = [...colPrefs];
    const j = idx + dir;
    if (j < 0 || j >= next.length) return;
    [next[idx], next[j]] = [next[j], next[idx]];
    setColPrefs(next);
  };
  const toggle = (key) => setColPrefs((prev) => prev.map((p) => (p.key === key ? { ...p, visible: !p.visible } : p)));

  const columnManager = (
    <div style={{ width: 240 }}>
      {colPrefs.map((p, idx) => (
        <div key={p.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 0' }}>
          <Checkbox checked={p.visible} onChange={() => toggle(p.key)}>{colLabel(p.key)}</Checkbox>
          <Space size={0}>
            <Button type="text" size="small" disabled={idx === 0} onClick={() => move(idx, -1)}>↑</Button>
            <Button type="text" size="small" disabled={idx === colPrefs.length - 1} onClick={() => move(idx, 1)}>↓</Button>
          </Space>
        </div>
      ))}
      <Button size="small" block style={{ marginTop: 8 }} onClick={() => setColPrefs(COLUMN_KEYS.map((c) => ({ key: c.key, visible: c.def })))}>
        {t('admin.colReset')}
      </Button>
    </div>
  );

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
          <Space size={4}><Switch size="small" checked={groupByDay} onChange={setGroupByDay} />{t('admin.groupByDay')}</Space>
          <Space size={4}><Switch size="small" checked={hideOld} onChange={setHideOld} />{t('admin.hideOld')}</Space>
          <Popover trigger="click" content={columnManager} placement="bottomRight" title={t('admin.columns')}>
            <Button>{t('admin.columns')}</Button>
          </Popover>
          <Button onClick={load}>{t('common.refresh')}</Button>
        </Space>
      }
    >
      <Table rowKey="booking_id" columns={columns} dataSource={view} loading={loading} pagination={{ pageSize: 20 }} scroll={{ x: 'max-content' }} />

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
