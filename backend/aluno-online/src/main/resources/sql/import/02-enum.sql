-- ======================================================
-- 1. ENUMS (TIPOS CONTROLADOS)
-- ======================================================

-- Status possível de um aluno
DROP TYPE IF EXISTS status_matricula_enum CASCADE;
CREATE TYPE status_matricula_enum AS ENUM (
    'Ativo',
    'Inativo',
    'Trancado',
    'Formado'
);

-- Dias da semana (usado em horário de aula)
DROP TYPE IF EXISTS dia_semana_enum CASCADE;
CREATE TYPE dia_semana_enum AS ENUM (
    'Segunda',
    'Terca',
    'Quarta',
    'Quinta',
    'Sexta',
    'Sabado',
    'Domingo'
);

-- Status de sincronização (usado em tabela de sync)
DROP TYPE IF EXISTS status_sinc_enum CASCADE;
CREATE TYPE status_sinc_enum AS ENUM (
    'PENDENTE',
    'PROCESSANDO',
    'COMPLETO',
    'ERRO'
);