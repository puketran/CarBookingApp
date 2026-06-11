# Office Car Booking — Test Cases

Derived from the requirements in [thiet-ke-cap-nhat-email-otp-railway.md](thiet-ke-cap-nhat-email-otp-railway.md), [api-spec.md](api-spec.md), and [project-plan.md](project-plan.md).

**Legend — Status:** ☐ not run · ✅ pass · ❌ fail · ⏭️ blocked
**Legend — Scope:** `PROTO` = in the current prototype · `MVP` = deferred to MVP (endpoint/feature not built yet)
**Verified-by:** `API` = curl/Postman against backend · `UI` = click-through in browser · `DB` = inspect database

> Many `API`-level cases were already exercised during the day-by-day build (d01–d03). The `UI` cases require the manual browser click-through (d04 task 10). `MVP` cases are written now so they're ready when those features land.

---

## 1. Authentication — Email OTP

| ID | Scope | Title | Preconditions | Steps | Expected | Status |
|----|-------|-------|---------------|-------|----------|--------|
| AUTH-01 | PROTO | Request OTP for valid active user | `employee@company.com` seeded & active | POST `/auth/request-otp` | 200 generic message; 6-digit code logged to server console; row in `otp_codes` | ✅ |
| AUTH-02 | PROTO | Anti-enumeration — unknown email | email not in DB | POST `/auth/request-otp` with `ghost@x.com` | 200 **identical** message; **no** code generated/logged; no new `otp_codes` row | ✅ |
| AUTH-03 | PROTO | Inactive user gets no OTP | user exists, `is_active=false` | POST `/auth/request-otp` | 200 generic; no code generated | ✅ |
| AUTH-04 | PROTO | Invalid email format rejected | — | POST `/auth/request-otp` with `notanemail` | 422 `VALIDATION_ERROR` | ✅ |
| AUTH-05 | PROTO | Rate limit 5/email/hour | — | POST `/auth/request-otp` 6× for same email within an hour | 6th returns generic message but **no new code** minted (throttled) | ☐ |
| AUTH-06 | PROTO | Verify correct code issues JWT | valid OTP just requested | POST `/auth/verify-otp` with correct code | 200 `{token, user{user_id,name,role}}`; `otp_codes.used=true` | ✅ |
| AUTH-07 | PROTO | JWT carries role | logged in | decode returned token | payload has `role` matching the user | ✅ |
| AUTH-08 | PROTO | Wrong code rejected | valid OTP exists | POST `/auth/verify-otp` with wrong code | 401 `INVALID_OTP`; `attempts` incremented | ✅ |
| AUTH-09 | PROTO | Expired code rejected | OTP `expires_at` in the past | POST `/auth/verify-otp` | 401 `INVALID_OTP` | ✅ |
| AUTH-10 | PROTO | Single-use — reused code rejected | code already verified once | POST `/auth/verify-otp` same code again | 401 `INVALID_OTP` | ✅ |
| AUTH-11 | PROTO | Lock after 5 wrong attempts | fresh OTP | 5× wrong code, then correct code | all 401; correct one also 401 (locked → must re-request) | ✅ |
| AUTH-12 | PROTO | OTP stored as hash, never raw | any OTP request | inspect `otp_codes.code_hash` | value is a SHA-256 hash, not the 6 digits | ✅ (DB) |
| AUTH-13 | PROTO | Verify with malformed code | — | POST `/auth/verify-otp` `code:"12"` | 422 `VALIDATION_ERROR` | ✅ |
| AUTH-14 | UI | Login two-step happy path | servers running | enter email → submit → enter console code → submit | routed to role landing page; session persists on refresh | ☐ |
| AUTH-15 | UI | Login with wrong code shows error | on OTP step | enter wrong code | toast "Invalid or expired code"; stays on login | ☐ |

---

## 2. Authorization & Roles

