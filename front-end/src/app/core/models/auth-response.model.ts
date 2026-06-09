import { Usuario } from './usuario.model';

// Estrutura da resposta recebida no login/refresh.
export interface AuthResponse {
  // JWT de acesso usado nas rotas protegidas.
  accessToken: string;
  // JWT de renovacao usado para gerar novo access token.
  refreshToken: string;
  // Dados do usuario retornados pelo backend. 
  // Alterado para usar a interface Usuario completa.
  user: Usuario; 
}