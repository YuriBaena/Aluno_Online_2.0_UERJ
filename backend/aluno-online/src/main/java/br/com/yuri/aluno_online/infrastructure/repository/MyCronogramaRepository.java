package br.com.yuri.aluno_online.infrastructure.repository;

import br.com.yuri.aluno_online.infrastructure.web.MyCronogramaResource.DisciplinaDTO;
import lombok.RequiredArgsConstructor;
import tools.jackson.databind.ObjectMapper;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.List;
import java.util.UUID;

import org.springframework.jdbc.core.RowMapper; // Import correto

@Repository
@RequiredArgsConstructor
public class MyCronogramaRepository {

    private final NamedParameterJdbcTemplate npJdbc;
    private final ObjectMapper objectMapper; // Para converter String JSON para DTO

    public List<DisciplinaDTO> list(String busca, UUID id_aluno) {
        String termoBusca = (busca == null || busca.isBlank()) ? "" : busca;

        String sql = """
            SELECT jsonb_build_object(
                'nome', d.nome,
                'codigo', d.codigo,
                'periodo', d.periodo,
                'turmas', COALESCE((
                    SELECT jsonb_agg(jsonb_build_object(
                        'id', t.numero,
                        'nome', 'Turma ' || t.numero,
                        'professor', p.nome,
                        'vagas', t.vagas,
                        'horario', COALESCE((
                            SELECT jsonb_agg(jsonb_build_object(
                                'dia', h.dia,
                                'hora_codigo', h.codigo_hora
                            ))
                            FROM horario_aula h
                            WHERE h.id_turma = t.id_turma
                        ), '[]'::jsonb)
                    ))
                    FROM turma t
                    LEFT JOIN professor p ON t.id_professor = p.id
                    WHERE t.codigo_disciplina = d.codigo
                ), '[]'::jsonb)
            ) as json_data
            FROM disciplina d
            INNER JOIN aluno a ON a.id_curso = d.id_curso
            WHERE a.id = :id_aluno
            AND (d.nome ILIKE '%' || :busca || '%' OR d.codigo ILIKE '%' || :busca || '%')
            ORDER BY d.periodo, d.nome
            """;

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("id_aluno", id_aluno)
                .addValue("busca", termoBusca);

        return npJdbc.query(sql, params, new DisciplinaJsonRowMapper(objectMapper));
    }

    public List<DisciplinaDTO> pegaMelhorCombinacaoPeriodo(int num, UUID id_aluno) {
        String sql = """
            SELECT jsonb_build_object(
                'nome', d.nome,
                'codigo', d.codigo,
                'periodo', d.periodo,
                'turmas', COALESCE((
                    SELECT jsonb_agg(jsonb_build_object(
                        'id', t.numero,
                        'nome', 'Turma ' || t.numero,
                        'professor', p.nome,
                        'vagas', t.vagas,
                        'horario', COALESCE((
                            SELECT jsonb_agg(jsonb_build_object(
                                'dia', h.dia,
                                'hora_codigo', h.codigo_hora
                            ))
                            FROM horario_aula h
                            WHERE h.id_turma = t.id_turma
                        ), '[]'::jsonb)
                    ))
                    FROM turma t
                    LEFT JOIN professor p ON t.id_professor = p.id
                    WHERE t.codigo_disciplina = d.codigo
                ), '[]'::jsonb)
            ) as json_data
            FROM disciplina d
            INNER JOIN aluno a ON a.id_curso = d.id_curso
            WHERE a.id = :id_aluno
            AND d.periodo = :per
            ORDER BY d.periodo, d.nome
            """;

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("id_aluno", id_aluno)
                .addValue("per", num);

        return npJdbc.query(sql, params, new DisciplinaJsonRowMapper(objectMapper));
    }

    public int getNumPeriodos(UUID id_aluno) {
        String sql = """
            SELECT COALESCE(MAX(d.periodo), 0)
            FROM disciplina d
            INNER JOIN aluno a ON a.id_curso = d.id_curso
            WHERE a.id = :id_aluno
            """;

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("id_aluno", id_aluno);

        return npJdbc.queryForObject(sql, params, Integer.class);
    }


    @RequiredArgsConstructor
    private static class DisciplinaJsonRowMapper implements RowMapper<DisciplinaDTO> {
        private final ObjectMapper mapper;

        @Override
        public DisciplinaDTO mapRow(ResultSet rs, int rowNum) throws SQLException {
            try {
                String json = rs.getString("json_data");
                return mapper.readValue(json, DisciplinaDTO.class);
            } catch (Exception e) {
                throw new SQLException("Erro ao converter JSON para DisciplinaDTO", e);
            }
        }
    }
}