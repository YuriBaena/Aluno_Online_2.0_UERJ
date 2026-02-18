package br.com.yuri.aluno_online.infrastructure.repository;


import org.springframework.data.domain.Sort;
import br.com.yuri.aluno_online.domain.model.Avaliacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ObjetivoRepository extends JpaRepository<Avaliacao, Long> {

    // Busca todas as avaliações de um aluno específico
    List<Avaliacao> findByIdAluno(UUID idAluno, Sort sort);

    // Busca avaliações de um aluno filtradas por uma disciplina específica
    List<Avaliacao> findByIdAlunoAndCodigoDisciplina(UUID idAluno, String codigoDisciplina, Sort sort);

    // Busca uma avaliação específica garantindo que ela pertence àquele aluno
    // Essencial para o Editar e Deletar por segurança (Prevenção de IDOR)
    Optional<Avaliacao> findByIdAndIdAluno(Long id, UUID idAluno);
    
    // Se você quiser ordenar por data no banco de dados futuramente:
    List<Avaliacao> findByIdAlunoOrderByDataAgendadaDesc(UUID idAluno);
}