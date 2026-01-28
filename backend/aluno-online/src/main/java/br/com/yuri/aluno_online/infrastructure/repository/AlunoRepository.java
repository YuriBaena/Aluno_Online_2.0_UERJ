package br.com.yuri.aluno_online.infrastructure.repository;

import br.com.yuri.aluno_online.domain.model.Aluno;
import br.com.yuri.aluno_online.domain.interfaces.ResumoAluno;
import br.com.yuri.aluno_online.domain.interfaces.ResumoAulaDia;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;
import java.util.List;

@Repository
public interface AlunoRepository extends JpaRepository<Aluno, UUID> {
    Optional<Aluno> findByMatricula(Long matricula);
    
    @Query(value = "SELECT nextval('aluno_matricula_seq')", nativeQuery = true)
    Long getNextMatriculaSequence();

    @Query(value = """
            SELECT 
            COALESCE(
                ROUND(
                    CAST(
                        COALESCE(SUM(d.creditos * h.nota_final), 0)
                        /
                        NULLIF(COALESCE(SUM(d.creditos), 0), 0)
                    AS NUMERIC),
                2),
            0) AS cr,

            COALESCE(SUM(d.creditos), 0) AS somaCreditos,

            c.total_creditos AS totalCreditos,

            (
                SELECT COUNT(*) 
                FROM em_andamento e 
                WHERE e.id_aluno = a.id
            ) AS disciplinasAndamento

        FROM aluno a
        JOIN curso c 
            ON a.id_curso = c.id

        LEFT JOIN historico_disciplina h 
            ON a.id = h.id_aluno 
        AND h.status != 'Cancelado'

        LEFT JOIN disciplina d 
            ON h.codigo_disciplina = d.codigo

        WHERE a.id = :id_aluno

        GROUP BY a.id, c.total_creditos;
            """, nativeQuery = true)
    ResumoAluno geStatsAluno(@Param("id_aluno") UUID id_aluno);

    @Query(value="""
        SELECT 
            d.codigo AS codigo,
            d.nome AS disciplina,
            p.nome AS nome_professor,
            h.dia AS dia,
            h.codigo_hora AS codigo_hora,
            h.hora AS hora
        FROM turma t
        INNER JOIN em_andamento e ON 
            t.codigo_disciplina = e.codigo_disciplina AND 
            t.numero = e.numero_turma
        INNER JOIN professor p ON 
            t.id_professor = p.id
        INNER JOIN disciplina d ON 
            t.codigo_disciplina = d.codigo
        INNER JOIN horario_aula h ON 
            t.id_turma = h.id_turma
        WHERE e.id_aluno = :id_aluno 
        AND h.dia::text = :diaSemana
        ORDER BY h.hora ASC
        """, nativeQuery = true)
    List<ResumoAulaDia> getAulasHoje(@Param("id_aluno") UUID id_aluno,
                                    @Param("diaSemana") String diaSemana);
    

}