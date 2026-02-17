-- ======================================================
-- 1. TABELA CURSO
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
-- 2. TABELA PROFESSOR
-- ======================================================

CREATE TABLE IF NOT EXISTS professor (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome VARCHAR(255) NOT NULL
);

ALTER TABLE professor DROP CONSTRAINT IF EXISTS professor_nome_unique;
ALTER TABLE professor ADD CONSTRAINT professor_nome_unique UNIQUE (nome);

-- ======================================================
-- 3. TABELA DISCIPLINA
-- ======================================================

CREATE TABLE IF NOT EXISTS disciplina (
    codigo VARCHAR(50) PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    id_curso BIGINT NOT NULL,
    carga_horaria SMALLINT,
    creditos SMALLINT,
    tipo VARCHAR(50),
    periodo SMALLINT
);

ALTER TABLE disciplina DROP CONSTRAINT IF EXISTS fk_disciplina_curso;
ALTER TABLE disciplina ADD CONSTRAINT fk_disciplina_curso FOREIGN KEY (id_curso) REFERENCES curso(id) ON DELETE CASCADE;

-- ======================================================
-- 4. TABELA ALUNO
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
    id_curso BIGINT
);

ALTER TABLE aluno DROP CONSTRAINT IF EXISTS fk_aluno_curso;
ALTER TABLE aluno ADD CONSTRAINT fk_aluno_curso FOREIGN KEY (id_curso) REFERENCES curso(id) ON DELETE SET NULL;

-- ======================================================
-- 5. TABELAS 1:1 — DADOS DO ALUNO
-- ======================================================

CREATE TABLE IF NOT EXISTS dados_pessoais (
    id UUID PRIMARY KEY,
    cpf VARCHAR(14) UNIQUE,
    rg VARCHAR(20),
    data_nascimento DATE,
    nome_pai VARCHAR(255),
    nome_mae VARCHAR(255)
);

