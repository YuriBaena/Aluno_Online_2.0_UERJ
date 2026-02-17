package br.com.yuri.aluno_online.application.Objetivo;

import br.com.yuri.aluno_online.domain.model.Avaliacao;
import br.com.yuri.aluno_online.infrastructure.repository.ObjetivoRepository;
import br.com.yuri.aluno_online.infrastructure.web.ObjetivoResource.AvaliacaoDTO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ObjetivoService {

    private final ObjetivoRepository repository;

    public ObjetivoService(ObjetivoRepository repository) {
        this.repository = repository;
    }

    public List<AvaliacaoDTO> buscarPorAluno(UUID alunoId, String disciplina, String sort, String dir) {
        // Lógica simples: Se vier disciplina filtra, se não, traz tudo do aluno
        List<Avaliacao> entities = (disciplina != null) 
            ? repository.findByIdAlunoAndCodigoDisciplina(alunoId, disciplina)
            : repository.findByIdAluno(alunoId);

        return entities.stream().map(this::toDTO).collect(Collectors.toList());
    }

    @Transactional
    public void save(UUID alunoId, AvaliacaoDTO dto) {
        Avaliacao entity = new Avaliacao();
        updateEntity(entity, dto, alunoId);
        repository.save(entity);
    }

    @Transactional
    public void edit(UUID alunoId, Long id, AvaliacaoDTO dto) {
        Avaliacao entity = repository.findByIdAndIdAluno(id, alunoId)
            .orElseThrow(() -> new RuntimeException("Avaliação não encontrada"));
        updateEntity(entity, dto, alunoId);
        repository.save(entity);
    }

    @Transactional
    public void delete(UUID alunoId, Long id) {
        Avaliacao entity = repository.findByIdAndIdAluno(id, alunoId)
            .orElseThrow(() -> new RuntimeException("Permissão negada ou não encontrado"));
        repository.delete(entity);
    }

    // Métodos auxiliares de conversão (Mappers)
    private AvaliacaoDTO toDTO(Avaliacao e) {
        return new AvaliacaoDTO(e.getId(), e.getNome(), e.getCodigoDisciplina(), 
                                e.getTipo(), e.getPeso(), e.getNota(), e.getDataAgendada());
    }

    private void updateEntity(Avaliacao e, AvaliacaoDTO d, UUID alunoId) {
        e.setIdAluno(alunoId);
        e.setNome(d.nome());
        e.setCodigoDisciplina(d.codigo_disciplina());
        e.setTipo(d.tipo());
        e.setPeso(d.peso());
        e.setNota(d.nota());
        e.setDataAgendada(d.data());
    }
}