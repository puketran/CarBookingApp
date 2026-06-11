# Phase 2 Roadmap — Production UI & MVP Features

**Goal:** reach the production design from the UI mockup — a mobile-first employee app and a desktop admin console — and fill in the MVP features the prototype deferred.

Baseline = prototype d01–d04 + in-app feedback (OTP auth, availability, bookings CRUD + status, basic AntD pages).

---

## What the mockup adds (gap summary)

**Design system / shells**
- Brand theme (blue primary, rounded cards, status color system, badges) via AntD `ConfigProvider` theme tokens.
- Two layout shells: **mobile bottom-tab** (employee: Book / My Bookings / Notifications / Profile) and **desktop sidebar** (admin: Dashboard / Bookings / Vehicles / Calendar / Users / Reports / Settings).
- Responsive web (the employee screens are phone-sized; confirm responsive web — not native — is acceptable).

**Employee**
- 4-step **booking wizard**: Date & Time → Vehicle → Details → Confirm.
- **Quick-Book presets** (Office HQ / Airport SGN / Client Visit / Custom) + destination/purpose.
- **Vehicle cards**: photo, seats, transmission, parking location, availability badge, "Nearest" tag.
- **My Bookings** tabs (All / Upcoming / Past / Cancelled), human **booking codes** (BK-YYYY-NNN), status-colored cards, booking **detail** view.
- **Notifications** + **Profile** screens.

**Admin**
- **Dashboard**: 4 KPI cards with %-deltas, per-vehicle utilisation bars, recent bookings w/ inline approve, trend.
- **Calendar**: month grid (vehicle × day) with Available / Booked / Completed / Maintenance states; Timeline toggle.
- **Vehicles** management (CRUD + maintenance).
- **Users** management (super-admin add/remove admin).
- **Reports / Export** (xlsx).

**Implied data/requirement changes**
- Vehicle: add `image_url`, `transmission`, `parking_location` (and possibly location for "Nearest").
- Booking: add a human reference code `BK-YYYY-NNN`.
- **Notifications** were *post-MVP* in the original plan — the mockup promotes them.

**Decisions locked (2026-06-11)**
- **Start:** M1 (design system) first.
- **Roles:** **employee / driver / admin** — *manager* and *super_admin* dropped (d06). Admins bootstrapped by `SUPER_ADMIN_EMAIL` (role `admin`) and promote others in the Users screen (M4). Driver linked to a vehicle via `vehicles.driver_user_id`; driver can see assigned trips, mark completed, set vehicle maintenance, confirm/decline assigned trip — **driver shell = new milestone d09**.
- **Approval:** kept (pending → approved).
- **Notifications:** in-app only (M5); no email/Teams/reminder yet.
- **Requester info:** auto from logged-in profile (contact entered).
- **Vehicle attributes:** static **seeded placeholder images**, `transmission`/`parking_location` as plain fields, **"Nearest" is a label only** (no geo/proximity, no upload).
- **Mobile:** responsive web (not native).

**Revised sequence (updated):** d06 role model ✅ → d07 M2 employee ✅ → **d08 driver experience ✅** → **d09 no-show/block rule** (`docs/rules.md` — needs alignment) → d10–11 M3 dashboard/calendar → d12 M4 vehicles/users/export → d13 M5 notifications → d14 M6 polish/email/deploy.

**New rule to schedule (d09):** `docs/rules.md` — block a user after 3 "didn't use the car" no-shows, with an admin section to manage the counts. Open questions before building: what records a no-show (driver/admin/auto), what "block" means (can't book vs can't log in), and what admins can reset.

---

## Milestones & targets

> Continues the day-file + `/check-todo` workflow. Suggested numbering d05+.

### M1 — Design system & layout shells  *(d05)*
**Target:** the app *looks* like the mockup shell, even before new features.
- AntD theme tokens (brand blue, radius, fonts, status palette).
- Mobile bottom-tab shell (employee) + desktop sidebar shell (admin); responsive.
- Shared components: `VehicleCard`, `StatusBadge`, `KPICard`, `BookingCard`, `StepHeader`.
- Backend: add vehicle fields (`image_url`, `transmission`, `parking_location`) + migration + seed images.

### M2 — Employee experience  *(d06–d07)*
**Target:** S1 + S2 fully match the mockup.
- Booking wizard (4 steps) with the new vehicle cards.
- Quick-Book presets + destination/purpose.
- My Bookings tabs + booking codes + detail view.
- Profile screen.
- Backend: booking-code generation; presets config.

### M3 — Admin dashboard & calendar  *(d08–d09)*
**Target:** S3 + S4 match the mockup.
- Dashboard UI (KPIs, utilisation bars, recent, trend, export button).
- Calendar UI (month grid vehicle×day, color states, timeline toggle).
- Backend: `/dashboard/*` endpoints (summary, utilisation, booking-trend, peak-hours) + a calendar/month-aggregation endpoint.

### M4 — Admin management & reports  *(d10)*
**Target:** sidebar items all work.
- Vehicles CRUD UI + maintenance windows.
- Users management UI (super-admin `POST /admin/users`, list, deactivate).
- Reports/Export UI; backend `/export/*` (xlsx via `exceljs`).

### M5 — Notifications  *(d11)*
**Target:** bell + Notifications tab work.
- `notifications` table + endpoints (list, mark-read); triggers on booking create/approve/reject.
- In-app delivery; email via Resend optional (depends on decision).

### M6 — Polish, real email, deploy  *(d12)*
**Target:** production-ready.
- Empty/loading/error states, accessibility, responsive QA.
- Swap mailer → **Resend** (real OTP email) + SPF/DKIM.
- Deploy frontend + backend to **Railway** (DB already there); env config; smoke test.
- Run the full [test-cases.md](test-cases.md) (the `MVP` cases are now built); 1-page user guide.

---

## Suggested order

1. **M1 first** — the design system unblocks every screen and makes everything after it look right.
2. Then **M2 (employee)** and **M3 (admin)** — can run in parallel if there's help; solo, do employee first (more user-facing).
3. **M4 → M5 → M6** to close out.

Each milestone becomes one or more `todos/dNN.md` files driven by `/check-todo`. Feedback collected via the in-app widget feeds the same loop (see [feedback-triage.md](feedback-triage.md)).
