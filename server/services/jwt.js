// JWT issue/verify. Payload carries the role so middleware can authorize
// without a DB hit. 12h expiry for the prototype.
const jwt = require('jsonwebtoken');

const EXPIRES_IN = '12h';

function issue(user) {
  return jwt.sign(
    { user_id: user.user_id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: EXPIRES_IN },
  );
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = { issue, verifyToken };
