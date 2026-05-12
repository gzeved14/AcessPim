/**
 * CargoColaborador: Cargos/funções dos colaboradores (funcionários) na planta industrial.
 * Estes definem QUEM A PESSOA É dentro da empresa, não permissões no sistema.
 * 
 * Valores baseados nos dados reais do banco de dados:
 * - Técnico de Manutenção
 * - Supervisor de Produção
 * - GESTOR_DE_AREA
 * 
 * Os cargos são usados para:
 * 1. Identificar o funcionário na planta
 * 2. Vincular às autorizações de áreas (tabela Autorizacao)
 * 3. Determinar se pode entrar em áreas restritas
 */
export enum CargoColaborador {
    TECNICO_MANUTENCAO = "Técnico de Manutenção",
    SUPERVISOR = "Supervisor de Produção",
    GESTOR_DE_AREA = "GESTOR_DE_AREA",
}
