CREATE TABLE IF NOT EXISTS vehicles (
  vehicle_id    INT PRIMARY KEY AUTO_INCREMENT,
  license_plate VARCHAR(50),
  vehicle_name  VARCHAR(255),
  capacity      INT,
  driver_name   VARCHAR(255),
  status        ENUM('active','maintenance') NOT NULL DEFAULT 'active',
  notes         TEXT,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
