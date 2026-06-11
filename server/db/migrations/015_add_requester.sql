-- Snapshot requester name/department on the booking so an employee can book
-- on behalf of someone (editable in the form). Reads fall back to the user's
-- profile when these are NULL (older rows).
ALTER TABLE bookings
  ADD COLUMN requester_name VARCHAR(255) NULL,
  ADD COLUMN department VARCHAR(255) NULL;
