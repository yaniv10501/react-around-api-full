require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const cookieParser = require('cookie-parser');
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
  MONGO_DB_SERVER = 'mongodb://localhost:27017',
  NODE_ENV = 'development',
  COOKIE_SECRET = 'cookie-secret'
} = process.env;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});

mongoose.connect(`${MONGO_DB_SERVER}/aroundb`);

app.set('port', PORT);
app.set('env', NODE_ENV);

app.use(helmet());
app.use(limiter);
app.use(express.json());
app.use(cookieParser(COOKIE_SECRET));
app.use(cors());
app.options('*', cors());

app.use(requestLogger);

app.post('/api/signin', celebrateSignin, login);
app.post('/api/signup', celebrateSignup, createUser);

app.use((req, res, next) => celebrateHeaders(req, res, next));

app.use(auth);

app.use('/api', usersRoutes);
app.use('/api', cardsRoutes);

app.use(errorLogger);

app.use((req, res, next) => new ResourceNotFound(req, res, next));

app.use(checkJoiError);

app.use(ServerError);

app.listen(PORT, () => {
  logger.log(
    `Express Server started on Port ${PORT} | Environment : ${NODE_ENV}`,
  );
});
