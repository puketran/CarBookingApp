# Office Car Booking System — API Specification

**Base URL:** `/api/v1`  
**Auth:** All endpoints require `Authorization: Bearer <JWT>` (issued by Microsoft Entra ID SSO)  
**Roles:** `employee` | `admin` | `manager`

---

## Authentication

### POST `/auth/login`
Exchange Microsoft SSO token for internal JWT.

**Request body**
```json
{ "ms_token": "string" }
```
**Response 200**
```json
{
  "token": "string",
  "user": {
    "user_id": 1,
    "name": "Nguyen Van A",
    "email": "a@company.com",
    "department": "Marketing",
    "role": "employee"
  }
}
```

---

## Vehicles

### GET `/vehicles`
List all vehicles.  
**Access:** admin, manager  
**Query params:** `status` (active | maintenance)

**Response 200**
```json
[
  {
    "vehicle_id": 1,
    "license_plate": "51A-12345",
    "vehicle_name": "Innova 01",
    "capacity": 7,
    "driver_name": "Nguyen Tài",
    "status": "active",
    "notes": ""
  }
]
```

### GET `/vehicles/available`
List vehicles that have at least one open slot on a given date.  
**Access:** employee, admin  
**Query params:** `date` (YYYY-MM-DD) — **required**

**Response 200**
```json
[
  {
    "vehicle_id": 1,
    "vehicle_name": "Innova 01",
    "capacity": 7,
    "driver_name": "Nguyen Tài",
    "available_slots": [
      { "slot_start": "10:30", "slot_end": "12:30" },
      { "slot_start": "13:00", "slot_end": "15:00" }
    ]
  }
]
```
> **Note:** Only slots not yet booked are returned. Employees never see taken slots.

### GET `/vehicles/:id`
Get one vehicle by ID.  
**Access:** admin

### POST `/vehicles`
Create a vehicle.  
**Access:** admin

**Request body**
```json
{
  "license_plate": "51A-12345",
  "vehicle_name": "Innova 01",
  "capacity": 7,
  "driver_name": "Nguyen Tài",
  "status": "active",
  "notes": ""
}
```
**Response 201** — created vehicle object.

### PUT `/vehicles/:id`
Update vehicle details or status.  
**Access:** admin  
**Response 200** — updated vehicle object.

### DELETE `/vehicles/:id`
Soft-delete a vehicle (sets status = inactive).  
**Access:** admin  
**Response 204**

---

## Slots

### GET `/slots`
Return the master list of fixed daily time slots.  
**Access:** all

**Response 200**
```json
[
  { "slot_start": "08:00", "slot_end": "10:00" },
  { "slot_start": "10:30", "slot_end": "12:30" },
  { "slot_start": "13:00", "slot_end": "15:00" },
  { "slot_start": "15:30", "slot_end": "17:30" },
  { "slot_start": "18:00", "slot_end": "20:00" }
]
```

### GET `/slots/available-days`
Return a list of dates (within a given month) that have at least one open slot across all vehicles. Used to grey out fully-booked days on the calendar.  
**Access:** employee, admin  
**Query params:** `month` (YYYY-MM) — **required**

**Response 200**
```json
{
  "available_dates": ["2024-06-11", "2024-06-12", "2024-06-14"]
}
```

---

## Bookings

### GET `/bookings`
List bookings.  
**Access:** admin (all bookings), employee (own bookings only — enforced server-side)  
**Query params (all optional):**
- `date` — YYYY-MM-DD
- `vehicle_id`
- `department`
- `status` — pending | approved | rejected | completed | cancelled
- `employee_name`
- `page`, `limit`

**Response 200**
```json
{
  "total": 42,
  "page": 1,
  "limit": 20,
  "data": [
    {
      "booking_id": 101,
      "vehicle_id": 1,
      "vehicle_name": "Innova 01",
      "user_id": 5,
      "employee_name": "Nguyen Van A",
      "department": "Marketing",
      "contact_number": "0901234567",
      "destination": "Tan Son Nhat Airport",
      "purpose": "Client pickup",
      "passenger_count": 3,
      "booking_date": "2024-06-11",
      "slot_start": "10:30",
      "slot_end": "12:30",
      "status": "pending",
      "created_at": "2024-06-09T08:22:00Z",
      "updated_at": "2024-06-09T08:22:00Z"
    }
  ]
}
```

### GET `/bookings/:id`
Get one booking by ID.  
**Access:** admin (any), employee (own only)

### POST `/bookings`
Create a new booking. **Slot is locked immediately** (status = pending).  
**Access:** employee, admin

