export interface RegistroAcesso {
  // Identificador unico do registro de acesso.
  id: string;
  // Tipo de movimentacao (entrada ou saida), suportando variacoes de casing.
  tipo: 'entrada' | 'saida' | 'ENTRADA' | 'SAIDA';
  // Resultado da validacao de autorizacao no momento do registro.
  autorizado: boolean;
  // Data/hora em formato string retornado pela API.
  timestamp: string;
  // Observacao opcional, esperada em acessos negados.
  observacao?: string | null;
  // Campos opcionais quando a API retornar IDs diretos.
  colaborador_id?: string;
  area_id?: string;
  registrado_por?: string;
  // Relacionamentos opcionais para exibicao de nomes no front.
  colaborador?: { id?: string; nome?: string };
  area?: { id?: string; nome?: string };
}