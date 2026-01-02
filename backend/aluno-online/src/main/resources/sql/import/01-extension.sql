-- ======================================================
-- 0. EXTENSÕES
-- ======================================================

-- Gera UUIDs (usado como PK em aluno)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Permite busca por similaridade de texto (ILIKE, %%, fuzzy search)
-- Muito útil para buscas por nome
CREATE EXTENSION IF NOT EXISTS pg_trgm;