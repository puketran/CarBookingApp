# request03 — show-off admin dashboard · demo data · single-vehicle fleet

## Source request
Beautiful "show-off" admin dashboard. Remove total vehicles / today booking / utilisation / most used
/ vehicle utilisation. Add a day-range selector (default 30). Fleet is one driver — Innova 1 (Trai)
active, Innova 2 (Tin) and others hidden. Show: total full-day bookings needing approval; active
employees (30d); avg bookings per employee (30d); booking trend; peak hours. Fill demo data.

## Decisions (confirmed)
- Demo data = **add on top** (never wipe bookings).
- Fleet = **only Innova 1 active** (hide all others).
- Visuals = **polished + extra charts** (status donut, full-day-vs-slot split).

## Tasks
### Backend
- [x] B1 — `dashboardController`: reshaped `summary` (accepts `days`; returns active_employees,
  avg_bookings_per_employee, total_bookings, full_day_pending); `bookingTrend` + `peakHours` accept
  `days`; peakHours excludes full-day; NEW `breakdown` (by_status + by_type); dropped `utilisation` + SLOTS_PER_DAY
- [x] B2 — `routes/dashboard.js`: added `/breakdown`, removed `/utilisation`
- [x] B3 — NEW `db/demo-setup.js` (non-destructive, idempotent): hides non-keep vehicles, ensures ~8
  employees, appends ~30d bookings (INSERT IGNORE), 4 full-day pending + 3 completed full-day history, clears blocks; +`seed:demo` script

### Frontend
- [x] F1 — `KPICard`: optional `icon` + `accent` (gradient + icon chip; backward compatible)
- [x] F2 — `AdminDashboard` rewrite: range Segmented (7/30/90, default 30) → refetch; KPI row
  (active employees / avg per employee / full-day pending / total bookings); AreaChart trend;
  BarChart peak; status donut; full-day-vs-slot donut

### Verify
- [x] `seed:demo` ran (1 active vehicle, 12 bookers/30d, full_day_pending=4, by_type full_day=3);
  admin-JWT smoke on summary/trend/peak/breakdown OK; `/utilisation` → 404; `vite build` passes

## Notes
- Dashboard labels stay English (matches current dashboard; i18n out of scope here).
- `seed:demo` runs against the live Railway DB (append-only; sets non-keep vehicles inactive — reversible).
- Restart `npm run dev` (server) — :3000 was stale last session.
