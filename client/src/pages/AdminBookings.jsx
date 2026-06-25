import { useEffect, useMemo, useState } from 'react';
import { Card, Table, Button, Select, Space, Segmented, Tag, Modal, Alert, Empty, Switch, Popover, Checkbox, Input, App } from 'antd';
import dayjs from 'dayjs';
import api from '../api/axios';
import StatusBadge from '../components/StatusBadge';
import { useLang } from '../i18n';

const STATUSES = ['pending', 'approved', 'rejected', 'completed', 'cancelled'];
const INACTIVE_STATUSES = ['completed', 'cancelled', 'rejected', 'no_show'];

// Quick tabs → query params for GET /bookings. (today's date is filled in at request time.)
const TABS = {
  needs_action: { status: 'pending', sort: 'priority' },
  next2: { within: 2, sort: 'priority' },
  today: { sort: 'priority' },
  all: {},
};

// Monday (ISO) of the week containing `d`.
const mondayOf = (d) => d.subtract((d.day() + 6) % 7, 'day').startOf('day');

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
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  const [weekStart, setWeekStart] = useState(() => mondayOf(dayjs()));
  const [weekData, setWeekData] = useState([]);
  const [weekLoading, setWeekLoading] = useState(false);
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
      if (tab === 'today') params.date = dayjs().format('YYYY-MM-DD');
      if (tab === 'all' && status) params.status = status;
      if (search.trim()) params.employee_name = search.trim();
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
  }, [tab, status, search]);

  // Week-grid view loads its own Mon–Sun range (independent of the tab filters).
  const loadWeek = async () => {
    setWeekLoading(true);
    try {
      const from = weekStart.format('YYYY-MM-DD');
      const to = weekStart.add(6, 'day').format('YYYY-MM-DD');
      const params = { from, to, limit: 100 };
      if (search.trim()) params.employee_name = search.trim();
      const res = await api.get('/bookings', { params });
      setWeekData(res.data.data);
    } catch {
      message.error(t('admin.bookingsLoadErr'));
    } finally {
      setWeekLoading(false);
    }
  };

  useEffect(() => {
    if (viewMode === 'grid') loadWeek();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, weekStart, search]);

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
      // Slot bookings are auto-approved and self-managed — only full-day bookings
      // need an admin to approve / reject / complete them.
      render: (_, r) => {
        if (r.booking_type !== 'full_day') return <span style={{ color: '#bbb' }}>—</span>;
        return (
          <Space>
            {r.status === 'pending' && (
              <>
                <Button type="primary" size="small" onClick={() => openFullDayReview(r)}>{t('admin.approve')}</Button>
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
        );
      },
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
    { value: 'today', label: t('admin.tabToday') },
    { value: 'all', label: t('my.tabAll') },
  ];

  // When grouping, the first row of each day gets a separator class for visual contrast.
  const rowClassName = (record) => (groupByDay && spanByDate[record.booking_id] > 0 ? 'ab-day-start' : '');

  // Mon–Sun grid for the selected week. Booking cards sit under their day column;
  // today's column is highlighted.
  const renderWeekGrid = () => {
    const todayYmd = dayjs().format('YYYY-MM-DD');
    const days = Array.from({ length: 7 }, (_, i) => weekStart.add(i, 'day'));
    const byDay = {};
    for (const b of weekData) (byDay[b.booking_date?.slice(0, 10)] ||= []).push(b);
    const rangeLabel = `${weekStart.format('DD MMM')} – ${weekStart.add(6, 'day').format('DD MMM YYYY')}`;
    return (
      <div>
        <Space style={{ marginBottom: 12 }}>
          <Button onClick={() => setWeekStart(weekStart.subtract(7, 'day'))}>← {t('admin.prevWeek')}</Button>
          <Button onClick={() => setWeekStart(mondayOf(dayjs()))}>{t('admin.thisWeek')}</Button>
          <Button onClick={() => setWeekStart(weekStart.add(7, 'day'))}>{t('admin.nextWeek')} →</Button>
          <span style={{ color: '#666' }}>{rangeLabel}</span>
        </Space>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(150px, 1fr))', gap: 8, overflowX: 'auto' }}>
          {days.map((d) => {
            const ymd = d.format('YYYY-MM-DD');
            const isToday = ymd === todayYmd;
            const list = (byDay[ymd] || []).sort((a, b) => (a.slot_start || '').localeCompare(b.slot_start || ''));
            return (
              <div key={ymd} style={{ border: '1px solid #eee', borderRadius: 8, background: isToday ? '#f0f5ff' : '#fff', minHeight: 120 }}>
                <div style={{ padding: '6px 8px', borderBottom: '1px solid #eee', fontWeight: 600, color: isToday ? '#1d4ed8' : '#333' }}>
                  {d.format('ddd')} <span style={{ color: '#999', fontWeight: 400 }}>{d.format('DD/MM')}</span>
                </div>
                <div style={{ padding: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {list.length === 0 && <span style={{ color: '#ccc', fontSize: 12, padding: 4 }}>—</span>}
                  {list.map((b) => (
                    <div key={b.booking_id} style={{ border: '1px solid #f0f0f0', borderLeft: `3px solid ${b.booking_type === 'full_day' ? '#722ed1' : '#1677ff'}`, borderRadius: 6, padding: 6, fontSize: 12 }}>
                      <div style={{ fontWeight: 600 }}>{b.booking_type === 'full_day' ? t('book.fullDay') : `${b.slot_start}–${b.slot_end}`}</div>
                      <div style={{ color: '#666' }}>{b.vehicle_name}</div>
                      <div style={{ color: '#666' }}>{b.employee_name}</div>
                      <div style={{ marginTop: 2 }}><StatusBadge status={b.status} /></div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        {weekLoading && <div style={{ textAlign: 'center', padding: 16, color: '#999' }}>{t('common.loading')}</div>}
      </div>
    );
  };

  return (
    <Card
      title={t('nav.manageBookings')}
      extra={
        <Space wrap>
          <Segmented
            options={[{ value: 'list', label: t('admin.viewList') }, { value: 'grid', label: t('admin.viewGrid') }]}
            value={viewMode}
            onChange={setViewMode}
          />
          <Input.Search
            allowClear
            placeholder={t('admin.searchEmployee')}
            style={{ width: 200 }}
            defaultValue={search}
            onSearch={setSearch}
          />
          {viewMode === 'list' && <Segmented options={tabOptions} value={tab} onChange={setTab} />}
          {viewMode === 'list' && tab === 'all' && (
            <Select
              allowClear
              placeholder={t('admin.filterStatus')}
              style={{ width: 160 }}
              value={status}
              onChange={setStatus}
              options={STATUSES.map((s) => ({ value: s, label: t(`status.${s}`) }))}
            />
          )}
          {viewMode === 'list' && <Space size={4}><Switch size="small" checked={groupByDay} onChange={setGroupByDay} />{t('admin.groupByDay')}</Space>}
          {viewMode === 'list' && <Space size={4}><Switch size="small" checked={hideOld} onChange={setHideOld} />{t('admin.hideOld')}</Space>}
          {viewMode === 'list' && (
            <Popover trigger="click" content={columnManager} placement="bottomRight" title={t('admin.columns')}>
              <Button>{t('admin.columns')}</Button>
            </Popover>
          )}
          <Button onClick={() => (viewMode === 'grid' ? loadWeek() : load())}>{t('common.refresh')}</Button>
        </Space>
      }
    >
      <style>{`.ab-day-start > td { border-top: 2px solid #1d4ed8 !important; }`}</style>
      {viewMode === 'grid'
        ? renderWeekGrid()
        : <Table rowKey="booking_id" columns={columns} dataSource={view} loading={loading} rowClassName={rowClassName} pagination={{ pageSize: 20 }} scroll={{ x: 'max-content' }} />}

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
