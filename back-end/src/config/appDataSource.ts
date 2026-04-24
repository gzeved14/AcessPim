import { DataSource } from "typeorm";
import dotenv from 'dotenv';

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
    synchronize: process.env.NODE_ENV !== 'production',
    logging: false,
    entities: [
        "src/entities/**/*.ts",
        "dist/entities/**/*.js"
]
});