| ID | Scope | Title | Preconditions | Steps | Expected | Status |
|----|-------|-------|---------------|-------|----------|--------|
| ROLE-01 | PROTO | No token → 401 | — | GET `/me` without `Authorization` | 401 `UNAUTHORIZED` | ✅ |
| ROLE-02 | PROTO | Invalid/expired token → 401 | — | GET `/me` with garbage token | 401 `UNAUTHORIZED` | ✅ |
| ROLE-03 | PROTO | Employee blocked from admin route | logged in as employee | GET `/admin/ping` | 403 `FORBIDDEN` | ✅ |
| ROLE-04 | PROTO | Admin allowed on admin route | logged in as admin | GET `/admin/ping` | 200 | ✅ |
| ROLE-05 | PROTO | Employee sees only own bookings | employee + others' bookings exist | GET `/bookings` | only own rows returned | ✅ |
| ROLE-06 | PROTO | Admin sees all bookings | multiple users' bookings exist | GET `/bookings` | all rows returned | ✅ |
| ROLE-07 | UI | Route guard redirects unauthenticated | not logged in | navigate to `/admin` | redirected to `/login` | ☐ |
| ROLE-08 | UI | Employee can't reach admin page | logged in as employee | navigate to `/admin` | redirected to `/` (own landing) | ☐ |
| ROLE-09 | MVP | Super-admin adds an admin | logged in as super_admin | POST `/admin/users` with an email | target user's role becomes `admin` (201) | ☐ |
| ROLE-10 | MVP | Non-super-admin cannot add admin | logged in as admin | POST `/admin/users` | 403 `FORBIDDEN` | ☐ |
| ROLE-11 | MVP | Super-admin email is env-fixed | — | attempt to change super_admin via UI/API | not possible (hardcoded `SUPER_ADMIN_EMAIL`) | ☐ |

---

## 3. Vehicles & Availability

| ID | Scope | Title | Preconditions | Steps | Expected | Status |
|----|-------|-------|---------------|-------|----------|--------|
| VEH-01 | PROTO | Availability returns open slots | active vehicles seeded, date free | GET `/vehicles/available?date=YYYY-MM-DD` | each active vehicle with its open slots (5 if none booked) | ✅ |
| VEH-02 | PROTO | Taken slot excluded | a slot booked (pending/approved) | GET `/vehicles/available?date=` | that slot absent from the vehicle's list | ✅ |
| VEH-03 | PROTO | Missing `date` rejected | — | GET `/vehicles/available` (no date) | 422 `VALIDATION_ERROR` | ✅ |
| VEH-04 | PROTO | Only active vehicles shown | one vehicle `status=maintenance` | GET `/vehicles/available?date=` | maintenance vehicle not listed | ☐ |
| VEH-05 | PROTO | Fully-booked vehicle excluded | all 5 slots booked for a vehicle | GET `/vehicles/available?date=` | that vehicle omitted entirely | ☐ |
| VEH-06 | PROTO | Requires auth | no token | GET `/vehicles/available?date=` | 401 `UNAUTHORIZED` | ☐ |
| VEH-07 | MVP | List all vehicles (admin) | — | GET `/vehicles` | array of vehicles | ☐ |
| VEH-08 | MVP | Create vehicle (admin) | — | POST `/vehicles` | 201 created object | ☐ |
| VEH-09 | MVP | Update vehicle (admin) | vehicle exists | PUT `/vehicles/:id` | 200 updated | ☐ |
| VEH-10 | MVP | Soft-delete vehicle (admin) | vehicle exists | DELETE `/vehicles/:id` | 204; vehicle deactivated | ☐ |

---

## 4. Slots

| ID | Scope | Title | Steps | Expected | Status |
|----|-------|-------|-------|----------|--------|
| SLOT-01 | PROTO | Master slot list | GET `/slots` | the 5 fixed slots (08:00,10:30,13:00,15:30,18:00) | ✅ |
| SLOT-02 | MVP | Available days in month | GET `/slots/available-days?month=YYYY-MM` | dates with ≥1 open slot | ☐ |

