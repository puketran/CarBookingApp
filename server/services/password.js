// Password hashing with Node's built-in scrypt (salted, no dependency).
// Stored format: "<saltHex>:<derivedKeyHex>".
const crypto = require('crypto');

function hashPassword(pw) {
  const salt = crypto.randomBytes(16).toString('hex');
  const dk = crypto.scryptSync(String(pw), salt, 64).toString('hex');
  return `${salt}:${dk}`;
}

function verifyPassword(pw, stored) {
  if (!stored || !stored.includes(':')) return false;
  const [salt, dk] = stored.split(':');
  const calc = crypto.scryptSync(String(pw), salt, 64);
  const expected = Buffer.from(dk, 'hex');
  return expected.length === calc.length && crypto.timingSafeEqual(expected, calc);
}

module.exports = { hashPassword, verifyPassword };
