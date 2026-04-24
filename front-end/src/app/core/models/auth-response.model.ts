// Response de autenticação do backend
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    nome: string;
    email: string;
    cargo: string;
  };
}
