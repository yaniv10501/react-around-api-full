require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mongoose = require('mongoose');
const logger = require('./utils/logger');
const ResourceNotFound = require('./utils/errors/ResourceNotFound');
const { celebrateSignin, celebrateSignup, celebrateHeaders } = require('./utils/celebrate');
const { requestLogger, errorLogger } = require('./middlewares/logger');

const app = express();
const usersRoutes = require('./routes/users');
const cardsRoutes = require('./routes/cards');
const ServerError = require('./utils/errors/ServerError');
const { login, createUser } = require('./controllers/users');
const auth = require('./middlewares/auth');
const { checkJoiError } = require('./utils/errors/JoiError');

const {
  PORT = 3000,
  MONGO_DB_SERVER,
  NODE_ENV = 'development',
} = process.env;

mongoose.connect(`${MONGO_DB_SERVER}/aroundb`);

app.set('port', PORT);
app.set('env', NODE_ENV);

app.use(helmet());
app.use(express.json());
app.use(cors());
app.options('*', cors());

app.use(requestLogger);

app.get('/crash-test', () => {
  setTimeout(() => {
    throw new Error('Server will crash now');
  }, 0);
});
app.post('/signin', celebrateSignin, login);
app.post('/signup', celebrateSignup, createUser);

app.use(celebrateHeaders);

app.use(auth);

app.use('/', usersRoutes);
app.use('/', cardsRoutes);

app.use(errorLogger);

app.use((req, res, next) => new ResourceNotFound(req, res, next));

app.use(checkJoiError);

app.use(ServerError);

app.listen(PORT, () => {
  logger.log(
    `Express Server started on Port ${PORT} | Environment : ${NODE_ENV}`,
  );
});
