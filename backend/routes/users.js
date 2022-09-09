const router = require('express').Router();
const { celebrateUpdateUser, celebrateUpdateAvatar } = require('../utils/celebrate');
const {
  getAllUsers,
  getUserById,
  updateUser,
  updateAvater,
  logout,
} = require('../controllers/users');

router.post('/signout', logout);

router.get('/users', getAllUsers);

router.get('/users/me', getUserById);

router.patch('/users/me', celebrateUpdateUser, updateUser);

router.patch('/users/me/avatar', celebrateUpdateAvatar, updateAvater);

module.exports = router;
