package br.com.yuri.aluno_online.infrastructure.repository;

import br.com.yuri.aluno_online.domain.enums.StatusSincronizacao;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import java.util.UUID;
import java.util.Map;

@Repository
public class ScraperRepository {

    private final JdbcTemplate jdbcTemplate;

    public ScraperRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Executa comandos DDL/DML vindos do Python (Scraper)
     */
    public void executarComandoSql(String sql) {
        jdbcTemplate.execute(sql);
    }

    /**
     * Cria um novo registro de sincronização ao iniciar o processo
     */
    public void criarSincronizacao(UUID idAluno) {
        String sql = "INSERT INTO sincronizacao (id_aluno, status_sinc) VALUES (?, 'PENDENTE')";
        jdbcTemplate.update(sql, idAluno);
    }

    /**
     * Atualiza o status e detalhes durante o processo (Ex: Erro ou Sucesso)
     */
    public void atualizarStatus(UUID idAluno, StatusSincronizacao status, String detalhes) {
        String sql = """
            UPDATE sincronizacao 
            SET status_sinc = ?::status_sinc_enum, 
                detalhes = ?, 
                data_fim = CASE WHEN ? IN ('COMPLETO', 'ERRO') THEN CURRENT_TIMESTAMP ELSE data_fim END
            WHERE id = (SELECT id FROM sincronizacao WHERE id_aluno = ? ORDER BY data_inicio DESC LIMIT 1)
        """;
        jdbcTemplate.update(sql, status.name(), detalhes, status.name(), idAluno);
    }

    /**
     * Consulta o status atual usando a VIEW que criamos para máxima performance
     */
    public Map<String, Object> obterStatusCompleto(UUID id) {
        String sql = """
            SELECT status_sinc, detalhes, data_inicio, data_fim
            FROM v_status_sincronizacao_atual v
            WHERE id_aluno = ?
        """;
        
        try {
            return jdbcTemplate.queryForMap(sql, id);
        } catch (Exception e) {
            return null; // Caso não exista nenhuma sincronização para este aluno
        }
    }

    /**
     * Busca a data da última sincronização finalizada com sucesso.
     * Filtramos pelo UUID para garantir que a troca de matrícula não afete o resultado.
     */
    public String buscarUltimaDataPorId(UUID idAluno) {
        String sql = """
            SELECT data_fim 
            FROM sincronizacao 
            WHERE id_aluno = ? AND status_sinc = 'COMPLETO'
            ORDER BY data_fim DESC
            LIMIT 1
        """;
        
        try {
            // queryForObject é ideal quando queremos apenas uma coluna (data_fim)
            return jdbcTemplate.queryForObject(sql, String.class, idAluno);
        } catch (Exception e) {
            // Retorna null caso o aluno nunca tenha completado uma sincronização
            return null; 
        }
    }
}