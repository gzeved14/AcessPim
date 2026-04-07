-- 1. Inserir um Usuário Inicial (Senha exemplo: 'admin123' em hash)
INSERT INTO usuario (nome, email, senha_hash, cargo) 
VALUES ('Operador Padrão', 'operador@empresa.com', '$2b$10$ExemploHashBcrypt', 'OP_DE_SEGURANCA');

-- 2. Inserir Colaboradores
INSERT INTO colaborador (nome, matricula, cargo, setor) 
VALUES 
('João Silva', 'MAT123', 'Técnico de Manutenção', 'Elétrica'),
('Maria Oliveira', 'MAT456', 'Supervisor de Produção', 'Linha A');

-- 3. Inserir Áreas
-- Maria (MAT456) será a responsável pelas áreas
INSERT INTO area (nome, descricao, nivel_risco, capacidade, responsavel_id)
VALUES 
('Sala de Alta Tensão', 'Uso obrigatório de EPI nível 4', 'critico', 2, (SELECT id FROM colaborador WHERE matricula = 'MAT456')),
('Almoxarifado Químico', 'Acesso restrito a técnicos', 'alto', 5, (SELECT id FROM colaborador WHERE matricula = 'MAT456'));

-- 4. Inserir um Registro de Acesso inicial para teste
INSERT INTO registro_acesso (colaborador_id, area_id, tipo, autorizado, registrado_por)
VALUES (
    (SELECT id FROM colaborador WHERE matricula = 'MAT123'),
    (SELECT id FROM area WHERE nome = 'Sala de Alta Tensão'),
    'entrada',
    true,
    (SELECT id FROM usuario WHERE email = 'operador@empresa.com')
);