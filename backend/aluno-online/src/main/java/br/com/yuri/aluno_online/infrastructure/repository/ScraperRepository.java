package br.com.yuri.aluno_online.infrastructure.repository;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class ScraperRepository {

    private final JdbcTemplate jdbcTemplate;

    public ScraperRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void executarComandoSql(String sql) {
        // Executa o comando puro vindo do Python
        jdbcTemplate.execute(sql);
    }
}