// OTP helpers. Codes are 6 digits; we store only a SHA-256 hash (salted with
// the email so the same code for two users yields different hashes), never the
// raw code. Comparison is timing-safe.
const crypto = require('crypto');

function generateCode() {
  return String(crypto.randomInt(100000, 1000000)); // 100000..999999, always 6 digits
}

function hash(code, email) {
  return crypto.createHash('sha256').update(`${code}:${email}`).digest('hex');
}

function verify(code, email, codeHash) {
  const computed = Buffer.from(hash(code, email));
  const stored = Buffer.from(codeHash);
  return computed.length === stored.length && crypto.timingSafeEqual(computed, stored);
}

module.exports = { generateCode, hash, verify };
