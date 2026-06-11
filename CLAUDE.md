# CLAUDE.md

This file orients Claude Code on the project. Read `docs/` for full detail.

## What this is

An internal office car booking web app. Employees book company vehicles into
fixed time slots; admins approve bookings and manage the fleet; a super admin
manages who is an admin. Built to replace manual Excel-based booking and to
prevent double-booking.

## Current status (2026-06-11)

Full app **built and working against a live Railway MySQL** — Phase 2 M1–M5 done; only production deploy (M6, 👤) remains.

| Area | State |
|---|---|
| Backend (auth, bookings, driver, admin, dashboard, calendar, export, notifications, feedback) | ✅ done, verified via curl |
| Frontend (React + AntD: employee wizard, driver app, admin console) | ✅ built; visual click-through pending |
| Real email (Resend) | ✅ wired (stays console until `RESEND_API_KEY` set) |
| Production deploy to Railway | ⛔ pending — 👤 tasks in `todos/d14.md` |

Day files: **d01–d13 complete** (d04 = 9/10, manual browser click-through pending); **d14 = code done, 👤 deploy tasks open**. See `docs/roadmap-phase2.md`.

## Read these first

- `docs/thiet-ke-cap-nhat-email-otp-railway.md` — **the latest, authoritative design.** Email OTP + Railway. Start here.
- `docs/api-spec.md` — API endpoint specification (note: dashboard/export/vehicle-CRUD endpoints in here are not built yet).
- `docs/roadmap-phase2.md` — production-UI roadmap (M1–M6) derived from the UI mockup, with locked decisions.
- `docs/test-cases.md` — full test matrix (PROTO = built, MVP = deferred).
- `docs/feedback-triage.md` — how in-app feedback becomes new day files.
- `docs/project-plan.md` — original 10-day plan (auth/roles superseded by the OTP design).

If anything in the older docs conflicts with `thiet-ke-cap-nhat-email-otp-railway.md`, the latter wins.

## Tech stack (as built)

- Frontend: React + Ant Design + Vite + react-router-dom + axios + dayjs
- Backend: Node.js / Express + mysql2 + jsonwebtoken + express-validator + express-rate-limit + helmet + cors
- Database: MySQL on **Railway** (connected via `DATABASE_URL`; mysql2 pool is lazy)
- Auth: **email + password** login (password hashed with Node **scrypt**, salted). **OTP is register/forgot-password only** — 6-digit code (SHA-256, 5-min, single-use) → `set-password`. **Open self-registration** (any email can OTP→set-password to create an `employee`). JWT (12h) carries the role.
- Email: pluggable `server/services/mailer.js`. **Resend is wired** — sends real email when `RESEND_API_KEY` + `EMAIL_FROM` are set, else logs the OTP to the server console (dev default).
- Hosting: Railway (Hobby, 24/7). **Production is single-service**: in `NODE_ENV=production` Express serves the built React app (`client/dist`) + API on one port. App not deployed yet (DB is); deploy = the remaining 👤 tasks in `todos/d14.md`.

## Repo structure (built)

```
/server
  app.js                  express app (helmet, cors, json, /api/v1, error handler, /health)
  config/                 db.js (mysql2 pool from DATABASE_URL), slots.js (5 fixed slots)
  db/migrations/          001..006 .sql ; migrate.js (tracks applied in schema_migrations) ; seed.js
  middleware/             auth.js (JWT), role.js (requireRole), validate.js, error.js
  services/               otp.js (SHA-256), jwt.js, mailer.js (console in dev)
  controllers/            authController, vehicleController, bookingController, feedbackController
  routes/                 index.js + auth.js, vehicles.js, bookings.js, feedback.js
/client
  src/
    api/axios.js          baseURL /api/v1, attaches JWT, 401 -> /login
    context/AuthContext.jsx
    layouts/              EmployeeLayout (mobile bottom-tab), AdminLayout (desktop sidebar)
    components/           ProtectedRoute, FeedbackButton, StatusBadge, VehicleCard, KPICard, BookingCard
    pages/                Login, BookVehicle, MyBookings, AdminBookings, AdminFeedback, ComingSoon
    theme.js              brand tokens + status color palette
  public/vehicles/        placeholder car SVGs
  vite.config.js          proxies /api -> :3000 ; host:true (LAN access)
/todos                    dNN.md day files (driven by the check-todo skill)
/docs                     design + roadmap + test cases + feedback triage
/.claude/skills/check-todo  the day-file workflow skill (SKILL.md + todo.mjs)
```

## How to run (local dev)

```bash
# backend — prints OTP codes to this console; needs DATABASE_URL in server/.env
cd server && npm install && npm run migrate && npm run seed && npm run dev   # :3000

# frontend — open this in the browser
cd client && npm install && npm run dev                                       # :5173
```
- **Login:** seeded accounts use password **`password123`** (set by `npm run seed`). "Set / forgot password" emails an OTP — in dev the 6-digit code prints in the **backend console**.
- **LAN access:** Vite is `host:true`; other devices on the same Wi-Fi open `http://<this-machine-LAN-IP>:5173` (only :5173 needs exposing; `/api` is proxied). Find IP: `ipconfig getifaddr en0`.
- `DATABASE_URL` must be the Railway **public** proxy URL (`*.proxy.rlwy.net`), not the `*.railway.internal` one.

## Database

Tables: `users`, `otp_codes`, `vehicles`, `bookings`, `feedback`, plus `schema_migrations`.
Run `npm run migrate` (idempotent — applies only new files) then `npm run seed` (only seeds when empty; backfills vehicle media).

Seeded users (default password **`password123`**; new emails can self-register via OTP):

