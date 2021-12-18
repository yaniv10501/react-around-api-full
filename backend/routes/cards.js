const router = require('express').Router();
const {
  getAllCards,
  createCard,
  deleteCard,
  likeCard,
  dislikeCard,
} = require('../controllers/cards');
const { celebrateCardId, celebrateCardAdd } = require('../utils/celebrate');

router.get('/cards', getAllCards);

router.post('/cards', celebrateCardAdd, createCard);

router.delete('/cards/:cardId', celebrateCardId, deleteCard);

router.put('/cards/:cardId/likes', celebrateCardId, likeCard);

router.delete('/cards/:cardId/likes', celebrateCardId, dislikeCard);

module.exports = router;
