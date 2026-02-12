package br.com.yuri.aluno_online.infrastructure.repository;

import br.com.yuri.aluno_online.domain.model.Cronograma;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CronRepository extends JpaRepository<Cronograma, Long> {
}