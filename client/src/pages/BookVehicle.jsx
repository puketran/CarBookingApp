import { useState } from 'react';
import { Card, DatePicker, Select, Form, Input, InputNumber, Button, Typography, Empty, App } from 'antd';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../api/axios';

export default function BookVehicle() {
  const [date, setDate] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [vehicleId, setVehicleId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [form] = Form.useForm();

  const loadAvailability = async (d) => {
    setDate(d);
    setVehicleId(null);
    setVehicles([]);
    form.resetFields(['slot']);
    if (!d) return;
    setLoading(true);
    try {
      const { data } = await api.get('/vehicles/available', { params: { date: d.format('YYYY-MM-DD') } });
      setVehicles(data);
    } catch {
      message.error('Could not load availability.');
    } finally {
      setLoading(false);
    }
  };

  const selectedVehicle = vehicles.find((v) => v.vehicle_id === vehicleId);

  const submit = async (values) => {
    const [slot_start, slot_end] = values.slot.split('-');
    setSubmitting(true);
    try {
      const { data } = await api.post('/bookings', {
        vehicle_id: vehicleId,
        booking_date: date.format('YYYY-MM-DD'),
        slot_start,
        slot_end,
        destination: values.destination,
        purpose: values.purpose,
        passenger_count: values.passenger_count,
        contact_number: values.contact_number,
      });
      message.success(`Booking #${data.booking_id} submitted — awaiting approval.`);
      navigate('/my-bookings');
    } catch (err) {
      if (err.response?.status === 409) {
        message.error('That slot was just taken. Pick another.');
        loadAvailability(date); // refresh so the taken slot disappears
      } else {
        message.error('Booking failed. Check the form and try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card title="Book a Vehicle" style={{ maxWidth: 640, margin: '0 auto' }}>
      <Form layout="vertical" form={form} onFinish={submit}>
        <Form.Item label="Date">
          <DatePicker
            style={{ width: '100%' }}
            value={date}
            onChange={loadAvailability}
            disabledDate={(d) => d && d < dayjs().startOf('day')}
          />
        </Form.Item>

        {date && (
          <Form.Item label="Vehicle">
            <Select
              loading={loading}
              placeholder={vehicles.length ? 'Select a vehicle' : 'No vehicles available'}
              value={vehicleId}
              onChange={(v) => { setVehicleId(v); form.resetFields(['slot']); }}
              options={vehicles.map((v) => ({
                value: v.vehicle_id,
                label: `${v.vehicle_name} · ${v.capacity} seats · ${v.driver_name}`,
              }))}
              notFoundContent={<Empty description="No availability" />}
            />
          </Form.Item>
        )}

        {selectedVehicle && (
          <>
            <Form.Item name="slot" label="Time slot" rules={[{ required: true }]}>
              <Select
                placeholder="Select a slot"
                options={selectedVehicle.available_slots.map((s) => ({
                  value: `${s.slot_start}-${s.slot_end}`,
                  label: `${s.slot_start} – ${s.slot_end}`,
                }))}
              />
            </Form.Item>
            <Form.Item name="destination" label="Destination" rules={[{ required: true }]}>
              <Input placeholder="e.g. Tan Son Nhat Airport" />
            </Form.Item>
            <Form.Item name="purpose" label="Purpose">
              <Input placeholder="e.g. Client pickup" />
            </Form.Item>
            <Form.Item name="passenger_count" label="Passengers" initialValue={1} rules={[{ required: true }]}>
              <InputNumber min={1} max={selectedVehicle.capacity} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="contact_number" label="Contact number">
              <Input placeholder="09xxxxxxxx" />
            </Form.Item>
            <Button type="primary" htmlType="submit" block loading={submitting}>
              Submit booking
            </Button>
          </>
        )}

        {date && !loading && vehicles.length === 0 && (
          <Typography.Text type="secondary">No vehicles have open slots on this date.</Typography.Text>
        )}
      </Form>
    </Card>
  );
}
