import { DataSource } from "typeorm";
import dotenv from 'dotenv';
import { Area } from "../entities/Area.js";
import { Autorizacao } from "../entities/Autorizacao.js";
import { Colaborador } from "../entities/Colaborador.js";
import { RegistroAcesso } from "../entities/RegistroAcesso.js";
import { TokenBlacklist } from "../entities/TokenBlacklist.js";
import { Usuario } from "../entities/Usuario.js";
import { env } from './env.js';

dotenv.config();

export const appDataSource = new DataSource({
    type: 'postgres',
    host: env.DB_HOST,
    port: env.DB_PORT,
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    synchronize: false,
    logging: false,
    // Lista explícita para evitar falhas de metadata com glob patterns no runtime ESM.
    entities: [
        Area,
        Autorizacao,
        Colaborador,
        RegistroAcesso,
        TokenBlacklist,
        Usuario
    ],
});