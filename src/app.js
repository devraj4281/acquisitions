import express from 'express';
import dotenv from 'dotenv';
import logger from './config/logger.js';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.js';
import { arcjetMiddleware } from './middleware/arcjet.middleware.js';

dotenv.config();

const app = express();
app.use(helmet());
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(arcjetMiddleware);
app.use(
  morgan('combined', {
    stream: {
      write: message => logger.info(message.trim()),
    },
  })
);

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
  console.error(err);
  res.status(500).send('Something broke!');
});
app.use('/api/auth', authRoutes);
app.get('/api', (req, res) => {
  res.status(200).json({ message: 'API is running' });
});
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});
export default app;
