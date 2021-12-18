module.exports = class JoiError extends Error {
  constructor(err) {
    super(`${err.message}: ${err.validation.message}`);
    this.name = 'JoiError';
    this.status = 400;
  }
};
