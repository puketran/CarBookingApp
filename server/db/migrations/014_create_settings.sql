CREATE TABLE IF NOT EXISTS settings (
  skey   VARCHAR(50) PRIMARY KEY,
  svalue VARCHAR(100) NOT NULL
);

INSERT IGNORE INTO settings (skey, svalue) VALUES
  ('booking_weeks', '2'),
  ('bookings_per_week', '1'),
  ('noshow_limit', '3'),
  ('ban_months', '2');
