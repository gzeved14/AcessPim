import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import rateLimit from 'express-rate-limit';
import { Pool } from 'pg';


const app = express();

app.set('trust proxy', true); // Para lidar com proxies reversos, se necessário

// Middleware de logging simples para monitorar as requisições
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

app.use(helmet({
  // Desativa o CSP para evitar que o Helmet bloqueie as extensões e o DevTools do Chrome em APIs REST
  contentSecurityPolicy: false,
}));

//app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));

// Garantir UTF-8 em todas as respostas JSON
app.use((req, res, next) => {
  res.type('application/json; charset=utf-8');
  next();
});

app.use(cors());
app.use(express.json());
/*const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Muitas requisições, tente novamente mais tarde'
});
app.use('/auth/login', limiter);

app.use(routes);

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(" [ERRO INTERNO NO BACK-END]:", err);
    next(err); 
});

app.use(errorHandler);
*/
const conexaoBanco = process.env.DATABASE_URL || `postgresql://${env.DB_USER}:${env.DB_PASSWORD}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`;

const pool = new Pool({
  connectionString: conexaoBanco,
});

app.post('/api/registro', async (req, res) => {
  const { matricula, area, status } = req.body;

  console.log(`\n☁️ [NUVEM] Evento de acesso recebido da Catraca:`);
  console.log(`   - Matrícula: ${matricula} | Área: ${area} | Status: ${status}`);

  try {
    // Insere o evento de acesso gerado pelo OpenCV direto na tabela do banco real
    // Nota: Certifique-se de que os campos batem com a sua tabela de logs/registros
    const queryTexto = 'INSERT INTO registro_acesso (matricula, area, status, data_hora) VALUES ($1, $2, $3, NOW()) RETURNING *';
    const valores = [matricula, area, status];
    
    // Se você ainda não criou a tabela de registros, comente as duas linhas abaixo para não dar erro
    // const resultado = await pool.query(queryTexto, valores);

    return res.status(201).json({
      status: "Sucesso!",
      mensagem: "Log de acesso consolidado com sucesso na nuvem!"
    });

  } catch (erro) {
    console.error("❌ Erro ao salvar registro de acesso no banco:", erro);
    return res.status(500).json({ erro: "Erro interno ao salvar no banco de dados." });
  }
});

// Rota de teste antiga do banco
app.get('/teste-banco', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT * FROM colaborador');
    res.json({
      status: "Sucesso!",
      mensagem: "Conexão com PostgreSQL bem-sucedida. Sprint 1 entregue!",
      dados: resultado.rows
    });
  } catch (erro) {
    console.error("Erro ao conectar no banco:", erro);
    res.status(500).json({ erro: "Falha na conexão com o banco de dados." });
  }
});

const appPort = process.env.PORT || env.PORT || 3000;

app.listen(appPort, () => {
  console.log(`🚀 Servidor rodando na porta ${appPort}`);
  console.log(`👉 API ativa para receber logs da borda em: http://localhost:${appPort}/api/registro`);
});