| email | role |
|---|---|
| employee@company.com | employee |
| driver@company.com | driver (drives Innova 01) |
| admin@company.com | admin |
| hoa.tranbinh@gameloft.com | admin (= `SUPER_ADMIN_EMAIL` bootstrap) |

## Implemented API (`/api/v1`)

- **Auth/health:** `GET /health` · `GET /slots` · `POST /auth/login` · `POST /auth/request-otp` · `POST /auth/set-password` · `PATCH /auth/password` · `GET /me` · `GET /admin/ping`
- **Bookings:** `GET /vehicles/available?date=` · `GET /bookings` (scoped) · `GET /bookings/:id` · `POST /bookings` (blocks if no-show-blocked) · `PATCH /bookings/:id/status`
- **Driver:** `GET /driver/trips` · `PATCH /driver/trips/:id` (confirm/decline/complete/no_show) · `GET /driver/vehicles` · `PATCH /driver/vehicles/:id/status`
- **Admin — vehicles:** `GET/POST /vehicles` · `PUT/DELETE /vehicles/:id` (soft-delete → `inactive`)
- **Admin — users:** `GET /admin/users` (+ no-show counts) · `POST /admin/users` · `PATCH /admin/users/:id` (role/active/unblock)
- **Admin — analytics:** `GET /dashboard/{summary,utilisation,booking-trend,peak-hours}` · `GET /calendar?month=` · `GET /export/{bookings,utilisation,monthly}` (.xlsx)
- **Feedback:** `POST /feedback` · `GET /feedback` (admin) · `PATCH /feedback/:id` (admin)

All `/driver/*` require role `driver`; `/admin/*`, `/dashboard/*`, `/calendar`, `/export/*`, and vehicle/feedback management require role `admin`.

## Roles (employee / driver / admin)

- `employee` — book, view, cancel own bookings
- `driver` — see trips assigned to their vehicle, mark trip completed, set vehicle maintenance, confirm/decline assigned trip *(built in d08; endpoints under `/driver/*`)*
- `admin` — manage vehicles & bookings, approve, dashboards, reports, export

*manager* and *super_admin* were dropped (see d06 / `docs/roadmap-phase2.md`). Admins are bootstrapped by `SUPER_ADMIN_EMAIL` (role just `admin`) and promote/demote others in the Users screen (M4). A driver is linked to a vehicle via `vehicles.driver_user_id`.

## Key business rules (do not break these)

1. A slot locks the moment a booking is submitted (status = pending), not on approval — this is how double-booking is prevented.
2. DB enforces `UNIQUE (vehicle_id, booking_date, slot_start)` as a hard safety net; catch error 1062 → `409 SLOT_CONFLICT`.
3. Time slots are fixed (08:00-10:00, 10:30-12:30, 13:00-15:00, 15:30-17:30, 18:00-20:00). Slot not in the list → `422 INVALID_SLOT`.
4. Booked slots disappear from the employee booking screen. Fully-booked days are disabled on the calendar.
5. Auth: login is **email + password**. OTP is only for register/forgot → `set-password` (open self-registration creates an `employee`). OTP: 6-digit, SHA-256, 5-min, single-use; lock after 5 wrong attempts; rate-limit 5 requests/email/hour. Logged-in users change their password at `PATCH /auth/password` (Profile screen).
6. Booking statuses: pending → approved/rejected → completed/cancelled/no_show. completed/cancelled/rejected/no_show are terminal. Employee can only cancel own *pending*.
7. No-show strikes: a **driver** can mark an approved trip `no_show`. `noshow_limit` (default 3) no-shows in a calendar month → `booking_blocked_until = today + ban_months` (default 2) and `POST /bookings` returns `403 USER_BLOCKED`. Admins view counts and unblock at `/admin/users`.
8. Weekly limit: a user may hold at most `bookings_per_week` (default 1) non-cancelled bookings per **Mon–Sun week** (by trip date) → else `403 WEEKLY_LIMIT`.
9. Tunable controls live in the `settings` table (key/value), edited at **/admin/settings**: `booking_weeks` (employee day-picker window), `bookings_per_week`, `noshow_limit`, `ban_months`.
10. Employee booking flow is **car → day → slot → details**; the day picker shows the next `booking_weeks` weeks (Mon–Sun); requester name/department are snapshot on the booking (book-on-behalf).

## Known issues

- **Cancelled slot not re-bookable** (test case BOOK-19): the unique constraint covers all statuses, so a cancelled/rejected booking still blocks that slot. Fix before MVP (delete-on-cancel or status-aware index).

## Security must-haves

- Store OTP **hashes** (SHA-256), never raw codes.
- Rate-limit OTP requests (max 5 per email per hour); lock after 5 wrong verifies.
- Never commit secrets — `.env` is gitignored. Secrets: `JWT_SECRET`, `SUPER_ADMIN_EMAIL`, `DATABASE_URL` (and `RESEND_API_KEY` once email is wired).

## How to work with me

- This is a solo-dev MVP. Favor simplicity over cleverness.
- **Workflow:** work is planned as `todos/dNN.md` day files (Goal → Task status → Implementation details) and driven by the **`/check-todo`** skill — read the day, plan, ask which tasks to do, implement, tick checkboxes, surface a 👤 banner for anything only the user can do.
- **Feedback loop:** in-app Feedback widget → `feedback` table → admin reviews at `/admin/feedback` → triage into a new day file → `/check-todo` → ship → add a test case. See `docs/feedback-triage.md`.
- Build order for new backend features follows the roadmap: design system (done) → employee wizard → admin dashboard/calendar → management/export → notifications → real email + deploy.
- Ask before introducing new dependencies beyond those already in `server/package.json` / `client/package.json`.
