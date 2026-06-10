# Office Car Booking System — MVP Project Plan

**Team:** 1 solo developer  
**Stack:** React + Ant Design · Node.js/Express · MySQL · Microsoft Entra ID SSO  
**Target duration:** 10 working days (2 weeks)  
**Approval workflow:** Enabled (Pending → Approved by Admin)  
**Notifications:** Deferred to post-MVP

---

## Milestones at a Glance

| # | Milestone | Days | End of day |
|---|-----------|------|-----------|
| 1 | Project setup & auth | 1–2 | Day 2 |
| 2 | Vehicle & slot management | 3–4 | Day 4 |
| 3 | Booking core (employee flow) | 5–6 | Day 6 |
| 4 | Admin dashboard & controls | 7–8 | Day 8 |
| 5 | Export, polish & testing | 9–10 | Day 10 |

---

## Day-by-Day Breakdown

### Day 1–2 · Project Setup & Auth

**Goal:** Running skeleton with login working end-to-end.

**Tasks:**
- [ ] Scaffold Node.js/Express project (folder structure, ESLint, `.env`)
- [ ] Create MySQL database + run initial migration (users, vehicles, bookings tables)
- [ ] Implement Microsoft Entra ID SSO: OAuth2 callback → issue internal JWT
- [ ] JWT middleware: verify token, attach `req.user` with role
- [ ] Scaffold React app with Ant Design, React Router, Axios
- [ ] Build Login page (SSO redirect button)
- [ ] Implement role-based route guards on frontend (Employee / Admin / Manager layouts)
- [ ] Seed database: 3 vehicles, 3 test users (one per role)

**Deliverable:** Dev can log in via SSO, token is issued, role-protected routes work.

---

### Day 3–4 · Vehicle & Slot Management

**Goal:** Admin can manage the fleet; availability logic is correct.

**Tasks:**
- [ ] `GET /vehicles`, `POST /vehicles`, `PUT /vehicles/:id`, `DELETE /vehicles/:id`
- [ ] Admin UI: Vehicle list table (Ant Table) with Add / Edit / Deactivate actions
- [ ] Hardcode slot list in config: 5 fixed daily slots
- [ ] `GET /slots/available-days?month=YYYY-MM` — query DB for days with open slots
- [ ] `GET /vehicles/available?date=YYYY-MM-DD` — return vehicles + remaining slots
- [ ] Unit test: slot availability returns correct results when 1 slot is booked

**Deliverable:** Admin can add/edit vehicles. Availability API returns correct data.

---

### Day 5–6 · Booking Core (Employee Flow)

**Goal:** Employees can book; slot is locked on submit; double-booking is impossible.

**Tasks:**
- [ ] `POST /bookings` — insert with `status = pending`, enforce DB unique constraint
- [ ] Handle `SLOT_CONFLICT` (HTTP 409) gracefully on frontend
- [ ] `GET /bookings` (employee scope: own bookings only)
- [ ] `PATCH /bookings/:id/status` (employee: cancel own pending booking)
- [ ] Frontend — Employee "Book a vehicle" page:
  - Calendar picker (disabled dates = fully booked)
  - Vehicle selector (filtered by date)
  - Slot selector (only available slots shown)
  - Booking form (destination, purpose, passengers, contact)
  - Submit → success toast with Booking ID
- [ ] Frontend — Employee "My Bookings" list with status badges
- [ ] Integration test: two simultaneous POSTs for same slot → one succeeds, one gets 409

**Deliverable:** Full employee booking flow works, double-booking is blocked.

---

### Day 7–8 · Admin Dashboard & Controls

**Goal:** Admin can approve/reject bookings, view dashboard, filter and search.

**Tasks:**
- [ ] `GET /bookings` (admin scope: all bookings) with filter params
- [ ] `PATCH /bookings/:id/status` (admin: approve / reject / cancel)
- [ ] `PUT /bookings/:id` (admin: edit booking details)
- [ ] `GET /dashboard/summary`, `/utilisation`, `/booking-trend`, `/peak-hours`
- [ ] Frontend — Admin Booking Management table:
  - Filters: date range, vehicle, department, status
  - Row actions: Approve / Reject / Edit / Cancel
