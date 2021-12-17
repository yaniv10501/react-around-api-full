const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const NotFoundError = require('../utils/errors/NotFoundError');
const CastError = require('../utils/errors/CastError');
const ValidationError = require('../utils/errors/ValidationError');

const checkErrors = (error, next) => {
  if (error.name === 'ValidationError') {
    next(new ValidationError(error.message));
    return;
  }
  if (error.name === 'CastError') {
    next(new CastError(error.reason));
    return;
  }
  next(error);
};

module.exports.getAllUsers = (req, res, next) => {
  User.find({})
    .then((users) => res.send(users))
    .catch((err) => next(err));
};

module.exports.getUserById = (req, res, next) => {
  User.find({ _id: req.params.userId })
    .orFail(() => {
      throw new NotFoundError('User ID not found');
    })
    .then((users) => res.send(users))
    .catch((error) => checkErrors(error, next));
};

module.exports.createUser = (req, res, next) => {
  const {
    name,
    about,
    link,
    email,
    password,
  } = req.body;
  bcrypt.hash(password, 10)
    .then((hash) => User.create({
      name,
      about,
      link,
      email,
      password: hash,
    })
      .then((user) => res.json({
        message: 'A new user has been created',
        user,
      }))
      .catch((error) => checkErrors(error, next)))
    .catch((error) => checkErrors(error, next));
};

module.exports.updateUser = (req, res, next) => {
  const { name, about } = req.body;
  const userId = req.user._id;
  User.findByIdAndUpdate(
    userId,
    { name, about },
    {
      new: true,
      runValidators: true,
    },
  )
    .orFail(() => {
      throw new NotFoundError('User ID not found');
    })
    .then((user) => res.json({
      message: `User - ${userId} profile has been updated`,
      user,
    }))
    .catch((error) => checkErrors(error, next));
};

module.exports.updateAvater = (req, res, next) => {
  const { link } = req.body;
  const userId = req.user._id;
  User.findByIdAndUpdate(
    userId,
    { link },
    {
      new: true,
      runValidators: true,
    },
  )
    .orFail(() => {
      throw new NotFoundError('User ID not found');
    })
    .then((user) => res.json({
      message: `User - ${userId} avatar has been updated`,
      user,
    }))
    .catch((error) => checkErrors(error, next));
};

module.exports.login = (req, res, next) => {
  const { JWT_SECRET } = process.env;
  const { email, password } = req.body;
  User.findOne({ email })
    .orFail(() => {
      throw new NotFoundError('Incorrect email or password');
    })
    .select('+password')
    .then((user) => bcrypt.compare(password, user.password)
      .then((matched) => {
        if (matched) {
          const token = jwt.sign({ _id: user._id }, JWT_SECRET, { expiresIn: '7d' });
          return res.send({ token });
        }
        throw new NotFoundError('Incorrect email or password');
      })
      .catch((error) => checkErrors(error, next)))
    .catch((error) => checkErrors(error, next));
};
