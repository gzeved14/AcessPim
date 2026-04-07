import { DataSource } from "typeorm";
import dotenv from 'dotenv';

//dotenv.config();

/*/const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = Number(process.env.DB_PORT) || 5432;
const dbUser = process.env.DB_USER || process.env.DB_USERNAME;
const dbName = process.env.DB_NAME || process.env.DB_DATABASE;
const dbPassword = process.env.DB_PASSWORD || process.env.DB_PASSWORD;
*/
export const appDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST as string, //dbHost,
    port: Number(process.env.DB_PORT) || 5432, //dbPort,
    username: process.env.DB_USER as string,//dbUser as string,
    password: process.env.DB_PASSWORD as string, //dbPassword as string,
    database: process.env.DB_NAME as string, //dbName as string,
    synchronize: true, // Em produção, é recomendado usar migrations em vez de synchronize
    logging: false,
    entities: [
        "src/entities/**/*.ts"
]
});