package br.com.yuri.aluno_online.infrastructure.repository;

import br.com.yuri.aluno_online.domain.model.Aluno;
import br.com.yuri.aluno_online.domain.interfaces.ResumoAluno;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AlunoRepository extends JpaRepository<Aluno, UUID> {
    Optional<Aluno> findByMatricula(Long matricula);
    
    @Query(value = "SELECT nextval('aluno_matricula_seq')", nativeQuery = true)
    Long getNextMatriculaSequence();

    @Query(value = """
            SELECT 
        ROUND(CAST(SUM(d.creditos * h.nota_final) / CAST(SUM(d.creditos) AS NUMERIC) AS NUMERIC), 2) AS cr,
        SUM(d.creditos) AS somaCreditos,
        c.total_creditos AS totalCreditos,
        (SELECT COUNT(*) FROM em_andamento e WHERE e.id_aluno = a.id) AS disciplinasAndamento
        FROM aluno a
        JOIN curso c ON a.id_curso = c.id
        LEFT JOIN historico h ON a.id = h.id_aluno
        LEFT JOIN disciplina d ON h.codigo_disciplina = d.codigo
        WHERE a.id = :id_aluno
        GROUP BY a.id, c.total_creditos
            """, nativeQuery = true)
    ResumoAluno geStatsAluno(@Param("id_aluno") UUID id_aluno);

}