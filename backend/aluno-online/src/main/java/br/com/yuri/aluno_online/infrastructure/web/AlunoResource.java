package br.com.yuri.aluno_online.infrastructure.web;

import br.com.yuri.aluno_online.application.aluno.AlunoService;
import br.com.yuri.aluno_online.domain.model.Aluno;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import java.util.List;
import java.util.UUID;
import java.time.LocalTime;


@RestController
@RequestMapping("/aluno")
@CrossOrigin(origins = "*")
public class AlunoResource {

    private final AlunoService service;

    AlunoResource(AlunoService service){
        this.service = service;
    }
    
    @GetMapping("/stats")
    public ResponseEntity<StatsAluno> getStatsAluno(@AuthenticationPrincipal Aluno aluno) {
        UUID id_aluno = aluno.getId();
        
        StatsAluno resposta = service.getStats(id_aluno);
        
        return ResponseEntity.ok(
            resposta
        );
    }


    @GetMapping("/aulas_hoje")
    public ResponseEntity<List<Aula>> getAulasHoje(@AuthenticationPrincipal Aluno aluno,
                                                    @RequestBody String diaSemana
    ){
        UUID id_aluno = aluno.getId();

        List<Aula> resp = service.getAulasHoje(id_aluno, diaSemana);

        return ResponseEntity.ok(
            resp
        );
    }


    public record StatsAluno(Float cr, 
                            Integer creditosFeitos, Integer totalCreditos, Double progressoCurso,
                            Integer discplinasAndamento) {}

    public record Aula(
        String codigo, String disciplina, String professor, String diaSemana, String codigo_hora, LocalTime hora
    ){}

}
