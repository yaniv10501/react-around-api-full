const router = require('express').Router();
const {
  getAllUsers,
  getUserById,
  updateUser,
  updateAvater,
} = require('../controllers/users');

router.get('/users', getAllUsers);

router.get('/users/me', getUserById);

router.patch('/users/me', updateUser);

router.patch('/users/me/avatar', updateAvater);

module.exports = router;
