import { useEffect, useState } from 'react';
import { Card, Steps, Form, Input, InputNumber, Button, Space, Descriptions, Spin, Empty, Segmented, Alert, App } from 'antd';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLang } from '../i18n';
import { useGuidelines } from '../components/GuidelinesModal';
import VehicleCard from '../components/VehicleCard';
import { QUICK_BOOK } from '../config/quickBook';

const FULLDAY_ADVANCE_DAYS = 2;

const DEFAULT_SLOTS = ['08:00-10:00', '10:30-12:30', '13:00-15:00', '15:30-17:30', '18:00-20:00'];

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
  const [mode, setMode] = useState('slot'); // 'slot' | 'full_day'
  const [vehicles, setVehicles] = useState([]);
  const [vehicleId, setVehicleId] = useState(null);
  const [avail, setAvail] = useState(null); // { weeks, slots, days }
  const [date, setDate] = useState(null);
  const [endDate, setEndDate] = useState(null); // full-day range end (null = single day)
  const [slot, setSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLang();
  const { show: showGuidelines } = useGuidelines();
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const isFullDay = mode === 'full_day';

  useEffect(() => {
    (async () => {
      try { setVehicles((await api.get('/vehicles/active')).data); }
      catch { message.error(t('book.couldNotLoad')); }
    })();
  }, []);

  const pickVehicle = async (id) => {
    setVehicleId(id);
    setDate(null);
    setEndDate(null);
    setSlot(null);
    setLoading(true);
    try {
      setAvail((await api.get(`/vehicles/${id}/availability`)).data);
      setStep(1);
    } catch {
      message.error(t('book.couldNotLoad'));
    } finally {
      setLoading(false);
    }
  };

  const dayInfo = avail?.days.find((d) => d.date === date);
  const maxDays = avail?.fullday_max_days;
  const selectedVehicle = vehicles.find((v) => v.vehicle_id === vehicleId);
  // Slots come from the vehicle's assigned driver (falls back to defaults server-side).
  const slotList = avail?.slots?.length
    ? avail.slots.map((s) => `${s.slot_start}-${s.slot_end}`)
    : DEFAULT_SLOTS;

  const submit = async () => {
    const v = form.getFieldsValue(true);
    const [slot_start, slot_end] = isFullDay ? ['00:00', '23:59'] : slot.split('-');
    setSubmitting(true);
    try {
      const { data } = await api.post('/bookings', {
        vehicle_id: vehicleId, booking_date: date, slot_start, slot_end,
        booking_type: isFullDay ? 'full_day' : 'slot',
        end_date: isFullDay ? (endDate || date) : undefined,
        destination: v.destination, purpose: v.purpose, passenger_count: v.passenger_count,
        contact_number: v.contact_number, requester_name: v.requester_name, department: v.department,
      });
      message.success(t('book.submitted', { code: data.code }));
      showGuidelines();
      navigate('/my-bookings');
    } catch (err) {
      const code = err.response?.data?.error;
      const s = err.response?.status;
      if (code === 'FULLDAY_TOO_SOON') message.error(t('book.fullDayTooSoon'));
      else if (code === 'FULLDAY_BLOCKED') message.error(t('book.fullDayBlocked'));
      else if (code === 'WEEKEND_NOT_ALLOWED') message.error(t('book.weekendBlocked'));
      else if (code === 'INVALID_RANGE') message.error(t('book.rangeInvalid'));
      else if (code === 'RANGE_TOO_LONG') message.error(err.response.data?.message || t('book.failed'));
      else if (s === 409) { message.error(isFullDay ? (err.response.data?.message || t('book.failed')) : t('book.slotTaken')); pickVehicle(vehicleId); }
      else if (s === 403) message.error(err.response.data?.message || t('book.failed'));
      else message.error(err.response?.data?.message || t('book.failed'));
    } finally {
      setSubmitting(false);
    }
  };

  // group days into weeks of 7 for the grid
  const weeks = [];
  if (avail) for (let i = 0; i < avail.days.length; i += 7) weeks.push(avail.days.slice(i, i + 7));

  return (
    <Card title={t('book.title')} styles={{ body: { padding: 12 } }}>
      <Steps size="small" current={step} items={[{ title: t('book.stepCar') }, { title: t('book.stepDay') }, { title: t('book.stepSlot') }, { title: t('book.stepDetails') }]} style={{ marginBottom: 16 }} />

      {step === 0 && (
        vehicles.length === 0 ? <Empty description={t('book.noVehicles')} /> :
        vehicles.map((v) => <VehicleCard key={v.vehicle_id} vehicle={v} selected={vehicleId === v.vehicle_id} onSelect={() => pickVehicle(v.vehicle_id)} />)
      )}

      {step === 1 && (
        loading || !avail ? <div style={{ textAlign: 'center', padding: 24 }}><Spin /></div> : (
          <>
            <Segmented
              block
              value={mode}
              onChange={(m) => { setMode(m); setDate(null); setEndDate(null); setSlot(null); }}
              options={[{ label: t('book.modeSlot'), value: 'slot' }, { label: t('book.modeFullDay'), value: 'full_day' }]}
              style={{ marginBottom: 10 }}
            />
            {isFullDay && <Alert type="info" showIcon style={{ marginBottom: 10 }} message={t('book.fullDayHint')} description={date && !endDate ? t('book.rangePickEnd', { date }) : t('book.rangeHint')} />}
            <div style={{ color: '#666', marginBottom: 8 }}>{selectedVehicle?.vehicle_name} · {t('book.pickDay')} <span style={{ color: '#389e0d' }}>{t('book.greenOpen')}</span> · <span style={{ color: '#999' }}>{t('book.weekendsClosed')}</span>{isFullDay && maxDays ? ` · ${t('book.rangeMaxHint', { n: maxDays })}` : ''}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, fontSize: 11, color: '#999', textAlign: 'center', marginBottom: 4 }}>
              {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => <div key={d}>{d}</div>)}
            </div>
            {weeks.map((wk, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 6 }}>
                {wk.map((d) => {
                  // Weekends are closed for every booking type.
                  // Full-day: needs ≥2 days' notice and no existing full-day that day.
                  // Slot: disabled when the day has no open slots.
                  const tooSoon = isFullDay && dayjs(d.date).diff(dayjs().startOf('day'), 'day') < FULLDAY_ADVANCE_DAYS;
                  const fullTaken = isFullDay && d.full_day && d.full_day !== 'none';
                  const blocked = d.weekend || (isFullDay ? (tooSoon || fullTaken) : d.open === 0);
                  // Full-day is a date range: first pick = start, a later pick = end.
                  const inRange = isFullDay && date && d.date >= date && d.date <= (endDate || date);
                  const state = (isFullDay ? inRange : date === d.date) ? 'selected' : (d.past || blocked) ? 'disabled' : 'open';
                  const go = () => {
                    if (!isFullDay) { setDate(d.date); setSlot(null); setStep(2); return; }
                    setSlot('full');
                    if (!date || endDate) { setDate(d.date); setEndDate(null); return; }   // start fresh
                    if (d.date < date) { setDate(d.date); setEndDate(null); return; }       // clicked earlier → new start
                    // End pick: enforce the max-span and no-weekend rules before continuing.
                    const span = dayjs(d.date).diff(dayjs(date), 'day') + 1;
                    if (maxDays && span > maxDays) { message.error(t('book.rangeTooLong', { n: maxDays })); return; }
                    const hasWeekend = (avail?.days || []).some((x) => x.date >= date && x.date <= d.date && x.weekend);
                    if (hasWeekend) { message.error(t('book.weekendBlocked')); return; }
                    setEndDate(d.date); setStep(3);                                          // end (or same day) → continue
                  };
                  return <div key={d.date}>{block(state, go, d.date.slice(8))}</div>;
                })}
              </div>
            ))}
            <Button style={{ marginTop: 8 }} onClick={() => setStep(0)}>{t('common.back')}</Button>
          </>
        )
      )}

      {step === 2 && dayInfo && (
        <>
          <div style={{ color: '#666', marginBottom: 8 }}>{selectedVehicle?.vehicle_name} · {date} — {t('book.pickSlot')}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {slotList.map((s) => {
              const taken = dayInfo.takenSlots.includes(s.split('-')[0]);
              const state = slot === s ? 'selected' : taken ? 'taken' : 'open';
              return <div key={s}>{block(state, () => { setSlot(s); setStep(3); }, s)}</div>;
            })}
          </div>
          <Button style={{ marginTop: 12 }} onClick={() => setStep(1)}>{t('common.back')}</Button>
        </>
      )}

      {step === 3 && (
        <Form layout="vertical" form={form} initialValues={{ passenger_count: 1, requester_name: user?.name, department: user?.department }}>
          <Descriptions size="small" column={1} style={{ marginBottom: 12 }}>
            <Descriptions.Item label={t('f.vehicle')}>{selectedVehicle?.vehicle_name}</Descriptions.Item>
            <Descriptions.Item label={t('f.date')}>{isFullDay && endDate && endDate !== date ? `${date} → ${endDate}` : date} · {isFullDay ? t('book.fullDay') : slot}</Descriptions.Item>
          </Descriptions>
          <div style={{ marginBottom: 6, fontSize: 13, color: '#666' }}>{t('book.quickBook')}</div>
          <Space wrap style={{ marginBottom: 12 }}>
            {QUICK_BOOK.map((p) => <Button key={p.key} size="small" onClick={() => form.setFieldsValue({ destination: p.destination, purpose: p.purpose })}>{p.label}</Button>)}
          </Space>
          <Form.Item name="destination" label={t('book.destination')} rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="purpose" label={t('book.purpose')}><Input /></Form.Item>
          <Form.Item name="passenger_count" label={t('book.passengers')} rules={[{ required: true }]}><InputNumber min={1} max={selectedVehicle?.capacity || 7} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="contact_number" label={t('book.contact')} rules={[{ required: true, message: t('book.contactRequired') }]}><Input /></Form.Item>
          <Form.Item name="requester_name" label={t('book.requester')}><Input /></Form.Item>
          <Form.Item name="department" label={t('book.department')}><Input /></Form.Item>
          <Space>
            <Button onClick={() => setStep(isFullDay ? 1 : 2)}>{t('common.back')}</Button>
            <Button type="primary" loading={submitting} onClick={async () => { await form.validateFields(); submit(); }}>{t('book.submit')}</Button>
          </Space>
        </Form>
      )}
    </Card>
  );
}
