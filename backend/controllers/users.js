const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const User = require('../models/user');
const Tokens = require('../models/token');
const NotFoundError = require('../utils/errors/NotFoundError');
const AuthorizationError = require('../utils/errors/AuthorizationError');
const CastError = require('../utils/errors/CastError');
const ValidationError = require('../utils/errors/ValidationError');
const AlreadyUsedError = require('../utils/errors/AlreadyUsedError');

const checkErrors = (error, next) => {
  if (error.name === 'ValidationError') {
    next(new ValidationError(error.message));
    return;
  }
  if (error.name === 'CastError') {
    next(new CastError(error.reason));
    return;
  }
  if (error.name === 'MongoServerError' && error.message.includes('email_1 dup key')) {
    next(new AlreadyUsedError('This Email is already used'));
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
  User.findOne({ _id: req.user._id })
    .orFail(() => {
      throw new NotFoundError('User ID not found');
    })
    .then((user) => res.send(user))
    .catch((error) => checkErrors(error, next));
};

module.exports.createUser = (req, res, next) => {
  const { name, about, link, email, password } = req.body;
  bcrypt
    .hash(password, 10)
    .then((hash) =>
      User.create({
        name,
        about,
        link,
        email,
        password: hash,
      })
        .then((newUser) =>
          res.status(201).json({
            message: 'A new user has been created',
            user: {
              _id: newUser._id,
              name: newUser.name,
              about: newUser.about,
              link: newUser.link,
              email: newUser.email,
            },
          })
        )
        .catch((error) => checkErrors(error, next))
    )
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
    }
  )
    .orFail(() => {
      throw new NotFoundError('User ID not found');
    })
    .then((user) =>
      res.json({
        message: `User - ${userId} profile has been updated`,
        user,
      })
    )
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
    }
  )
    .orFail(() => {
      throw new NotFoundError('User ID not found');
    })
    .then((user) =>
      res.json({
        message: `User - ${userId} avatar has been updated`,
        user,
      })
    )
    .catch((error) => checkErrors(error, next));
};

module.exports.login = (req, res, next) => {
  const { JWT_SECRET = 'Secret-key' } = process.env;
  const { email, password } = req.body;
  User.findOne({ email })
    .orFail(() => {
      throw new AuthorizationError('Incorrect email or password');
    })
    .select('+password')
    .then((user) =>
      bcrypt
        .compare(password, user.password)
        .then(async (matched) => {
          if (matched) {
            const token = jwt.sign({ _id: user._id }, JWT_SECRET, { expiresIn: '10s' });
            const refreshToken = uuidv4();
            const refreshJwt = jwt.sign({ _id: user._id, token: refreshToken }, JWT_SECRET, {
              expiresIn: '7d',
            });
            await Tokens.create({
              userId: user._id,
              refreshTokens: [
                {
                  token: refreshToken,
                  expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
                },
              ],
            })
              .then(() => {
                res.cookie('authorization', `Bearer ${token}`, {
                  maxAge: 1000 * 30,
                  httpOnly: true,
                  secure: true,
                  domain: 'around.yanivportfolio.com',
                });
                res.cookie('refreshToken', refreshJwt, {
                  maxAge: 1000 * 60 * 60 * 24 * 7,
                  httpOnly: true,
                  secure: true,
                  signed: true,
                  domain: 'around.yanivportfolio.com',
                });
                return res.json({
                  email: user.email,
                  name: user.name,
                });
              })
              .catch((error) => {
                if (
                  error.name !== 'MongoServerError' ||
                  !error.message.includes('userId_1 dup key')
                ) {
                  checkErrors(error, next);
                  return;
                }
                Tokens.findOneAndUpdate(
                  { userId: user._id },
                  {
                    $addToSet: {
                      refreshTokens: {
                        token: refreshToken,
                        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
                      },
                    },
                  }
                )
                  .then(async (result) => {
                    await result.refreshTokens.forEach(async (item) => {
                      if (Date.now() >= item.expires) {
                        await Tokens.findOneAndUpdate(
                          { userId: user._id },
                          {
                            $pull: { refreshTokens: { token: item.token } },
                          }
                        );
                      }
                    });
                    res.cookie('authorization', `Bearer ${token}`, {
                      maxAge: 1000 * 30,
                      httpOnly: true,
                      secure: true,
                      domain: 'around.yanivportfolio.com',
                    });
                    res.cookie('refreshToken', refreshJwt, {
                      maxAge: 1000 * 60 * 60 * 24 * 7,
                      httpOnly: true,
                      secure: true,
                      signed: true,
                      domain: 'around.yanivportfolio.com',
                    });
                    return res.json({
                      message: 'Successfully logged in',
                    });
                  })
                  .catch((err) => checkErrors(err, next));
              });
          }
          throw new AuthorizationError('Incorrect email or password');
        })
        .catch((error) => checkErrors(error, next))
    )
    .catch((error) => checkErrors(error, next));
};

module.exports.logout = (req, res, next) => {
  const { _id } = req.user;
  Tokens.deleteOne({ userId: _id })
    .then(() => {
      res.cookie('authorization', '', {
        maxAge: 0,
        httpOnly: true,
        secure: true,
        domain: 'around.yanivportfolio.com',
      });
      res.cookie('refreshToken', '', {
        maxAge: 0,
        httpOnly: true,
        secure: true,
        signed: true,
        domain: 'around.yanivportfolio.com',
      });
      res.json({ message: 'Successfully logged out' });
    })
    .catch((error) => checkErrors(error, next));
};
