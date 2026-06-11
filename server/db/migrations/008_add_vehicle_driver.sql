-- A driver is a real user; link each vehicle to its driver account.
ALTER TABLE vehicles
  ADD COLUMN driver_user_id INT NULL,
  ADD CONSTRAINT fk_vehicle_driver FOREIGN KEY (driver_user_id) REFERENCES users(user_id);
