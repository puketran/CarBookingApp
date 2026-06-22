-- Per-driver time slots. When a driver has no rows here, the app falls back to
-- the 5 default fixed slots in config/slots.js, so existing behaviour is preserved.
CREATE TABLE IF NOT EXISTS slots (
  slot_id        INT PRIMARY KEY AUTO_INCREMENT,
  driver_user_id INT NOT NULL,
  slot_start     TIME NOT NULL,
  slot_end       TIME NOT NULL,
  is_active      TINYINT(1) NOT NULL DEFAULT 1,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_driver_slot_start (driver_user_id, slot_start),
  CONSTRAINT fk_slot_driver FOREIGN KEY (driver_user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
