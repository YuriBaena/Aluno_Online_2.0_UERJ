package br.com.yuri.aluno_online.infrastructure.repository;

import br.com.yuri.aluno_online.domain.model.Aluno;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.UUID;

public interface AlunoRepository extends JpaRepository<Aluno, UUID> {
    Optional<Aluno> findByMatricula(Long matricula);
    
    @Query(value = "SELECT nextval('aluno_matricula_seq')", nativeQuery = true)
    Long getNextMatriculaSequence();
}