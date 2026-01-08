package br.com.yuri.aluno_online.infrastructure.web;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import br.com.yuri.aluno_online.application.myCronograma.MyCronogramaService;
import br.com.yuri.aluno_online.domain.model.Aluno;

@RestController
@RequestMapping("/my-cron")
@CrossOrigin(origins = "*")
public class MyCronogramaResource{
    private MyCronogramaService servico;

    public MyCronogramaResource(MyCronogramaService servico){
        this.servico = servico;
    }

    @GetMapping("")
    public ResponseEntity<List<DisciplinaDTO>> list(@AuthenticationPrincipal Aluno aluno, @RequestParam(required = false) String busca){
        return ResponseEntity.ok(
            servico.list(busca, aluno.getId())
        );
    }

    public record DisciplinaDTO(String nome,
                                Integer periodo,
                                List<TurmaDTO> turmas) {}

    public record TurmaDTO(Integer id,
                            String nome,
                            String professor,
                            List<HorarioDTO> horario,
                            Integer vagas) {}

    public record HorarioDTO(String dia,
                            String hora_codigo) {}

}