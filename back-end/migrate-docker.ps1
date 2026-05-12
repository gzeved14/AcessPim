#!/usr/bin/env pwsh
# ============================================================================
# SCRIPT: Aplicar Migrações do AccessPIM no Docker
# OS: Windows PowerShell
# Descrição: Automatiza toda a migração do banco em 3 passos
# ============================================================================

Write-Host "🐳 AccessPIM - Migração de Banco de Dados" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# PASSO 1: Verificar se o Docker está rodando
# ============================================================================
Write-Host "📍 Passo 1: Verificando Docker..." -ForegroundColor Yellow

$container = docker ps --filter "name=accesspim-db" --format "{{.Names}}"

if ([string]::IsNullOrEmpty($container)) {
    Write-Host "⚠️  Container accesspim-db não está rodando" -ForegroundColor Red
    Write-Host "🚀 Iniciando Docker Compose..." -ForegroundColor Yellow
    docker-compose up -d
    Start-Sleep -Seconds 3
    Write-Host "✅ Docker iniciado" -ForegroundColor Green
} else {
    Write-Host "✅ Docker já está rodando" -ForegroundColor Green
}

Write-Host ""

# ============================================================================
# PASSO 2: Aplicar Migração Principal
# ============================================================================
Write-Host "📍 Passo 2: Aplicando Migração de Autorizações..." -ForegroundColor Yellow

# Copiar arquivo de migração para o container
Write-Host "   Copiando arquivo..." -ForegroundColor Gray
docker cp src/db/migration-autorizacao-20260504.sql accesspim-db:/migration.sql

# Executar a migração
Write-Host "   Executando SQL..." -ForegroundColor Gray
$migration = docker exec -i accesspim-db psql -U postgres -d accesspim < src/db/migration-autorizacao-20260504.sql 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Migração aplicada com sucesso" -ForegroundColor Green
} else {
    Write-Host "❌ Erro na migração:" -ForegroundColor Red
    Write-Host $migration -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================================================
# PASSO 3: Inserir Dados de Teste
# ============================================================================
Write-Host "📍 Passo 3: Inserindo Dados de Teste..." -ForegroundColor Yellow

Write-Host "   Copiando arquivo de seeds..." -ForegroundColor Gray
docker cp src/db/seeds-autorizacoes-teste.sql accesspim-db:/seeds.sql

Write-Host "   Executando inserts..." -ForegroundColor Gray
$seeds = docker exec -i accesspim-db psql -U postgres -d accesspim < src/db/seeds-autorizacoes-teste.sql 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Dados de teste inseridos" -ForegroundColor Green
} else {
    Write-Host "⚠️  Aviso ao inserir dados (pode ser normal se alguns já existem):" -ForegroundColor Yellow
    Write-Host $seeds -ForegroundColor Yellow
}

Write-Host ""

# ============================================================================
# PASSO 4: Verificar Resultado
# ============================================================================
Write-Host "📍 Passo 4: Verificando Resultado..." -ForegroundColor Yellow

$count = docker exec -it accesspim-db psql -U postgres -d accesspim -t -c "SELECT COUNT(*) FROM autorizacao;" 2>&1
$count = $count.Trim()

Write-Host "   Total de autorizações no banco: $count" -ForegroundColor Cyan

Write-Host ""

# ============================================================================
# RESUMO FINAL
# ============================================================================
Write-Host "✅ Migração Completa!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Próximos Passos:" -ForegroundColor Cyan
Write-Host "  1. Verificar as autorizações no banco:" -ForegroundColor Gray
Write-Host "     docker exec -it accesspim-db psql -U postgres -d accesspim" -ForegroundColor DarkGray
Write-Host "     SELECT * FROM autorizacao LIMIT 5;" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  2. Testar o endpoint de preview:" -ForegroundColor Gray
Write-Host "     POST /registro/preview" -ForegroundColor DarkGray
Write-Host "     {" -ForegroundColor DarkGray
Write-Host "       ""colaborador_id"": ""xxx""," -ForegroundColor DarkGray
Write-Host "       ""area_id"": ""yyy""," -ForegroundColor DarkGray
Write-Host "       ""tipo"": ""ENTRADA""" -ForegroundColor DarkGray
Write-Host "     }" -ForegroundColor DarkGray
Write-Host ""
Write-Host "  3. Registrar um acesso de teste" -ForegroundColor Gray
Write-Host ""
Write-Host "📚 Documentação:" -ForegroundColor Cyan
Write-Host "  - Guia completo: GUIA_MIGRACAO_DOCKER.md" -ForegroundColor Gray
Write-Host "  - Arquitetura: src/types/ARQUITETURA_PERMISSOES.ts" -ForegroundColor Gray
Write-Host "  - Exemplos SQL: src/db/seeds-autorizacoes-teste.sql" -ForegroundColor Gray
Write-Host ""

# ============================================================================
# MENU OPCIONAL: Operações Adicionais
# ============================================================================
Write-Host "🔧 Operações Adicionais:" -ForegroundColor Yellow
Write-Host ""
Write-Host "[1] Ver todas as autorizações"
Write-Host "[2] Conectar ao psql interativo"
Write-Host "[3] Fazer backup do banco"
Write-Host "[4] Limpar dados de teste"
Write-Host "[0] Sair"
Write-Host ""

$option = Read-Host "Escolha uma opção (0-4)"

switch ($option) {
    "1" {
        Write-Host ""
        Write-Host "📋 Autorizações no Banco:" -ForegroundColor Cyan
        docker exec -it accesspim-db psql -U postgres -d accesspim -c "
            SELECT 
                cargo,
                (SELECT nome FROM area WHERE id = auth.area_id) as area,
                COALESCE((SELECT nome FROM colaborador WHERE id = auth.colaborador_id), 'GLOBAL') as colaborador,
                CASE WHEN validade IS NULL THEN 'Indefinida' ELSE to_char(validade, 'DD/MM/YYYY HH:MM') END as validade
            FROM autorizacao auth
            ORDER BY cargo, area;
        "
    }
    "2" {
        Write-Host ""
        Write-Host "🔗 Conectando ao PostgreSQL..." -ForegroundColor Yellow
        docker exec -it accesspim-db psql -U postgres -d accesspim
    }
    "3" {
        Write-Host ""
        Write-Host "💾 Fazendo backup..." -ForegroundColor Yellow
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        $backupFile = "backup_accesspim_$timestamp.sql"
        docker exec -i accesspim-db pg_dump -U postgres accesspim > $backupFile
        Write-Host "✅ Backup salvo: $backupFile" -ForegroundColor Green
    }
    "4" {
        Write-Host ""
        Write-Host "🗑️  Limpando dados de teste..." -ForegroundColor Yellow
        docker exec -i accesspim-db psql -U postgres -d accesspim -c "DELETE FROM autorizacao;"
        Write-Host "✅ Dados de teste removidos" -ForegroundColor Green
    }
    default {
        Write-Host ""
        Write-Host "👋 Até logo!" -ForegroundColor Green
    }
}

Write-Host ""
