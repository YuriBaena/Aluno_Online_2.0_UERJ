package br.com.yuri.aluno_online.application.myCronograma;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;

import br.com.yuri.aluno_online.infrastructure.repository.MyCronogramaRepository;
import br.com.yuri.aluno_online.infrastructure.web.MyCronogramaResource.DisciplinaDTO;
import br.com.yuri.aluno_online.infrastructure.web.MyCronogramaResource.HorarioDTO;
import br.com.yuri.aluno_online.infrastructure.web.MyCronogramaResource.TurmaDTO;

@Service
public class MyCronogramaService {

    private final MyCronogramaRepository repository;

    public MyCronogramaService(MyCronogramaRepository repository) {
        this.repository = repository;
    }
    
    public int maiorPeriodo(UUID id_aluno){
        return repository.getNumPeriodos(id_aluno);
    }

    public List<DisciplinaDTO> list(String busca, UUID id_aluno) {
        return repository.list(busca, id_aluno);
    }

    public List<DisciplinaDTO> pegaMelhorCombinacaoPeriodo(int num, UUID id_aluno){
        // 1. Busca todas as disciplinas do período com suas respectivas turmas
        List<DisciplinaDTO> todasDisciplinas = repository.pegaMelhorCombinacaoPeriodo(num, id_aluno);

        // 2. Tenta encontrar a combinação ideal
        List<DisciplinaDTO> resultado = new ArrayList<>();
        encontrarMelhorCombinacao(todasDisciplinas, 0, new HashSet<String>(), new ArrayList<>(), resultado);

        return resultado;
    }


    /**
     * Algoritmo de Backtracking para encaixar o máximo de disciplinas
     */
    private void encontrarMelhorCombinacao(
            List<DisciplinaDTO> disciplinas, 
            int index, 
            Set<String> horariosOcupados, 
            List<DisciplinaDTO> combinacaoAtual, 
            List<DisciplinaDTO> melhorCombinacao) {

        // Se já percorremos todas as disciplinas disponíveis
        if (index == disciplinas.size()) {
            if (combinacaoAtual.size() > melhorCombinacao.size()) {
                melhorCombinacao.clear();
                melhorCombinacao.addAll(combinacaoAtual);
            }
            return;
        }

        DisciplinaDTO disciplina = disciplinas.get(index);

        // Tenta encaixar cada turma da disciplina atual
        boolean encaixouAlgumaTurma = false;
        for (TurmaDTO turma : disciplina.turmas()) {
            if (podeAdicionarTurma(turma, horariosOcupados)) {
                
                // Marca os horários dessa turma como ocupados
                Set<String> novosHorarios = extrairHorarios(turma);
                horariosOcupados.addAll(novosHorarios);
                
                // Cria uma nova instância da disciplina contendo APENAS a turma escolhida
                DisciplinaDTO disciplinaComTurmaEscolhida = new DisciplinaDTO(
                    disciplina.nome(), 
                    disciplina.periodo(), 
                    List.of(turma)
                );
                
                combinacaoAtual.add(disciplinaComTurmaEscolhida);

                // Vai para a próxima disciplina
                encontrarMelhorCombinacao(disciplinas, index + 1, horariosOcupados, combinacaoAtual, melhorCombinacao);
                encaixouAlgumaTurma = true;

                // Backtracking: remove para testar a próxima possibilidade
                combinacaoAtual.remove(combinacaoAtual.size() - 1);
                horariosOcupados.removeAll(novosHorarios);
            }
        }

        // Caso não consiga encaixar NENHUMA turma desta disciplina, 
        // tenta pular ela para ver se as próximas cabem
        encontrarMelhorCombinacao(disciplinas, index + 1, horariosOcupados, combinacaoAtual, melhorCombinacao);
    }

    private boolean podeAdicionarTurma(TurmaDTO turma, Set<String> ocupados) {
        if (turma.horario() == null) return true;
        for (HorarioDTO h : turma.horario()) {
            String chave = h.dia() + "-" + h.hora_codigo();
            if (ocupados.contains(chave)) return false;
        }
        return true;
    }

    private Set<String> extrairHorarios(TurmaDTO turma) {
        Set<String> hSet = new HashSet<>();
        if (turma.horario() != null) {
            for (HorarioDTO h : turma.horario()) {
                hSet.add(h.dia() + "-" + h.hora_codigo());
            }
        }
        return hSet;
    }
}
