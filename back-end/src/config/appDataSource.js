import { DataSource } from "typeorm";
import dotenv from 'dotenv';
import { Area } from "../entities/Area.js";
import { Autorizacao } from "../entities/Autorizacao.js";
import { Colaborador } from "../entities/Colaborador.js";
import { RegistroAcesso } from "../entities/RegistroAcesso.js";
import { TokenBlacklist } from "../entities/TokenBlacklist.js";
import { Usuario } from "../entities/Usuario.js";
dotenv.config();
const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = Number(process.env.DB_PORT) || 5432;
const dbUser = process.env.DB_USER || process.env.DB_USERNAME || 'postgres';
const dbName = process.env.DB_NAME || process.env.DB_DATABASE || 'accesspim';
const dbPassword = process.env.DB_PASSWORD || '';
export const appDataSource = new DataSource({
    type: "postgres",
    host: dbHost,
    port: dbPort,
    username: dbUser,
    password: dbPassword,
    database: dbName,
    synchronize: false,
    logging: false,
    // Lista explícita para evitar falhas de metadata com glob patterns no runtime ESM.
    entities: [Area, Autorizacao, Colaborador, RegistroAcesso, TokenBlacklist, Usuario]
});
//# sourceMappingURL=appDataSource.js.map