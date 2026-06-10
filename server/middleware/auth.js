// Verifies the Bearer JWT and attaches req.user = { user_id, email, role }.
const { verifyToken } = require('../services/jwt');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const match = header.match(/^Bearer (.+)$/);
  if (!match) {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Missing or invalid token' });
  }
  try {
    req.user = verifyToken(match[1]);
    next();
  } catch {
    return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Missing or invalid token' });
  }
}

module.exports = { requireAuth };
