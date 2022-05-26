const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const Tokens = require('../models/token');
const AuthorizationError = require('../utils/errors/AuthorizationError');

module.exports = async (req, res, next) => {
  // Trying to authorize a user
  try {
    const { authorization } = req.cookies;
    const { refreshToken: refreshJwt } = req.signedCookies;

    // If no token or refreshToken throw an error
    if ((!authorization || !authorization.startsWith('Bearer ')) && !refreshJwt) {
      throw new AuthorizationError('Authorization is required');
    }

    const token = authorization?.replace('Bearer ', '');
    const { JWT_SECRET = 'Secret-key' } = process.env;

    let payload;

    // Try to verify the token
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      // If the token is not verified try to use the refreshToken
      try {
        const { _id: userId, token: refreshToken } = jwt.verify(refreshJwt, JWT_SECRET);
        await Tokens.findOne({ userId })
          .orFail(() => {
            throw new AuthorizationError('Authorization is required');
          })
          .then(async ({ refreshTokens, usedTokens }) => {
            const isUsed = usedTokens.some((usedToken) => usedToken === refreshToken);
            if (isUsed) {
              await Tokens.findOneAndUpdate(
                { userId },
                {
                  $pullAll: { refreshTokens, usedTokens },
                }
              );
              throw new AuthorizationError('Authorization is required');
            }
            const isValid = refreshTokens.some(
              ({ token: validToken }) => validToken === refreshToken
            );
            if (!isValid) {
              await Tokens.findOneAndUpdate(
                { userId },
                {
                  $pullAll: { refreshTokens, usedTokens },
                }
              );
              throw new AuthorizationError('Authorization is required');
            }
            const newToken = jwt.sign({ _id: userId }, JWT_SECRET, { expiresIn: '10m' });
            const newRefreshToken = uuidv4();
            const newRefreshJwt = jwt.sign(
              {
                _id: userId,
                token: newRefreshToken,
              },
              JWT_SECRET,
              {
                expiresIn: '7d',
              }
            );
            const bulkUpdate = [
              {
                updateOne: {
                  filter: { userId },
                  update: {
                    $pull: { refreshTokens: { token: refreshToken } },
                  },
                },
              },
              {
                updateOne: {
                  filter: { userId },
                  update: {
                    $addToSet: {
                      refreshTokens: {
                        token: newRefreshToken,
                        expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
                      },
                      usedTokens: refreshToken,
                    },
                  },
                },
              },
              {
                updateOne: {
                  filter: { userId },
                  update: {
                    $push: {
                      usedTokens: {
                        $each: [],
                        $slice: -5,
                      },
                    },
                  },
                },
              },
            ];
            await Tokens.bulkWrite(bulkUpdate);
            res.cookie('authorization', `Bearer ${newToken}`, {
              maxAge: 1000 * 60 * 15,
              httpOnly: true,
              secure: true,
              domain: 'nomoreparties.sbs',
            });
            res.cookie('refreshToken', newRefreshJwt, {
              maxAge: 1000 * 60 * 60 * 24 * 7,
              httpOnly: true,
              secure: true,
              signed: true,
              domain: 'nomoreparties.sbs',
            });
            payload = { _id: userId };
          })
          .catch((error) => next(error));
      } catch (error) {
        throw new AuthorizationError('Authorization is required');
      }
    }

    req.user = payload;

    next();
  } catch (error) {
    next(error);
  }
};
