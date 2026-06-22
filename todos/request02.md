# request02 — full-day bookings · mandatory contact · role guideline popups

## Source request
- Employee can request a **full-day booking** that locks a vehicle for the whole day even if others
  hold slots; **admin-approval only**; admin contacts/​rejects conflicting bookings manually; drivers
  **see** it but only **act** once approved; full-day must be requested **≥2 days ahead**.
- **Contact number is mandatory** on the booking form.
- **Role guideline popups** (employee / driver / admin) — same modal, localized content per role,
  shown on **every app open**; employees also after a successful booking.

## Decisions (confirmed)
- Contact required = booking only (drivers don't book).
- Full-day conflicts = **manual reject** (system surfaces conflicts; approved full-day blocks new bookings that day).
- Popup = **every app open** + employee after booking.

## Design
`booking_type ENUM('slot','full_day')` on bookings; full-day stored as synthetic `00:00–23:59` so the
existing `UNIQUE (vehicle_id, booking_date, slot_start)` allows one full-day/day and never collides
with real slots. Full-day creation ignores slot conflicts; an **approved** full-day blocks new
bookings. Contact enforced at API+form (DB stays nullable). Guideline content in a localized config
file (en/vi/zh).

## Tasks
### Backend
- [x] B1 — migration `018_add_booking_type.sql` (applied)
- [x] B2 — `bookingController.create`: full-day branch (force 00:00–23:59, skip slot check, ≥2-day rule → `FULLDAY_TOO_SOON`); slot branch guard against approved full-day → `FULLDAY_BLOCKED`; insert `booking_type`
- [x] B3 — `routes/bookings.js`: `booking_type` optional enum; `contact_number` required
- [x] B4 — `GET /bookings/:id/conflicts` (admin): same vehicle+date pending/approved, excl. self
- [x] B5 — `driverController.actOnTrip`: full-day confirm/decline only when `status='approved'`
- [x] B6 — `vehicleController` getAvailable + availability: approved full-day closes the day; availability returns per-day `full_day`

### Frontend
- [x] F1 — `BookVehicle`: Slot/Full-day segmented; full-day picker (≥2 days, not full-day-taken, skip slot step); required contact; new error messages; popup after success
- [x] F2 — `AdminBookings`: Type tag; pending full-day Approve → conflicts modal (reject each / confirm approve)
- [x] F3 — `DriverTrips`: full-day tag; disable confirm/decline until approved (+ BookingCard / MyBookings show "Full day")
- [x] F4 — `GuidelinesModal` + `config/guidelines.js` (en/vi/zh) + `GuidelinesProvider`/Shell trigger + header help icon + i18n chrome keys

### Verify
- [x] migrate + `vite build` + backend smoke: FULLDAY_TOO_SOON, required-contact 422, conflicts endpoint (admin 200 / employee 403), approved full-day → availability open:0 + getAvailable drops vehicle + slot create → FULLDAY_BLOCKED. All test rows cleaned up.

## ⚠️ Follow-up
- The local dev server on :3000 was running **stale** code during testing — **restart `npm run dev`** to pick up the backend changes.

## Notes
- Contact stays nullable at DB; enforcement API+form only.
- Analytics keep nominal slot count (full-day not modelled).
