import { DataSource } from "typeorm";
import dotenv from 'dotenv';
import { Area } from "../entities/Area";
import { Autorizacao } from "../entities/Autorizacao";
import { Colaborador } from "../entities/Colaborador";
import { RegistroAcesso } from "../entities/RegistroAcesso";
import { TokenBlacklist } from "../entities/TokenBlacklist";
import { Usuario } from "../entities/Usuario";
import { env } from './env';
import { AccessLogCache } from "../entities/AccessLogCache";

dotenv.config();

export const appDataSource = new DataSource({
    type: 'postgres',
    host: env.DB_HOST,
    port: env.DB_PORT,
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    synchronize: true,
    logging: false,
    // Lista explícita para evitar falhas de metadata com glob patterns no runtime ESM.
    entities: [
        Area,
        Autorizacao,
        Colaborador,
        RegistroAcesso,
        TokenBlacklist,
        Usuario,
        AccessLogCache
    ],
});