**Request body**
```json
{
  "vehicle_id": 1,
  "booking_date": "2024-06-11",
  "slot_start": "10:30",
  "slot_end": "12:30",
  "destination": "Tan Son Nhat Airport",
  "purpose": "Client pickup",
  "passenger_count": 3,
  "contact_number": "0901234567"
}
```
**Response 201**
```json
{
  "booking_id": 101,
  "status": "pending",
  "message": "Booking submitted. Awaiting admin approval."
}
```
**Error 409** — slot already taken:
```json
{ "error": "SLOT_CONFLICT", "message": "This slot is no longer available." }
```

### PUT `/bookings/:id`
Edit a booking (destination, purpose, passenger count).  
**Access:** admin only  
**Response 200** — updated booking object.

### PATCH `/bookings/:id/status`
Change booking status.  
**Access:** admin (approve / reject / complete / cancel), employee (cancel own — pending only)

**Request body**
```json
{ "status": "approved", "note": "optional reason" }
```
**Response 200**
```json
{ "booking_id": 101, "status": "approved" }
```
**Business rules enforced server-side:**
- Employee can only cancel own booking when `status = pending`
- Admin can approve/reject only `pending` bookings
- Admin can cancel `pending` or `approved` bookings
- `completed` and `cancelled` are terminal states — no further transitions

---

## Dashboard

### GET `/dashboard/summary`
KPI summary cards.  
**Access:** admin, manager

**Response 200**
```json
{
  "total_vehicles": 3,
  "todays_bookings": 12,
  "utilisation_rate": 85.3,
  "most_used_vehicle": "Innova 01"
}
```

### GET `/dashboard/utilisation`
Per-vehicle utilisation breakdown.  
**Access:** admin, manager  
**Query params:** `from` (YYYY-MM-DD), `to` (YYYY-MM-DD)

**Response 200**
```json
[
  {
    "vehicle_id": 1,
    "vehicle_name": "Innova 01",
    "total_slots": 100,
    "used_slots": 92,
    "utilisation_pct": 92.0
  }
]
```

### GET `/dashboard/booking-trend`
Bookings aggregated by day / week / month.  
**Access:** admin, manager  
**Query params:** `period` (day | week | month), `from`, `to`

**Response 200**
```json
[
  { "period": "2024-06-09", "count": 8 },
  { "period": "2024-06-10", "count": 11 }
]
```

### GET `/dashboard/peak-hours`
Bookings count grouped by time slot.  
**Access:** admin, manager

**Response 200**
```json
[
  { "slot": "10:30-12:30", "count": 48 },
  { "slot": "13:00-15:00", "count": 41 }
]
```

---

## Export

### GET `/export/bookings`
Export booking summary as `.xlsx`.  
**Access:** admin  
**Query params (all optional):** `from`, `to`, `vehicle_id`, `department`, `status`  
**Response:** `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`  
**Filename:** `booking-summary-{from}-{to}.xlsx`

**Columns:** Date | Vehicle | Employee | Department | Destination | Purpose | Slot | Status

### GET `/export/utilisation`
Export vehicle utilisation report as `.xlsx`.  
**Access:** admin  
**Query params:** `from`, `to`  
**Columns:** Vehicle | Total Slots | Used Slots | Utilisation %

### GET `/export/monthly`
Export monthly summary as `.xlsx`.  
**Access:** admin  
**Query params:** `month` (YYYY-MM)  
**Columns:** Month | Total Bookings | Total Hours

---

## Error Codes

| Code | HTTP | Meaning |
|------|------|---------|
| `UNAUTHORIZED` | 401 | Missing or invalid JWT |
| `FORBIDDEN` | 403 | Insufficient role |
| `NOT_FOUND` | 404 | Resource does not exist |
| `SLOT_CONFLICT` | 409 | Slot already booked |
| `INVALID_SLOT` | 422 | Slot not in allowed list |
| `VALIDATION_ERROR` | 422 | Request body failed validation |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Slot Conflict Prevention

The database must enforce a **unique constraint** on `(vehicle_id, booking_date, slot_start)` to prevent race conditions at the DB level, in addition to application-level checks.

```sql
ALTER TABLE bookings
  ADD CONSTRAINT uq_vehicle_slot
  UNIQUE (vehicle_id, booking_date, slot_start);
```

Only rows with `status IN ('pending', 'approved')` should count as "taken". Consider a partial unique index or handle in application logic:

```sql
-- MySQL does not support partial unique indexes natively.
-- Enforce via application: check for existing pending/approved booking
-- before INSERT, and handle duplicate key error (1062) as SLOT_CONFLICT.
```
