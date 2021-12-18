const router = require('express').Router();
const { celebrate, Joi, Segments } = require('celebrate');
const {
  getAllUsers,
  getUserById,
  updateUser,
  updateAvater,
} = require('../controllers/users');

router.get('/users', getAllUsers);

router.get('/users/me', getUserById);

router.patch('/users/me', celebrate({
  [Segments.BODY]: Joi.object({
    name: Joi.string().required,
    about: Joi.string().required,
  }),
}), updateUser);

router.patch('/users/me/avatar', updateAvater);

module.exports = router;
