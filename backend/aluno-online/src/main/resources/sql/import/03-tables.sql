-- ======================================================
-- 2. TABELA CURSO
-- ======================================================

CREATE TABLE IF NOT EXISTS curso (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome_curso VARCHAR(255) NOT NULL UNIQUE,
    total_creditos SMALLINT NOT NULL DEFAULT 0,
    total_horas SMALLINT NOT NULL DEFAULT 0
);

INSERT INTO public.curso (nome_curso, total_creditos, total_horas) 
VALUES ('Eletivas Universais', 0, 0)
ON CONFLICT (nome_curso) DO NOTHING;

-- ======================================================
-- 3. TABELA PROFESSOR
-- ======================================================

CREATE TABLE IF NOT EXISTS professor (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    -- CONSTRAINT necessária para ON CONFLICT (nome)
    CONSTRAINT professor_nome_unique UNIQUE (nome)
);

-- ======================================================
-- 4. TABELA DISCIPLINA
-- ======================================================

CREATE TABLE IF NOT EXISTS disciplina (
    codigo VARCHAR(50) PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    id_curso BIGINT NOT NULL,
    carga_horaria SMALLINT,
    creditos SMALLINT,
    tipo VARCHAR(50),
    periodo SMALLINT,

    CONSTRAINT fk_disciplina_curso
        FOREIGN KEY (id_curso)
        REFERENCES curso(id)
        ON DELETE CASCADE
);

-- ======================================================
-- 5. TABELA ALUNO
-- ======================================================

CREATE TABLE IF NOT EXISTS aluno (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nome VARCHAR(255) NOT NULL,
    matricula BIGINT UNIQUE NOT NULL,
    email_institucional VARCHAR(255) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    status_matricula status_matricula_enum NOT NULL,
    periodo_inicio VARCHAR(50),
    id_curso BIGINT,

    CONSTRAINT fk_aluno_curso
        FOREIGN KEY (id_curso)
        REFERENCES curso(id)
        ON DELETE SET NULL
);

-- ======================================================
-- 6. TABELAS 1:1 — DADOS DO ALUNO
-- ======================================================

CREATE TABLE IF NOT EXISTS dados_pessoais (
    id UUID PRIMARY KEY,
    cpf VARCHAR(14) UNIQUE,
    rg VARCHAR(20),
    data_nascimento DATE,
    nome_pai VARCHAR(255),
    nome_mae VARCHAR(255),

    CONSTRAINT fk_dados_pessoais_aluno
        FOREIGN KEY (id)
        REFERENCES aluno(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS dados_contato (
    id UUID PRIMARY KEY,
    celular VARCHAR(20),
    email_pessoal VARCHAR(255),
    endereco_completo TEXT,

    CONSTRAINT fk_dados_contato_aluno
        FOREIGN KEY (id)
        REFERENCES aluno(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS dados_bancarios (
    id UUID PRIMARY KEY,
    banco VARCHAR(100),
    agencia VARCHAR(20),
    conta VARCHAR(20),
    tipo_conta VARCHAR(50),

    CONSTRAINT fk_dados_bancarios_aluno
        FOREIGN KEY (id)
        REFERENCES aluno(id)
        ON DELETE CASCADE
);

-- ======================================================
-- 7. TABELA TURMA
-- ======================================================

CREATE TABLE IF NOT EXISTS turma (
    id_turma BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo_disciplina VARCHAR(50) NOT NULL,
    id_professor BIGINT,
    numero SMALLINT NOT NULL,
    vagas SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT turma_disciplina_numero_unique UNIQUE (codigo_disciplina, numero),

    CONSTRAINT fk_turma_disciplina
        FOREIGN KEY (codigo_disciplina)
        REFERENCES disciplina(codigo)
        ON DELETE CASCADE,

    CONSTRAINT fk_turma_professor
        FOREIGN KEY (id_professor)
        REFERENCES professor(id)
        ON DELETE CASCADE
);

-- ======================================================
-- 8. TABELA HORÁRIO DE AULA
-- ======================================================

CREATE TABLE IF NOT EXISTS horario_aula (
    id_horario BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_turma BIGINT NOT NULL,
    dia dia_semana_enum NOT NULL,
    hora TIME NOT NULL,
    codigo_hora VARCHAR(50),

    CONSTRAINT horario_unico UNIQUE (id_turma, dia, hora),

    CONSTRAINT fk_horario_turma
        FOREIGN KEY (id_turma)
        REFERENCES turma(id_turma)
        ON DELETE CASCADE
);

-- ======================================================
-- 9. TABELA HISTÓRICO
-- ======================================================

CREATE TABLE IF NOT EXISTS historico_disciplina (
    id_aluno UUID NOT NULL,
    codigo_disciplina VARCHAR(50) NOT NULL,
    nota_final DECIMAL(4,2),
    frequencia DECIMAL(5,2),
    status VARCHAR(50),
    periodo_realizado VARCHAR(50),

    CONSTRAINT pk_historico
        PRIMARY KEY (id_aluno, codigo_disciplina),

    CONSTRAINT fk_historico_aluno
        FOREIGN KEY (id_aluno)
        REFERENCES aluno(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_historico_disciplina 
        FOREIGN KEY (codigo_disciplina)
        REFERENCES disciplina(codigo)
);

-- ======================================================
-- 10. TABELA EM ANDAMENTO
-- ======================================================

CREATE TABLE IF NOT EXISTS em_andamento (
    id_aluno UUID NOT NULL,
    codigo_disciplina VARCHAR(50) NOT NULL,
    PRIMARY KEY (id_aluno, codigo_disciplina),
    numero_turma SMALLINT NOT NULL,

    CONSTRAINT fk_aluno_em_andamento 
        FOREIGN KEY (id_aluno) 
        REFERENCES aluno(id) 
        ON DELETE CASCADE,
        
    CONSTRAINT fk_disciplina_em_andamento 
        FOREIGN KEY (codigo_disciplina) 
        REFERENCES disciplina(codigo) 
        ON DELETE CASCADE
);

-- ======================================================
-- 11. TABELA SINCRONIZAÇÃO
-- ======================================================

CREATE TABLE IF NOT EXISTS sincronizacao (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_aluno UUID NOT NULL,
    data_inicio TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_fim TIMESTAMPTZ,
    status_sinc status_sinc_enum NOT NULL DEFAULT 'PENDENTE',
    detalhes TEXT,
    
    CONSTRAINT fk_aluno FOREIGN KEY (id_aluno) REFERENCES aluno(id) ON DELETE CASCADE
);


-- ======================================================
-- 12. TABELA ATIVIDADE
-- ======================================================

CREATE TABLE IF NOT EXISTS atividade (
    id_atividade BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    max_horas SMALLINT NOT NULL DEFAULT 0

    CONSTRAINT atividade_nome_unique UNIQUE (nome)
);

-- ======================================================
-- 13. TABELA HISTÓRICO ATIVIDADE
-- ======================================================

CREATE TABLE IF NOT EXISTS historico_atividade (
    id_aluno UUID NOT NULL,
    id_atividade BIGINT NOT NULL,
    periodo_realizado VARCHAR(50),
    horas_realizadas SMALLINT,

    CONSTRAINT fk_historico_atividade_aluno
        FOREIGN KEY (id_aluno)
        REFERENCES aluno(id)
        ON DELETE CASCADE,
    
    CONSTRAINT fk_historico_atividade_atividade
        FOREIGN KEY (id_atividade)
        REFERENCES atividade(id_atividade)
        ON DELETE CASCADE
);