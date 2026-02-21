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
                'periodo', gc.periodo,
                'turmas', COALESCE((
                    SELECT jsonb_agg(jsonb_build_object(
                        'id', t.numero,
                        'nome', 'Turma ' || t.numero,
                        'professor', COALESCE(p.nome, 'A definir'),
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
            FROM aluno a
            -- Ajuste no JOIN: Busca a grade do curso do aluno OU a grade das Eletivas Universais
            INNER JOIN grade_curricular gc ON (
                gc.id_curso = a.id_curso 
                OR 
                gc.id_curso = (SELECT id FROM curso WHERE nome_curso = 'Eletivas Universais' LIMIT 1)
            )
            INNER JOIN disciplina d ON gc.codigo_disciplina = d.codigo
            WHERE a.id = :id_aluno
            AND (
                :busca = '' 
                OR d.nome ILIKE '%' || :busca || '%' 
                OR d.codigo ILIKE '%' || :busca || '%'
            )
            ORDER BY 
                (CASE WHEN gc.periodo = 0 THEN 1 ELSE 0 END), -- Joga periodo 0 para o fim da lista
                gc.periodo, 
                d.nome
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
                'periodo', gc.periodo,
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
            -- Ligação com a Grade Curricular ajustada para incluir o curso do aluno OU Universais
            INNER JOIN grade_curricular gc ON d.codigo = gc.codigo_disciplina
            INNER JOIN aluno a ON a.id = :id_aluno
            WHERE (
                gc.id_curso = a.id_curso 
                OR 
                gc.id_curso = (SELECT id FROM curso WHERE nome_curso = 'Eletivas Universais' LIMIT 1)
            )
            -- Garante que a disciplina possui pelo menos uma turma no horário selecionado
            AND EXISTS (
                SELECT 1
                FROM turma t2
                JOIN horario_aula h ON h.id_turma = t2.id_turma
                WHERE t2.codigo_disciplina = d.codigo
                AND h.dia::text = :dia
                AND h.codigo_hora = :hora
            )
            -- Filtra para não mostrar o que o aluno já passou
            AND NOT EXISTS (
                SELECT 1
                FROM historico h_hist
                WHERE h_hist.id_aluno = :id_aluno
                AND h_hist.codigo_disciplina = d.codigo
                AND h_hist.status ILIKE 'Aprov%'
            )
            ORDER BY (CASE WHEN gc.periodo = 0 THEN 1 ELSE 0 END), gc.periodo, d.nome;
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
                'periodo', gc.periodo,
                'turmas', COALESCE((
                    SELECT jsonb_agg(jsonb_build_object(
                        'id', t.numero,
                        'nome', 'Turma ' || t.numero,
                        'professor', COALESCE(p.nome, 'A definir'),
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
            INNER JOIN grade_curricular gc ON d.codigo = gc.codigo_disciplina
            INNER JOIN aluno a ON a.id = :id_aluno
            WHERE (
                gc.id_curso = a.id_curso 
                OR 
                gc.id_curso = (SELECT id FROM curso WHERE nome_curso = 'Eletivas Universais' LIMIT 1)
            )
            -- Filtramos pelo período (se num=0 traz as universais, se num>0 traz as do curso)
            AND gc.periodo = :per
            AND NOT EXISTS (
                SELECT 1 
                FROM historico h 
                WHERE h.id_aluno = a.id 
                AND h.codigo_disciplina = d.codigo 
                AND h.status ILIKE 'Aprov%'
            )
            ORDER BY d.nome
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
                'periodo', gc.periodo,
                'turmas', COALESCE((
                    SELECT jsonb_agg(jsonb_build_object(
                        'id', t.numero,
                        'nome', 'Turma ' || t.numero,
                        'professor', COALESCE(p.nome, 'A definir'),
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
                    -- Garante que TODAS as aulas desta turma pertencem ao turno escolhido
                    AND NOT EXISTS (
                        SELECT 1
                        FROM horario_aula h2
                        WHERE h2.id_turma = t.id_turma
                        AND h2.codigo_hora NOT LIKE :turno || '%'
                    )
                ), '[]'::jsonb)
            ) as json_data
            FROM disciplina d
            INNER JOIN grade_curricular gc ON d.codigo = gc.codigo_disciplina
            INNER JOIN aluno a ON a.id = :id_aluno
            WHERE (
                gc.id_curso = a.id_curso 
                OR 
                gc.id_curso = (SELECT id FROM curso WHERE nome_curso = 'Eletivas Universais' LIMIT 1)
            )
            -- Verifica se o aluno já não foi aprovado
            AND NOT EXISTS (
                SELECT 1 
                FROM historico h_hist 
                WHERE h_hist.id_aluno = a.id 
                AND h_hist.codigo_disciplina = d.codigo 
                AND h_hist.status ILIKE 'Aprov%'
            )
            -- Só retorna a disciplina se ela possuir ao menos uma turma no turno desejado
            AND EXISTS (
                SELECT 1 FROM turma t3
                WHERE t3.codigo_disciplina = d.codigo
                AND NOT EXISTS (
                    SELECT 1 FROM horario_aula h3
                    WHERE h3.id_turma = t3.id_turma
                    AND h3.codigo_hora NOT LIKE :turno || '%'
                )
            )
            ORDER BY 
                (CASE WHEN gc.periodo = 0 THEN 1 ELSE 0 END), 
                gc.periodo, 
                d.nome
            """;

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("id_aluno", id_aluno)
                .addValue("turno", turno);

        return npJdbc.query(sql, params, new DisciplinaJsonRowMapper(objectMapper));
    }

    public List<DisciplinaDTO> pegaMelhorCombinacaoDisponibilidade(DisponibilidadeDTO dto, UUID id_aluno) {
        // 1. Transformamos o Map em uma lista de strings para o PostgreSQL processar
        List<String> filtros = dto.disponibilidade().entrySet().stream()
            .flatMap(entry -> entry.getValue().stream()
                .map(h -> entry.getKey() + "|" + h.inicio() + "|" + h.fim()))
            .toList();

        String sql = """
            WITH disp_aluno AS (
                SELECT 
                    split_part(val, '|', 1) as d_dia,
                    split_part(val, '|', 2)::time as d_inicio,
                    split_part(val, '|', 3)::time as d_fim
                FROM unnest(:filtros::text[]) as val
            )
            SELECT jsonb_build_object(
                'nome', d.nome,
                'codigo', d.codigo,
                'periodo', gc.periodo,
                'turmas', COALESCE((
                    SELECT jsonb_agg(jsonb_build_object(
                        'id', t.numero,
                        'nome', 'Turma ' || t.numero,
                        'professor', COALESCE(p.nome, 'A definir'),
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
            INNER JOIN grade_curricular gc ON d.codigo = gc.codigo_disciplina
            INNER JOIN aluno a ON a.id = :id_aluno
            -- AJUSTE: Permite buscar na grade do curso do aluno OU na grade universal
            WHERE (
                gc.id_curso = a.id_curso 
                OR 
                gc.id_curso = (SELECT id FROM curso WHERE nome_curso = 'Eletivas Universais' LIMIT 1)
            )
            -- Filtra Disciplinas que possuem pelo menos uma turma válida dentro do horário do aluno
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
            -- Filtra o que o aluno já concluiu (Histórico)
            AND NOT EXISTS (
                SELECT 1 FROM historico hist 
                WHERE hist.id_aluno = a.id 
                AND hist.codigo_disciplina = d.codigo 
                AND hist.status ILIKE 'Aprov%'
            )
            ORDER BY (CASE WHEN gc.periodo = 0 THEN 1 ELSE 0 END), gc.periodo, d.nome;
            """;

        MapSqlParameterSource params = new MapSqlParameterSource()
                .addValue("id_aluno", id_aluno)
                .addValue("filtros", filtros.toArray(new String[0]));

        return npJdbc.query(sql, params, new DisciplinaJsonRowMapper(objectMapper));
    }

    public int getNumPeriodos(UUID id_aluno) {
        String sql = """
            SELECT COALESCE(MAX(gc.periodo), 0)
            FROM grade_curricular gc
            INNER JOIN aluno a ON a.id_curso = gc.id_curso
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