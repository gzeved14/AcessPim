/**
 * ARQUITETURA DE PERMISSÕES - AccessPIM
 * 
 * Este documento esclarece a diferença fundamental entre Perfis de Usuário e Cargos de Colaboradores.
 */

// ============================================================================
// 1️⃣  PERFIS DE USUÁRIO (PerfilUsuario.ts) - Sistema/Login
// ============================================================================
// 
// São apenas 3 perfis, vinculados à tabela USUARIO.
// Definem O QUE A PESSOA PODE FAZER dentro do SOFTWARE.
// 
// Exemplos:
// - ADMIN: Pode cadastrar áreas, colaboradores, usuários e ver auditoria
// - GESTOR_DE_AREA: Pode consultar dashboard e auditoria da sua área
// - OP_DE_SEGURANCA: Pode registrar entradas/saídas de colaboradores
// 
// Arquivo: src/types/PerfilUsuario.ts
// Tabela: usuario.cargo (enum PerfilUsuario)
// Usado por: Usuários que fazem LOGIN no sistema
// 

// ============================================================================
// 2️⃣  CARGOS DE COLABORADORES (CargoColaborador.ts) - Planta/Funcionários
// ============================================================================
// 
// São MÚLTIPLOS cargos, vinculados à tabela COLABORADOR.
// Definem QUEM A PESSOA É dentro da EMPRESA.
// 
// Exemplos:
// - TECNICO_MANUTENCAO
// - AUXILIAR_PRODUCAO
// - ENGENHEIRO
// - OPERADOR_MAQUINA
// - AUXILIAR_LIMPEZA
// 
// Arquivo: src/types/CargoColaborador.ts
// Tabela: colaborador.cargo (enum CargoColaborador)
// Usado por: Todos os funcionários da planta (mesmo sem acesso ao sistema)
// 

// ============================================================================
// 3️⃣  TABELA DE AUTORIZAÇÃO - A Ponte
// ============================================================================
// 
// A tabela AUTORIZACAO vincula:
// - CargoColaborador (cargo do colaborador)
// - Area (aonde pode ir)
// - Validade (até quando)
// 
// Quando um Operador tenta registrar entrada de um colaborador:
// 
// 1. Sistema busca o CARGO do colaborador
// 2. Sistema busca AUTORIZAÇÕES que permitam esse cargo naquela área
// 3. Sistema verifica se não expirou
// 4. Registra como AUTORIZADO ou NEGADO
// 

// ============================================================================
// 4️⃣  EXEMPLO PRÁTICO DE FLUXO
// ============================================================================
// 
// Cenário:
// - Operador de Segurança (OP_DE_SEGURANCA - perfil) quer registrar entrada
// - Colaborador: João Silva (cargo: TECNICO_MANUTENCAO)
// - Área: Sala de Servidores (nível de risco: ALTO)
// 
// Processo:
// 1. Sistema busca autorizações onde:
//    - cargo = TECNICO_MANUTENCAO
//    - area_id = <sala_de_servidores>
// 
// 2. Se encontra e não expirou:
//    ✅ AUTORIZADO - Registra como entrada bem-sucedida
// 
// 3. Se NÃO encontra:
//    ❌ NEGADO - Registra como tentativa não autorizada
// 

// ============================================================================
// 5️⃣  IMPORTÂNCIA PARA O PROJETO
// ============================================================================
// 
// ✅ Separação de Conceitos: Usuário ≠ Colaborador
// ✅ Escalabilidade: Adicionar novos cargos sem impactar perfis
// ✅ Segurança: Granular control sobre quem vai aonde
// ✅ Auditoria: Registra quem tentou e foi negado
// ✅ Flexibilidade: Permite autorizações temporárias (com validade)
// 

export const ARCHITECTURE_DOC = "Leia este arquivo para entender a estrutura";