---

## 5. Bookings

| ID | Scope | Title | Preconditions | Steps | Expected | Status |
|----|-------|-------|---------------|-------|----------|--------|
| BOOK-01 | PROTO | Create booking locks slot | open slot | POST `/bookings` (valid) | 201 `{booking_id,status:'pending'}`; slot disappears from availability | ✅ |
| BOOK-02 | PROTO | Invalid slot rejected | — | POST `/bookings` with slot not in the 5 | 422 `INVALID_SLOT` | ✅ |
| BOOK-03 | PROTO | Double-book same slot | slot already pending/approved | POST `/bookings` same vehicle+date+slot | 409 `SLOT_CONFLICT` | ✅ |
| BOOK-04 | PROTO | Concurrent double-book race | open slot | two simultaneous POSTs same slot | exactly one 201, one 409 (DB `uq_vehicle_slot`) | ✅ |
| BOOK-05 | PROTO | Missing required fields | — | POST `/bookings` without destination | 422 `VALIDATION_ERROR` | ☐ |
| BOOK-06 | PROTO | Passenger count vs capacity | — | POST with `passenger_count` > capacity | (UI caps at capacity; server min≥1) — confirm behavior | ☐ |
| BOOK-07 | PROTO | List pagination | >20 bookings (admin) | GET `/bookings?page=2&limit=20` | correct `total/page/limit/data` | ☐ |
| BOOK-08 | PROTO | Admin filters | mixed bookings | GET `/bookings?status=pending` etc. | filtered results | ✅ (status) |
| BOOK-09 | PROTO | Get own booking | employee owns #N | GET `/bookings/N` | 200 booking | ✅ |
| BOOK-10 | PROTO | Get others' booking blocked | employee, #M owned by another | GET `/bookings/M` | 404 `NOT_FOUND` (no leak) | ☐ |
| BOOK-11 | PROTO | Employee cancels own pending | own pending booking | PATCH `/bookings/:id/status` `cancelled` | 200; status cancelled | ✅ |
| BOOK-12 | PROTO | Employee cannot cancel approved | own approved booking | PATCH `cancelled` | 403 `FORBIDDEN` | ✅ |
| BOOK-13 | PROTO | Employee cannot touch others' | #M owned by another | PATCH `cancelled` | 404 `NOT_FOUND` | ☐ |
| BOOK-14 | PROTO | Admin approves pending | pending booking | PATCH `approved` | 200 approved | ✅ |
| BOOK-15 | PROTO | Admin rejects pending | pending booking | PATCH `rejected` | 200 rejected | ☐ |
| BOOK-16 | PROTO | Admin completes approved | approved booking | PATCH `completed` | 200 completed | ✅ |
| BOOK-17 | PROTO | Illegal transition blocked | completed booking | PATCH `approved` | 422 `VALIDATION_ERROR` | ✅ |
| BOOK-18 | PROTO | Terminal states immutable | cancelled/rejected/completed | any PATCH | rejected (422/403) | ☐ |
| BOOK-19 | KNOWN-ISSUE | Re-book a cancelled slot | a booking for slot was cancelled | POST `/bookings` same slot | ⚠️ currently 409 (unique constraint covers all statuses) — see caveat below | ☐ |
| BOOK-20 | MVP | Admin edits booking details | booking exists | PUT `/bookings/:id` | 200 updated | ☐ |
| BOOK-21 | UI | Book flow end-to-end | logged in | date → vehicle → slot → form → submit | success toast + appears in My Bookings as pending | ☐ |
| BOOK-22 | UI | 409 surfaces as toast | slot taken between load & submit | submit booking | error toast "slot was just taken"; availability refreshes | ☐ |
| BOOK-23 | UI | My Bookings cancel | own pending in list | click Cancel → confirm | row becomes cancelled | ☐ |
| BOOK-24 | UI | Admin approve from table | pending in Manage Bookings | click Approve | row becomes approved | ☐ |
| NS-01 | PROTO | Driver marks no-show | approved trip on driver's vehicle | PATCH `/driver/trips/:id` `{action:'no_show'}` | status → `no_show` | ✅ |
| NS-02 | PROTO | 3rd no-show blocks user | user has 2 no-shows this month | driver marks a 3rd | user `booking_blocked_until` = month-end | ✅ |
| NS-03 | PROTO | Blocked user can't book | blocked user | `POST /bookings` | 403 `USER_BLOCKED` | ✅ |
| NS-04 | PROTO | Admin sees counts | no-shows exist | `GET /admin/users` | per-user `noshow_this_month` + blocked-until | ✅ |
| NS-05 | PROTO | Admin unblock | blocked user | `PATCH /admin/users/:id` clear block | user can book again | ✅ |
| NS-06 | PROTO | Block auto-clears next month | blocked this month | (next calendar month) | block no longer applies | ☐ |

