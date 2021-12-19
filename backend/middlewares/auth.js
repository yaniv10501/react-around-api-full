const jwt = require('jsonwebtoken');
const AuthorizationError = require('../utils/errors/AuthorizationError');

module.exports = (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    throw new AuthorizationError('Authorization is required');
  }

  const token = authorization.replace('Bearer ', '');
  const {
    JWT_SECRET = 'Secret-key',
  } = process.env;

  let payload;

  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch (err) {
    throw new AuthorizationError('Authorization is required');
  }

  req.user = payload;

  next();
};
