-- ============================================================================
-- EXEMPLO DE SEEDS PARA TABELA AUTORIZACAO
-- Demonstra como vincular CARGOS DE COLABORADORES a ÁREAS
-- ============================================================================

-- Assumindo que existem areas e colaboradores já cadastrados no banco

-- Exemplo 1: Técnico de Manutenção pode acessar Sala de Servidores
INSERT INTO autorizacao (id, cargo, area_id, colaborador_id, validade, criada_em)
VALUES (
    gen_random_uuid(),
    'TECNICO_MANUTENCAO',      -- Cargo do colaborador
    '<area_sala_servidores_id>', -- ID da Sala de Servidores
    NULL,                         -- NULL = regra global para todo técnico
    NULL,                         -- NULL = sem data de validade
    NOW()
);

-- Exemplo 2: Engenheiro pode acessar Laboratório de Qualidade
INSERT INTO autorizacao (id, cargo, area_id, colaborador_id, validade, criada_em)
VALUES (
    gen_random_uuid(),
    'ENGENHEIRO',
    '<area_lab_qualidade_id>',
    NULL,
    NULL,
    NOW()
);

-- Exemplo 3: Auxiliar de Produção pode acessar Piso de Produção (3 meses)
INSERT INTO autorizacao (id, cargo, area_id, colaborador_id, validade, criada_em)
VALUES (
    gen_random_uuid(),
    'AUXILIAR_PRODUCAO',
    '<area_piso_producao_id>',
    NULL,
    NOW() + INTERVAL '3 months',  -- Validade temporária
    NOW()
);

-- Exemplo 4: Autorização específica para um colaborador (exceção)
-- João Silva (ID = xxx) é auxiliar mas precisa acessar laboratório por 1 mês
INSERT INTO autorizacao (id, cargo, area_id, colaborador_id, validade, criada_em)
VALUES (
    gen_random_uuid(),
    'AUXILIAR_PRODUCAO',
    '<area_lab_qualidade_id>',
    '<joao_silva_id>',              -- ID específico do colaborador
    NOW() + INTERVAL '1 month',
    NOW()
);

-- ============================================================================
-- RESULTADO: Fluxo de Autorização
-- ============================================================================
--
-- 1. Operador tenta registrar entrada de João Silva na Sala de Servidores
--    Sistema busca: autorizações onde cargo=TECNICO_MANUTENCAO E area=Servidores
--    → Não encontra (João é AUXILIAR)
--    ❌ NEGADO - Registrado como acesso não autorizado
--
-- 2. Operador tenta registrar entrada de João Silva no Piso de Produção
--    Sistema busca: autorizações onde cargo=AUXILIAR_PRODUCAO E area=Piso
--    → Encontra! E não expirou
--    ✅ AUTORIZADO - Registrado como acesso bem-sucedido
--
-- 3. Operador tenta registrar entrada de Maria (outro auxiliar) no Piso
--    Sistema busca: autorizações onde cargo=AUXILIAR_PRODUCAO E area=Piso
--    → Encontra! (mesma regra global)
--    ✅ AUTORIZADO
--
