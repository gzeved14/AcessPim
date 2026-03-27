import * as dotenv from 'dotenv';
import { DataSource } from 'typeorm';
import { appDataSource } from './src/db/appDataSource.js';
import routes from './src/routes/index.js';
import { errorHandler } from './src/middlewares/errorHandler.js';
import express from 'express';
import 'reflect-metadata';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(routes);
app.use(errorHandler);

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