// Send a single test email through Postmark to verify the token + sender signature.
//   Usage:  node scripts/test-postmark.js [recipient@example.com]
// Reads POSTMARK_API_TOKEN and EMAIL_FROM from server/.env. Recipient defaults to
// SUPER_ADMIN_EMAIL. Prints the raw Postmark response (incl. ErrorCode) and hints on
// the common failures, then exits non-zero on error so you can see it failed.
require('dotenv').config();

const token = process.env.POSTMARK_API_TOKEN;
const from = process.env.EMAIL_FROM;
const to = process.argv[2] || process.env.SUPER_ADMIN_EMAIL;

function fail(msg) {
  console.error(`\n✗ ${msg}\n`);
  process.exit(1);
}

if (!token) fail('POSTMARK_API_TOKEN is not set in server/.env (use your Postmark *Server* token).');
if (!from) fail('EMAIL_FROM is not set in server/.env (must be a verified Postmark sender signature).');
if (!to) fail('No recipient. Pass one: node scripts/test-postmark.js you@example.com');

(async () => {
  console.log(`\nSending test email…\n  from: ${from}\n  to:   ${to}\n  stream: ${process.env.POSTMARK_STREAM || 'outbound'}\n`);
  const res = await fetch('https://api.postmarkapp.com/email', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Postmark-Server-Token': token,
    },
    body: JSON.stringify({
      From: from,
      To: to,
      Subject: 'Car Booking — Postmark test',
      TextBody: 'This is a test email from the Car Booking app via Postmark. If you got this, Postmark works. 🚗',
      MessageStream: process.env.POSTMARK_STREAM || 'outbound',
    }),
  });
  const body = await res.json().catch(() => ({}));
  console.log(`HTTP ${res.status}`);
  console.log(JSON.stringify(body, null, 2));

  if (res.ok && body.ErrorCode === 0) {
    console.log(`\n✓ Sent. MessageID: ${body.MessageID}\n`);
    return;
  }
  // Map the usual Postmark error codes to a plain-English hint.
  const hints = {
    10: 'Bad/invalid Server API token — check POSTMARK_API_TOKEN (Server token, not Account token).',
    401: `Sender signature not found — verify ${from} (or its domain) in Postmark → Sender Signatures.`,
    300: 'Invalid email request — check the From/To addresses.',
    413: 'Account not approved — a new Postmark account cannot send ANY email (not even to its own domain) until you complete the approval request in the Postmark dashboard. This is the only blocker; the token + signature are fine.',
    405: 'Account not approved for sending — request approval in the Postmark dashboard.',
    406: 'Recipient is inactive (a prior bounce/complaint) — reactivate it in Postmark or use another address.',
  };
  fail(`Postmark rejected the send (ErrorCode ${body.ErrorCode}). ${hints[body.ErrorCode] || body.Message || ''}`);
})().catch((e) => fail(e.message));
