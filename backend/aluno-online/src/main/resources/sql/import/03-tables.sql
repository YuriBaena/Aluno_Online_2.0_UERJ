-- ======================================================
-- 2. TABELA CURSO
-- ======================================================

-- Representa um curso de graduação
CREATE TABLE IF NOT EXISTS curso (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY, -- PK numérica
    nome_curso VARCHAR(255) NOT NULL UNIQUE              -- Nome único do curso
);


-- ======================================================
-- 3. TABELA PROFESSOR
-- ======================================================

CREATE TABLE IF NOT EXISTS professor (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome VARCHAR(255) NOT NULL
);


-- ======================================================
-- 4. TABELA DISCIPLINA
-- ======================================================

CREATE TABLE IF NOT EXISTS disciplina (
    codigo VARCHAR(50) PRIMARY KEY,          -- Código oficial da disciplina
    nome VARCHAR(255) NOT NULL,
    id_curso BIGINT NOT NULL,                 -- Curso ao qual pertence
    carga_horaria SMALLINT,
    creditos SMALLINT,
    vagas SMALLINT,
    tipo VARCHAR(50),                         -- Obrigatória / Optativa
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
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- UUID facilita integração
    nome VARCHAR(255) NOT NULL,
    matricula BIGINT UNIQUE NOT NULL,
    email_institucional VARCHAR(255) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,

    role VARCHAR(50) NOT NULL,                       -- aluno, admin, etc
    status_matricula status_matricula_enum NOT NULL, -- ENUM (corrigido)
    periodo_inicio VARCHAR(50),

    id_curso BIGINT,                                 -- Curso do aluno

    CONSTRAINT fk_aluno_curso
        FOREIGN KEY (id_curso)
        REFERENCES curso(id)
        ON DELETE SET NULL
);


-- ======================================================
-- 6. TABELAS 1:1 — DADOS DO ALUNO
-- ======================================================

-- Dados pessoais
CREATE TABLE IF NOT EXISTS dados_pessoais (
    id UUID PRIMARY KEY,          -- Mesmo ID do aluno
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

-- Contato
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

-- Dados bancários
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
    id_professor BIGINT NOT NULL,
    numero SMALLINT NOT NULL, -- Ex: Turma 1, 2, 3

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
    codigo_hora VARCHAR(50), -- Ex: M1, T2, N3

    CONSTRAINT fk_horario_turma
        FOREIGN KEY (id_turma)
        REFERENCES turma(id_turma)
        ON DELETE CASCADE
);


-- ======================================================
-- 9. TABELA HISTÓRICO
-- ======================================================

CREATE TABLE IF NOT EXISTS historico (
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
-- 10. TABELA SINCRONIZAÇÃO
-- ======================================================

CREATE TABLE IF NOT EXISTS sincronizacao (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_aluno UUID NOT NULL,
    data_inicio TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_fim TIMESTAMPTZ,
    status_sinc status_sinc_enum NOT NULL DEFAULT 'PENDENTE', -- Tipo alterado aqui
    detalhes TEXT,
    
    CONSTRAINT fk_aluno FOREIGN KEY (id_aluno) REFERENCES aluno(id) ON DELETE CASCADE
);