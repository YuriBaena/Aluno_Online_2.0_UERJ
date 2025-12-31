package br.com.yuri.aluno_online.infrastructure.web;

import br.com.yuri.aluno_online.application.sync.ScraperService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/sync")
@CrossOrigin(origins = "*") 
public class ScraperResource {

    private final ScraperService scraperService;

    public ScraperResource(ScraperService scraperService) {
        this.scraperService = scraperService;
    }

    @PostMapping
    public ResponseEntity<?> sincronizar(@RequestBody SyncRequest request) {
        try {
            // Dispara o processo assíncrono. 
            // O código Java continuará para a linha de baixo sem esperar o Python terminar.
            scraperService.executarSincronizacao(request.login(), request.senha());
            
            // Retornamos 202 Accepted (O padrão para processos longos em background)
            return ResponseEntity.status(HttpStatus.ACCEPTED)
                    .body(Map.of(
                        "message", "Sincronização iniciada com sucesso!",
                        "status", "PROCESSING"
                    ));

        } catch (Exception e) {
            // Este catch só pegará erros se o Spring falhar ao disparar a thread (raro)
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Não foi possível iniciar o processo: " + e.getMessage()));
        }
    }

    public record SyncRequest(String login, String senha) {}
}