---

## 6. Dashboard & Export — `MVP` (not in prototype)

| ID | Scope | Title | Endpoint | Expected | Status |
|----|-------|-------|----------|----------|--------|
| DASH-01 | MVP | KPI summary | GET `/dashboard/summary` | totals + utilisation + most-used | ☐ |
| DASH-02 | MVP | Utilisation breakdown | GET `/dashboard/utilisation?from&to` | per-vehicle % | ☐ |
| DASH-03 | MVP | Booking trend | GET `/dashboard/booking-trend?period` | counts per period | ☐ |
| DASH-04 | MVP | Peak hours | GET `/dashboard/peak-hours` | counts per slot | ☐ |
| EXP-01 | MVP | Export bookings xlsx | GET `/export/bookings` | .xlsx download, correct columns | ☐ |
| EXP-02 | MVP | Export utilisation xlsx | GET `/export/utilisation` | .xlsx download | ☐ |
| EXP-03 | MVP | Export monthly xlsx | GET `/export/monthly?month` | .xlsx download | ☐ |

---

## 7. Cross-cutting / Non-functional

| ID | Scope | Title | Steps | Expected | Status |
|----|-------|-------|-------|----------|--------|
| SEC-01 | PROTO | Security headers present | inspect response headers | helmet headers set | ✅ |
| SEC-02 | PROTO | SQL injection safe | inject `' OR 1=1 --` into params/body | no leak; parameterized queries hold (rejected safely, no 500) | ✅ |
| SEC-03 | PROTO | Consistent error shapes | trigger each error | `{error, message}` with documented codes | ✅ |
| SEC-04 | PROTO | Unknown route → 404 | GET `/api/v1/nope` | 404 `NOT_FOUND` | ✅ |
| SEC-05 | MVP | HTTPS in production | hit deployed URL | served over HTTPS (Railway) | ☐ |
| SEC-06 | PROTO | Health check | GET `/health` | 200 `{status:'ok'}` | ✅ |
| PERF-01 | MVP | Availability under load | many vehicles/bookings | response < ~500ms | ☐ |

---

## Known issue (tracked)

- **BOOK-19 — cancelled slot not re-bookable.** The `uq_vehicle_slot` unique constraint is on `(vehicle_id, booking_date, slot_start)` for **all** statuses, so a cancelled/rejected booking still blocks that exact slot (MySQL has no partial unique index). Documented in [api-spec.md](api-spec.md). Fix options: delete-on-cancel, or a status-aware generated column. Decide before MVP.

---

## How to run the API cases quickly

```bash
cd server && npm run dev        # backend on :3000, OTP codes print here
# request a code, read it from the console, then verify — see README / day files for curl snippets
```
UI cases: run `client` (`npm run dev`, :5173) alongside the backend and click through.
