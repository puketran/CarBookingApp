const ExcelJS = require('exceljs');
const pool = require('../config/db');

const PREVIEW_LIMIT = 100;

// ── Report builders ─────────────────────────────────────────────────────────
// Each returns { filename, sheet, columns, rows }.
// columns: ExcelJS column defs ({ header, key, width }); rows: objects keyed by column key.

// GET params: from, to, vehicle_id, department, status
async function buildBookings(q) {
  const where = [];
  const params = [];
  if (q.from) { where.push('b.booking_date >= ?'); params.push(q.from); }
  if (q.to) { where.push('b.booking_date <= ?'); params.push(q.to); }
  if (q.vehicle_id) { where.push('b.vehicle_id = ?'); params.push(q.vehicle_id); }
  if (q.department) { where.push('u.department = ?'); params.push(q.department); }
  if (q.status) { where.push('b.status = ?'); params.push(q.status); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const [data] = await pool.query(
    `SELECT DATE_FORMAT(b.booking_date,'%Y-%m-%d') d, b.booking_type,
            v.vehicle_name, u.name employee, u.department,
            b.destination, b.purpose,
            TIME_FORMAT(b.slot_start,'%H:%i') ss, TIME_FORMAT(b.slot_end,'%H:%i') se, b.status
     FROM bookings b JOIN users u ON b.user_id=u.user_id JOIN vehicles v ON b.vehicle_id=v.vehicle_id
     ${whereSql} ORDER BY b.booking_date DESC`,
    params,
  );
  return {
    filename: 'booking-summary.xlsx',
    sheet: 'Bookings',
    columns: [
      { header: 'Date', key: 'd', width: 12 }, { header: 'Type', key: 'type', width: 10 },
      { header: 'Slot', key: 'slot', width: 14 }, { header: 'Vehicle', key: 'v', width: 16 },
      { header: 'Employee', key: 'e', width: 18 }, { header: 'Department', key: 'dep', width: 14 },
      { header: 'Destination', key: 'dest', width: 22 }, { header: 'Purpose', key: 'p', width: 18 },
      { header: 'Status', key: 's', width: 12 },
    ],
    rows: data.map((r) => ({
      d: r.d, type: r.booking_type === 'full_day' ? 'Full day' : 'Slot',
      slot: r.booking_type === 'full_day' ? 'Full day' : `${r.ss}-${r.se}`,
      v: r.vehicle_name, e: r.employee, dep: r.department, dest: r.destination, p: r.purpose, s: r.status,
    })),
  };
}

// Pending approvals queue — what an admin needs to clear the backlog, with contact.
async function buildPending(q) {
  const where = ["b.status = 'pending'"];
  const params = [];
  if (q.from) { where.push('b.booking_date >= ?'); params.push(q.from); }
  if (q.to) { where.push('b.booking_date <= ?'); params.push(q.to); }
  const [data] = await pool.query(
    `SELECT DATE_FORMAT(b.booking_date,'%Y-%m-%d') d, b.booking_type,
            v.vehicle_name, COALESCE(b.requester_name, u.name) employee,
            COALESCE(b.department, u.department) department, b.contact_number,
            b.destination, TIME_FORMAT(b.slot_start,'%H:%i') ss, TIME_FORMAT(b.slot_end,'%H:%i') se
     FROM bookings b JOIN users u ON b.user_id=u.user_id JOIN vehicles v ON b.vehicle_id=v.vehicle_id
     WHERE ${where.join(' AND ')}
     ORDER BY (b.booking_type='full_day') DESC, b.booking_date ASC, b.slot_start ASC`,
    params,
  );
  return {
    filename: 'pending-approvals.xlsx',
    sheet: 'Pending',
    columns: [
      { header: 'Date', key: 'd', width: 12 }, { header: 'Type', key: 'type', width: 10 },
      { header: 'Slot', key: 'slot', width: 14 }, { header: 'Vehicle', key: 'v', width: 16 },
      { header: 'Employee', key: 'e', width: 18 }, { header: 'Department', key: 'dep', width: 14 },
      { header: 'Phone', key: 'phone', width: 14 }, { header: 'Destination', key: 'dest', width: 22 },
    ],
    rows: data.map((r) => ({
      d: r.d, type: r.booking_type === 'full_day' ? 'Full day' : 'Slot',
      slot: r.booking_type === 'full_day' ? 'Full day' : `${r.ss}-${r.se}`,
      v: r.vehicle_name, e: r.employee, dep: r.department, phone: r.contact_number || '', dest: r.destination,
    })),
  };
}

// GET params: from, to (defaults to last 30 days)
async function buildUtilisation(q) {
  const to = q.to || new Date().toISOString().slice(0, 10);
  const from = q.from || new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);
  const days = Math.max(1, Math.round((new Date(to) - new Date(from)) / 86400000) + 1);
  const [vehicles] = await pool.query("SELECT vehicle_id, vehicle_name FROM vehicles WHERE status='active' ORDER BY vehicle_id");
  const [used] = await pool.query(
    "SELECT vehicle_id, COUNT(*) used FROM bookings WHERE status IN ('approved','completed') AND booking_date BETWEEN ? AND ? GROUP BY vehicle_id",
    [from, to],
  );
  const map = Object.fromEntries(used.map((r) => [r.vehicle_id, r.used]));
  const rows = vehicles.map((v) => {
    const u = map[v.vehicle_id] || 0;
    const total = days * 5;
    return { v: v.vehicle_name, total, used: u, pct: total ? Math.round((u / total) * 1000) / 10 : 0 };
  });
  return {
    filename: 'utilisation.xlsx',
    sheet: 'Utilisation',
    columns: [
      { header: 'Vehicle', key: 'v', width: 18 }, { header: 'Total Slots', key: 'total', width: 12 },
      { header: 'Used Slots', key: 'used', width: 12 }, { header: 'Utilisation %', key: 'pct', width: 14 },
    ],
    rows,
  };
}

