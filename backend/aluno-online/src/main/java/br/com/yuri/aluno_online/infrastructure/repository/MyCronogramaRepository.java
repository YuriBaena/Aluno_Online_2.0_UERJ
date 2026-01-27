package br.com.yuri.aluno_online.infrastructure.repository;

import br.com.yuri.aluno_online.infrastructure.web.MyCronogramaResource.DisciplinaDTO;
import br.com.yuri.aluno_online.infrastructure.web.MyCronogramaResource.DisponibilidadeDTO;
import br.com.yuri.aluno_online.infrastructure.web.MyCronogramaResource.HorarioDTO;
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
            INNER JOIN aluno a ON a.id = :id_aluno
            INNER JOIN curso c ON c.id = d.id_curso
            WHERE (d.id_curso = a.id_curso OR c.nome_curso = 'Eletivas Universais')
            AND (d.nome ILIKE '%' || :busca || '%' OR d.codigo ILIKE '%' || :busca || '%')
            ORDER BY d.periodo, d.nome
            """;

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("id_aluno", id_aluno)
                .addValue("busca", termoBusca);

        return npJdbc.query(sql, params, new DisciplinaJsonRowMapper(objectMapper));
    }

    public List<DisciplinaDTO> listDiaHora(HorarioDTO dia_hora, UUID id_aluno) {
        String sql = """
            SELECT jsonb_build_object(
                'nome', d.nome,
                'codigo', d.codigo,
                'periodo', d.periodo,
                'turmas', COALESCE((
                    SELECT jsonb_agg(
                        jsonb_build_object(
                            'id', t.numero,
                            'nome', 'Turma ' || t.numero,
                            'professor', COALESCE(p.nome, 'A definir'),
                            'vagas', t.vagas,
                            'horario', COALESCE((
                                SELECT jsonb_agg(
                                    jsonb_build_object(
                                        'dia', h.dia,
                                        'hora_codigo', h.codigo_hora
                                    )
                                )
                                FROM horario_aula h
                                WHERE h.id_turma = t.id_turma
                            ), '[]'::jsonb)
                        )
                    )
                    FROM turma t
                    LEFT JOIN professor p ON p.id = t.id_professor
                    WHERE t.codigo_disciplina = d.codigo
                    AND EXISTS (
                        SELECT 1
                        FROM horario_aula h2
                        WHERE h2.id_turma = t.id_turma
                        AND h2.dia::text = :dia
                        AND h2.codigo_hora = :hora
                    )
                ), '[]'::jsonb)
            ) AS json_data
            FROM disciplina d
            INNER JOIN curso c ON c.id = d.id_curso
            WHERE (
                EXISTS (
                    SELECT 1
                    FROM aluno a
                    WHERE a.id = :id_aluno
                    AND a.id_curso = d.id_curso
                )
                OR c.nome_curso = 'Eletivas Universais'
            )
            AND EXISTS (
                SELECT 1
                FROM turma t2
                JOIN horario_aula h ON h.id_turma = t2.id_turma
                WHERE t2.codigo_disciplina = d.codigo
                AND h.dia::text = :dia
                AND h.codigo_hora = :hora
            )
            AND NOT EXISTS (
                SELECT 1
                FROM historico h
                WHERE h.id_aluno = :id_aluno
                AND h.codigo_disciplina = d.codigo
                AND h.status = 'Aprov. Nota'
            )
            ORDER BY d.periodo, d.nome;
            """;

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("id_aluno", id_aluno)
                .addValue("dia", dia_hora.dia())
                .addValue("hora", dia_hora.hora_codigo());

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
            INNER JOIN aluno a ON a.id = :id_aluno
            WHERE (d.id_curso = a.id_curso)
            AND d.periodo = :per
            AND NOT EXISTS (
                SELECT 1 
                FROM historico h 
                WHERE h.id_aluno = a.id 
                AND h.codigo_disciplina = d.codigo 
                AND h.status = 'Aprov. Nota'
            )
            ORDER BY d.periodo, d.nome
            """;

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("id_aluno", id_aluno)
                .addValue("per", num);

        return npJdbc.query(sql, params, new DisciplinaJsonRowMapper(objectMapper));
    }

    public List<DisciplinaDTO> pegaMelhorCombinacaoTurno(String turno, UUID id_aluno) {
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
                    AND NOT EXISTS (
                        SELECT 1
                        FROM horario_aula h2
                        WHERE h2.id_turma = t.id_turma
                        AND h2.codigo_hora NOT LIKE :turno || '%'
                    )
                ), '[]'::jsonb)
            ) as json_data
            FROM disciplina d
            INNER JOIN aluno a ON a.id = :id_aluno
            WHERE (d.id_curso = a.id_curso)
            AND NOT EXISTS (
                    SELECT 1 
                    FROM historico h 
                    WHERE h.id_aluno = a.id 
                    AND h.codigo_disciplina = d.codigo 
                    AND h.status = 'Aprov. Nota'
                )
                ORDER BY d.periodo, d.nome
            """;

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("id_aluno", id_aluno)
                .addValue("turno", turno);

        return npJdbc.query(sql, params, new DisciplinaJsonRowMapper(objectMapper));
    }

    public List<DisciplinaDTO> pegaMelhorCombinacaoDisponibilidade(DisponibilidadeDTO dto, UUID id_aluno) {
        // 1. Transformamos o Map em uma lista de strings: "DIA|00:00|00:00"
        // Ex: "SEG|07:30|11:00"
        List<String> filtros = dto.disponibilidade().entrySet().stream()
            .flatMap(entry -> entry.getValue().stream()
                .map(h -> entry.getKey() + "|" + h.inicio() + "|" + h.fim()))
            .toList();

        String sql = """
            WITH disp_aluno AS (
                -- Explode a lista de strings em uma tabela temporária com tipos corretos
                SELECT 
                    split_part(val, '|', 1) as d_dia,
                    split_part(val, '|', 2)::time as d_inicio,
                    split_part(val, '|', 3)::time as d_fim
                FROM unnest(:filtros::text[]) as val
            )
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
                        'horario', (
                            SELECT jsonb_agg(jsonb_build_object('dia', h.dia, 'hora_codigo', h.codigo_hora))
                            FROM horario_aula h WHERE h.id_turma = t.id_turma
                        )
                    ))
                    FROM turma t
                    LEFT JOIN professor p ON t.id_professor = p.id
                    WHERE t.codigo_disciplina = d.codigo
                    -- REGRA: A turma só entra se TODAS as suas aulas estiverem na disponibilidade do aluno
                    AND NOT EXISTS (
                        SELECT 1 FROM horario_aula ha
                        WHERE ha.id_turma = t.id_turma
                        AND NOT EXISTS (
                            SELECT 1 FROM disp_aluno da
                            WHERE da.d_dia = ha.dia::text
                            AND ha.hora >= da.d_inicio 
                            AND ha.hora < da.d_fim
                        )
                    )
                ), '[]'::jsonb)
            ) as json_data
            FROM disciplina d
            INNER JOIN aluno a ON a.id = :id_aluno
            WHERE (d.id_curso = a.id_curso)
            -- Filtra Disciplinas que possuem pelo menos uma turma válida para o aluno
            AND EXISTS (
                SELECT 1 FROM turma t2
                WHERE t2.codigo_disciplina = d.codigo
                AND NOT EXISTS (
                    SELECT 1 FROM horario_aula ha2
                    WHERE ha2.id_turma = t2.id_turma
                    AND NOT EXISTS (
                        SELECT 1 FROM disp_aluno da2 
                        WHERE da2.d_dia = ha2.dia::text 
                        AND ha2.hora >= da2.d_inicio 
                        AND ha2.hora < da2.d_fim
                    )
                )
            )
            AND NOT EXISTS (
                SELECT 1 FROM historico hist 
                WHERE hist.id_aluno = a.id 
                AND hist.codigo_disciplina = d.codigo 
                AND hist.status = 'Aprov. Nota'
            )
            ORDER BY d.periodo, d.nome;
            """;

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("id_aluno", id_aluno)
                .addValue("filtros", filtros.toArray(new String[0]));

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