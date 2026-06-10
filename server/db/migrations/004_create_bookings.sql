CREATE TABLE IF NOT EXISTS bookings (
  booking_id      INT PRIMARY KEY AUTO_INCREMENT,
  vehicle_id      INT NOT NULL,
  user_id         INT NOT NULL,
  destination     VARCHAR(255),
  purpose         VARCHAR(255),
  passenger_count INT,
  booking_date    DATE NOT NULL,
  slot_start      TIME NOT NULL,
  slot_end        TIME NOT NULL,
  status          ENUM('pending','approved','rejected','completed','cancelled') NOT NULL DEFAULT 'pending',
  contact_number  VARCHAR(50),
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_booking_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id),
  CONSTRAINT fk_booking_user    FOREIGN KEY (user_id)    REFERENCES users(user_id),
  -- Hard safety net against double-booking (app layer also checks).
  CONSTRAINT uq_vehicle_slot UNIQUE (vehicle_id, booking_date, slot_start)
);