async function buildMonthly() {
  const [data] = await pool.query(
    `SELECT DATE_FORMAT(booking_date,'%Y-%m') m, COUNT(*) total, COUNT(*) * 2 hours
     FROM bookings WHERE status NOT IN ('cancelled','rejected')
     GROUP BY m ORDER BY m`,
  );
  return {
    filename: 'monthly-report.xlsx',
    sheet: 'Monthly',
    columns: [
      { header: 'Month', key: 'm', width: 12 }, { header: 'Total Bookings', key: 'total', width: 16 },
      { header: 'Total Hours', key: 'hours', width: 14 },
    ],
    rows: data.map((r) => ({ m: r.m, total: r.total, hours: r.hours })),
  };
}

const BUILDERS = {
  bookings: buildBookings,
  pending: buildPending,
  utilisation: buildUtilisation,
  monthly: buildMonthly,
};

// GET /export/:report — stream the .xlsx workbook.
async function download(req, res, next) {
  try {
    const build = BUILDERS[req.params.report];
    if (!build) return res.status(404).json({ error: 'UNKNOWN_REPORT' });
    const { filename, sheet, columns, rows } = await build(req.query);
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(sheet);
    ws.columns = columns;
    ws.getRow(1).font = { bold: true };
    rows.forEach((r) => ws.addRow(r));
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
}

// GET /export/:report/preview — JSON for the on-screen table (rows capped).
async function preview(req, res, next) {
  try {
    const build = BUILDERS[req.params.report];
    if (!build) return res.status(404).json({ error: 'UNKNOWN_REPORT' });
    const { columns, rows } = await build(req.query);
    res.json({
      columns: columns.map((c) => ({ title: c.header, key: c.key })),
      rows: rows.slice(0, PREVIEW_LIMIT),
      total: rows.length,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { download, preview };
