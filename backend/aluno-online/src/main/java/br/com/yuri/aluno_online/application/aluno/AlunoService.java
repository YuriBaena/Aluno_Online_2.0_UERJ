package br.com.yuri.aluno_online.application.aluno;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import br.com.yuri.aluno_online.domain.interfaces.ResumoAluno;
import br.com.yuri.aluno_online.infrastructure.repository.AlunoRepository;
import br.com.yuri.aluno_online.infrastructure.web.AlunoResource.Aula;
import br.com.yuri.aluno_online.infrastructure.web.AlunoResource.StatsAluno;

@Service
public class AlunoService {

    private final AlunoRepository repository;

    AlunoService(AlunoRepository repository){
        this.repository = repository;
    }

    public StatsAluno getStats(UUID id_aluno) {
        // O Spring entrega a implementação da interface aqui automaticamente
        ResumoAluno dados = repository.geStatsAluno(id_aluno);

        if (dados == null) {
            return null; // Ou lance uma exception
        }

        // Calculando o progresso no Java (regra de negócio)
        Double progresso = 0.0;
        if (dados.getTotalCreditos() != null && dados.getTotalCreditos() > 0) {
            progresso = (dados.getSomaCreditos() * 100.0) / dados.getTotalCreditos();
        }

        // Criando o seu record a partir da interface
        return new StatsAluno(
            dados.getCr(),
            dados.getSomaCreditos(),
            dados.getTotalCreditos(),
            progresso,
            dados.getDisciplinasAndamento()
        );
    }

    /*
    
    public List<Aula> getAulasHoje(UUID id_aluno){
        
    }
    
    */
}
