/**
 * PerfilUsuario: Perfis de acesso para usuarios que fazem login no sistema.
 * Estes definem o que a pessoa pode fazer DENTRO do software.
 * 
 * São apenas 3 perfis fixos:
 * - ADMIN: Gerencia áreas, colaboradores e autorizações do sistema
 * - GESTOR_DE_AREA: Consulta dashboard e auditoria da sua área
 * - OP_DE_SEGURANCA: Registra entradas/saídas de colaboradores
 */
export enum PerfilUsuario {
    ADMIN = "ADMIN",
    GESTOR_DE_AREA = "GESTOR_DE_AREA",
    OP_DE_SEGURANCA = "OP_DE_SEGURANCA"
}
