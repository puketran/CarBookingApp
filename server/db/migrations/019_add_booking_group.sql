-- Multi-day full-day bookings. A full-day reservation spanning several days is
-- stored as one booking row per day (so the existing per-day slot logic and the
-- UNIQUE (vehicle_id, booking_date, slot_start) constraint keep working), with all
-- rows sharing a booking_group_id. Approve / reject / cancel act on the whole group.
-- NULL for single slot bookings; set (= the first row's id) for every full-day row.
ALTER TABLE bookings
  ADD COLUMN booking_group_id INT NULL,
  ADD INDEX idx_booking_group (booking_group_id);
