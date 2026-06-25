-- request07 batch.
-- 1) status_note: a free-text reason a driver leaves when declining or marking a
--    trip no-show, so admins can review it later (surfaced in the booking detail).
-- 2) maintenance_note: the message a driver leaves when putting a vehicle into
--    maintenance; shown as a banner to employees and admins.
-- 3) fullday_max_days setting: admin-tunable cap on how many days a single full-day
--    reservation may span (was a hard-coded 14).
ALTER TABLE bookings
  ADD COLUMN status_note VARCHAR(500) NULL;

ALTER TABLE vehicles
  ADD COLUMN maintenance_note VARCHAR(500) NULL;

INSERT IGNORE INTO settings (skey, svalue) VALUES ('fullday_max_days', '14');
