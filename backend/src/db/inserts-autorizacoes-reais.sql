-- ============================================================================
-- INSERTS: Autorizações Reais do AccessPIM
-- Baseado nos dados existentes no banco
-- ============================================================================

-- Técnico de Manutenção pode acessar Sala de Alta Tensão
INSERT INTO autorizacao (cargo, area_id, colaborador_id, validade, criada_em)
SELECT 
    'Técnico de Manutenção'::cargo_colaborador_enum as cargo,
    a.id as area_id,
    NULL::UUID as colaborador_id,
    NULL::TIMESTAMP as validade,
    NOW() as criada_em
FROM area a 
WHERE LOWER(a.nome) LIKE '%alta%tensão%' OR LOWER(a.nome) LIKE '%alta%tens%'
ON CONFLICT DO NOTHING;

-- Supervisor de Produção pode acessar Almoxarifado Químico
INSERT INTO autorizacao (cargo, area_id, colaborador_id, validade, criada_em)
SELECT 
    'Supervisor de Produção'::cargo_colaborador_enum as cargo,
    a.id as area_id,
    NULL::UUID as colaborador_id,
    NULL::TIMESTAMP as validade,
    NOW() as criada_em
FROM area a 
WHERE LOWER(a.nome) LIKE '%almoxarifado%' OR LOWER(a.nome) LIKE '%químico%'
ON CONFLICT DO NOTHING;

-- GESTOR_DE_AREA pode acessar TODAS as áreas (regra global)
INSERT INTO autorizacao (cargo, area_id, colaborador_id, validade, criada_em)
SELECT 
    'GESTOR_DE_AREA'::cargo_colaborador_enum as cargo,
    a.id as area_id,
    NULL::UUID as colaborador_id,
    NULL::TIMESTAMP as validade,
    NOW() as criada_em
FROM area a
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICAÇÃO: Ver o que foi inserido
-- ============================================================================
SELECT 
    auth.cargo,
    a.nome as area_nome,
    CASE WHEN auth.colaborador_id IS NULL THEN 'GLOBAL' ELSE 'ESPECÍFICA' END as tipo_regra,
    auth.validade
FROM autorizacao auth
JOIN area a ON auth.area_id = a.id
ORDER BY auth.cargo, a.nome;

-- ============================================================================
-- RESUMO
-- ============================================================================
SELECT 
    COUNT(*) as total_autorizacoes,
    COUNT(DISTINCT cargo) as cargos_com_autorizacao,
    COUNT(DISTINCT area_id) as areas_cobertas
FROM autorizacao;
