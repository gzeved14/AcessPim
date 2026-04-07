import * as dotenv from 'dotenv';
dotenv.config();
import { DataSource } from 'typeorm';
import { appDataSource } from './config/appDataSource.js';
import routes from './routes/index.js';
//import { errorHandler } from './errors/errorHandler.js';
import express from 'express';
import 'reflect-metadata';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(routes);
app.set('trust proxy', true); // Habilita a confiança no proxy para req.ip funcionar corretamente
// Error-handling middleware must be registered after all routes.
// Keep this middleware registration as the last app.use call.

//app.use(errorHandler);

appDataSource.initialize()
    .then(() => {
        console.log('Conexão com o banco de dados estabelecida com sucesso!');
        app.listen(PORT, () => {
            console.log(`Servidor rodando na porta ${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Erro ao conectar com o banco de dados:', error);
    });