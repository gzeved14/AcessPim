import * as dotenv from 'dotenv';
dotenv.config();
import { DataSource } from 'typeorm';
import { appDataSource } from './config/appDataSource.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import 'reflect-metadata';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:4200', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Muitas requisições, tente novamente mais tarde'
});
app.use('/auth/login', limiter);

app.use(routes);
app.set('trust proxy', true); // Enables proxy trust so req.ip is resolved correctly
// Error-handling middleware must be registered after all routes.
// Keep this middleware registration as the last app.use call.

app.use(errorHandler);

appDataSource.initialize()
    .then(() => {
        console.log('Database connection established successfully!');
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Error connecting to the database:', error);
    });