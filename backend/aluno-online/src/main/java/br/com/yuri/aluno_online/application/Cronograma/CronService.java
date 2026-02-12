package br.com.yuri.aluno_online.application.Cronograma;

import br.com.yuri.aluno_online.domain.model.Cronograma;
import br.com.yuri.aluno_online.domain.model.DisciplinaCronograma;
import br.com.yuri.aluno_online.infrastructure.repository.CronRepository;
import br.com.yuri.aluno_online.infrastructure.web.SaveCronResource.CronRequest;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CronService {

    private final CronRepository repository;

    public CronService(CronRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public void save(UUID id_aluno, CronRequest req) {
        Cronograma cronograma = new Cronograma();
        cronograma.setNome(req.nome_cronograma());
        cronograma.setIdAluno(id_aluno);
        
        var listaDisciplinas = req.disciplinas().stream().map(dto -> {
            DisciplinaCronograma entidadeDisc = new DisciplinaCronograma();
            entidadeDisc.setCodigoDisciplina(dto.codigo_disc());
            entidadeDisc.setNomeDisciplina(dto.nome_disc());
            entidadeDisc.setNomeProfessor(dto.nome_prof());
            entidadeDisc.setCronograma(cronograma);

            entidadeDisc.setHorarios(dto.horarios()); 

            return entidadeDisc;
        }).collect(Collectors.toList());

        cronograma.setDisciplinas(listaDisciplinas);
        repository.save(cronograma);
    }

    public List<String> listCronAluno(UUID id_aluno){
        return repository.getCronAluno(id_aluno);
    }
}