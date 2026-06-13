const jwt = require('jsonwebtoken');

module.exports = function checkRoleMiddleware(roles) {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];

  return function checkRole(req, res, next) {
    if (req.method === 'OPTIONS') {
      return next();
    }

    try {
      const token = req.cookies?.token;

      if (!token) {
        return res.status(401).json({ message: 'Unauthorized' });
      }

      const decoded = jwt.verify(
        token,
        process.env.SECRET_KEY || 'development_secret_key',
      );

      if (!allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ message: 'Forbidden' });
      }

      req.user = decoded;
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
  };
};
