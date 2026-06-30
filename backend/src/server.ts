import 'reflect-metadata'; // Importante para o TypeORM funcionar corretamente
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import rateLimit from 'express-rate-limit';
import routes from './routes'; 
import { errorHandler } from './middleware/errorHandler'; 
import { appDataSource } from './config/appDataSource'; 

const app = express();
app.set('trust proxy', 1); 

// 1. Logs de Requisição (Para você ver tudo o que chega no terminal)
// Adicione isto logo após o app.use(express.json())
app.use((req, res, next) => {
    console.log(`[DEBUG] Recebido: ${req.method} ${req.path} com body:`, JSON.stringify(req.body));
    next();
});

// 2. Segurança e CORS (Configuração Oficial para Deploy)
app.use(helmet());
app.use(cors({
  origin: ['https://accesspim.dev', 'http://localhost:4200'], // No deploy final em nuvem, você pode trocar '*' pelo domínio do front-end
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

app.use(express.json());

// 3. Rate Limit apenas na rota de Login para evitar ataques de força bruta
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Muitas requisições, tente novamente mais tarde'
});
app.use('/api/auth/login', limiter);

// 4. Roteamento Oficial (Toda a arquitetura passa por aqui agora)
app.use('/api', routes);

// 5. Tratamento Global de Erros (Captura os AppErrors dos seus controllers)
app.use(errorHandler);

const appPort = process.env.PORT || env.PORT || 3000;

// 6. Inicialização do Banco e Boot do Servidor
appDataSource.initialize()
  .then(() => {
    console.log("💾 [BANCO] Conexão com o PostgreSQL via TypeORM estabelecida!");
    app.listen(Number(appPort), "0.0.0.0", () => {
      console.log(`🚀 Servidor Oficial rodando na porta ${appPort}`);
    });
  })
  .catch((erro) => {
    console.error("❌ Falha ao inicializar o banco de dados:", erro);
    process.exit(1); 
  });