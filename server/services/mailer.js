// Pluggable mailer.
//   - When RESEND_API_KEY + EMAIL_FROM are set → send real email via Resend.
//   - Otherwise (dev / not configured) → log the message to the server console.
// Same send({ to, subject, text }) signature either way, so call sites never change.
let resendClient = null;

function getResend() {
  if (resendClient) return resendClient;
  if (process.env.RESEND_API_KEY) {
    const { Resend } = require('resend');
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

async function send({ to, subject, text }) {
  const client = getResend();
  if (client && process.env.EMAIL_FROM) {
    await client.emails.send({ from: process.env.EMAIL_FROM, to, subject, text });
    return;
  }
  console.log(`\n[MAILER] to=${to} | ${subject}\n${text}\n`);
}

module.exports = { send };
