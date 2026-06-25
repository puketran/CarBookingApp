import { useEffect, useState } from 'react';
import { Row, Col, Card, Segmented, Spin, Empty, Typography, Modal, App } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, Cell, PieChart, Pie, Legend,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import api from '../api/axios';
import KPICard from '../components/KPICard';
import { STATUS_HEX } from '../theme';
import { useLang } from '../i18n';

const RANGE_VALUES = [7, 30, 90];
const TYPE_COLORS = { slot: '#1d4ed8', full_day: '#722ed1' };

export default function AdminDashboard() {
  const [days, setDays] = useState(30);
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [peak, setPeak] = useState([]);
  const [breakdown, setBreakdown] = useState({ by_status: [], by_type: { slot: 0, full_day: 0 } });
  const [loading, setLoading] = useState(false);
  const [inbox, setInbox] = useState(null); // { full_day_pending, new_slots } when popup is showing
  const { message } = App.useApp();
  const { t } = useLang();
  const navigate = useNavigate();

  // On arrival, surface what needs attention (pending full-day + slots since last visit).
  useEffect(() => {
    const SEEN_KEY = 'adminInboxSeen';
    const since = localStorage.getItem(SEEN_KEY) || '';
    (async () => {
      try {
        const { data } = await api.get('/dashboard/inbox', { params: since ? { since } : {} });
        localStorage.setItem(SEEN_KEY, new Date().toISOString());
        if (data.full_day_pending > 0 || data.new_slots > 0) setInbox(data);
      } catch { /* non-blocking */ }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const period = days > 60 ? 'week' : 'day';
        const [s, tr, p, b] = await Promise.all([
          api.get('/dashboard/summary', { params: { days } }),
          api.get('/dashboard/booking-trend', { params: { days, period } }),
          api.get('/dashboard/peak-hours', { params: { days } }),
          api.get('/dashboard/breakdown', { params: { days } }),
        ]);
        setSummary(s.data);
        setTrend(tr.data);
        setPeak(p.data);
        setBreakdown(b.data);
      } catch {
        message.error(t('admin.dashboardLoadErr'));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  if (!summary) return <div style={{ textAlign: 'center', padding: 48 }}><Spin /></div>;

  const rangeOptions = RANGE_VALUES.map((v) => ({ value: v, label: t('admin.nDays', { n: v }) }));
  const lastNDays = t('admin.lastNDays', { n: days });

  const statusData = (breakdown.by_status || []).map((r) => ({ name: t(`status.${r.status}`), value: r.count, fill: STATUS_HEX[r.status] || '#d9d9d9' }));
  const typeData = [
    { name: t('admin.bySlot'), value: breakdown.by_type?.slot || 0, fill: TYPE_COLORS.slot },
    { name: t('book.fullDay'), value: breakdown.by_type?.full_day || 0, fill: TYPE_COLORS.full_day },
  ];
  const hasStatus = statusData.some((d) => d.value > 0);
  const hasType = typeData.some((d) => d.value > 0);

  const donut = (chartData, has) => (
    <ResponsiveContainer width="100%" height={240}>
      {has ? (
        <PieChart>
          <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
            {chartData.map((d, i) => <Cell key={i} fill={d.fill} />)}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      ) : <></>}
    </ResponsiveContainer>
  );

  return (
    <Spin spinning={loading}>
      <Modal
        open={!!inbox}
        title={t('admin.inboxTitle')}
        onCancel={() => setInbox(null)}
        onOk={() => { setInbox(null); navigate('/admin'); }}
        okText={t('admin.inboxGo')}
        cancelText={t('admin.close')}
      >
        <p style={{ fontSize: 15 }}>{t('admin.inboxFullDay', { n: inbox?.full_day_pending || 0 })}</p>
        <p style={{ fontSize: 15 }}>{t('admin.inboxNewSlots', { n: inbox?.new_slots || 0 })}</p>
      </Modal>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>{t('nav.dashboard')}</Typography.Title>
        <Segmented options={rangeOptions} value={days} onChange={setDays} />
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}><KPICard title={t('admin.kpiActiveEmployees')} value={summary.active_employees} sub={lastNDays} icon="👥" accent="#1d4ed8" /></Col>
        <Col xs={12} md={6}><KPICard title={t('admin.kpiAvgPerEmployee')} value={summary.avg_bookings_per_employee} sub={lastNDays} icon="📈" accent="#16a34a" /></Col>
        <Col xs={12} md={6}><KPICard title={t('admin.kpiFullDayPending')} value={summary.full_day_pending} sub={t('admin.needsApproval')} icon="🗓️" accent="#fa8c16" /></Col>
        <Col xs={12} md={6}><KPICard title={t('admin.kpiTotalBookings')} value={summary.total_bookings} sub={lastNDays} icon="🚗" accent="#722ed1" /></Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card title={t('admin.bookingTrend', { n: days })}>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trend} margin={{ left: -10, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1d4ed8" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} interval="preserveStartEnd" minTickGap={24} tickFormatter={(v) => (v?.length === 10 ? v.slice(5) : v)} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Area type="monotone" dataKey="count" stroke="#1d4ed8" strokeWidth={2} fill="url(#trendFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title={t('admin.bookingsByStatus')}>
            {hasStatus ? donut(statusData, true) : <Empty description={t('admin.noData')} style={{ padding: 40 }} />}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card title={t('admin.peakHours')}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={peak} margin={{ left: -10, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="slot" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#1d4ed8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title={t('admin.fullDayVsSlot')}>
            {hasType ? donut(typeData, true) : <Empty description={t('admin.noData')} style={{ padding: 40 }} />}
          </Card>
        </Col>
      </Row>
    </Spin>
  );
}
