// Estrutura da resposta recebida no login/refresh.
export interface AuthResponse {
  // JWT de acesso usado nas rotas protegidas.
  accessToken: string;
  // JWT de renovacao usado para gerar novo access token.
  refreshToken: string;
  // Dados do usuario retornados pelo backend apos autenticar.
  user: {
    // Identificador unico do usuario autenticado.
    id: string;
    // Nome exibido na interface.
    nome: string;
    // Email usado para login.
    email: string;
    // Cargo/perfil para regras de acesso.
    cargo: string;
  };
}
