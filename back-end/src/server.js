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
// Garantir UTF-8 em todas as respostas JSON
app.use((req, res, next) => {
    res.type('application/json; charset=utf-8');
    next();
});
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
    // Garante a tabela usada pela invalidacao de sessão mesmo em bases antigas.
    return appDataSource.query(`
      CREATE TABLE IF NOT EXISTS token_blacklist (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `);
})
    .then(() => {
    console.log('Database connection established successfully!');
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
})
    .catch((error) => {
    console.error('Error connecting to the database:', error);
});
//# sourceMappingURL=server.js.map