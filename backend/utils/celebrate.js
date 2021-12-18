const { celebrate, Joi, Segments } = require('celebrate');
const validateUrl = require('./validateUrl');
const validateEmail = require('./validateEmail');

module.exports.celebrateCardId = () => celebrate({
  [Segments.PARAMS]: Joi.object().keys({
    cardId: Joi.string().length(24).required(),
  }),
});

module.exports.celebrateCardAdd = () => celebrate({
  [Segments.BODY]: Joi.object().keys({
    name: Joi.string().min(2).max(30).required(),
    link: Joi.string().required().custom(validateUrl),
  }),
});

module.exports.celebrateUpdateUser = () => celebrate({
  [Segments.BODY]: Joi.object().keys({
    name: Joi.string().min(2).max(30).required(),
    about: Joi.string().min(2).max(30).required(),
  }),
});

module.exports.celebrateUpdateAvatar = () => celebrate({
  [Segments.BODY]: Joi.object().keys({
    link: Joi.string().required().custom(validateUrl),
  }),
});

module.exports.celebrateHeaders = () => celebrate({
  [Segments.HEADERS]: Joi.object({
    authorization: Joi.string().required(),
  }).unknown(),
});

module.exports.celebrateSignin = () => celebrate({
  [Segments.BODY]: Joi.object().keys({
    email: Joi.string().required().custom(validateEmail),
    password: Joi.string()
      .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.*\s).*$/)
      .min(6)
      .max(20)
      .required(),
  }),
});

module.exports.celebrateSignup = () => celebrate({
  [Segments.BODY]: Joi.object().keys({
    email: Joi.string().required().custom(validateEmail),
    password: Joi.string()
      .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.*\s).*$/)
      .min(6)
      .max(20)
      .required(),
  }),
});
