# Office Car Booking — User Guide (1 page)

## Logging in
1. Open the app URL and sign in with your **email + password**.
2. First time, or forgot it? Tap **"Set / forgot password"** → enter your email → you get a **6-digit code** (dev: printed to the server console) → enter the code + a new password. New emails self-register as an employee.
3. Codes expire in 5 minutes and are single-use. Change your password anytime from **Profile**.

Seeded demo accounts use the password **`password123`**.

## Roles & what you can do

**Employee**
- **Book a Vehicle** (bottom tab): pick a Date & Time slot → choose an available vehicle → fill destination/purpose/passengers → **Confirm**. You get a booking code like `BK-2026-0042`.
- **My Bookings**: see your bookings under All / Upcoming / Past / Cancelled; tap one for details; **Cancel** while it's still *pending*.
- A booked slot disappears for everyone else. If a slot is taken as you submit, you'll be asked to pick another.
- **No-shows:** if a driver marks 3 of your trips as no-shows in a month, booking is blocked until month-end. An admin can unblock you.

**Driver**
- **My Trips**: trips assigned to your vehicle. **Confirm** or **Decline** an approved trip, **Mark completed** after the trip, or mark a **No-show**.
- Toggle your vehicle to **Maintenance** to remove it from booking availability.

**Admin**
- **Dashboard**: KPIs, vehicle utilisation, booking trend, peak hours.
- **Bookings**: filter and **Approve / Reject / Complete** bookings.
- **Calendar**: month grid of every vehicle's bookings; click a cell for that day's trips.
- **Vehicles**: add/edit/deactivate vehicles, assign a driver, set maintenance.
- **Users**: change roles, activate/deactivate, **add users**, view no-show counts, **unblock**.
- **Reports**: download Booking Summary / Utilisation / Monthly as Excel.

## Notifications
The 🔔 bell shows updates (booking approved/rejected, driver actions, blocks). Open **Notifications** to see all and mark them read.

## Seeded demo accounts
| Email | Role |
|---|---|
| employee@company.com | employee |
| driver@company.com | driver (Innova 01) |
| admin@company.com | admin |
| hoa.tranbinh@gameloft.com | admin (bootstrap) |

## Time slots (fixed, 2h each)
08:00–10:00 · 10:30–12:30 · 13:00–15:00 · 15:30–17:30 · 18:00–20:00
