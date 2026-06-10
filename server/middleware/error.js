// Central error handler. Routes/controllers throw { status, code, message }
// (or call next(err)); this normalizes the response shape.
function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const code = err.code || (status === 500 ? 'INTERNAL_ERROR' : 'ERROR');
  if (status === 500) console.error(err);
  res.status(status).json({ error: code, message: err.message || 'Unexpected error' });
}

// 404 fallthrough for unmatched routes.
function notFound(req, res) {
  res.status(404).json({ error: 'NOT_FOUND', message: 'Resource does not exist' });
}

module.exports = { errorHandler, notFound };
