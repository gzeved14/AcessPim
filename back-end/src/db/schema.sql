-- Extensão para geração de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Definição de ENUMs conforme o PRD
CREATE TYPE nivel_risco_enum AS ENUM ('BAIXO', 'MEDIO', 'ALTO', 'CRITICO');
CREATE TYPE tipo_movimento_enum AS ENUM ('ENTRADA', 'SAIDA');
CREATE TYPE cargo_usuario_enum AS ENUM ('ADMIN', 'GESTOR_DE_AREA', 'OP_DE_SEGURANCA');

-- Tabela de Usuários (Quem opera o sistema)
CREATE TABLE usuario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    matricula TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha_hash TEXT NOT NULL, -- Armazenar com BCrypt
    setor TEXT NOT NULL,
    cargo cargo_usuario_enum NOT NULL,
    criado_em TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Colaboradores (Quem é monitorado)
CREATE TABLE colaborador (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    matricula TEXT UNIQUE NOT NULL,
    cargo TEXT NOT NULL, -- Texto livre para funções da fábrica
    setor TEXT NOT NULL,
    ativo BOOLEAN DEFAULT true,
    foto_url TEXT NULL,
    criado_em TIMESTAMPTZ DEFAULT now()
);

-- Tabela de Áreas
CREATE TABLE area (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome TEXT NOT NULL,
    descricao TEXT NULL,
    nivel_risco nivel_risco_enum NOT NULL,
    capacidade INTEGER NOT NULL,
    responsavel_id UUID NOT NULL REFERENCES colaborador(id),
    ativa BOOLEAN DEFAULT true
);

-- Tabela de Registro de Acesso (Coração do sistema)
CREATE TABLE registro_acesso (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    colaborador_id UUID NOT NULL REFERENCES colaborador(id),
    area_id UUID NOT NULL REFERENCES area(id),
    tipo tipo_movimento_enum NOT NULL,
    autorizado BOOLEAN NOT NULL,
    registrado_em TIMESTAMPTZ DEFAULT now(),
    registrado_por UUID NOT NULL REFERENCES usuario(id),
    observacao TEXT NULL
);

-- Tabela de blacklist de tokens para invalidação de sessão
CREATE TABLE token_blacklist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);