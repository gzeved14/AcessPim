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

// Middleware de log global de requisições
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});
const PORT = process.env.PORT || 3000;

app.use(helmet({
  // Desativa o CSP para evitar que o Helmet bloqueie as extensões e o DevTools do Chrome em APIs REST
  contentSecurityPolicy: false,
}));
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

// Middleware de log global de erros
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("[LOG DE ERRO GLOBAL]", err);
  next(err);
});
app.set('trust proxy', true); // Enables proxy trust so req.ip is resolved correctly
// Error-handling middleware must be registered after all routes.
// Keep this middleware registration as the last app.use call.

// Logger global para revelar os erros 500 no terminal
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("ERRO INTERNO NO BACK-END:", err);
    next(err);
});
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
      );

      CREATE TABLE IF NOT EXISTS autorizacao (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        colaborador_id UUID REFERENCES colaborador(id),
        area_id UUID NOT NULL REFERENCES area(id),
        cargo_permitido TEXT
      );
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