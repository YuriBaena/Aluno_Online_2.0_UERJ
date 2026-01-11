package br.com.yuri.aluno_online.infrastructure.repository;

import org.springframework.stereotype.Repository;

import br.com.yuri.aluno_online.domain.model.Disciplina;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface MyCronogramaRepository extends JpaRepository<Disciplina, String> {

    @Query(value = """
        SELECT jsonb_build_object(
            'nome', d.nome,
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
        )
        FROM disciplina d
        INNER JOIN aluno a ON a.id_curso = d.id_curso
        WHERE a.id = :id_aluno
        AND (d.nome ILIKE %:busca% OR d.codigo ILIKE %:busca%)
        ORDER BY d.periodo, d.nome
        """, nativeQuery = true)
    List<String> listJson(@Param("busca") String busca, @Param("id_aluno") UUID id_aluno); 
}
