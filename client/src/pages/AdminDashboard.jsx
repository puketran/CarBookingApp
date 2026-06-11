import { useEffect, useState } from 'react';
import { Row, Col, Card, Progress, Spin, App } from 'antd';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../api/axios';
import KPICard from '../components/KPICard';

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null);
  const [util, setUtil] = useState([]);
  const [trend, setTrend] = useState([]);
  const [peak, setPeak] = useState([]);
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [s, u, t, p] = await Promise.all([
          api.get('/dashboard/summary'),
          api.get('/dashboard/utilisation'),
          api.get('/dashboard/booking-trend', { params: { period: 'day' } }),
          api.get('/dashboard/peak-hours'),
        ]);
        setSummary(s.data);
        setUtil(u.data);
        setTrend(t.data);
        setPeak(p.data);
      } catch {
        message.error('Could not load the dashboard.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading || !summary) return <div style={{ textAlign: 'center', padding: 48 }}><Spin /></div>;

  return (
    <>
      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}><KPICard title="Total vehicles" value={summary.total_vehicles} sub="Active" /></Col>
        <Col xs={12} md={6}><KPICard title="Today's bookings" value={summary.todays_bookings} sub="Not cancelled" /></Col>
        <Col xs={12} md={6}><KPICard title="Utilisation" value={summary.utilisation_rate} suffix="%" sub="Today" /></Col>
        <Col xs={12} md={6}><KPICard title="Most used" value={summary.most_used_vehicle} sub="By bookings" /></Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} md={10}>
          <Card title="Vehicle utilisation (last 30 days)">
            {util.map((v) => (
              <div key={v.vehicle_id} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span>{v.vehicle_name}</span><span>{v.utilisation_pct}%</span>
                </div>
                <Progress percent={v.utilisation_pct} showInfo={false} />
              </div>
            ))}
            {util.length === 0 && <span style={{ color: '#999' }}>No data</span>}
          </Card>
        </Col>
        <Col xs={24} md={14}>
          <Card title="Booking trend (last 30 days)">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#1d4ed8" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card title="Peak booking hours">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={peak}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="slot" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#1d4ed8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>
    </>
  );
}
