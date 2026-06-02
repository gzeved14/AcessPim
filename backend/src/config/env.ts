import { z } from 'zod';
import * as dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000), // Porta aceita fallback por padrão de mercado
  FRONTEND_URL: z.string().url("FRONTEND_URL precisa ser uma URL válida"),
  
  // Variáveis do Banco de Dados - SEM FALLBACKS
  DB_HOST: z.string().min(1, "DB_HOST é obrigatório"),
  DB_PORT: z.coerce.number().default(5432),
  DB_USER: z.string().min(1, "DB_USER é obrigatório"),
  DB_PASSWORD: z.string().min(1, "DB_PASSWORD é obrigatória e não pode ser vazia"),
  DB_NAME: z.string().min(1, "DB_NAME é obrigatório"),
  
  // Se você usar JWT_SECRET, valide aqui também
  JWT_SECRET: z.string().min(1, "JWT_SECRET é obrigatório para a segurança dos tokens"),
});

const _env = envSchema.safeParse(process.env);

if (_env.success === false) {
  console.error('Erro de configuração nas variáveis de ambiente:', _env.error.format());
  // Derruba a aplicação imediatamente
  process.exit(1);
}

export const env = _env.data;