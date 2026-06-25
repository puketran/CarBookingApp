// Pluggable mailer. Provider is picked by which env vars are set, in this order:
//   1. Postmark — POSTMARK_API_TOKEN + EMAIL_FROM  → real email via the Postmark HTTP API
//   2. Resend   — RESEND_API_KEY    + EMAIL_FROM  → real email via Resend
//   3. otherwise (dev / not configured)           → log the message to the server console
// Same send({ to, subject, text }) signature either way, so call sites never change.
// EMAIL_FROM must be a verified Postmark sender signature (or verified domain).
let resendClient = null;

function getResend() {
  if (resendClient) return resendClient;
  if (process.env.RESEND_API_KEY) {
    const { Resend } = require('resend');
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

// Postmark via raw HTTP (no SDK dependency). Throws with the API's error body on failure.
async function sendViaPostmark({ to, subject, text }) {
  const res = await fetch('https://api.postmarkapp.com/email', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Postmark-Server-Token': process.env.POSTMARK_API_TOKEN,
    },
    body: JSON.stringify({
      From: process.env.EMAIL_FROM,
      To: to,
      Subject: subject,
      TextBody: text,
      MessageStream: process.env.POSTMARK_STREAM || 'outbound',
    }),
  });
  const body = await res.json().catch(() => ({}));
  // Postmark returns HTTP 200 with ErrorCode 0 on success; anything else is a failure.
  if (!res.ok || (body && body.ErrorCode && body.ErrorCode !== 0)) {
    throw new Error(`Postmark ${res.status} ErrorCode ${body.ErrorCode}: ${body.Message || 'send failed'}`);
  }
  return body;
}

async function send({ to, subject, text }) {
  if (process.env.POSTMARK_API_TOKEN && process.env.EMAIL_FROM) {
    await sendViaPostmark({ to, subject, text });
    return;
  }
  const client = getResend();
  if (client && process.env.EMAIL_FROM) {
    await client.emails.send({ from: process.env.EMAIL_FROM, to, subject, text });
    return;
  }
  console.log(`\n[MAILER] to=${to} | ${subject}\n${text}\n`);
}

module.exports = { send, sendViaPostmark };
