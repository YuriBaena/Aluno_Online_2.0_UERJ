package br.com.yuri.aluno_online.infrastructure.web;

import br.com.yuri.aluno_online.application.sync.ScraperService;
import br.com.yuri.aluno_online.domain.model.Aluno; // Assumindo sua classe de usuário
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/sync")
@CrossOrigin(origins = "*") 
public class ScraperResource {

    private final ScraperService scraperService;

    public ScraperResource(ScraperService scraperService) {
        this.scraperService = scraperService;
    }

    /**
     * Inicia o processo de sincronização.
     * @AuthenticationPrincipal extrai o usuário logado para pegarmos o UUID com segurança.
     */
    @PostMapping
    public ResponseEntity<?> sincronizar(@RequestBody SyncRequest request, 
                                        @AuthenticationPrincipal Aluno usuarioLogado) {
        try {
            // Pegamos o ID do aluno que vem do contexto de segurança (JWT/Session)
            UUID idAluno = usuarioLogado.getId();

            // Dispara o processo @Async passando o ID para rastreamento no banco
            scraperService.executarSincronizacao(idAluno, request.login(), request.senha());
            
            return ResponseEntity.status(HttpStatus.ACCEPTED)
                    .body(Map.of(
                        "message", "Sincronização iniciada. Acompanhe o progresso.",
                        "status", "PENDENTE"
                    ));

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erro ao disparar thread: " + e.getMessage()));
        }
    }

    /**
     * Endpoint consultado pelo Angular (Polling) a cada X segundos.
     */
    @GetMapping("/status")
    public ResponseEntity<?> statusSync(@AuthenticationPrincipal Aluno aluno) {
        try {
            // Retorna o Map vindo da VIEW (status_sinc, detalhes, etc.)
            var status = scraperService.obterStatusSincronizacao(aluno.getId());
            
            if (status == null || status.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("message", "Nenhuma sincronização encontrada para este login."));
            }

            return ResponseEntity.ok(status);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Erro ao consultar status: " + e.getMessage()));
        }
    }

    @GetMapping("/ultima")
    public ResponseEntity<?> buscarUltima(@AuthenticationPrincipal Aluno aluno) {
        // O aluno.getId() aqui é o UUID que veio do TokenService
        String data = scraperService.buscarUltimaDataPorId(aluno.getId());
        return ResponseEntity.ok(Map.of("ultima_sinc", data != null ? data : ""));
    }
    
    public record SyncRequest(String login, String senha) {}
}