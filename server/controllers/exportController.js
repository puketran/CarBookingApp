const ExcelJS = require('exceljs');
const pool = require('../config/db');

async function sendWorkbook(res, filename, sheetName, columns, rows) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(sheetName);
  ws.columns = columns;
  ws.getRow(1).font = { bold: true };
  rows.forEach((r) => ws.addRow(r));
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  await wb.xlsx.write(res);
  res.end();
}

// GET /export/bookings?from&to&vehicle_id&department&status
async function bookings(req, res, next) {
  try {
    const where = [];
    const params = [];
    if (req.query.from) { where.push('b.booking_date >= ?'); params.push(req.query.from); }
    if (req.query.to) { where.push('b.booking_date <= ?'); params.push(req.query.to); }
    if (req.query.vehicle_id) { where.push('b.vehicle_id = ?'); params.push(req.query.vehicle_id); }
    if (req.query.department) { where.push('u.department = ?'); params.push(req.query.department); }
    if (req.query.status) { where.push('b.status = ?'); params.push(req.query.status); }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [data] = await pool.query(
      `SELECT DATE_FORMAT(b.booking_date,'%Y-%m-%d') d, v.vehicle_name, u.name employee, u.department,
              b.destination, b.purpose, TIME_FORMAT(b.slot_start,'%H:%i') ss, TIME_FORMAT(b.slot_end,'%H:%i') se, b.status
       FROM bookings b JOIN users u ON b.user_id=u.user_id JOIN vehicles v ON b.vehicle_id=v.vehicle_id
       ${whereSql} ORDER BY b.booking_date DESC`,
      params,
    );
    await sendWorkbook(
      res, 'booking-summary.xlsx', 'Bookings',
      [
        { header: 'Date', key: 'd', width: 12 }, { header: 'Vehicle', key: 'v', width: 16 },
        { header: 'Employee', key: 'e', width: 18 }, { header: 'Department', key: 'dep', width: 14 },
        { header: 'Destination', key: 'dest', width: 22 }, { header: 'Purpose', key: 'p', width: 18 },
        { header: 'Slot', key: 'slot', width: 14 }, { header: 'Status', key: 's', width: 12 },
      ],
      data.map((r) => ({ d: r.d, v: r.vehicle_name, e: r.employee, dep: r.department, dest: r.destination, p: r.purpose, slot: `${r.ss}-${r.se}`, s: r.status })),
    );
  } catch (err) {
    next(err);
  }
}

// GET /export/utilisation?from&to
async function utilisation(req, res, next) {
  try {
    const to = req.query.to || new Date().toISOString().slice(0, 10);
    const from = req.query.from || new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);
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
    await sendWorkbook(
      res, 'utilisation.xlsx', 'Utilisation',
      [
        { header: 'Vehicle', key: 'v', width: 18 }, { header: 'Total Slots', key: 'total', width: 12 },
        { header: 'Used Slots', key: 'used', width: 12 }, { header: 'Utilisation %', key: 'pct', width: 14 },
      ],
      rows,
    );
  } catch (err) {
    next(err);
  }
}

// GET /export/monthly?month=YYYY-MM (defaults to all-time by month)
async function monthly(req, res, next) {
  try {
    const [data] = await pool.query(
      `SELECT DATE_FORMAT(booking_date,'%Y-%m') m, COUNT(*) total, COUNT(*) * 2 hours
       FROM bookings WHERE status NOT IN ('cancelled','rejected')
       GROUP BY m ORDER BY m`,
    );
    await sendWorkbook(
      res, 'monthly-report.xlsx', 'Monthly',
      [
        { header: 'Month', key: 'm', width: 12 }, { header: 'Total Bookings', key: 'total', width: 16 },
        { header: 'Total Hours', key: 'hours', width: 14 },
      ],
      data.map((r) => ({ m: r.m, total: r.total, hours: r.hours })),
    );
  } catch (err) {
    next(err);
  }
}

module.exports = { bookings, utilisation, monthly };
