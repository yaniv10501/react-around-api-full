require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const mongoose = require('mongoose');
const logger = require('./utils/logger');
const ResourceNotFound = require('./utils/errors/ResourceNotFound');

const app = express();
const usersRoutes = require('./routes/users');
const cardsRoutes = require('./routes/cards');
const ServerError = require('./utils/errors/ServerError');
const { login, createUser } = require('./controllers/users');
const auth = require('./middlewares/auth');

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
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
  if (req.method === 'OPTIONS') {
    res.send();
  } else {
    next();
  }
});

app.post('/signin', login);
app.post('/signup', createUser);

app.use(auth);

app.use('/', usersRoutes);
app.use('/', cardsRoutes);

app.use((req, res, next) => new ResourceNotFound(req, res, next));

app.use(ServerError);

app.listen(PORT, () => {
  logger.log(
    `Express Server started on Port ${PORT} | Environment : ${NODE_ENV}`,
  );
});