package br.com.yuri.aluno_online.application.aluno;

import java.util.List;
import java.util.Collections;
import java.util.UUID;
import java.util.stream.Collectors;
import java.time.LocalTime;

import org.springframework.stereotype.Service;

import br.com.yuri.aluno_online.domain.interfaces.ResumoAluno;
import br.com.yuri.aluno_online.domain.interfaces.ResumoAulaDia;
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

    
    public List<Aula> getAulasHoje(UUID id_aluno, String diaSemana) {
        // 1. Busca a lista de projeções do banco
        List<ResumoAulaDia> dados = repository.getAulasHoje(id_aluno, diaSemana);
        System.out.println(dados);

        // 2. Se a lista estiver vazia, retorna uma lista vazia (melhor que null para evitar NPE)
        if (dados == null || dados.isEmpty()) {
            return Collections.emptyList(); 
        }

        // 3. Transforma (mapeia) cada ResumoAulaDia em um objeto Aula
        return dados.stream().map(item -> {
            // Lógica da hora que fizemos antes
            LocalTime horaConvertida = null;
            if (item.getHora() instanceof java.time.LocalTime) {
                horaConvertida = (java.time.LocalTime) item.getHora();
            } else if (item.getHora() instanceof java.sql.Time) {
                horaConvertida = ((java.sql.Time) item.getHora()).toLocalTime();
            }

            // A ORDEM AQUI DEVE SER IDÊNTICA AO CONSTRUTOR DA CLASSE AULA
            return new Aula(
                item.getCodigo(),          // 1. String
                item.getDisciplina(),      // 2. String
                this.capitalize(item.getNome_professor().toLowerCase()),  // 3. String
                item.getDia().toString(),             // 4. String (Cuidado se aqui estiver item.getHora())
                item.getCodigo_hora(),     // 5. String
                horaConvertida             // 6. LocalTime
            );
        }).collect(Collectors.toList());
    }
    
    public String capitalize(String str) {
        if (str == null || str.isEmpty()) {
            return str;
        }
        return str.substring(0, 1).toUpperCase() + str.substring(1).toLowerCase();
    }

}
