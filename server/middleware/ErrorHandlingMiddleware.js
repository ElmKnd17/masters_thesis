module.exports = function errorHandlingMiddleware(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || 'Unexpected server error';

  return res.status(status).json({ message });
};
