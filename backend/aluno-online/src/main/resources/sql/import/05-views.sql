-- ======================================================
-- 12. VIEWS (VISÕES)
-- ======================================================

-- View para obter o status da sincronização MAIS RECENTE de cada aluno
-- O comando DISTINCT ON (id_aluno) garante que apenas a última linha 
-- (baseada na data_inicio DESC) seja retornada para cada UUID.

DROP VIEW IF EXISTS v_status_sincronizacao_atual;
CREATE VIEW v_status_sincronizacao_atual AS
SELECT DISTINCT ON (id_aluno)
    id_aluno,
    status_sinc,
    detalhes,
    data_inicio,
    data_fim
FROM sincronizacao
ORDER BY id_aluno, data_inicio DESC;