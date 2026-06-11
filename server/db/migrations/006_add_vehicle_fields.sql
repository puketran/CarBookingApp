-- Production-UI vehicle attributes (mockup): photo, transmission, parking.
ALTER TABLE vehicles
  ADD COLUMN image_url VARCHAR(255) NULL,
  ADD COLUMN transmission ENUM('auto','manual') NOT NULL DEFAULT 'auto',
  ADD COLUMN parking_location VARCHAR(100) NULL;
