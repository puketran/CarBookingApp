# request01 — per-driver time slots + employee management

## Source request
- Admin can control time slots (add, modify, remove) **for each driver**.
- Admin can modify / remove employees (currently only role / active / unblock are editable).

## Goal
Make time slots configurable **per driver** instead of one global fixed list, and let admins
fully edit and delete user accounts. Keep the 5 fixed slots as the default fallback so nothing
breaks for drivers (or unassigned vehicles) that have no custom slots yet.

## Design (locked)
- New `slots` table keyed by `driver_user_id` (FK → users, ON DELETE CASCADE).
- A vehicle's bookable slots = its assigned driver's active slots; fall back to the 5 default
  slots when the driver has none configured (or the vehicle has no driver). `config/slots.js`
  stays the default source of truth.
- `services/slots.js` resolves slots for a driver or a vehicle.
- Booking validation + availability become per-vehicle (driver) instead of the global set.
- Slot management lives in the **Users** screen as a "Slots" action on driver rows (modal).
- User edit = name / department / email; delete is guarded (block self-delete and delete of a
  user that still has bookings or is a vehicle's driver → tell admin to deactivate instead).

## Tasks

### Backend
- [x] T1 — migration `017_create_slots.sql` (driver_user_id, slot_start, slot_end, is_active, unique per driver+start) — applied
- [x] T2 — `services/slots.js`: `getDriverSlots(driverId)` + `getVehicleSlots(vehicleId)` with default fallback
- [x] T3 — admin slot CRUD in `adminController` + routes (`/admin/users/:id/slots` GET/POST, `/admin/slots/:slotId` PATCH/DELETE)
- [x] T4 — `bookingController.createBooking`: validate slot against the vehicle's resolved slots
- [x] T5 — `vehicleController.getAvailable` + `availability`: compute open slots from the vehicle's resolved slots (availability now returns `slots`)
- [x] T6 — `adminController.updateUser`: allow name / department / email; add `deleteUser` (guarded: self / has-bookings / is-driver) + route

### Frontend
- [x] T7 — `BookVehicle`: render slot step from availability `slots` list (not the hardcoded array)
- [x] T8 — `AdminUsers`: Edit (name/dept/email) + Delete actions; "Slots" modal for driver rows (add/edit/remove)
- [x] T9 — n/a: AdminUsers was already all-English (no `t()`); BookVehicle change adds no new strings

## Notes
- Dashboard / calendar capacity math keeps the nominal 5-slots-per-day figure (analytics estimate only).
