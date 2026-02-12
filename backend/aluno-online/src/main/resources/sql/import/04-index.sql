-- ======================================================
-- 11. ÍNDICES
-- ======================================================

-- Busca por similaridade de nomes (Python + fuzzy search)
CREATE INDEX IF NOT EXISTS idx_aluno_nome_trgm
    ON aluno USING gin (nome gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_historico_aluno
    ON historico (id_aluno);

CREATE INDEX IF NOT EXISTS idx_disciplina_nome
    ON disciplina (nome);

