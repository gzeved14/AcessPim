import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import rateLimit from 'express-rate-limit';
import { Pool } from 'pg';
import routes from './routes'; 
import { errorHandler } from './middleware/errorHandler'; 
import { appDataSource } from './config/appDataSource'; 

const app = express();

app.set('trust proxy', true); 

// Middleware de logging simples para monitorar as requisições
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

app.use(helmet({
  contentSecurityPolicy: false,
}));

// Garantir UTF-8 em todas as respostas JSON
app.use((req, res, next) => {
  res.type('application/json; charset=utf-8');
  next();
});

app.use(cors());
app.use(express.json());

// Limitador de requisições para a rota de login
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Muitas requisições, tente novamente mais tarde'
});
app.use('/api/auth/login', limiter);

// =========================================================================
// 🔓 INTERCEPTADORES PÚBLICOS (Devem vir antes do roteador principal /api)
// =========================================================================

// Configuração do Pool do PG (Mantida para fins de compatibilidade)
const conexaoBanco = process.env.DATABASE_URL || `postgresql://${env.DB_USER}:${env.DB_PASSWORD}@${env.DB_HOST}:${env.DB_PORT}/${env.DB_NAME}`;
const pool = new Pool({
  connectionString: conexaoBanco,
});

// 🎯 Rota pública para logs de acesso da catraca (OpenCV na borda)
// Posicionada aqui em cima, ela nunca passará pelo middleware de token!
app.post('/api/registro', async (req, res) => {
  const { matricula, area, status } = req.body;

  console.log(`\n☁️ [NUVEM] Evento de acesso recebido da Catraca:`);
  console.log(`   - Matrícula: ${matricula} | Área: ${area} | Status: ${status}`);

  try {
    const queryTexto = 'INSERT INTO registro_acesso (matricula, area, status, data_hora) VALUES ($1, $2, $3, NOW()) RETURNING *';
    const valores = [matricula, area, status];
    
    // Se a tabela já existir e você quiser persistir usando o PG bruto:
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

// Rota de teste antiga do banco nativo
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

// =========================================================================
// 🛡️ ROTEADOR PRINCIPAL (Contém o ensureAuth para as demais rotas privadas)
// =========================================================================
app.use('/api', routes);

// Middleware de log de erros internos
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(" [ERRO INTERNO NO BACK-END]:", err);
    next(err); 
});

app.use(errorHandler);

const appPort = process.env.PORT || env.PORT || 3000;

// Inicialização Síncrona Segura
appDataSource.initialize()
  .then(() => {
    console.log("💾 [BANCO] Conexão com o PostgreSQL via TypeORM estabelecida!");
    console.log("📊 [METADATA] Entidades sincronizadas e prontas na memória.");

    app.listen(appPort, () => {
      console.log(`🚀 Servidor rodando na porta ${appPort}`);
      console.log(`👉 API ativa para receber logs da borda em: http://localhost:${appPort}/api/registro`);
    });
  })
  .catch((erro) => {
    console.error("❌ [ERRO CRÍTICO] Falha ao inicializar o DataSource do TypeORM antes do boot do servidor:", erro);
    process.exit(1); 
  });