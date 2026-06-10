// Collects express-validator results into the standard error shape.
const { validationResult } = require('express-validator');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ error: 'VALIDATION_ERROR', message: errors.array()[0].msg });
  }
  next();
}

module.exports = { validate };
