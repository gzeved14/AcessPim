-- ============================================================================
-- MIGRAÇÃO: Atualizar Tabela de Autorização com Novo Sistema
-- Data: 4 de maio de 2026
-- Descrição: Refatora tabela autorizacao para suportar:
--   - Cargos de Colaboradores (CargoColaborador enum)
--   - Regras globais por cargo
--   - Exceções por colaborador específico
--   - Validade de autorização (temporária ou indefinida)
-- ============================================================================

-- ============================================================================
-- PASSO 1: Adicionar Enum para CargoColaborador (se não existir)
-- ============================================================================
DO $$ BEGIN
  CREATE TYPE cargo_colaborador_enum AS ENUM (
    'Técnico de Manutenção',
    'Supervisor de Produção',
    'GESTOR_DE_AREA'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ============================================================================
-- PASSO 2: Remover tabela antiga autorizacao (se existir)
-- ============================================================================
DROP TABLE IF EXISTS autorizacao CASCADE;

-- ============================================================================
-- PASSO 3: Criar nova tabela autorizacao com estrutura correta
-- ============================================================================
CREATE TABLE autorizacao (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Qual CARGO pode acessar (global para todo colaborador com este cargo)
    cargo cargo_colaborador_enum NOT NULL,
    
    -- Qual AREA ele pode acessar
    area_id UUID NOT NULL REFERENCES area(id) ON DELETE CASCADE,
    
    -- OPCIONAL: Se preenchido, é uma exceção para colaborador específico
    -- Serve para autorizar um colaborador que normalmente não teria permissão
    colaborador_id UUID REFERENCES colaborador(id) ON DELETE CASCADE,
    
    -- Data de validade (NULL = indefinida)
    validade TIMESTAMP NULL,
    
    -- Auditoria
    criada_em TIMESTAMP DEFAULT NOW(),
    criada_por UUID REFERENCES usuario(id),
    
    -- Constraint
    CONSTRAINT validade_no_passado CHECK (validade IS NULL OR validade > NOW())
);

-- ============================================================================
-- PASSO 4: Criar índices para performance e uniqueness
-- ============================================================================
-- Índice parcial para regras GLOBAIS (sem colaborador específico)
CREATE UNIQUE INDEX idx_autorizacao_unique_global 
ON autorizacao(cargo, area_id) 
WHERE colaborador_id IS NULL;

-- Índice parcial para regras ESPECÍFICAS (com colaborador)
CREATE UNIQUE INDEX idx_autorizacao_unique_especifica 
ON autorizacao(cargo, area_id, colaborador_id) 
WHERE colaborador_id IS NOT NULL;

-- Índices para performance em buscas
CREATE INDEX idx_autorizacao_cargo ON autorizacao(cargo);
CREATE INDEX idx_autorizacao_area ON autorizacao(area_id);
CREATE INDEX idx_autorizacao_colaborador ON autorizacao(colaborador_id);
CREATE INDEX idx_autorizacao_validade ON autorizacao(validade) 
    WHERE validade IS NOT NULL;

-- ============================================================================
-- PASSO 5: Atualizar coluna cargo da tabela colaborador (se necessário)
-- ============================================================================
-- Verifica se a coluna cargo é do tipo TEXT (pode precisar de conversão)
-- Para usar o enum, descomentar:
-- ALTER TABLE colaborador 
-- ALTER COLUMN cargo TYPE cargo_colaborador_enum 
-- USING cargo::cargo_colaborador_enum;

-- ============================================================================
-- SUCESSO: Tabela criada com sucesso!
-- ============================================================================
-- A partir de agora, você pode inserir regras de autorização:
--
-- Exemplo 1: Técnico pode acessar Sala de Servidores (global)
-- INSERT INTO autorizacao (cargo, area_id, colaborador_id, validade, criada_em)
-- VALUES ('TECNICO_MANUTENCAO', <area_id>, NULL, NULL, NOW());
--
-- Exemplo 2: João (auxiliar específico) pode acessar Lab por 1 mês
-- INSERT INTO autorizacao (cargo, area_id, colaborador_id, validade, criada_em)
-- VALUES ('AUXILIAR_PRODUCAO', <area_id>, <joao_id>, NOW() + INTERVAL '1 month', NOW());
--
