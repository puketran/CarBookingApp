# request07 — Driver / Employee / Admin improvements

> ## 🔔 USER ACTION REQUIRED (👤)
> 1. **Set `DEVELOPER_PASSWORD`** in `server/.env` (and Railway env) — the Developer tab and the
>    "clear all bookings" tool are locked until this is set. With no value set, verification always fails.
> 2. **Run the migration:** `cd server && npm run migrate` to apply `020_request07.sql`
>    (adds `bookings.status_note`, `vehicles.maintenance_note`, and the `fullday_max_days` setting).

## Goal
Turn the raw feedback list into shipped features across the driver app, employee booking
wizard, and admin console. Locked decisions: multi-day = refine the existing full-day flow;
weekends blocked for **all** bookings; admin Mon–Sun grid is an **added** view toggle; the
developer tab **wipes all bookings**, gated by `DEVELOPER_PASSWORD` + a typed confirmation.

## Tasks

### Foundation
- [x] Migration `020_request07.sql`: `bookings.status_note`, `vehicles.maintenance_note`, `fullday_max_days` setting
- [x] `fullday_max_days` in settings service `DEFAULTS` + AdminSettings field (max-full-day config, #18/#8)

### Driver view
- [x] Highlight today's trips + full-day trips (accent border / tint) (#1)
- [x] Prominent timeslot tag on each trip card (#3)
- [x] "Today" filter mode (Pending | Today | All) (#5)
- [x] No-show requires a note (modal); stored in `status_note`, visible to admins (#6)
- [x] Maintenance prompts for a message; shown to admins + employees via banner (#4)

### Employee view
- [x] Weekends disabled in both pickers + rejected server-side (#9, all bookings)
- [x] Continuous multi-day full-day range capped by `fullday_max_days`; inline error on violation (#8, #10, #11)

### Admin view
- [x] Mon–Sun **Week-grid** view toggle, prev/next week, today's column highlighted (#13)
- [x] Approve/reject/complete actions only on full-day rows; slot rows show "—" (#14)
- [x] Day separators when grouped by day (#15)
- [x] "Today" tab (#16)
- [x] Employee search bar (matches requester/account name + email) (#17)
- [x] Feedback tab shows employee name (#19)
- [x] Developer tab — `DEVELOPER_PASSWORD` gate → typed `DELETE` → clear all bookings (#20, #21)

### Cross-cutting
- [x] `GET /maintenance-notices` + MaintenanceNotice banner in employee & admin layouts
- [x] i18n keys added (en / zh / vi)

## Implementation details
- **Backend**: `bookingController.js` (`isWeekend`, weekend rejection, `fullday_max_days`,
  `from`/`to` range filter, broadened `employee_name` search, `status_note` in select);
  `driverController.js` (store decline/no-show reason, maintenance note, `maintenanceNotices`);
  `feedbackController.js` (LEFT JOIN users → `employee_name`); `adminController.js`
  (`verifyDev`, `clearAllBookings`); `vehicleController.js` availability echoes `weekend` +
  `fullday_max_days`. Routes wired in `admin.js`, `driver.js`, `index.js`.
- **Frontend**: `BookVehicle.jsx`, `DriverTrips.jsx`, `AdminBookings.jsx`, `AdminFeedback.jsx`,
  new `AdminDeveloper.jsx` (+ nav/route), new `MaintenanceNotice.jsx`, `AdminSettings.jsx`,
  both layouts, `i18n.jsx`.

## Verification
See the approved plan. Quick path: run `npm run migrate`, set `DEVELOPER_PASSWORD`, `./dev.sh`,
then exercise each role per the checklist. Client `npm run build` passes.
