import { RegistroAcesso } from './registro-acesso.model';

// Indicadores obrigatorios exibidos nos cards do dashboard.
export interface DashboardCards {
  // Total de acessos registrados no dia corrente.
  totalAccessesToday: number;
  // Total de acessos negados no dia corrente.
  deniedToday: number;
  // Quantidade de pessoas em area restrita no momento.
  collaboratorsNow: number;
  // Nome da area com maior movimentacao.
  mostActiveArea: string;
}

// Estrutura usada para grafico/lista de ocupacao por area.
export interface AreaOccupancyItem {
  // Nome da area para exibicao.
  areaName: string;
  // Quantidade atual de pessoas presentes.
  currentOccupancy: number;
  // Limite maximo suportado pela area.
  maxCapacity: number;
  // Percentual de ocupacao calculado.
  percentage: number;
}

// Payload consolidado retornado por GET /dashboard.
export interface DashboardData {
  // Cards principais da visao gerencial.
  cards: DashboardCards;
  // Lista de ocupacao por area.
  areaOccupancy: AreaOccupancyItem[];
  // Ultimos registros para exibicao imediata.
  latestAccesses: RegistroAcesso[];
}