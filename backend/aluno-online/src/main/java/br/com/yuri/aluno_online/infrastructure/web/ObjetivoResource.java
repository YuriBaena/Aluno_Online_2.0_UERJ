package br.com.yuri.aluno_online.infrastructure.web;

import java.time.LocalDate;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import br.com.yuri.aluno_online.application.Objetivo.ObjetivoService;
import br.com.yuri.aluno_online.application.aluno.AlunoService;
import br.com.yuri.aluno_online.domain.model.Aluno;
import br.com.yuri.aluno_online.infrastructure.web.AlunoResource.StatsAluno;

@RestController
@RequestMapping("/objetivo")
@CrossOrigin(origins = "*")
public class ObjetivoResource {

    private final ObjetivoService service;
    private final AlunoService alunoService;

    public ObjetivoResource(ObjetivoService servico, AlunoService alunoServie){
        this.service = servico;
        this.alunoService = alunoServie;
    }

    // Listar (Retorna uma lista de DTOs)
    @GetMapping
    public ResponseEntity<List<AvaliacaoDTO>> list(
            @AuthenticationPrincipal Aluno aluno,
            @RequestParam(required = false) String codigo_disciplina,
            @RequestParam(defaultValue = "data_agendada") String sort,
            @RequestParam(defaultValue = "desc") String dir) {
        
        List<AvaliacaoDTO> lista = service.buscarPorAluno(aluno.getId(), codigo_disciplina, sort, dir);
        return ResponseEntity.ok(lista); 
    }

    // Retornar materias em andamento e cr
    @GetMapping("/dados")
    public ResponseEntity<DadosAluno> listDados(
        @AuthenticationPrincipal Aluno aluno
    ){
        List<ResumoDisciplina> andamento = alunoService.getDisciplinasEmAndamento(aluno.getId());
        StatsAluno status = alunoService.getStats(aluno.getId());
        DadosAluno info = new DadosAluno(andamento, status.cr(), status.creditosFeitos());
        return ResponseEntity.ok(info);
    }

    // Criar
    @PostMapping
    public ResponseEntity<AvaliacaoDTO> create(
            @AuthenticationPrincipal Aluno aluno,
            @RequestBody AvaliacaoDTO dto) {
        service.save(aluno.getId(), dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto);
    }

    // Editar
    @PutMapping("/{id}")
    public ResponseEntity<AvaliacaoDTO> update(
            @AuthenticationPrincipal Aluno aluno,
            @PathVariable Long id,
            @RequestBody AvaliacaoDTO dto) {
        service.edit(aluno.getId(), id, dto);
        return ResponseEntity.ok(dto);
    }

    // Deletar
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
        @AuthenticationPrincipal Aluno aluno,
        @PathVariable Long id) {
        service.delete(aluno.getId(), id);
        return ResponseEntity.noContent().build();
    }

    public record AvaliacaoDTO(
        Long id,
        String nome,
        String codigo_disciplina,
        String tipo,
        Integer peso,
        Double nota,
        LocalDate data
    ){}

    public record ResumoDisciplina(
        String nome,
        String codigo,
        Short creditos
    ){}

    public record DadosAluno(
        List<ResumoDisciplina> disciplinas,
        Float cr,
        Integer creditosFeitos
    ){}
}