package br.com.yuri.aluno_online.infrastructure.repository;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import br.com.yuri.aluno_online.domain.model.Disciplina;

@Repository
public interface FluxogramaRepository extends JpaRepository<Disciplina, String> {

    @Query(value = """
        SELECT 
            d.codigo, 
            d.nome, 
            gc.periodo, 
            d.creditos,
            h.status AS status_historico,
            h.nota_final,
            (
                SELECT jsonb_agg(sub.requisitos_do_grupo)
                FROM (
                    SELECT jsonb_build_object(
                        'id_grupo', pr.id_grupo,
                        'disciplinas', jsonb_agg(pr.codigo_requisito)
                    ) as requisitos_do_grupo
                    FROM pre_requisito pr
                    WHERE pr.codigo_disciplina = d.codigo
                    GROUP BY pr.id_grupo
                ) sub
            ) AS grupos_requisitos_json
        FROM aluno a
        JOIN grade_curricular gc ON a.id_curso = gc.id_curso
        JOIN disciplina d ON gc.codigo_disciplina = d.codigo
        LEFT JOIN historico h ON a.id = h.id_aluno AND d.codigo = h.codigo_disciplina
        WHERE a.id = :alunoId
        ORDER BY 
            (CASE WHEN gc.periodo = 0 THEN 1 ELSE 0 END), -- Se for 0, vira 1 (vai pro fim), senão 0 (fica no início)
            gc.periodo,                                  -- Ordena os demais (1, 2, 3...)
            d.nome
        """, nativeQuery = true)
    List<Map<String, Object>> findFluxogramaRaw(@Param("alunoId") UUID alunoId);
}