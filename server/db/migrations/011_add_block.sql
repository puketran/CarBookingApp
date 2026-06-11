-- Monthly booking block: set when a user reaches 3 no-shows in a calendar month.
ALTER TABLE users ADD COLUMN booking_blocked_until DATE NULL;
