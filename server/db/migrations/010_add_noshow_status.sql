-- A driver-marked no-show is a terminal booking state, counted toward strikes.
ALTER TABLE bookings
  MODIFY COLUMN status ENUM('pending','approved','rejected','completed','cancelled','no_show') NOT NULL DEFAULT 'pending';
