const jwt = require('jsonwebtoken');

module.exports = function authMiddleware(req, res, next) {
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

    req.user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
};
