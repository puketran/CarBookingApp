CREATE TABLE IF NOT EXISTS users (
  user_id    INT PRIMARY KEY AUTO_INCREMENT,
  email      VARCHAR(255) UNIQUE NOT NULL,
  name       VARCHAR(255),
  department VARCHAR(255),
  role       ENUM('employee','admin','super_admin') NOT NULL DEFAULT 'employee',
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
