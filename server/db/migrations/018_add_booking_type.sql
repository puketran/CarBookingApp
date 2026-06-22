-- Full-day bookings. A 'full_day' booking locks a vehicle for the whole day; it
-- is stored with a synthetic 00:00–23:59 span so the existing
-- UNIQUE (vehicle_id, booking_date, slot_start) allows only one full-day per
-- vehicle/day and never collides with a real slot. Contact stays nullable at the
-- DB level (historical rows); it is enforced required in the API + form only.
ALTER TABLE bookings
  ADD COLUMN booking_type ENUM('slot', 'full_day') NOT NULL DEFAULT 'slot';
