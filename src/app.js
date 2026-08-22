import express from 'express';
import dotenv from 'dotenv';
import logger from '#config/logger.js';

dotenv.config();

const app = express();
app.get('/', (req, res) => {
  logger.info('Hello from Acquisition Project');
  res.status(200).send('Hello From Acquistion Project');
});
app.post('/', (req, res) => {
  res.send('Hello World!');
});

app.put('/', (req, res) => {
  res.send('Hello World!');
});

app.delete('/', (req, res) => {
  res.send('Hello World!');
});

app.use((err, req, res, _next) => {
  logger.error(err.message, { stack: err.stack });
  res.status(500).send('Something broke!');
});

export default app;
