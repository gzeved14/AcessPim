// Estrutura do usuario armazenado no estado da aplicacao.
export interface Usuario {
  // Identificador unico do usuario.
  id: string;
  // Nome completo exibido no front.
  nome: string;
  // Email usado no login.
  email: string;
  // Cargo/perfil usado em regras de acesso.
  cargo: string;
  // Matricula funcional, mantida para contexto do dominio.
  matricula: string;
  // Setor de lotacao do usuario.
  setor: string;
}
