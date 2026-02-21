package br.com.yuri.aluno_online.infrastructure.web;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import br.com.yuri.aluno_online.application.Fluxograma.FluxogramaService;
import br.com.yuri.aluno_online.domain.model.Aluno;

@RestController
@RequestMapping("/fluxograma")
@CrossOrigin(origins = "*")
public class FluxogramaResource{

    private final FluxogramaService servico;

    public FluxogramaResource(FluxogramaService servico){
        this.servico = servico;
    }

    @GetMapping("")
    public ResponseEntity<List<DisciplinaFluxogramaDTO>> fluxograma(@AuthenticationPrincipal Aluno aluno){
        return ResponseEntity.ok(servico.fluxograma(aluno.getId()));
    }

    public record RequisitoGrupoDTO(
        Long id_grupo,
        List<String> disciplinas
    ) {}

    public record DisciplinaFluxogramaDTO(
        String codigo,
        String nome,
        Integer periodo,
        Integer creditos,
        String status_historico,
        BigDecimal nota_final,
        List<RequisitoGrupoDTO> grupos_requisitos
    ) {}

}