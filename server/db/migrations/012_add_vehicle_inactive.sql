-- Soft-delete for vehicles: 'inactive' is excluded from availability/dashboards
-- but keeps the row (bookings FK-reference it).
ALTER TABLE vehicles
  MODIFY COLUMN status ENUM('active','maintenance','inactive') NOT NULL DEFAULT 'active';