- [ ] Frontend — Admin Dashboard:
  - 4 KPI cards (total vehicles, today's bookings, utilisation rate, most-used)
  - Bar chart: vehicle utilisation (Ant Design Charts or Recharts)
  - Line chart: booking trend by day/week/month
  - Bar chart: peak hours
- [ ] Frontend — Admin Calendar view (Ant Calendar with colour coding)
- [ ] Frontend — Manager view: read-only dashboard + utilisation report

**Deliverable:** Admin can fully manage bookings; all dashboard charts render.

---

### Day 9–10 · Export, Polish & Testing

**Goal:** Excel export works; app is stable and ready for internal rollout.

**Tasks:**
- [ ] `GET /export/bookings`, `/export/utilisation`, `/export/monthly` — generate `.xlsx` with `exceljs`
- [ ] Frontend: Export button with date range picker → triggers file download
- [ ] End-to-end test walkthroughs (all 3 roles)
- [ ] Bug fixes from testing
- [ ] Input validation (server-side: `express-validator`; client-side: Ant Form rules)
- [ ] Error boundary on frontend — graceful error pages
- [ ] Environment config: `.env.production` for internal/Azure hosting
- [ ] Build and deploy to target server
- [ ] Smoke test in production environment
- [ ] Write brief internal user guide (1 page)

**Deliverable:** MVP live on internal server, all 3 roles tested, Excel export confirmed.

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Entra ID SSO setup takes longer than expected | Medium | High | Allocate Day 1 fully to auth; have fallback mock login for dev |
| Slot conflict race condition | Low | High | DB unique constraint is the safety net; do not rely on app checks alone |
| Ant Charts / Recharts rendering issues | Low | Medium | Use simpler chart library (Chart.js) if blocking |
| MySQL hosting not ready | Medium | High | Use local Docker MySQL in dev; confirm production server early |
| Scope creep from stakeholders | Medium | Medium | Freeze scope at Day 1; log all new requests for v1.1 |

---

## Post-MVP Backlog (v1.1)

These are explicitly out of scope for the 10-day MVP:

- Email / Teams notifications (booking confirmed, upcoming reminder)
- Recurring bookings
- Driver mobile view / trip confirmation
- Booking approval delegation
- Department-level booking limits
- SSO group sync (auto-assign roles from AD groups)
- Audit log of all status changes

---

## Technical Notes for Developer

### Slot Conflict Handling
```
1. App layer: SELECT existing booking WHERE vehicle_id + date + slot_start + status IN (pending, approved)
2. If found → return 409 SLOT_CONFLICT
3. If clear → INSERT
4. DB layer: unique index on (vehicle_id, booking_date, slot_start) as hard safety net
```

### Recommended NPM Packages
```
Backend:
  express, mysql2, jsonwebtoken, @azure/msal-node,
  express-validator, exceljs, dotenv, cors, helmet

Frontend:
  react, react-router-dom, antd, axios,
  @ant-design/charts (or recharts), dayjs
```

### Folder Structure (suggested)
```
/server
  /routes       (auth, vehicles, bookings, dashboard, export)
  /controllers
  /middleware   (auth.js, role.js)
  /db           (migrations, seed)
  /config       (slots.js — the 5 fixed slots)
  app.js

/client
  /src
    /pages      (Login, BookVehicle, MyBookings, Dashboard, Calendar, Admin)
    /components (SlotPicker, BookingTable, VehicleForm, KPICard)
    /api        (axios instance + endpoint helpers)
    /context    (AuthContext with role)
  vite.config.js
```

### Database Migrations
Run in order on first deploy:
```sql
-- 001_create_users.sql
-- 002_create_vehicles.sql
-- 003_create_bookings.sql
-- 004_add_unique_slot_constraint.sql
```
