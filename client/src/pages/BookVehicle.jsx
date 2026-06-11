import { useEffect, useState } from 'react';
import { Card, Steps, Form, Input, InputNumber, Button, Space, Descriptions, Spin, Empty, App } from 'antd';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import VehicleCard from '../components/VehicleCard';
import { QUICK_BOOK } from '../config/quickBook';

const SLOTS = ['08:00-10:00', '10:30-12:30', '13:00-15:00', '15:30-17:30', '18:00-20:00'];

// Shared block style for day / slot pickers.
function block(state, onClick, children) {
  const styles = {
    open: { background: '#f6ffed', border: '1px solid #b7eb8f', color: '#389e0d', cursor: 'pointer' },
    selected: { background: '#1d4ed8', border: '1px solid #1d4ed8', color: '#fff', cursor: 'pointer' },
    disabled: { background: '#f5f5f5', border: '1px solid #eee', color: '#bbb', cursor: 'not-allowed', textDecoration: state === 'taken' ? 'line-through' : 'none' },
  };
  const key = state === 'selected' ? 'selected' : state === 'open' ? 'open' : 'disabled';
  return (
    <div onClick={key === 'disabled' ? undefined : onClick} style={{ ...styles[key], borderRadius: 8, padding: '8px 6px', textAlign: 'center', fontSize: 13, userSelect: 'none' }}>
      {children}
    </div>
  );
}

export default function BookVehicle() {
  const [step, setStep] = useState(0);
  const [vehicles, setVehicles] = useState([]);
  const [vehicleId, setVehicleId] = useState(null);
  const [avail, setAvail] = useState(null); // { weeks, days }
  const [date, setDate] = useState(null);
  const [slot, setSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { message } = App.useApp();
  const [form] = Form.useForm();

  useEffect(() => {
    (async () => {
      try { setVehicles((await api.get('/vehicles/active')).data); }
      catch { message.error('Could not load vehicles.'); }
    })();
  }, []);

  const pickVehicle = async (id) => {
    setVehicleId(id);
    setDate(null);
    setSlot(null);
    setLoading(true);
    try {
      setAvail((await api.get(`/vehicles/${id}/availability`)).data);
      setStep(1);
    } catch {
      message.error('Could not load availability.');
    } finally {
      setLoading(false);
    }
  };

  const dayInfo = avail?.days.find((d) => d.date === date);
  const selectedVehicle = vehicles.find((v) => v.vehicle_id === vehicleId);

  const submit = async () => {
    const v = form.getFieldsValue(true);
    const [slot_start, slot_end] = slot.split('-');
    setSubmitting(true);
    try {
      const { data } = await api.post('/bookings', {
        vehicle_id: vehicleId, booking_date: date, slot_start, slot_end,
        destination: v.destination, purpose: v.purpose, passenger_count: v.passenger_count,
        contact_number: v.contact_number, requester_name: v.requester_name, department: v.department,
      });
      message.success(`Booking ${data.code} submitted — awaiting approval.`);
      navigate('/my-bookings');
    } catch (err) {
      const s = err.response?.status;
      if (s === 409) { message.error('That slot was just taken. Pick another.'); pickVehicle(vehicleId); }
      else if (s === 403) message.error(err.response.data?.message || 'Booking blocked.');
      else message.error(err.response?.data?.message || 'Booking failed.');
    } finally {
      setSubmitting(false);
    }
  };

  // group days into weeks of 7 for the grid
  const weeks = [];
  if (avail) for (let i = 0; i < avail.days.length; i += 7) weeks.push(avail.days.slice(i, i + 7));

  return (
    <Card title="Book a Vehicle" styles={{ body: { padding: 12 } }}>
      <Steps size="small" current={step} items={[{ title: 'Car' }, { title: 'Day' }, { title: 'Slot' }, { title: 'Details' }]} style={{ marginBottom: 16 }} />

      {step === 0 && (
        vehicles.length === 0 ? <Empty description="No vehicles" /> :
        vehicles.map((v) => <VehicleCard key={v.vehicle_id} vehicle={v} selected={vehicleId === v.vehicle_id} onSelect={() => pickVehicle(v.vehicle_id)} />)
      )}

      {step === 1 && (
        loading || !avail ? <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div> : (
          <>
            <div style={{ color: '#666', marginBottom: 8 }}>{selectedVehicle?.vehicle_name} · pick a day <span style={{ color: '#389e0d' }}>(green = open)</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, fontSize: 11, color: '#999', textAlign: 'center', marginBottom: 4 }}>
              {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => <div key={d}>{d}</div>)}
            </div>
            {weeks.map((wk, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 6 }}>
                {wk.map((d) => {
                  const state = date === d.date ? 'selected' : (d.past || d.open === 0) ? 'disabled' : 'open';
                  return <div key={d.date}>{block(state, () => { setDate(d.date); setSlot(null); setStep(2); }, d.date.slice(8))}</div>;
                })}
              </div>
            ))}
            <Button style={{ marginTop: 8 }} onClick={() => setStep(0)}>Back</Button>
          </>
        )
      )}

      {step === 2 && dayInfo && (
        <>
          <div style={{ color: '#666', marginBottom: 8 }}>{selectedVehicle?.vehicle_name} · {date} — pick a slot</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {SLOTS.map((s) => {
              const taken = dayInfo.takenSlots.includes(s.split('-')[0]);
              const state = slot === s ? 'selected' : taken ? 'taken' : 'open';
              return <div key={s}>{block(state, () => { setSlot(s); setStep(3); }, s)}</div>;
            })}
          </div>
          <Button style={{ marginTop: 12 }} onClick={() => setStep(1)}>Back</Button>
        </>
      )}

      {step === 3 && (
        <Form layout="vertical" form={form} initialValues={{ passenger_count: 1, requester_name: user?.name, department: user?.department }}>
          <Descriptions size="small" column={1} style={{ marginBottom: 12 }}>
            <Descriptions.Item label="Vehicle">{selectedVehicle?.vehicle_name}</Descriptions.Item>
            <Descriptions.Item label="When">{date} · {slot}</Descriptions.Item>
          </Descriptions>
          <Space wrap style={{ marginBottom: 12 }}>
            {QUICK_BOOK.map((p) => <Button key={p.key} size="small" onClick={() => form.setFieldsValue({ destination: p.destination, purpose: p.purpose })}>{p.label}</Button>)}
          </Space>
          <Form.Item name="destination" label="Destination" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="purpose" label="Purpose"><Input /></Form.Item>
          <Form.Item name="passenger_count" label="Passengers" rules={[{ required: true }]}><InputNumber min={1} max={selectedVehicle?.capacity || 7} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="contact_number" label="Contact number"><Input /></Form.Item>
          <Form.Item name="requester_name" label="Requester name"><Input /></Form.Item>
          <Form.Item name="department" label="Department"><Input /></Form.Item>
          <Space>
            <Button onClick={() => setStep(2)}>Back</Button>
            <Button type="primary" loading={submitting} onClick={async () => { await form.validateFields(); submit(); }}>Submit booking</Button>
          </Space>
        </Form>
      )}
    </Card>
  );
}
