package br.com.yuri.aluno_online.infrastructure.web;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.yuri.aluno_online.application.Cronograma.CronService;
import br.com.yuri.aluno_online.domain.model.Aluno;

@RestController
@RequestMapping("/cronograma")
@CrossOrigin(origins = "*")
public class SaveCronResource{

    private final CronService servico;

    public SaveCronResource(CronService servico){
        this.servico = servico;
    }

    @PostMapping("/save")
    public ResponseEntity<Void> saveCron(@AuthenticationPrincipal Aluno aluno, @RequestBody CronRequest req){
        servico.save(aluno.getId(), req);
        return ResponseEntity.accepted().build();
    }

    public record CronRequest(
        String nome_cronograma,
        List<CronPart> disciplinas
    ) {}

    public record CronPart(
        String codigo_disc,
        String nome_disc,
        String nome_prof,
        List<Horarios> horarios
    ){}

    public record Horarios(
        String dia,
        List<String> codigo_horario
    ){}

}