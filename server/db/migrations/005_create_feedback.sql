CREATE TABLE IF NOT EXISTS feedback (
  id         INT PRIMARY KEY AUTO_INCREMENT,
  user_id    INT,
  email      VARCHAR(255),
  page       VARCHAR(255),                                   -- which screen it came from
  category   ENUM('bug','idea','question','other') NOT NULL DEFAULT 'other',
  message    TEXT NOT NULL,
  status     ENUM('new','triaged','done','wontfix') NOT NULL DEFAULT 'new',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_feedback_status (status)
);
