-- Role model → employee / driver / admin (drop manager + super_admin).
-- Convert existing super_admins to admin BEFORE narrowing the enum, otherwise
-- those rows would be coerced to '' by the MODIFY.
UPDATE users SET role = 'admin' WHERE role = 'super_admin';

ALTER TABLE users
  MODIFY COLUMN role ENUM('employee','driver','admin') NOT NULL DEFAULT 'employee';
