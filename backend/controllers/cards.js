const Card = require('../models/card');
const NotFoundError = require('../utils/errors/NotFoundError');
const CastError = require('../utils/errors/CastError');
const ValidationError = require('../utils/errors/ValidationError');
const NotAllowedError = require('../utils/errors/NotAllowedError');

const checkCastError = (error, next) => {
  if (error.name === 'CastError') {
    next(new CastError(error.reason));
    return;
  }
  next(error);
};

module.exports.getAllCards = (req, res, next) => {
  Card.find({})
    .then((cards) => res.send(cards))
    .catch((error) => next(error));
};

module.exports.createCard = (req, res, next) => {
  const { name, link } = req.body;
  Card.create({ name, link, owner: req.user._id })
    .then((card) => res.json({
      message: 'A new card has been created',
      card,
    }))
    .catch((error) => {
      if (error.name === 'ValidationError') {
        next(new ValidationError(error.message));
        return;
      }
      next(error);
    });
};

module.exports.deleteCard = (req, res, next) => {
  const { cardId } = req.params;
  Card.findOne({ _id: cardId })
    .then((card) => {
      // eslint-disable-next-line no-console
      console.log(req.user._id);
      // eslint-disable-next-line no-console
      console.log(card.owner);
      if (card.owner.toString() !== req.user._id) {
        throw new NotAllowedError('You are not allowed to delete this card');
      }
      Card.deleteOne(
        { _id: cardId },
      )
        .orFail(() => {
          throw new NotFoundError('Card ID not found');
        })
        .then(() => res.json({ message: `card - ${cardId} has been deleted` }))
        .catch((error) => checkCastError(error, next));
    })
    .catch((error) => checkCastError(error, next));
};

module.exports.likeCard = (req, res, next) => {
  const { cardId } = req.params;
  const userId = req.user._id;
  Card.findByIdAndUpdate(
    cardId,
    { $addToSet: { likes: userId } },
    { new: true },
  )
    .orFail(() => {
      throw new NotFoundError('Card ID not found');
    })
    .then((card) => res.json({
      message: `card - ${cardId} has been liked by user - ${userId}`,
      card,
    }))
    .catch((error) => checkCastError(error, next));
};

module.exports.dislikeCard = (req, res, next) => {
  const { cardId } = req.params;
  const userId = req.user._id;
  Card.findByIdAndUpdate(
    cardId,
    { $pull: { likes: userId } },
    { new: true },
  )
    .orFail(() => {
      throw new NotFoundError('Card ID not found');
    })
    .then((card) => res.json({
      message: `card - ${cardId} has been disliked by user - ${userId}`,
      card,
    }))
    .catch((error) => checkCastError(error, next));
};