ALTER TABLE dados_pessoais DROP CONSTRAINT IF EXISTS fk_dados_pessoais_aluno;
ALTER TABLE dados_pessoais ADD CONSTRAINT fk_dados_pessoais_aluno FOREIGN KEY (id) REFERENCES aluno(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS dados_contato (
    id UUID PRIMARY KEY,
    celular VARCHAR(20),
    email_pessoal VARCHAR(255),
    endereco_completo TEXT
);

ALTER TABLE dados_contato DROP CONSTRAINT IF EXISTS fk_dados_contato_aluno;
ALTER TABLE dados_contato ADD CONSTRAINT fk_dados_contato_aluno FOREIGN KEY (id) REFERENCES aluno(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS dados_bancarios (
    id UUID PRIMARY KEY,
    banco VARCHAR(100),
    agencia VARCHAR(20),
    conta VARCHAR(20),
    tipo_conta VARCHAR(50)
);

ALTER TABLE dados_bancarios DROP CONSTRAINT IF EXISTS fk_dados_bancarios_aluno;
ALTER TABLE dados_bancarios ADD CONSTRAINT fk_dados_bancarios_aluno FOREIGN KEY (id) REFERENCES aluno(id) ON DELETE CASCADE;

-- ======================================================
-- 6. TABELA TURMA
-- ======================================================

CREATE TABLE IF NOT EXISTS turma (
    id_turma BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo_disciplina VARCHAR(50) NOT NULL,
    id_professor BIGINT,
    numero SMALLINT NOT NULL,
    vagas SMALLINT NOT NULL DEFAULT 0
);

ALTER TABLE turma DROP CONSTRAINT IF EXISTS turma_disciplina_numero_unique;
ALTER TABLE turma ADD CONSTRAINT turma_disciplina_numero_unique UNIQUE (codigo_disciplina, numero);

ALTER TABLE turma DROP CONSTRAINT IF EXISTS fk_turma_disciplina;
ALTER TABLE turma ADD CONSTRAINT fk_turma_disciplina FOREIGN KEY (codigo_disciplina) REFERENCES disciplina(codigo) ON DELETE CASCADE;

ALTER TABLE turma DROP CONSTRAINT IF EXISTS fk_turma_professor;
ALTER TABLE turma ADD CONSTRAINT fk_turma_professor FOREIGN KEY (id_professor) REFERENCES professor(id) ON DELETE CASCADE;

-- ======================================================
-- 7. TABELA HORÁRIO DE AULA
-- ======================================================

CREATE TABLE IF NOT EXISTS horario_aula (
    id_horario BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_turma BIGINT NOT NULL,
    dia dia_semana_enum NOT NULL,
    hora TIME NOT NULL,
    codigo_hora VARCHAR(50)
);

ALTER TABLE horario_aula DROP CONSTRAINT IF EXISTS horario_unico;
ALTER TABLE horario_aula ADD CONSTRAINT horario_unico UNIQUE (id_turma, dia, hora);

ALTER TABLE horario_aula DROP CONSTRAINT IF EXISTS fk_horario_turma;
ALTER TABLE horario_aula ADD CONSTRAINT fk_horario_turma FOREIGN KEY (id_turma) REFERENCES turma(id_turma) ON DELETE CASCADE;

-- ======================================================
-- 8. TABELA HISTÓRICO
-- ======================================================

CREATE TABLE IF NOT EXISTS historico (
    id_aluno UUID NOT NULL,
    codigo_disciplina VARCHAR(50) NOT NULL,
    nota_final DECIMAL(4,2),
    frequencia DECIMAL(5,2),
    status VARCHAR(50),
    periodo_realizado VARCHAR(50)
);

ALTER TABLE historico DROP CONSTRAINT IF EXISTS pk_historico;
ALTER TABLE historico ADD CONSTRAINT pk_historico PRIMARY KEY (id_aluno, codigo_disciplina);

ALTER TABLE historico DROP CONSTRAINT IF EXISTS fk_historico_aluno;
ALTER TABLE historico ADD CONSTRAINT fk_historico_aluno FOREIGN KEY (id_aluno) REFERENCES aluno(id) ON DELETE CASCADE;

ALTER TABLE historico DROP CONSTRAINT IF EXISTS fk_historico_disciplina;
ALTER TABLE historico ADD CONSTRAINT fk_historico_disciplina FOREIGN KEY (codigo_disciplina) REFERENCES disciplina(codigo);

-- ======================================================
-- 9. TABELA EM ANDAMENTO
-- ======================================================

CREATE TABLE IF NOT EXISTS em_andamento (
    id_aluno UUID NOT NULL,
    codigo_disciplina VARCHAR(50) NOT NULL,
    PRIMARY KEY (id_aluno, codigo_disciplina),
    numero_turma SMALLINT NOT NULL
);

ALTER TABLE em_andamento DROP CONSTRAINT IF EXISTS fk_aluno_em_andamento;
ALTER TABLE em_andamento ADD CONSTRAINT fk_aluno_em_andamento FOREIGN KEY (id_aluno) REFERENCES aluno(id) ON DELETE CASCADE;

ALTER TABLE em_andamento DROP CONSTRAINT IF EXISTS fk_disciplina_em_andamento;
ALTER TABLE em_andamento ADD CONSTRAINT fk_disciplina_em_andamento FOREIGN KEY (codigo_disciplina) REFERENCES disciplina(codigo) ON DELETE CASCADE;

-- ======================================================
-- 10. TABELA SINCRONIZAÇÃO
-- ======================================================

CREATE TABLE IF NOT EXISTS sincronizacao (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_aluno UUID NOT NULL,
    data_inicio TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_fim TIMESTAMPTZ,
    status_sinc status_sinc_enum NOT NULL DEFAULT 'PENDENTE',
    detalhes TEXT
);

ALTER TABLE sincronizacao DROP CONSTRAINT IF EXISTS fk_aluno;
ALTER TABLE sincronizacao ADD CONSTRAINT fk_aluno FOREIGN KEY (id_aluno) REFERENCES aluno(id) ON DELETE CASCADE;

-- ======================================================
-- 11. TABELA DE CRONOGRAMAS
-- ======================================================

CREATE TABLE IF NOT EXISTS cronograma (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_aluno UUID NOT NULL,
    nome VARCHAR(255) NOT NULL,
    created_at DATE DEFAULT CURRENT_DATE NOT NULL
);

ALTER TABLE cronograma DROP CONSTRAINT IF EXISTS fk_cronograma_aluno;
ALTER TABLE cronograma ADD CONSTRAINT fk_cronograma_aluno FOREIGN KEY (id_aluno) REFERENCES aluno(id) ON DELETE CASCADE;

-- ======================================================
-- 12. TABELA DADOS DOS CRONOGRAMAS
-- ======================================================

CREATE TABLE IF NOT EXISTS disciplina_cronograma (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_cronograma BIGINT NOT NULL,
    codigo_disciplina VARCHAR(50) NOT NULL,
    nome_disciplina VARCHAR(255),
    nome_professor VARCHAR(255),
    horarios JSONB
);

ALTER TABLE disciplina_cronograma DROP CONSTRAINT IF EXISTS fk_disc_cronograma_pai;
ALTER TABLE disciplina_cronograma ADD CONSTRAINT fk_disc_cronograma_pai FOREIGN KEY (id_cronograma) REFERENCES cronograma(id) ON DELETE CASCADE;

-- ======================================================
-- 13. TABELA DE AVALIAÇÕES
-- ======================================================

CREATE TABLE IF NOT EXISTS avaliacao (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_aluno UUID NOT NULL,
    codigo_disciplina VARCHAR(50) NOT NULL,
    nome VARCHAR NOT NULL,
    tipo VARCHAR NOT NULL,
    peso SMALLINT NOT NULL DEFAULT 1,
    nota NUMERIC(4,2), 
    data_agendada DATE
);

ALTER TABLE avaliacao DROP CONSTRAINT IF EXISTS check_nota_range;
ALTER TABLE avaliacao ADD CONSTRAINT check_nota_range CHECK (nota >= 0 AND nota <= 10);