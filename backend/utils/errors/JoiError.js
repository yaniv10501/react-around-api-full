/* eslint-disable no-console */
const { isCelebrateError } = require('celebrate');

class JoiError extends Error {
  constructor(err) {
    super(err);
    this.name = 'JoiError';
    this.status = 400;
  }
}

module.exports.checkJoiError = (err, req, res, next) => {
  if (isCelebrateError(err)) {
    return next(new JoiError(err));
  }
  return next(err);
};
