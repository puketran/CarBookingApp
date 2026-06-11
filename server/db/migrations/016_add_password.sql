-- Password auth: OTP is now register/forgot only; login uses email + password.
ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NULL;
