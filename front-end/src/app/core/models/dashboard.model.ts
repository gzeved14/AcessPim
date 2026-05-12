import { RegistroAcesso } from './registro-acesso.model';

// Indicadores obrigatorios exibidos nos cards do dashboard.
export interface DashboardCards {
  // Total de acessos registrados no dia corrente.
  totalAccessesToday: number;
  totalAccessesThisWeek: number;
  totalAccessesThisMonth: number;
  totalAccessesThisYear: number;
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
// Localize este bloco no seu arquivo de modelos:
export interface HourlyAccess {
  total: number;
  hora?: number;
  dia?: string; // Representa o dia no formato 'YYYY-MM-DD'
  mes?: number;
  mesNome?: string; // Adicione esta linha
}
export interface DashboardData {
  cards: DashboardCards;
  areaOccupancy: AreaOccupancyItem[];
  latestAccesses: RegistroAcesso[];
  accessesByHour: HourlyAccess[];
}