-- ======================================================
-- 1. ENUMS (TIPOS CONTROLADOS)
-- ======================================================


DO '
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = ''status_matricula_enum'') THEN
        CREATE TYPE status_matricula_enum AS ENUM (''ATIVO'', ''CANCELADO'', ''TRANCADO'', ''FORMADO'');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = ''dia_semana_enum'') THEN
        CREATE TYPE dia_semana_enum AS ENUM (''Segunda'', ''Terca'', ''Quarta'', ''Quinta'', ''Sexta'', ''Sabado'', ''Domingo'');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = ''status_sinc_enum'') THEN
        CREATE TYPE status_sinc_enum AS ENUM (''PENDENTE'', ''PROCESSANDO'', ''COMPLETO'', ''ERRO'');
    END IF;
END ';