package br.com.yuri.aluno_online.infrastructure.repository;

import br.com.yuri.aluno_online.domain.interfaces.ResumoAluno;
import br.com.yuri.aluno_online.domain.model.Cronograma;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CronRepository extends JpaRepository<Cronograma, Long> {

    @Query(value = """
            SELECT nome 
            FROM cronograma 
            WHERE id_aluno = :id_aluno;
            """, nativeQuery = true)
    List<String> getCronAluno(@Param("id_aluno") UUID id_aluno);

}