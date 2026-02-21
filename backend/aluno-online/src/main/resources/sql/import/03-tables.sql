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
    carga_horaria SMALLINT,
    creditos SMALLINT
);

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

-- ======================================================
-- 13. TABELA DE PRE-REQUISITOS
-- ======================================================

CREATE TABLE IF NOT EXISTS public.pre_requisito (
    codigo_disciplina VARCHAR(20) NOT NULL,
    codigo_requisito VARCHAR(20) NOT NULL,
    id_grupo INTEGER NOT NULL
);

-- Constraint de Chave Primária Composta
-- Garante que não existam linhas idênticas (mesma disciplina, requisito e grupo)
ALTER TABLE public.pre_requisito DROP CONSTRAINT IF EXISTS pk_pre_requisito;
ALTER TABLE public.pre_requisito ADD CONSTRAINT pk_pre_requisito PRIMARY KEY (codigo_disciplina, codigo_requisito, id_grupo);

-- Constraint de Chave Estrangeira para a Disciplina "Dona" do requisito
ALTER TABLE public.pre_requisito DROP CONSTRAINT IF EXISTS fk_disciplina_principal;
ALTER TABLE public.pre_requisito ADD CONSTRAINT fk_disciplina_principal FOREIGN KEY (codigo_disciplina) REFERENCES public.disciplina(codigo) ON DELETE CASCADE;

-- Constraint de Chave Estrangeira para a Disciplina que É o requisito
ALTER TABLE public.pre_requisito DROP CONSTRAINT IF EXISTS fk_disciplina_requisito;
ALTER TABLE public.pre_requisito ADD CONSTRAINT fk_disciplina_requisito FOREIGN KEY (codigo_requisito) REFERENCES public.disciplina(codigo) ON DELETE CASCADE;

-- Constraint para evitar que uma disciplina seja requisito dela mesma
ALTER TABLE public.pre_requisito DROP CONSTRAINT IF EXISTS check_auto_requisito;
ALTER TABLE public.pre_requisito ADD CONSTRAINT check_auto_requisito CHECK (codigo_disciplina <> codigo_requisito);


-- ======================================================
-- 14. TABELA DE GRADE DO CURSO
-- ======================================================

-- Remove colunas da disciplina
ALTER TABLE disciplina DROP COLUMN IF EXISTS periodo;
ALTER TABLE disciplina DROP COLUMN IF EXISTS id_curso;
ALTER TABLE disciplina DROP COLUMN IF EXISTS tipo;

CREATE TABLE IF NOT EXISTS grade_curricular (
    id_curso BIGINT NOT NULL,
    codigo_disciplina VARCHAR(50) NOT NULL,
    periodo SMALLINT NOT NULL,
    tipo VARCHAR(50) -- Ex: 'OBRIGATÓRIA', 'ELETIVA'
);

-- Chave Primária Composta
ALTER TABLE grade_curricular DROP CONSTRAINT IF EXISTS pk_grade_curricular;
ALTER TABLE grade_curricular ADD CONSTRAINT pk_grade_curricular PRIMARY KEY (id_curso, codigo_disciplina);

-- Constraint de Chave Estrangeira para Curso
ALTER TABLE grade_curricular DROP CONSTRAINT IF EXISTS fk_grade_curso;
ALTER TABLE grade_curricular ADD CONSTRAINT fk_grade_curso FOREIGN KEY (id_curso) REFERENCES curso(id) ON DELETE CASCADE;

-- Constraint de Chave Estrangeira para Disciplina
ALTER TABLE grade_curricular DROP CONSTRAINT IF EXISTS fk_grade_disciplina;
ALTER TABLE grade_curricular ADD CONSTRAINT fk_grade_disciplina FOREIGN KEY (codigo_disciplina) REFERENCES disciplina(codigo) ON DELETE CASCADE;

-- ======================================================
-- 15. TABELA ATIVIDADE
-- ======================================================

CREATE TABLE IF NOT EXISTS atividade (
    id_atividade BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    max_horas SMALLINT NOT NULL DEFAULT 0
);

-- Garantir que o nome da atividade seja único para evitar duplicatas no scraper
ALTER TABLE atividade DROP CONSTRAINT IF EXISTS atividade_nome_unique;
ALTER TABLE atividade ADD CONSTRAINT atividade_nome_unique UNIQUE (nome);

-- ======================================================
-- 16. TABELA HISTÓRICO ATIVIDADE
-- ======================================================

CREATE TABLE IF NOT EXISTS historico_atividade (
    id_historico_ativ BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    id_aluno UUID NOT NULL,
    id_atividade BIGINT NOT NULL,
    periodo_realizado VARCHAR(50),
    horas_realizadas SMALLINT
);

-- Constraint de Chave Estrangeira para Aluno
ALTER TABLE historico_atividade DROP CONSTRAINT IF EXISTS fk_historico_atividade_aluno;
ALTER TABLE historico_atividade ADD CONSTRAINT fk_historico_atividade_aluno FOREIGN KEY (id_aluno) REFERENCES aluno(id) ON DELETE CASCADE;

-- Constraint de Chave Estrangeira para Atividade
ALTER TABLE historico_atividade DROP CONSTRAINT IF EXISTS fk_historico_atividade_atividade;
ALTER TABLE historico_atividade ADD CONSTRAINT fk_historico_atividade_atividade FOREIGN KEY (id_atividade) REFERENCES atividade(id_atividade) ON DELETE CASCADE;