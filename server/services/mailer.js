// Pluggable mailer. Dev: log to console (no email provider needed).
// MVP: swap the body for Resend — same send({ to, subject, text }) signature,
// so no call site changes.
async function send({ to, subject, text }) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`\n[MAILER] to=${to} | ${subject}\n${text}\n`);
    return;
  }
  // TODO MVP: integrate Resend here.
  throw new Error('Production mailer not configured yet.');
}

module.exports = { send };
