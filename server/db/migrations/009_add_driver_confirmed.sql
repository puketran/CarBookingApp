-- Driver acknowledgement of an assigned, admin-approved trip.
-- NULL = not acted, 1 = confirmed, 0 = declined.
ALTER TABLE bookings ADD COLUMN driver_confirmed TINYINT(1) NULL;
